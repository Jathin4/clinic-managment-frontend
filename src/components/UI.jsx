import Icons from "./Icons";

// ── Badge ──────────────────────────────────────────────────────
export const Badge = ({ status }) => {
  const styles = {
    Active:     "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Inactive:   "bg-gray-100 text-gray-500 border border-gray-200",
    Paid:       "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Partial:    "bg-amber-50 text-amber-700 border border-amber-200",
    Unpaid:     "bg-red-50 text-red-600 border border-red-200",
    Booked:     "bg-blue-50 text-blue-700 border border-blue-200",
    CheckedIn:  "bg-violet-50 text-violet-700 border border-violet-200",
    Completed:  "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Cancelled:  "bg-red-50 text-red-600 border border-red-200",
    Good:       "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Low:        "bg-amber-50 text-amber-700 border border-amber-200",
    Critical:   "bg-red-50 text-red-600 border border-red-200",
    Expiring:   "bg-orange-50 text-orange-600 border border-orange-200",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
};

// ── StatCard ───────────────────────────────────────────────────
export const StatCard = ({ title, value, change, icon: IconComp, bgColor = "#DFF7F6", positive = true }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer group">
    <div className="flex items-start justify-between mb-4">
      <div className="p-2.5 rounded-xl" style={{ backgroundColor: bgColor }}>
        <IconComp />
      </div>
      <span className={`flex items-center gap-1 text-xs font-semibold ${positive ? "text-emerald-600" : "text-red-500"}`}>
        {positive ? <Icons.TrendUp /> : <Icons.TrendDown />}
        {change}
      </span>
    </div>
    <div className="text-2xl font-bold text-slate-800 mb-1 group-hover:text-teal-700 transition-colors">{value}</div>
    <div className="text-sm text-slate-500">{title}</div>
  </div>
);

// ── Modal ──────────────────────────────────────────────────────
export const Modal = ({ title, children, onClose, wide = false }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
    <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[90vh] overflow-y-auto`}>
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><Icons.X /></button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

// ── Btn ────────────────────────────────────────────────────────
export const Btn = ({ children, onClick, variant = "primary", size = "md", disabled, className = "" }) => {
  const variants = {
    primary:   "bg-teal-700 hover:bg-teal-800 text-white shadow-sm",
    secondary: "bg-white hover:bg-gray-50 text-slate-700 border border-gray-200",
    danger:    "bg-red-500 hover:bg-red-600 text-white",
    ghost:     "hover:bg-gray-100 text-slate-600",
  };
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-6 py-3 text-base" };
  return (
    <button
      onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-2 font-semibold rounded-xl transition-all duration-150 ${variants[variant]} ${sizes[size]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      {children}
    </button>
  );
};

// ── Input ──────────────────────────────────────────────────────
export const Input = ({ label, type = "text", value, onChange, placeholder, required }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} required={required}
      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-50 transition-all"
    />
  </div>
);

// ── Select ─────────────────────────────────────────────────────
export const Select = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
    <select
      value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 bg-white transition-all"
    >
      <option value="">Select...</option>
      {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
    </select>
  </div>
);

// ── Toast ──────────────────────────────────────────────────────
export const Toast = ({ message, type = "success", onClose }) => (
  <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl ${type === "success" ? "bg-emerald-600" : "bg-red-500"} text-white text-sm font-medium`}>
    {type === "success" ? <Icons.Check /> : <Icons.X />}
    {message}
    <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><Icons.X /></button>
  </div>
);

// ── PageHeader ─────────────────────────────────────────────────
export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
      {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

// ── DataTable ──────────────────────────────────────────────────
export const DataTable = ({ title, subtitle, search, onSearch, searchPlaceholder, actions, columns, rows, empty }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
      <div>
        <div className="font-semibold text-slate-700">{title}</div>
        {subtitle && <div className="text-xs text-slate-400 mt-0.5">{subtitle}</div>}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {onSearch && (
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icons.Search /></div>
            <input value={search} onChange={e => onSearch(e.target.value)} placeholder={searchPlaceholder || "Search…"}
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 focus:bg-white w-56 transition-all" />
          </div>
        )}
        {actions}
      </div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
            {columns.map(c => (
              <th key={c} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0
            ? <tr><td colSpan={columns.length} className="text-center py-14 text-slate-400 text-sm">{empty || "No records found"}</td></tr>
            : rows}
        </tbody>
      </table>
    </div>
  </div>
);

// ── TR / TD ────────────────────────────────────────────────────
export const TR = ({ children, onClick }) => (
  <tr onClick={onClick} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: "1px solid #f8fafc" }}>{children}</tr>
);

export const TD = ({ children, mono, bold, muted }) => (
  <td className={`px-5 py-3.5 text-sm ${mono ? "font-mono" : ""} ${bold ? "font-semibold text-slate-800" : muted ? "text-slate-400" : "text-slate-600"}`}>
    {children}
  </td>
);

// ── RightDrawer ────────────────────────────────────────────────
export const RightDrawer = ({ title, children, onClose, open = false }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 animate-fade-in-backdrop bg-black/40" 
        onClick={onClose}
        style={{ backdropFilter: "blur(4px)" }}
      />
      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white animate-slide-in-from-right shadow-2xl overflow-hidden flex flex-col">
        {/* Header - if title is provided */}
        {title && (
          <div className="px-8 py-6 bg-gradient-to-r from-teal-50 to-blue-50 border-b border-teal-100 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-white/50 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
            >
              <Icons.X />
            </button>
          </div>
        )}
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
