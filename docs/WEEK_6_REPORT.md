# Minimised CRM: Week 6 Development Report
**Project:** Minimised CRM: A Full-Stack Customer Relationship Management System  
**Academic Level:** B.Tech Semester 5  
**Evaluation Milestone:** Week 6 Completed Implementation  

---

## 1. Executive Summary

During Week 6, all planned development milestones for the Minimised CRM system were completed without breaking existing functionality. The implementation extends the existing Django REST Framework backend and React (Vite + Tailwind CSS) frontend with enterprise-grade features:

1. **Email Notification System:** Complete backend email service with safe testing/console fallback, follow-up integration, status tracking (`PENDING`, `SENT`, `FAILED`), and resend endpoints.
2. **Interactive Visual Analytics & Charts:** Custom lightweight, zero-dependency SVG charts for Lead Status Distribution, Opportunity Pipeline, Revenue by Stage, and Follow-up Completion integrated into both Dashboard and Reports pages.
3. **Automated Activity Logging & Live Feed:** Real-time audit logging across core CRM operations (lead/contact/deal creation and updates, follow-up completions, logins) paired with a live, relative-time activity feed on the Dashboard.
4. **Role-Scoped CSV Exports:** Standard RFC-4180 CSV export for Leads and Contacts with server-side Role-Based Access Control (RBAC) allowing `ADMIN` and `MANAGER` access while enforcing `403 Forbidden` for unauthorized roles.
5. **Robust Error Handling & Refined Search/Filters:** Enhanced multi-field search and status/source/stage filtering across all modules, paired with friendly error representations across HTTP 400, 401, 403, 404, 500 status codes.

---

## 2. Completed Week 6 Objectives & Deliverables

| Objective | Backend Implementation | Frontend Implementation | Status |
| :--- | :--- | :--- | :--- |
| **Email Notification System** | `followups/services.py`, `EmailNotification` CRUD APIs, `resend` action | `notificationService.js`, Follow-up modal reminder toggle, status badges, details view | **100% Complete** |
| **Dashboard & Reports Charts** | `config/analytics_views.py` (`/api/reports/analytics/` endpoint) | Custom SVG charts (`LeadStatusChart`, `PipelineStageChart`, `RevenueChart`, `FollowupStatusChart`) | **100% Complete** |
| **Activity Log API & Automation** | `users/activity.py`, `ActivityLogViewSet`, signals/hooks on mutations | `activityService.js`, live dashboard activity feed with relative timestamps ("X min ago") | **100% Complete** |
| **CSV Export & RBAC** | `@action(detail=False, url_path='export-csv')` with role authorization check | [Export CSV] buttons on Leads and Contacts with automatic Blob download | **100% Complete** |
| **Search & Filter Refinement** | Refined `get_queryset` with `Q` queries and query parameters | Responsive search bars, status and source dropdowns on all entity tables | **100% Complete** |
| **Error Handling & UX States** | Clean DRF error payloads and status codes | Global `getErrorMessage` handling 400, 401, 403, 404, 500, loading spinners & empty states | **100% Complete** |

---

## 3. Git Commit History

The project follows a clean, atomic Git commit history as planned:

1. `75c265a` - **"Implement email notification integration"**
2. `edd9db4` - **"Add CRM dashboard analytics"**
3. `d22a688` - **"Implement activity log API and feed"**
4. `4f129fe` - **"Add CSV export for leads and contacts"**
5. `c9552b1` - **"Improve API error handling and testing"**

---

## 4. REST API Endpoint Directory

### Authentication & Users
- `POST /api/auth/login/` — Authenticates user credentials and issues JWT Access + Refresh tokens.
- `POST /api/auth/refresh/` — Renews expired JWT access tokens.
- `GET /api/auth/me/` — Returns the profile and role of the currently authenticated user.

### Leads Module
- `GET /api/leads/?search=<q>&status=<s>&source=<src>` — Filtered leads list (role-scoped).
- `POST /api/leads/` — Creates a new lead and generates an audit log entry.
- `GET /api/leads/<id>/` — Retrieves lead details.
- `PUT/PATCH /api/leads/<id>/` — Updates lead attributes and logs change.
- `DELETE /api/leads/<id>/` — Removes lead record.
- `GET /api/leads/export-csv/` — Streams `leads_export.csv` (`ADMIN` & `MANAGER` only; `403` for `SALES_EXECUTIVE`).

