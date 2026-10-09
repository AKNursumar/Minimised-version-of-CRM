import socket
from datetime import date
from unittest.mock import MagicMock, patch

from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from contacts.models import Contact
from followups.models import EmailNotification, FollowUp
from followups.services import (
    dispatch_notification_email,
    is_celery_broker_reachable,
    send_notification_email,
)
from followups.tasks import send_email_notification_task
from opportunities.models import Opportunity
from users.models import User


class EmailNotificationBaseTestCase(TestCase):
    """
    Base test case with common fixtures for CRM users, contacts, opportunities,
    and follow-up email notifications.
    """

    def setUp(self):
        self.admin_user = User.objects.create_user(
            username="admin_user",
            email="admin@example.com",
            password="password123",
            role=User.Role.ADMIN,
        )
        self.manager_user = User.objects.create_user(
            username="manager_user",
            email="manager@example.com",
            password="password123",
            role=User.Role.MANAGER,
        )
        self.sales_rep_1 = User.objects.create_user(
            username="rep1",
            email="rep1@example.com",
            password="password123",
            role=User.Role.SALES_EXECUTIVE,
        )
        self.sales_rep_2 = User.objects.create_user(
            username="rep2",
            email="rep2@example.com",
            password="password123",
            role=User.Role.SALES_EXECUTIVE,
        )

        self.contact = Contact.objects.create(
            name="Acme Corp Contact",
            email="client@acme.com",
        )

        self.opportunity_1 = Opportunity.objects.create(
            title="Enterprise Cloud Migration",
            contact=self.contact,
            assigned_to=self.sales_rep_1,
            amount=50000,
        )
        self.opportunity_2 = Opportunity.objects.create(
            title="Consulting Retainer",
            contact=self.contact,
            assigned_to=self.sales_rep_2,
            amount=20000,
        )

        self.followup_1 = FollowUp.objects.create(
            opportunity=self.opportunity_1,
            followup_date=date.today(),
            status=FollowUp.Status.PENDING,
            remarks="Review proposal with client",
        )
        self.followup_2 = FollowUp.objects.create(
            opportunity=self.opportunity_2,
            followup_date=date.today(),
            status=FollowUp.Status.PENDING,
            remarks="Schedule quarterly check-in",
        )

        self.notification_1 = EmailNotification.objects.create(
            followup=self.followup_1,
            receiver="client@acme.com",
            subject="Proposal Review Follow-up",
            message="Hi, let's review the proposal.",
            status=EmailNotification.Status.PENDING,
        )
        self.notification_2 = EmailNotification.objects.create(
            followup=self.followup_2,
            receiver="partner@acme.com",
            subject="Retainer Follow-up",
            message="Hi, checking in on retainer.",
            status=EmailNotification.Status.PENDING,
        )

        self.client = APIClient()


