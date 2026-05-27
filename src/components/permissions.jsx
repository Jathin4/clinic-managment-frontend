export const PERMISSIONS = {
  // ── Sidebar screens ───────────────────────────────
  VIEW_DASHBOARD:        "view_dashboard",
  MANAGE_CLINICS:        "manage_clinics",
  MANAGE_USERS:          "manage_users",
  VIEW_PATIENTS:         "view_patients",
  VIEW_APPOINTMENTS:     "view_appointments",
  VIEW_ENCOUNTERS:       "view_encounters",
  VIEW_BILLING:          "view_billing",
  VIEW_EXPENSES:         "view_expenses",
  VIEW_INVENTORY:        "view_inventory",
  VIEW_REPORTS:          "view_reports",
  VIEW_SETTINGS:         "view_settings",
  VIEW_ATTENDANCE:       "view_attendance",

  // ── Dashboard KPI cards ───────────────────────────
  DASH_ALL_PATIENTS:        "dash_all_patients",
  DASH_OWN_PATIENTS:        "dash_own_patients",
  DASH_ALL_APPOINTMENTS:    "dash_all_appointments",
  DASH_OWN_APPOINTMENTS:    "dash_own_appointments",
  DASH_REVENUE:             "dash_revenue",
  DASH_EXPENSES:            "dash_expenses",
  DASH_APT_PER_DOCTOR_ALL:  "dash_apt_per_doctor_all",
  DASH_APT_PER_DOCTOR_OWN:  "dash_apt_per_doctor_own",
  DASH_PAYMENT_MODES:       "dash_payment_modes",
  DASH_RECENT_PAYMENTS:     "dash_recent_payments",
};

// ── Shorthand sets ────────────────────────────────────────────
const ADMIN_SCREENS = [
  PERMISSIONS.VIEW_DASHBOARD,
  PERMISSIONS.MANAGE_CLINICS,
  PERMISSIONS.MANAGE_USERS,
  PERMISSIONS.VIEW_PATIENTS,
  PERMISSIONS.VIEW_APPOINTMENTS,
  PERMISSIONS.VIEW_ENCOUNTERS,
  PERMISSIONS.VIEW_BILLING,
  PERMISSIONS.VIEW_EXPENSES,
  PERMISSIONS.VIEW_INVENTORY,
  PERMISSIONS.VIEW_REPORTS,
  PERMISSIONS.VIEW_SETTINGS,
  PERMISSIONS.VIEW_ATTENDANCE,
];

const ADMIN_DASHBOARD = [
  PERMISSIONS.DASH_ALL_PATIENTS,
  PERMISSIONS.DASH_ALL_APPOINTMENTS,
  PERMISSIONS.DASH_REVENUE,
  PERMISSIONS.DASH_EXPENSES,
  PERMISSIONS.DASH_APT_PER_DOCTOR_ALL,
  PERMISSIONS.DASH_PAYMENT_MODES,
  PERMISSIONS.DASH_RECENT_PAYMENTS,
];

// ── Role → Permission map ─────────────────────────────────────
const ROLE_PERMISSIONS = {

  // ── Combined roles → full admin access ───────────
  "Admin+Doctor": [
    ...ADMIN_SCREENS,
    ...ADMIN_DASHBOARD,
  ],
  "Admin+Pharmacist": [
    ...ADMIN_SCREENS,
    ...ADMIN_DASHBOARD,
  ],
  // ✅ ADDED: Receptionist+Pharmacist → full admin access
  "Receptionist+Pharmacist": [
    ...ADMIN_SCREENS,
    ...ADMIN_DASHBOARD,
  ],
  // ❌ REMOVED: "Admin+Receptionist"

  // ── Single: Admin ─────────────────────────────────
  Admin: [
    ...ADMIN_SCREENS,
    ...ADMIN_DASHBOARD,
  ],

  // ── Single: Doctor ────────────────────────────────
  Doctor: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_PATIENTS,
    PERMISSIONS.VIEW_APPOINTMENTS,
    PERMISSIONS.VIEW_ENCOUNTERS,
    PERMISSIONS.VIEW_REPORTS,
    // dashboard — only own data
    PERMISSIONS.DASH_OWN_PATIENTS,
    PERMISSIONS.DASH_OWN_APPOINTMENTS,
    PERMISSIONS.DASH_APT_PER_DOCTOR_OWN,
  ],

  // ── Single: Receptionist ──────────────────────────
  Receptionist: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_PATIENTS,
    PERMISSIONS.VIEW_APPOINTMENTS,
    PERMISSIONS.VIEW_ENCOUNTERS,
    PERMISSIONS.VIEW_BILLING,
    PERMISSIONS.VIEW_ATTENDANCE,
    // dashboard
    PERMISSIONS.DASH_ALL_PATIENTS,
    PERMISSIONS.DASH_ALL_APPOINTMENTS,
  ],

  // ── Single: Pharmacist ────────────────────────────
  // ✅ FIXED: Only Bills, Inventory, PharmSales, Dashboard (per your notes)
  Pharmacist: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_BILLING,
    PERMISSIONS.VIEW_INVENTORY,
    // dashboard
    PERMISSIONS.DASH_PAYMENT_MODES,
    PERMISSIONS.DASH_RECENT_PAYMENTS,
  ],

  // ── Single: Staff ─────────────────────────────────
  Staff: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_PATIENTS,
    PERMISSIONS.VIEW_APPOINTMENTS,
    // dashboard
    PERMISSIONS.DASH_ALL_PATIENTS,
    PERMISSIONS.DASH_ALL_APPOINTMENTS,
  ],

  // ── Single: Diagnosist ────────────────────────────
  Diagnosist: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_PATIENTS,
    PERMISSIONS.VIEW_APPOINTMENTS,
    PERMISSIONS.VIEW_ENCOUNTERS,
    PERMISSIONS.VIEW_BILLING,
    PERMISSIONS.VIEW_REPORTS,
    // dashboard
    PERMISSIONS.DASH_ALL_PATIENTS,
    PERMISSIONS.DASH_ALL_APPOINTMENTS,
  ],
};

// ── Helper ────────────────────────────────────────────────────
export const getUserPermissions = (role) => {
  const roles = Array.isArray(role) ? role : [role];
  return [...new Set(roles.flatMap(r => ROLE_PERMISSIONS[r] ?? []))];
};