### Contacts Module
- `GET /api/contacts/?search=<q>` — Filtered contacts list.
- `POST /api/contacts/` — Registers a customer contact.
- `GET /api/contacts/<id>/` — Retrieves contact record.
- `PUT/PATCH /api/contacts/<id>/` — Updates contact record.
- `DELETE /api/contacts/<id>/` — Deletes contact.
- `GET /api/contacts/export-csv/` — Streams `contacts_export.csv` (`ADMIN` & `MANAGER` only).

### Opportunities Pipeline
- `GET /api/opportunities/?search=<q>&stage=<s>` — Filtered deal opportunities.
- `POST /api/opportunities/` — Registers a deal with amount and stage.
- `PATCH /api/opportunities/<id>/` — Transitions deal stages (New, Qualified, Proposal, Negotiation, Won, Lost).

### Follow-ups & Email Reminders
- `GET /api/followups/?status=<s>&date=<d>` — Filtered follow-up meetings/tasks.
- `POST /api/followups/` — Creates a follow-up and triggers email notification dispatch.
- `PATCH /api/followups/<id>/` — Marks follow-up as Completed or updates notes.
- `GET /api/email-notifications/` — Lists email reminders and delivery statuses.
- `POST /api/email-notifications/<id>/resend/` — Re-triggers notification dispatch.

### Activity Logs & Analytics
- `GET /api/activity-logs/` — Audited actions across the CRM with user details.
- `GET /api/reports/analytics/` — Live database aggregate KPIs, status distributions, and pipeline valuations.

---

## 5. Verification & Test Evidence

All 12 visual evidence artifacts were captured from the running system and saved into `docs/screenshots/`:

| No. | Evidence File | Description |
| :---: | :--- | :--- |
| **01** | `01_EmailNotification_API.png` | Email Notification REST API JSON response with delivery statuses and follow-up links. |
| **02** | `02_EmailNotification_UI.png` | Follow-ups UI showcasing scheduled reminder, receiver input, and `SENT` status badge. |
| **03** | `03_Email_Test.png` | Django email service execution log verifying RFC-822 formatted message delivery. |
| **04** | `04_Dashboard_Charts.png` | Main dashboard displaying live KPI cards, Lead Status distribution, and Opportunity pipeline. |
| **05** | `05_Reports_Page.png` | Reports page with 8 KPI metrics, pipeline stages, revenue valuation, and follow-up completion charts. |
| **06** | `06_ActivityLog_API.png` | Activity Log REST API response with user metadata, activity descriptions, and timestamps. |
| **07** | `07_Activity_Feed.png` | Live activity audit feed on the Dashboard featuring relative time calculations ("X minutes ago"). |
| **08** | `08_Lead_CSV_Export.png` | Leads management screen with [Export CSV] action and success toast notification. |
| **09** | `09_Contact_CSV_Export.png` | Contacts management screen with [Export CSV] action and success toast notification. |
| **10** | `10_Role_Permissions_Test.png` | Security test demonstrating HTTP 403 Forbidden when Sales Executive attempts restricted export. |
| **11** | `11_Error_Handling.png` | User-friendly error message display upon invalid authentication credentials. |
| **12** | `12_End_to_End_Testing.png` | Complete test execution verifying all 8 core functional modules with 100% pass rate. |

---

## 6. Security & Role-Based Access Control Summary

- **Authentication:** All protected endpoints strictly require valid JWT Bearer tokens in the `Authorization` header.
- **Token Lifecycle:** Expired access tokens refresh transparently via Axios interceptors and the `/api/auth/refresh/` route without user disruption.
- **RBAC Authority:** Server-side permissions in `users/permissions.py` (`RolePermission`, `AdminOnly`, `AdminManager`, `AllCRMUsers`) enforce authorization regardless of client requests.
- **Environment Isolation:** Zero SMTP or database credentials are hardcoded; all configuration flows from `.env` with fallback to safe testing backends.

---

## 7. Recommended Week 7 Development Work

1. **Kanban Board View for Opportunities:** Drag-and-drop opportunity cards between pipeline stages (`QUALIFIED`, `PROPOSAL`, `NEGOTIATION`, `WON`, `LOST`).
2. **Automated Celery / Background Task Scheduling:** Moving email delivery and reminder cron checks to asynchronous background workers (Celery + Redis).
3. **Advanced Customer Notes & Timeline:** Aggregated timeline view on Contact details showing associated leads, deals, email notifications, and interaction notes in one view.
