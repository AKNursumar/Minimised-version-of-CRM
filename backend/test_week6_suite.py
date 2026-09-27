import urllib.request
import urllib.error
import json
import sys

BASE = 'http://127.0.0.1:8000'

def request(method, path, data=None, token=None):
    url = f'{BASE}{path}'
    body = json.dumps(data).encode('utf-8') if data else None
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        res = urllib.request.urlopen(req)
        raw = res.read().decode('utf-8')
        try:
            return res.status, json.loads(raw), res.headers
        except Exception:
            return res.status, raw, res.headers
    except urllib.error.HTTPError as e:
        raw = e.read().decode('utf-8')
        try:
            return e.code, json.loads(raw), e.headers
        except Exception:
            return e.code, raw, e.headers

print('=== 1. TEST AUTHENTICATION ===')
# Valid login
s, d, _ = request('POST', '/api/auth/login/', {'username': 'ansh', 'password': 'admin123'})
assert s == 200, f'Admin login failed: {s}, {d}'
admin_token = d['access']
refresh_token = d['refresh']
print('[PASS] Valid login OK (Role:', d['user']['role'], ')')

# Invalid login
s, d, _ = request('POST', '/api/auth/login/', {'username': 'ansh', 'password': 'wrongpassword'})
assert s == 400, f'Expected 400 on invalid login: {s}'
print('[PASS] Invalid login rejected (HTTP', s, ')')

# Unauthenticated protected route
s, d, _ = request('GET', '/api/leads/')
assert s == 401, f'Expected 401 without token: {s}'
print('[PASS] Protected route rejects unauthenticated request (HTTP', s, ')')

# Token refresh
s, d, _ = request('POST', '/api/auth/refresh/', {'refresh': refresh_token})
assert s == 200, f'Refresh failed: {s}'
new_access = d['access']
print('[PASS] Token refresh OK')

# Manager & Sales Exec logins
s, d_mgr, _ = request('POST', '/api/auth/login/', {'username': 'ravi', 'password': 'manager123'})
assert s == 200 and d_mgr['user']['role'] == 'MANAGER'
mgr_token = d_mgr['access']
print('[PASS] Manager login OK')

s, d_sales, _ = request('POST', '/api/auth/login/', {'username': 'AK', 'password': 'sales123'})
assert s == 200 and d_sales['user']['role'] == 'SALES_EXECUTIVE'
sales_token = d_sales['access']
print('[PASS] Sales Executive login OK')

print('\n=== 2. TEST LEADS CRUD, SEARCH & FILTER ===')
# POST Lead
s, new_lead, _ = request('POST', '/api/leads/', {
    'name': 'Acme Global Ventures',
    'company': 'Acme Global',
    'email': 'contact@acmeglobal.com',
    'phone': '9876501234',
    'source': 'WEBSITE',
    'status': 'NEW'
}, token=admin_token)
assert s == 201, f'Create lead failed: {s}, {new_lead}'
lead_id = new_lead['id']
print(f'[PASS] Create Lead OK (ID: {lead_id})')

# GET Lead
s, lead_get, _ = request('GET', f'/api/leads/{lead_id}/', token=admin_token)
assert s == 200 and lead_get['name'] == 'Acme Global Ventures'
print('[PASS] GET Lead by ID OK')

# PATCH Lead
s, lead_patched, _ = request('PATCH', f'/api/leads/{lead_id}/', {'status': 'CONTACTED'}, token=admin_token)
assert s == 200 and lead_patched['status'] == 'CONTACTED'
print('[PASS] PATCH Lead status OK')

# SEARCH Lead
s, search_res, _ = request('GET', '/api/leads/?search=Acme', token=admin_token)
assert s == 200 and len(search_res) >= 1
print(f'[PASS] Search Leads OK (found {len(search_res)} matching Acme)')

# FILTER Lead by status
s, filter_res, _ = request('GET', '/api/leads/?status=CONTACTED', token=admin_token)
assert s == 200 and all(l['status'] == 'CONTACTED' for l in filter_res)
print(f'[PASS] Filter Leads by status OK (found {len(filter_res)} CONTACTED)')

print('\n=== 3. TEST CONTACTS CRUD & SEARCH ===')
# POST Contact
s, new_contact, _ = request('POST', '/api/contacts/', {
    'name': 'Rajesh Patel',
    'company': 'Acme Global',
    'email': 'rajesh@acmeglobal.com',
    'phone': '9876501235',
    'address': 'Sector 62, Noida',
    'notes': 'VP of Engineering'
}, token=admin_token)
assert s == 201
contact_id = new_contact['id']
print(f'[PASS] Create Contact OK (ID: {contact_id})')

# SEARCH Contact
s, c_search, _ = request('GET', '/api/contacts/?search=Rajesh', token=admin_token)
assert s == 200 and len(c_search) >= 1
print(f'[PASS] Search Contacts OK (found {len(c_search)})')