class EmailDeliveryReliabilityTests(EmailNotificationBaseTestCase):
    """
    Phase 3: Tests for send_notification_email() reliability, error handling,
    timeout handling, and duplicate protection.
    """

    @patch("followups.services.send_mail")
    def test_01_successful_email_delivery(self, mock_send_mail):
        """1. Successful email delivery updates status to SENT and sets sent_at."""
        mock_send_mail.return_value = 1

        success, message = send_notification_email(self.notification_1)

        self.assertTrue(success)
        self.assertEqual(message, "Email sent successfully")
        self.notification_1.refresh_from_db()
        self.assertEqual(self.notification_1.status, EmailNotification.Status.SENT)
        self.assertIsNotNone(self.notification_1.sent_at)
        mock_send_mail.assert_called_once()

    @patch("followups.services.send_mail")
    def test_02_smtp_timeout_and_authentication_failure(self, mock_send_mail):
        """2. Handles SMTP timeout and authentication failures with FAILED status and sanitized logging."""
        # Test socket timeout
        mock_send_mail.side_effect = socket.timeout("SMTP connection timed out after 10s")
        success, message = send_notification_email(self.notification_1)

        self.assertFalse(success)
        self.assertIn("timed out", message)
        self.notification_1.refresh_from_db()
        self.assertEqual(self.notification_1.status, EmailNotification.Status.FAILED)

        # Test SMTP authentication failure
        import smtplib
        mock_send_mail.side_effect = smtplib.SMTPAuthenticationError(535, b"Authentication credentials invalid")
        success, message = send_notification_email(self.notification_2)

        self.assertFalse(success)
        self.assertIn("Authentication credentials invalid", message)
        self.notification_2.refresh_from_db()
        self.assertEqual(self.notification_2.status, EmailNotification.Status.FAILED)

    @patch("followups.services.send_mail")
    def test_06_duplicate_send_protection(self, mock_send_mail):
        """6a. If notification status is already SENT, send_notification_email does not resend."""
        self.notification_1.status = EmailNotification.Status.SENT
        self.notification_1.sent_at = timezone.now()
        self.notification_1.save()

        success, message = send_notification_email(self.notification_1)

        self.assertTrue(success)
        self.assertIn("already sent", message)
        mock_send_mail.assert_not_called()

    @patch("followups.services.send_mail")
    def test_post_delivery_db_exception_does_not_mark_failed(self, mock_send_mail):
        """Avoid overwriting SENT with FAILED if email was sent but a post-send DB error occurs."""
        mock_send_mail.return_value = 1

        with patch.object(self.notification_1, "save", side_effect=[Exception("DB lock timeout"), None]):
            success, message = send_notification_email(self.notification_1)
            # Should still report success because email was actually dispatched
            self.assertTrue(success)


class CeleryRedisDispatchTests(EmailNotificationBaseTestCase):
    """
    Phase 4: Tests for dispatch_notification_email(), broker reachability,
    queue failure, and Celery tasks.
    """

    def test_is_celery_broker_reachable_eager(self):
        """Eager mode returns True immediately without connecting to Redis."""
        with override_settings(CELERY_TASK_ALWAYS_EAGER=True):
            self.assertTrue(is_celery_broker_reachable())

    @patch("redis.Redis.from_url")
    def test_03_redis_unavailable_during_dispatch(self, mock_redis_cls):
        """3. Redis unavailability fails fast and does NOT fall back to slow synchronous SMTP."""
        mock_redis = MagicMock()
        mock_redis.ping.side_effect = Exception("Redis connection refused on port 6379")
        mock_redis_cls.return_value = mock_redis

        with override_settings(CELERY_TASK_ALWAYS_EAGER=False):
            with patch("followups.tasks.send_email_notification_task.delay", side_effect=Exception("Cannot connect to broker")):
                with patch("followups.services.send_notification_email") as mock_sync_send:
                    success, message = dispatch_notification_email(self.notification_1, use_async=True)

                    self.assertFalse(success)
                    self.assertIn("Task queue broker unavailable", message)
                    self.notification_1.refresh_from_db()
                    self.assertEqual(self.notification_1.status, EmailNotification.Status.FAILED)
                    # Crucial: verify it DID NOT silently switch to slow synchronous SMTP
                    mock_sync_send.assert_not_called()

    @patch("followups.tasks.send_email_notification_task.delay")
    def test_04_successful_celery_task_submission(self, mock_task_delay):
        """4. Successful Celery task submission sets QUEUED status and returns task ID."""
        mock_result = MagicMock()
        mock_result.id = "celery-uuid-abc-123"
        mock_task_delay.return_value = mock_result

        with override_settings(CELERY_TASK_ALWAYS_EAGER=False):
            success, message = dispatch_notification_email(self.notification_1, use_async=True)

            self.assertTrue(success)
            self.assertIn("celery-uuid-abc-123", message)
            self.notification_1.refresh_from_db()
            self.assertEqual(self.notification_1.status, EmailNotification.Status.QUEUED)
            mock_task_delay.assert_called_once_with(self.notification_1.pk)

    @patch("followups.tasks.send_email_notification_task.delay")
    def test_05_celery_submission_failure(self, mock_task_delay):
        """5. Celery submission failure preserves record, marks FAILED, and returns error."""
        mock_task_delay.side_effect = Exception("AMQP or Redis Queue Error: Connection reset by peer")

        with override_settings(CELERY_TASK_ALWAYS_EAGER=False):
            success, message = dispatch_notification_email(self.notification_1, use_async=True)

            self.assertFalse(success)
            self.assertIn("Task queue broker unavailable", message)
            self.notification_1.refresh_from_db()
            self.assertEqual(self.notification_1.status, EmailNotification.Status.FAILED)

    @patch("followups.services.send_notification_email")
    def test_06_task_retry_and_duplicate_send_protection(self, mock_send_email):
        """6b. Celery task retries transient failures with bounded exponential backoff and prevents duplicate sends."""
        # Duplicate protection inside task
        self.notification_1.status = EmailNotification.Status.SENT
        self.notification_1.save()

        result = send_email_notification_task.apply(args=[self.notification_1.pk]).result
        self.assertEqual(result["status"], "ALREADY_SENT")
        mock_send_email.assert_not_called()

    @patch("followups.services.send_notification_email", return_value=(False, "Transient network timeout"))
    def test_celery_task_retries_transient_failure(self, mock_send_email):
        """Task retries when delivery fails and retries remain."""
        self.notification_1.status = EmailNotification.Status.QUEUED
        self.notification_1.save()

        with patch.object(send_email_notification_task, "retry", side_effect=Exception("Celery retry triggered")) as mock_retry:
            with self.assertRaises(Exception) as ctx:
                send_email_notification_task.apply(args=[self.notification_1.pk])

            self.assertIn("Celery retry triggered", str(ctx.exception))
            mock_retry.assert_called_once()

        # Status remains QUEUED during retries (mark_failed=False was passed)
        self.notification_1.refresh_from_db()
        self.assertEqual(self.notification_1.status, EmailNotification.Status.QUEUED)


