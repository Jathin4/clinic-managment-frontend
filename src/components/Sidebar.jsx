import { useApp } from "../context/AppContext";
import { CURRENT_USER } from "../data/mockData";
import Icons from "./Icons";

const SIDEBAR_SECTIONS = [
  { section: null, items: [
    { id: "dashboard",     label: "Dashboard",     icon: Icons.Dashboard },
  ]},
  { section: "Clinic Management", items: [
    { id: "clinics",       label: "Clinics",       icon: Icons.Clinic },
    { id: "users",         label: "Users",         icon: Icons.Users  },
  ]},
  { section: "Patient Management", items: [
    { id: "patients",      label: "Patients",      icon: Icons.Patient      },
    { id: "appointments",  label: "Appointments",  icon: Icons.Calendar     },
    { id: "encounters",    label: "Encounters",    icon: Icons.Encounter    },
  ]},
  { section: "Billing", items: [
    { id: "bills",         label: "Bills",         icon: Icons.Bill    },
    { id: "payments",      label: "Payments",      icon: Icons.Payment },
  ]},
  { section: "Inventory", items: [
    { id: "inventory",     label: "Inventory",     icon: Icons.Inventory },
  ]},
  { section: "Reports", items: [
    { id: "reports",       label: "Reports",       icon: Icons.Reports },
  ]},
  { section: "Settings", items: [
    { id: "settings",      label: "Settings",      icon: Icons.Settings },
  ]},
];

export const SIDEBAR_ITEMS = SIDEBAR_SECTIONS.flatMap(s => s.items);

const Sidebar = () => {
  const { page, setPage, collapsed, setCollapsed, mobileSidebar, setMobileSidebar } = useApp();

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

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {SIDEBAR_SECTIONS.map((group, gi) => (
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

      {/* User */}
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
              {CURRENT_USER.initials}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm font-semibold text-white truncate">{CURRENT_USER.name}</div>
              <div className="text-xs truncate" style={{ color: "rgba(255,255,255,0.5)" }}>{CURRENT_USER.role}</div>
            </div>
            <span style={{ color: "rgba(255,255,255,0.4)" }}><Icons.ChevronRight /></span>
          </button>
        </div>
      ) : (
        <div className="p-3 flex justify-center" style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
          <button onClick={() => handleNav("my-profile")} title={CURRENT_USER.name} className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "rgba(255,255,255,0.25)" }}>
            {CURRENT_USER.initials}
          </button>
        </div>
      )}
    </aside>
    </>
  );
};

export default Sidebar;