print('\n=== 4. TEST OPPORTUNITIES PIPELINE ===')
# POST Opportunity
s, new_opp, _ = request('POST', '/api/opportunities/', {
    'title': 'Acme Global Cloud Migration',
    'contact': contact_id,
    'amount': '150000.00',
    'stage': 'QUALIFIED'
}, token=admin_token)
assert s == 201
opp_id = new_opp['id']
print(f'[PASS] Create Opportunity OK (ID: {opp_id}, Amount: {new_opp["amount"]})')

# PATCH Opportunity Stage
s, opp_patch, _ = request('PATCH', f'/api/opportunities/{opp_id}/', {'stage': 'PROPOSAL'}, token=admin_token)
assert s == 200 and opp_patch['stage'] == 'PROPOSAL'
print('[PASS] Opportunity Stage Update OK (QUALIFIED -> PROPOSAL)')

print('\n=== 5. TEST FOLLOW-UP & EMAIL NOTIFICATION WORKFLOW ===')
# POST Followup with Email Reminder
s, new_followup, _ = request('POST', '/api/followups/', {
    'opportunity': opp_id,
    'followup_date': '2026-10-05',
    'reminder_time': '11:00:00',
    'remarks': 'Follow-up on proposal presentation',
    'status': 'PENDING',
    'email_reminder': True,
    'receiver': 'rajesh@acmeglobal.com',
    'subject': 'Proposal Review Follow-up',
    'message': 'Dear Rajesh, looking forward to our review meeting.'
}, token=admin_token)
assert s == 201
followup_id = new_followup['id']
print(f'[PASS] Create Follow-up with Email Reminder OK (ID: {followup_id})')

# Verify EmailNotification created and sent
s, email_notifs, _ = request('GET', '/api/email-notifications/', token=admin_token)
assert s == 200 and len(email_notifs) >= 1
latest_notif = email_notifs[0]
print(f'[PASS] EmailNotification created: ID {latest_notif["id"]}, Receiver: {latest_notif["receiver"]}, Status: {latest_notif["status"]}')

# Re-send Email Notification action
s, resend_res, _ = request('POST', f'/api/email-notifications/{latest_notif["id"]}/resend/', token=admin_token)
assert s == 200 and resend_res['success'] is True
print('[PASS] EmailNotification resend action OK')

# Complete Follow-up
s, fu_patch, _ = request('PATCH', f'/api/followups/{followup_id}/', {'status': 'COMPLETED'}, token=admin_token)
assert s == 200 and fu_patch['status'] == 'COMPLETED'
print('[PASS] Complete Follow-up OK (PENDING -> COMPLETED)')

print('\n=== 6. TEST ACTIVITY LOG API & AUTOMATION ===')
s, logs, _ = request('GET', '/api/activity-logs/', token=admin_token)
assert s == 200 and len(logs) >= 5
print(f'[PASS] Activity Logs retrieved OK (total: {len(logs)})')
print('Latest 3 CRM activity events:')
for l in logs[:3]:
    print(f'   - [{l["created_at"][:19]}] {l["username"]}: {l["activity"]}')

print('\n=== 7. TEST CSV EXPORTS & RBAC RESTRICTIONS ===')
# Admin exports leads
s, leads_csv, h_l = request('GET', '/api/leads/export-csv/', token=admin_token)
assert s == 200 and 'filename="leads_export.csv"' in str(h_l)
assert 'ID,Name,Company,Email,Phone,Source,Status,Assigned To,Created At' in leads_csv
print('[PASS] Admin Leads CSV Export OK with required headers')

# Admin exports contacts
s, contacts_csv, h_c = request('GET', '/api/contacts/export-csv/', token=admin_token)
assert s == 200 and 'filename="contacts_export.csv"' in str(h_c)
assert 'ID,Name,Email,Phone,Company,Address,Notes,Created At' in contacts_csv
print('[PASS] Admin Contacts CSV Export OK with required headers')

# Manager exports leads
s, _, _ = request('GET', '/api/leads/export-csv/', token=mgr_token)
assert s == 200
print('[PASS] Manager Leads CSV Export OK (HTTP 200)')

# Sales Executive unauthorized export attempt
s, err_data, _ = request('GET', '/api/leads/export-csv/', token=sales_token)
assert s == 403, f'Expected 403 for sales executive, got {s}'
print(f'[PASS] Sales Executive CSV Export properly blocked (HTTP 403: {err_data["detail"]})')

print('\n=== 8. TEST ANALYTICS SUMMARY ENDPOINT ===')
s, analytics, _ = request('GET', '/api/reports/analytics/', token=admin_token)
assert s == 200
print('[PASS] Analytics Summary OK:')
print(f'   - Total Leads: {analytics["total_leads"]}')
print(f'   - Converted Leads: {analytics["converted_leads"]}')
print(f'   - Total Contacts: {analytics["total_contacts"]}')
print(f'   - Total Opportunities: {analytics["total_opportunities"]}')
print(f'   - Total Opp Value: Rs. {analytics["total_opportunity_value"]:,.2f}')
print(f'   - Won Opps: {analytics["won_opportunities"]}')
print(f'   - Pending Followups: {analytics["pending_followups"]}')
print(f'   - Sent Emails: {analytics["sent_emails"]}')

print('\n=============================================')
print('ALL WEEK 6 BACKEND & API TESTS COMPLETED 100%')
print('=============================================')