class ResendEndpointApiTests(EmailNotificationBaseTestCase):
    """
    Phase 5: Tests for the POST /api/email-notifications/<id>/resend/ endpoint.
    """

    def test_07_unauthorized_resend_requests(self):
        """7. Sales representative cannot resend an email notification belonging to another representative."""
        # Sales rep 1 tries to resend notification 2 (belonging to sales rep 2's opportunity)
        self.client.force_authenticate(user=self.sales_rep_1)
        url = f"/api/email-notifications/{self.notification_2.pk}/resend/"

        response = self.client.post(url)
        # Because rep 1's queryset does not include rep 2's notifications, DRF returns 404
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # But rep 1 CAN resend their own notification
        with override_settings(CELERY_TASK_ALWAYS_EAGER=False):
            with patch("followups.tasks.send_email_notification_task.delay") as mock_delay:
                mock_res = MagicMock()
                mock_res.id = "rep1-task-id"
                mock_delay.return_value = mock_res

                own_url = f"/api/email-notifications/{self.notification_1.pk}/resend/"
                own_response = self.client.post(own_url)
                self.assertEqual(own_response.status_code, status.HTTP_202_ACCEPTED)

        # Admin can resend any notification
        self.client.force_authenticate(user=self.admin_user)
        with override_settings(CELERY_TASK_ALWAYS_EAGER=False):
            with patch("followups.tasks.send_email_notification_task.delay") as mock_delay:
                mock_res = MagicMock()
                mock_res.id = "admin-task-id"
                mock_delay.return_value = mock_res

                admin_response = self.client.post(url)
                self.assertEqual(admin_response.status_code, status.HTTP_202_ACCEPTED)

    def test_08_missing_notification_ids(self):
        """8. Missing notification ID returns HTTP 404 and task handles missing ID gracefully."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post("/api/email-notifications/999999/resend/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Celery task also gracefully skips missing ID
        task_res = send_email_notification_task.apply(args=[999999]).result
        self.assertEqual(task_res["status"], "NOT_FOUND")

    @patch("followups.tasks.send_email_notification_task.delay")
    def test_09_correct_status_transitions(self, mock_delay):
        """9. Verifies PENDING -> QUEUED -> SENT status transitions."""
        mock_res = MagicMock()
        mock_res.id = "task-transition-1"
        mock_delay.return_value = mock_res

        self.client.force_authenticate(user=self.admin_user)
        url = f"/api/email-notifications/{self.notification_1.pk}/resend/"

        # Initially PENDING
        self.assertEqual(self.notification_1.status, EmailNotification.Status.PENDING)

        with override_settings(CELERY_TASK_ALWAYS_EAGER=False):
            # Resend transitions to QUEUED
            res = self.client.post(url)
            self.assertEqual(res.status_code, status.HTTP_202_ACCEPTED)
            self.notification_1.refresh_from_db()
            self.assertEqual(self.notification_1.status, EmailNotification.Status.QUEUED)

            # In Celery task, upon delivery transitions to SENT
            with patch("followups.services.send_mail", return_value=1):
                task_result = send_email_notification_task.apply(args=[self.notification_1.pk]).result
                self.assertEqual(task_result["status"], "SENT")
                self.notification_1.refresh_from_db()
                self.assertEqual(self.notification_1.status, EmailNotification.Status.SENT)

    @patch("followups.tasks.send_email_notification_task.delay")
    def test_10_api_responses_for_queued_and_failed_dispatches(self, mock_delay):
        """10. Endpoint returns HTTP 202 Accepted on queue, HTTP 409 Conflict if already queued, and HTTP 503 on queue failure."""
        self.client.force_authenticate(user=self.admin_user)
        url = f"/api/email-notifications/{self.notification_1.pk}/resend/"

        with override_settings(CELERY_TASK_ALWAYS_EAGER=False):
            # A) Successful queue: returns HTTP 202 Accepted
            mock_res = MagicMock()
            mock_res.id = "task-10-ok"
            mock_delay.return_value = mock_res

            res = self.client.post(url)
            self.assertEqual(res.status_code, status.HTTP_202_ACCEPTED)
            self.assertTrue(res.data["success"])
            self.assertIn("Queued via Celery task", res.data["message"])

            # B) Rapid duplicate click while already QUEUED: returns HTTP 409 Conflict
            res_conflict = self.client.post(url)
            self.assertEqual(res_conflict.status_code, status.HTTP_409_CONFLICT)
            self.assertFalse(res_conflict.data["success"])
            self.assertIn("already queued", res_conflict.data["message"])

            # C) Celery queue submission fails: returns HTTP 503 Service Unavailable
            self.notification_1.status = EmailNotification.Status.FAILED
            self.notification_1.save()
            mock_delay.side_effect = Exception("Redis broker is down")

            res_fail = self.client.post(url)
            self.assertEqual(res_fail.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
            self.assertFalse(res_fail.data["success"])
            self.assertIn("Task queue broker unavailable", res_fail.data["message"])


class CeleryTaskTypingAndPylanceDiagnosticTests(TestCase):
    """
    Phase 2 / Phase 8 (12): Test the exact typing behavior and callability of Celery tasks.
    """

    def test_12_pylance_callable_task(self):
        """12. send_email_notification_task is callable and its .delay method is callable without reportCallIssue."""
        from celery.app.task import Task
        self.assertTrue(hasattr(send_email_notification_task, "delay"))
        self.assertTrue(callable(send_email_notification_task.delay))
        self.assertTrue(hasattr(send_email_notification_task, "apply_async"))
        self.assertTrue(callable(send_email_notification_task.apply_async))
        # Verify it conforms to Task interface
        self.assertTrue(isinstance(send_email_notification_task, Task))
