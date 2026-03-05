# ClinicOS — React Project

A full-featured clinic management system built with React.

## Project Structure

```
clinicos/
├── public/
│   └── index.html              # HTML shell (loads Tailwind CDN)
├── src/
│   ├── index.jsx               # React entry point
│   ├── App.jsx                 # Root router — maps page keys to components
│   │
│   ├── context/
│   │   └── AppContext.jsx      # Global state: page, auth, sidebar collapse
│   │
│   ├── data/
│   │   └── mockData.js         # All schema-driven mock data + helpers
│   │
│   ├── components/
│   │   ├── Icons.jsx           # Inline SVG icon library
│   │   ├── Charts.jsx          # SVG charts: Line, Bar, Donut, Area
│   │   ├── UI.jsx              # Shared primitives: Badge, Btn, Modal, Input,
│   │   │                       #   Select, Toast, PageHeader, DataTable, TR, TD
│   │   ├── Sidebar.jsx         # Teal sidebar with section headers
│   │   └── TopNav.jsx          # Top header bar with search, notifications, user
│   │
│   └── pages/
│       ├── LoginPage.jsx           # Auth — login
│       ├── ForgotPasswordPage.jsx  # Auth — forgot password
│       ├── DashboardPage.jsx       # KPI cards + charts + live activity
│       ├── ClinicsPage.jsx         # clinics table + Add Clinic modal
│       ├── UsersPage.jsx           # users/staff table + Add User modal
│       ├── PatientsPage.jsx        # patients table + profile drill-down
│       ├── AppointmentsPage.jsx    # appointments table + calendar view
│       ├── EncountersPage.jsx      # encounters table + detail view
│       ├── DiagnosesPage.jsx       # ICD-10 diagnoses table
│       ├── PrescriptionsPage.jsx   # prescriptions table
│       ├── BillingPage.jsx         # invoices table + invoice detail modal
│       ├── PaymentsPage.jsx        # payments table + record payment
│       ├── InventoryPage.jsx       # medicine inventory + stock bars
│       ├── ReportsPage.jsx         # revenue / doctors / patients / audit tabs
│       ├── SettingsPage.jsx        # settings cards
│       └── EmployeeProfilePage.jsx # logged-in user profile
└── package.json
```

## Getting Started

```bash
cd clinicos
npm install
npm start
```

Opens at http://localhost:3000

**Demo credentials:** any email + password ≥ 6 chars

## Tech Stack

- React 18 (hooks, context)
- Tailwind CSS (via CDN in index.html)
- Pure SVG charts (no chart library needed)
- No routing library — simple page-key state in AppContext
