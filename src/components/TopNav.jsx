import { useState } from "react";
import { useApp } from "../context/AppContext";
import { SIDEBAR_ITEMS } from "./Sidebar";
import Icons from "./Icons";

const TopNav = () => {
  const { page, setPage, collapsed, setCollapsed, handleLogout, user } = useApp();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUser,   setShowUser]   = useState(false);
  const pageTitle = SIDEBAR_ITEMS.find(i => i.id === page)?.label || "Dashboard";

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4 relative">
      {collapsed && (
        <button onClick={() => setCollapsed(false)} className="p-2 hover:bg-gray-100 rounded-xl text-slate-500 transition-colors">
          <Icons.Menu />
        </button>
      )}
      <div className="flex-1 flex items-center gap-4">
       
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl text-slate-400">
          <Icons.Search />
          <input placeholder="Quick search..." className="bg-transparent text-sm outline-none w-48 text-slate-600 placeholder:text-slate-400" />
        </div>

        {/* Notifications */}
        <button className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-colors" onClick={() => { setShowNotifs(!showNotifs); setShowUser(false); }}>
          <Icons.Bell />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        {showNotifs && (
          <div className="absolute top-14 right-24 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-40 p-4">
            <div className="font-semibold text-slate-700 mb-3">Notifications</div>
            {["Low stock: Amlodipine 5mg (8 units left)", "3 appointments pending for today", "Invoice INV-003 overdue"].map((n, i) => (
              <div key={i} className="py-2.5 border-b border-gray-50 last:border-0 text-sm text-slate-600 flex items-start gap-2">
                <span className="w-2 h-2 mt-1.5 rounded-full bg-teal-500 flex-shrink-0"></span>{n}
              </div>
            ))}
          </div>
        )}

        {/* User */}
        <button
          className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-xl transition-colors"
          onClick={() => { setShowUser(!showUser); setShowNotifs(false); }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "linear-gradient(135deg,#0E6C68,#14A3A0)" }}>
            {user?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-700 leading-tight">{user?.full_name || 'User'}</div>
            <div className="text-xs text-slate-400 leading-tight">{user?.role || ''}</div>
          </div>
          <Icons.ChevronDown />
        </button>
        {showUser && (
          <div className="absolute top-14 right-4 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-40 p-2">
            <div className="px-3 py-3 mb-1 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: "linear-gradient(135deg,#0E6C68,#14A3A0)" }}>
                  {user?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate">{user?.full_name || 'User'}</div>
                  <div className="text-xs text-slate-400 truncate">{user?.email || ''}</div>
                </div>
              </div>
            </div>
            <button onClick={() => { setPage("my-profile"); setShowUser(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-teal-50 hover:text-teal-700 rounded-xl transition-colors">
              <Icons.User />My Profile
            </button>
            <button onClick={() => { setPage("settings"); setShowUser(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-gray-50 rounded-xl transition-colors">
              <Icons.Settings />Settings
            </button>
            <div className="border-t border-gray-100 mt-1 pt-1">
              <button onClick={() => { setShowUser(false); handleLogout(); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium">
                <Icons.Logout />Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopNav;
