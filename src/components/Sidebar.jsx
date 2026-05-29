import { useApp } from "../context/AppContext";
import Icons from "./Icons";
import { PERMISSIONS } from "./permissions"; 

const SIDEBAR_SECTIONS = [
  {
    section: null,
    permission: PERMISSIONS.VIEW_DASHBOARD,
    items: [
      { id: "dashboard", label: "Dashboard", icon: Icons.Dashboard, permission: PERMISSIONS.VIEW_DASHBOARD },
    ],
  },
  {
    section: "Clinic Management",
    permission: PERMISSIONS.MANAGE_CLINICS,
    items: [
      { id: "clinics",     label: "Clinics",     icon: Icons.Clinic,      permission: PERMISSIONS.MANAGE_CLINICS  },
      { id: "users",       label: "Users",       icon: Icons.Users,       permission: PERMISSIONS.MANAGE_USERS    },
      { id: "attendance",  label: "Attendance",  icon: Icons.Attendance,  permission: PERMISSIONS.VIEW_ATTENDANCE },
    ],
  },
  {
    section: "Patient Management",
    permission: PERMISSIONS.VIEW_PATIENTS,
    items: [
      { id: "patients",     label: "Patients",     icon: Icons.Patient,   permission: PERMISSIONS.VIEW_PATIENTS     },
      { id: "appointments", label: "Appointments", icon: Icons.Calendar,  permission: PERMISSIONS.VIEW_APPOINTMENTS },
      { id: "encounters",   label: "Encounters",   icon: Icons.Encounter, permission: PERMISSIONS.VIEW_ENCOUNTERS   },
    ],
  },
  {
    section: "Diagnostics",
    permission: PERMISSIONS.VIEW_DIAGNOSTICS,
    items: [
      { id: "diagnostics", label: "Diagnostics", icon: Icons.Diagnostics, permission: PERMISSIONS.VIEW_DIAGNOSTICS },
    ],
  },
  {
    section: "Billing",
    permission: PERMISSIONS.VIEW_BILLING,
    items: [
      { id: "bills",    label: "Bills",    icon: Icons.Bill,    permission: PERMISSIONS.VIEW_BILLING  },
      { id: "expenses", label: "Expenses", icon: Icons.Expense, permission: PERMISSIONS.VIEW_EXPENSES },
    ],
  },
  {
    section: "Inventory",
    permission: PERMISSIONS.VIEW_INVENTORY,
    items: [
      { id: "inventory",       label: "Inventory",       icon: Icons.Inventory, permission: PERMISSIONS.VIEW_INVENTORY },
      { id: "pharmacy-sales",  label: "Pharmacy Sales",  icon: PharmacyIcon,    permission: PERMISSIONS.VIEW_INVENTORY },
    ],
  },
  {
    section: "Reports",
    permission: PERMISSIONS.VIEW_REPORTS,
    items: [
      { id: "reports", label: "Reports", icon: Icons.Reports, permission: PERMISSIONS.VIEW_REPORTS },
    ],
  },
  // {
  //   section: "Settings",
  //   permission: PERMISSIONS.VIEW_SETTINGS,
  //   items: [
  //     { id: "settings", label: "Settings", icon: Icons.Settings, permission: PERMISSIONS.VIEW_SETTINGS },
  //   ],
  // },
];

// ── Pharmacy Sales icon (shopping cart) ───────────────────────────────────────
function PharmacyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
    </svg>
  );
}

export const SIDEBAR_ITEMS = SIDEBAR_SECTIONS.flatMap(s => s.items);

// ── Sidebar component ─────────────────────────────────────────────────────────
const Sidebar = () => {
  const {
    page, setPage,
    collapsed, setCollapsed,
    mobileSidebar, setMobileSidebar,
    user, can,
  } = useApp();

  const checker = typeof can === "function" ? can : () => false;

  const visibleSections = SIDEBAR_SECTIONS
    .filter(s => checker(s.permission))
    .map(s => ({
      ...s,
      items: s.items.filter(item => checker(item.permission)),
    }))
    .filter(s => s.items.length > 0);

  const initials = user?.full_name
    ? user.full_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  const displayRole = user?.role ?? "";

  const handleNav = (id) => { setPage(id); setMobileSidebar(false); };

  return (
    <>
      {mobileSidebar && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileSidebar(false)}
        />
      )}

      <aside
        className={`
          flex flex-col flex-shrink-0 h-screen overflow-hidden transition-all duration-300
          fixed lg:relative z-50
          ${mobileSidebar ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{ width: collapsed && !mobileSidebar ? 68 : 252, background: "#0E6C68" }}
      >
        {/* ── Logo ── */}
        <div
          className="flex items-center h-16 px-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}
        >
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              <Icons.Heart />
            </button>
          ) : (
            <div className="flex items-center gap-3 flex-1">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.2)" }}
              >
                <Icons.Heart />
              </div>
              <span className="text-white font-bold text-lg tracking-tight">{user?.clinic_name || "ClinicOS"}</span>
              <button
                onClick={() => setCollapsed(true)}
                className="ml-auto p-1.5 rounded-lg hidden lg:block"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                <Icons.ChevronLeft />
              </button>
              <button
                onClick={() => setMobileSidebar(false)}
                className="ml-auto p-1.5 rounded-lg lg:hidden"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                <Icons.X />
              </button>
            </div>
          )}
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {visibleSections.map((group, gi) => (
            <div key={gi} className="mb-1">
              {group.section && !collapsed && (
                <div
                  className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "rgba(255,255,255,0.45)", letterSpacing: "0.12em" }}
                >
                  {group.section}
                </div>
              )}
              {group.items.map(item => {
                const active = page === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                      text-sm font-medium transition-all duration-150
                      ${collapsed ? "justify-center" : ""}
                    `}
                    style={
                      active
                        ? { background: "rgba(255,255,255,0.18)", color: "white" }
                        : { color: "rgba(255,255,255,0.72)" }
                    }
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span
                      className="flex-shrink-0"
                      style={{ color: active ? "white" : "rgba(255,255,255,0.72)" }}
                    >
                      <item.icon />
                    </span>
                    {!collapsed && <span>{item.label}</span>}
                    {active && !collapsed && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white opacity-80" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── User card ── */}
        {!collapsed ? (
          <div className="p-3" style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
            <button
              onClick={() => handleNav("my-profile")}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
              style={{ color: "rgba(255,255,255,0.85)" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.25)" }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm font-semibold text-white truncate">
                  {user?.full_name ?? "User"}
                </div>
                <div className="text-xs truncate" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {displayRole}
                </div>
              </div>
              <span style={{ color: "rgba(255,255,255,0.4)" }}>
                <Icons.ChevronRight />
              </span>
            </button>
          </div>
        ) : (
          <div
            className="p-3 flex justify-center"
            style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}
          >
            <button
              onClick={() => handleNav("my-profile")}
              title={user?.full_name ?? "User"}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: "rgba(255,255,255,0.25)" }}
            >
              {initials}
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;