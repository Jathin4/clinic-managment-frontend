import Icons from "./Icons";
import { useState, useRef, useEffect } from "react";

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
  <div className="bg-white rounded-2xl p-3 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer group">
    <div className="flex items-start justify-between mb-3 sm:mb-4">
      <div className="p-2 sm:p-2.5 rounded-xl" style={{ backgroundColor: bgColor }}>
        <IconComp />
      </div>
      <span className={`flex items-center gap-1 text-xs font-semibold ${positive ? "text-emerald-600" : "text-red-500"}`}>
        {positive ? <Icons.TrendUp /> : <Icons.TrendDown />}
        {change}
      </span>
    </div>
    <div className="text-lg sm:text-2xl font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">{value}</div>
    <div className="text-xs sm:text-sm text-slate-500">{title}</div>
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
export const Btn = ({ children, onClick, variant = "primary", size = "md", disabled, className = "", style }) => {
  const variants = {
    primary:   "bg-teal-700 hover:bg-teal-800 text-white shadow-sm",
    secondary: "bg-white hover:bg-gray-50 text-slate-700 border border-gray-200",
    danger:    "bg-red-500 hover:bg-red-600 text-white",
    ghost:     "hover:bg-gray-100 text-slate-600",
  };
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-6 py-3 text-base" };
  return (
    <button
      onClick={onClick} disabled={disabled} style={style}
      className={`inline-flex items-center gap-2 font-semibold rounded-xl transition-all duration-150 ${variants[variant]} ${sizes[size]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      {children}
    </button>
  );
};

// ── Input ──────────────────────────────────────────────────────
// min prop supported for date/time inputs
export const Input = ({ label, type = "text", value, onChange, placeholder, required, min }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} required={required} min={min}
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
  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
    <div className="min-w-0">
      <h1 className="text-xl sm:text-2xl font-bold text-slate-800">{title}</h1>
      {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-1 truncate">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
  </div>
);

// ── DataTable ──────────────────────────────────────────────────
export const DataTable = ({
  title, subtitle, search, onSearch, searchPlaceholder, actions, empty,
  columns, data, rows,
  currentPage, totalPages, onPageChange, totalItems, pageSize, onPageSizeChange, pageSizeOptions,
}) => {
  const headers = columns.map(c => (typeof c === "string" ? c : c.label));

  const dataRows = data
    ? data.slice(
        currentPage && pageSize ? (currentPage - 1) * pageSize : 0,
        currentPage && pageSize ? currentPage * pageSize : undefined
      ).map((row, i) => (
        <tr key={row.id ?? i} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: "1px solid #f8fafc" }}>
          {columns.map(col => {
            const val = row[col.key];
            return (
              <td key={col.key}
                className={`px-5 py-3.5 text-sm ${col.mono ? "font-mono" : ""} ${col.bold ? "font-semibold text-slate-800" : col.muted ? "text-slate-400" : "text-slate-600"}`}>
                {col.render ? col.render(val, row) : val ?? "—"}
              </td>
            );
          })}
        </tr>
      ))
    : null;

  const bodyRows = dataRows ?? rows ?? [];
  const isEmpty  = Array.isArray(bodyRows) && bodyRows.length === 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="font-semibold text-slate-700">{title}</div>
          {subtitle && <div className="text-xs text-slate-400 mt-0.5">{subtitle}</div>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {onSearch && (
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icons.Search /></div>
              <input value={search} onChange={e => onSearch(e.target.value)} placeholder={searchPlaceholder || "Search…"}
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 focus:bg-white w-full sm:w-56 transition-all" />
            </div>
          )}
          {actions}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
              {headers.map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isEmpty
              ? <tr><td colSpan={headers.length} className="text-center py-14 text-slate-400 text-sm">{empty || "No records found"}</td></tr>
              : bodyRows}
          </tbody>
        </table>
      </div>
      {onPageChange && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange}
          totalItems={totalItems} pageSize={pageSize} onPageSizeChange={onPageSizeChange} pageSizeOptions={pageSizeOptions} />
      )}
    </div>
  );
};

// ── TR / TD ────────────────────────────────────────────────────
export const TR = ({ children, onClick }) => (
  <tr onClick={onClick} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: "1px solid #f8fafc" }}>{children}</tr>
);

export const TD = ({ children, mono, bold, muted }) => (
  <td className={`px-5 py-3.5 text-sm ${mono ? "font-mono" : ""} ${bold ? "font-semibold text-slate-800" : muted ? "text-slate-400" : "text-slate-600"}`}>
    {children}
  </td>
);

// ── Pagination ─────────────────────────────────────────────────
export const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, pageSize, onPageSizeChange, pageSizeOptions = [10, 20, 50, 100] }) => {
  if (totalPages <= 0) return null;

  const getPages = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end   = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    if (start > 1) { pages.push(1); if (start > 2) pages.push("..."); }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) { if (end < totalPages - 1) pages.push("..."); pages.push(totalPages); }
    return pages;
  };

  return (
    <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        {totalItems != null && <span>{totalItems} total records</span>}
        {onPageSizeChange && (
          <select value={pageSize} onChange={e => onPageSizeChange(Number(e.target.value))}
            className="px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-teal-400 bg-white">
            {pageSizeOptions.map(s => <option key={s} value={s}>{s} / page</option>)}
          </select>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1}
          className="px-2.5 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600">
          ‹ Prev
        </button>
        {getPages().map((p, i) =>
          p === "..." ? (
            <span key={`dot-${i}`} className="px-2 text-slate-400 text-sm">…</span>
          ) : (
            <button key={p} onClick={() => onPageChange(p)}
              className={`min-w-[34px] h-[34px] text-sm font-medium rounded-lg transition-all ${p === currentPage ? "text-white shadow-sm" : "text-slate-600 hover:bg-gray-50 border border-gray-200"}`}
              style={p === currentPage ? { background: "#0E6C68" } : {}}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages}
          className="px-2.5 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600">
          Next ›
        </button>
      </div>
    </div>
  );
};

// ── RightDrawer ────────────────────────────────────────────────
export const RightDrawer = ({ title, children, onClose, open = false }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 animate-fade-in-backdrop bg-black/40" onClick={onClose} style={{ backdropFilter: "blur(4px)" }} />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white animate-slide-in-from-right shadow-2xl overflow-hidden flex flex-col">
        {title && (
          <div className="px-8 py-6 bg-gradient-to-r from-teal-50 to-blue-50 border-b border-teal-100 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg transition-colors text-gray-600 hover:text-gray-900">
              <Icons.X />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

// ── ICDSelect ──────────────────────────────────────────────────
export const ICDSelect = ({ label, value, options = [], onChange }) => {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const regularOptions = options.filter(o => o.value !== "__other__");
  const hasOther       = options.some(o => o.value === "__other__");
  const filtered       = regularOptions.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  const selectedLabel  = regularOptions.find(o => o.value === value)?.label;

  const handleSelect = (val) => { onChange(val); setOpen(false); setSearch(""); };
  const handleOther  = ()    => { onChange("__other__"); setOpen(false); setSearch(""); };

  return (
    <div ref={ref} className="relative">
      {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-teal-400 transition-all flex items-center justify-between">
        <span className={selectedLabel ? "text-slate-800" : "text-slate-400"}>{selectedLabel || "Select..."}</span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ICD code..."
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-teal-400" />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0
              ? <p className="text-xs text-slate-400 text-center py-4">No matching codes</p>
              : filtered.map(o => (
                  <button key={o.value} type="button" onClick={() => handleSelect(o.value)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-teal-50 hover:text-teal-700 ${o.value === value ? "bg-teal-50 text-teal-700 font-medium" : "text-slate-700"}`}>
                    {o.label}
                  </button>
                ))
            }
          </div>
          {hasOther && (
            <div className="border-t border-gray-100">
              <button type="button" onClick={handleOther}
                className="w-full text-left px-4 py-2.5 text-sm text-teal-600 font-medium hover:bg-teal-50 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Other (Add new ICD code)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── ICDOtherPopup ──────────────────────────────────────────────
export const ICDOtherPopup = ({ onClose, onAdded, apiBase }) => {
  const [code,   setCode]   = useState("");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const handleAdd = async () => {
    if (!code.trim()) { setError("ICD code is required"); return; }
    setSaving(true);
    setError("");
    try {
      const res  = await fetch(`${apiBase}/icd_codes_create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icd_code: code.trim(), created_by: "admin" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail || JSON.stringify(data));
      onAdded({ icd_code: data.data.icd_code });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-base font-semibold text-slate-800">Add New ICD Code</p>
            <p className="text-xs text-gray-400 mt-0.5">This will be saved and available for future use</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><Icons.X /></button>
        </div>
        <div className="space-y-3">
          <Input label="ICD Code" value={code}
            onChange={v => { setCode(v.toUpperCase()); setError(""); }} placeholder="e.g. A01.0" />
          {error && <p className="text-red-500 text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <div className="flex gap-3 mt-5">
          <Btn variant="secondary" onClick={onClose} className="flex-1">Cancel</Btn>
          <Btn onClick={handleAdd} disabled={saving} className="flex-1">
            {saving ? "Adding..." : <><Icons.Plus /> Add ICD Code</>}
          </Btn>
        </div>
      </div>
    </div>
  );
};