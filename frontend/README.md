# Minimised CRM - Frontend

A clean, responsive, and modern Customer Relationship Management (CRM) frontend built with **React**, **Vite**, **Tailwind CSS**, and **Axios**, designed to communicate with the Django REST Framework backend.

---

## 🚀 Technology Stack

- **Framework**: React.js 19
- **Build Tool**: Vite 8
- **Routing**: React Router DOM (v7)
- **HTTP Client**: Axios with centralized request/response interceptors
- **Styling**: Tailwind CSS (v4) with custom light theme
- **Icons**: Lucide React

---

## 📁 Directory Structure

```text
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── LoadingSpinner.jsx
│   │   ├── MainLayout.jsx
│   │   ├── Modal.jsx
│   │   ├── Navbar.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── Sidebar.jsx
│   │   ├── StatCard.jsx
│   │   └── Toast.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── pages/
│   │   ├── Contacts.jsx
│   │   ├── Dashboard.jsx
│   │   ├── FollowUps.jsx
│   │   ├── Leads.jsx
│   │   ├── Login.jsx
│   │   ├── NotFound.jsx
│   │   ├── Opportunities.jsx
│   │   ├── Reports.jsx
│   │   └── Settings.jsx
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── contactService.js
│   │   ├── followupService.js
│   │   ├── leadService.js
│   │   ├── opportunityService.js
│   │   └── userService.js
│   ├── App.css
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

---

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
The app will be available at `http://127.0.0.1:5173/`.

### 3. Build for Production
```bash
npm run build
```

---

## 🔐 Demo Credentials

| Username | Password | Role | Description |
|---|---|---|---|
| `ansh` | `admin123` | **ADMIN** | Full CRM & User Management |
| `ravi` | `manager123` | **MANAGER** | Full CRM & Reports Access |
| `AK` | `sales123` | **SALES_EXECUTIVE** | Assigned Leads, Contacts, Deals |

---

## 🌟 Key Features

1. **Authentication & JWT Interceptors**:
   - Access & Refresh token storage in `localStorage`.
   - Automatic silent token refresh via Axios interceptors on `401 Unauthorized`.
   - Fast demo login presets on the login screen.
2. **Dashboard**:
   - Live KPI cards (Total Leads, Contacts, Opportunities, Pending Follow-ups).
   - Sales pipeline breakdown by stage.
   - Recent leads table with live backend records.
3. **Leads Management**:
   - Full CRUD connected to `/api/leads/`.
   - Search by name, email, phone, company.
   - Filter by status (`NEW`, `CONTACTED`, `QUALIFIED`, `CONVERTED`, `LOST`) and source (`WEBSITE`, `REFERRAL`, etc.).
   - Modals for add, edit, view, and deletion confirmation.
4. **Contacts Directory**:
   - Full CRUD connected to `/api/contacts/`.
   - Associate contacts with existing leads.
   - Search by name, phone, address, company.
5. **Opportunities & Pipeline**:
   - Deal progression across 6 stages (`NEW`, `QUALIFIED`, `PROPOSAL`, `NEGOTIATION`, `WON`, `LOST`).
   - Expected close dates, contact association, and notes.
6. **Follow-ups Scheduling**:
   - Calendar date and reminder time scheduling.
   - 1-click status update (`PENDING` -> `COMPLETED`).
7. **Reports & Role-Based UI**:
   - Live stage and status distribution analytics.
   - RBAC matrix display in Settings.
