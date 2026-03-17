import { useApp } from "../context/AppContext";
import Icons from "./Icons";

// ── Role constants ─────────────────────────────────────────────
export const ROLES = {
  ADMIN:        "Admin",
  DOCTOR:       "Doctor",
  RECEPTIONIST: "Receptionist",
};

// ── Centralized nav definition ─────────────────────────────────
// Add a new section/item here and list which roles can see it.
const ALL_ROLES = [ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST];

const SIDEBAR_SECTIONS = [
  {
    section: null,
    items: [
      { id: "dashboard", label: "Dashboard", icon: Icons.Dashboard, roles: ALL_ROLES },
    ],
  },
  {
    section: "Clinic Management",
    roles: [ROLES.ADMIN],
    items: [
      { id: "clinics", label: "Clinics", icon: Icons.Clinic,  roles: [ROLES.ADMIN] },
      { id: "users",   label: "Users",   icon: Icons.Users,   roles: [ROLES.ADMIN] },
    ],
  },
  {
    section: "Patient Management",
    roles: ALL_ROLES,
    items: [
      { id: "patients",      label: "Patients",      icon: Icons.Patient,   roles: ALL_ROLES },
      { id: "appointments",  label: "Appointments",  icon: Icons.Calendar,  roles: ALL_ROLES },
      { id: "encounters",    label: "Encounters",    icon: Icons.Encounter, roles: ALL_ROLES },
    ],
  },
  {
    section: "Billing",
    roles: [ROLES.ADMIN],
    items: [
      { id: "bills",    label: "Bills",    icon: Icons.Bill,    roles: [ROLES.ADMIN] },
      { id: "payments", label: "Payments", icon: Icons.Payment, roles: [ROLES.ADMIN] },
    ],
  },
  {
    section: "Inventory",
    roles: [ROLES.ADMIN],
    items: [
      { id: "inventory", label: "Inventory", icon: Icons.Inventory, roles: [ROLES.ADMIN] },
    ],
  },
  {
    section: "Reports",
    roles: [ROLES.ADMIN],
    items: [
      { id: "reports", label: "Reports", icon: Icons.Reports, roles: [ROLES.ADMIN] },
    ],
  },
  {
    section: "Settings",
    roles: [ROLES.ADMIN],
    items: [
      { id: "settings", label: "Settings", icon: Icons.Settings, roles: [ROLES.ADMIN] },
    ],
  },
];

// ── Helpers ────────────────────────────────────────────────────
const canAccess = (allowedRoles, userRole) =>
  !allowedRoles || allowedRoles.includes(userRole);

// Flat list of all items — used by TopNav for page title lookup
export const SIDEBAR_ITEMS = SIDEBAR_SECTIONS.flatMap(s => s.items);

// Returns only the sections/items the given role may see
export const getVisibleSections = (role) =>
  SIDEBAR_SECTIONS
    .filter(s => canAccess(s.roles ?? ALL_ROLES, role))
    .map(s => ({
      ...s,
      items: s.items.filter(item => canAccess(item.roles, role)),
    }))
    .filter(s => s.items.length > 0);

// ── Sidebar component ──────────────────────────────────────────
const Sidebar = () => {
  const { page, setPage, collapsed, setCollapsed, mobileSidebar, setMobileSidebar, user } = useApp();

  const role = user?.role ?? ROLES.ADMIN;
  const visibleSections = getVisibleSections(role);

  // Initials for the user avatar
  const initials = user?.full_name
    ? user.full_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  const handleNav = (id) => {
    setPage(id);
    setMobileSidebar(false);
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
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
          ${mobileSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ width: collapsed && !mobileSidebar ? 68 : 252, background: "#0E6C68" }}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
          {collapsed ? (
            <button onClick={() => setCollapsed(false)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
              <Icons.Heart />
            </button>
          ) : (
            <div className="flex items-center gap-3 flex-1">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.2)" }}>
                <Icons.Heart />
              </div>
              <span className="text-white font-bold text-lg tracking-tight">ClinicOS</span>
              <button onClick={() => setCollapsed(true)} className="ml-auto p-1.5 rounded-lg hidden lg:block" style={{ color: "rgba(255,255,255,0.6)" }}>
                <Icons.ChevronLeft />
              </button>
              <button onClick={() => setMobileSidebar(false)} className="ml-auto p-1.5 rounded-lg lg:hidden" style={{ color: "rgba(255,255,255,0.6)" }}>
                <Icons.X />
              </button>
            </div>
          )}
        </div>

        {/* Nav — only role-permitted sections rendered */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {visibleSections.map((group, gi) => (
            <div key={gi} className="mb-1">
              {group.section && !collapsed && (
                <div className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.45)", letterSpacing: "0.12em" }}>
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
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${collapsed ? "justify-center" : ""}`}
                    style={active ? { background: "rgba(255,255,255,0.18)", color: "white" } : { color: "rgba(255,255,255,0.72)" }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span className="flex-shrink-0" style={{ color: active ? "white" : "rgba(255,255,255,0.72)" }}>
                      <item.icon />
                    </span>
                    {!collapsed && <span>{item.label}</span>}
                    {active && !collapsed && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white opacity-80"></span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User card */}
        {!collapsed ? (
          <div className="p-3" style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
            <button
              onClick={() => handleNav("my-profile")}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
              style={{ color: "rgba(255,255,255,0.85)" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: "rgba(255,255,255,0.25)" }}>
                {initials}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm font-semibold text-white truncate">{user?.full_name ?? "User"}</div>
                <div className="text-xs truncate" style={{ color: "rgba(255,255,255,0.5)" }}>{role}</div>
              </div>
              <span style={{ color: "rgba(255,255,255,0.4)" }}><Icons.ChevronRight /></span>
            </button>
          </div>
        ) : (
          <div className="p-3 flex justify-center" style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
            <button onClick={() => handleNav("my-profile")} title={user?.full_name ?? "User"} className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "rgba(255,255,255,0.25)" }}>
              {initials}
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
