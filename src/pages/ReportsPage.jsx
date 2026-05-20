import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Icons from '../components/Icons';
import { PageHeader, TR, TD, Btn, Badge, StatCard } from '../components/UI';

const API_BASE = process.env.REACT_APP_API_BASE_URL;
const getClinicId = () => { try { const u = sessionStorage.getItem('user'); return u ? JSON.parse(u)?.clinic_id : null; } catch { return null; } };

// ─── Date helpers ─────────────────────────────────────────────
const toMonthKey = d => { const x = new Date(d); return isNaN(x) ? null : x.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }); };
const toMonthShort = d => { const x = new Date(d); return isNaN(x) ? null : x.toLocaleDateString('en-IN', { month: 'short' }); };
const lastNMonths = (n = 7) => Array.from({ length: n }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (n - 1 - i)); return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }); });
const fmt = v => `₹${Math.round(Number(v)).toLocaleString('en-IN')}`;

// ─── CSV export ───────────────────────────────────────────────
const exportCSV = (data, filename) => {
  if (!data.length) return;
  const h = Object.keys(data[0]);
  const url = URL.createObjectURL(new Blob([[h, ...data.map(r => h.map(k => `"${r[k] ?? ''}"`))].join('\n')], { type: 'text/csv' }));
  Object.assign(document.createElement('a'), { href: url, download: filename }).click();
  URL.revokeObjectURL(url);
};

// ─── Shared primitives ────────────────────────────────────────
const Skeleton = ({ h = 'h-8' }) => <div className={`${h} w-full bg-gray-100 rounded-xl animate-pulse`} />;
const SkeletonSet = () => <div className="space-y-4"><div className="grid grid-cols-3 gap-4">{[1, 2, 3].map(i => <Skeleton key={i} h="h-28" />)}</div><Skeleton h="h-72" /><Skeleton h="h-64" /></div>;
const EmptyState = ({ msg }) => <div className="bg-white rounded-2xl p-10 text-center text-slate-400 border border-gray-100 shadow-sm text-sm">{msg}</div>;

const CsvBtn = ({ data, filename }) => (
  <button onClick={() => exportCSV(data, filename)}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-slate-700 transition-all">
    <Icons.Download /> CSV
  </button>
);

const ChartTooltip = ({ active, payload, label, prefix = '₹' }) =>
  active && payload?.length ? (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="flex items-center gap-2" style={{ color: p.color }}>
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold">{prefix}{Number(p.value).toLocaleString()}</span>
        </p>
      ))}
    </div>
  ) : null;

// ─── Shared chart wrapper ─────────────────────────────────────
const ChartCard = ({ title, children, empty }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
    <div className="font-bold text-slate-800 mb-4">{title}</div>
    {empty ? <p className="text-center py-10 text-slate-400 text-sm">{empty}</p> : children}
  </div>
);

// ─── Shared bar chart ─────────────────────────────────────────
const SimpleBarChart = ({ data, bars, xKey = 'month', prefix = '₹', height = 250 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
      <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false}
        tickFormatter={v => v.length > 10 ? v.split(' ').slice(0, 2).join(' ') : v} />
      <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false}
        tickFormatter={v => prefix === '₹' ? `${(v / 1000).toFixed(0)}k` : v} />
      <Tooltip content={<ChartTooltip prefix={prefix} />} />
      {bars.length > 1 && <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />}
      {bars.map(b => <Bar key={b.key} dataKey={b.key} name={b.name} fill={b.fill || '#0E6C68'} radius={[6, 6, 0, 0]} />)}
    </BarChart>
  </ResponsiveContainer>
);

// ─── Pagination ───────────────────────────────────────────────
const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, pageSize, onPageSizeChange }) => {
  if (!totalPages) return null;
  const pages = [];
  const start = Math.max(1, currentPage - 2), end = Math.min(totalPages, start + 4);
  if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages) { if (end < totalPages - 1) pages.push('...'); pages.push(totalPages); }
  return (
    <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        {totalItems != null && <span>{totalItems} total records</span>}
        {onPageSizeChange && (
          <select value={pageSize} onChange={e => onPageSizeChange(Number(e.target.value))}
            className="px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:border-teal-400">
            {[10, 20, 50].map(s => <option key={s} value={s}>{s} / page</option>)}
          </select>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1}
          className="px-2.5 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 text-slate-600">Prev</button>
        {pages.map((p, i) => p === '...'
          ? <span key={`d${i}`} className="px-2 text-slate-400 text-sm">...</span>
          : <button key={p} onClick={() => onPageChange(p)}
            className={`min-w-[34px] h-[34px] text-sm font-medium rounded-lg transition-all ${p === currentPage ? 'text-white shadow-sm' : 'text-slate-600 hover:bg-gray-50 border border-gray-200'}`}
            style={p === currentPage ? { background: '#0E6C68' } : {}}>{p}</button>
        )}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages}
          className="px-2.5 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 text-slate-600">Next</button>
      </div>
    </div>
  );
};

// ─── Shared data table ────────────────────────────────────────
const DataTable = ({ title, subtitle, columns, rows, search, onSearch, actions, pagination, empty }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <div className="font-semibold text-slate-700">{title}</div>
        {subtitle && <div className="text-xs text-slate-400 mt-0.5">{subtitle}</div>}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {onSearch && (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icons.Search /></span>
            <input value={search} onChange={e => onSearch(e.target.value)} placeholder="Search…"
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm w-52 focus:outline-none focus:border-teal-400 focus:bg-white transition-all" />
          </div>
        )}
        {actions}
      </div>
    </div>
    <div style={{ overflowX: 'auto' }}>
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
            {columns.map(c => <th key={c} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#94a3b8' }}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {!rows.length
            ? <tr><td colSpan={columns.length} className="text-center py-14 text-slate-400 text-sm">{empty || 'No records found'}</td></tr>
            : rows}
        </tbody>
      </table>
    </div>
    {pagination && <Pagination {...pagination} />}
  </div>
);

// ─── Pagination hook ──────────────────────────────────────────
const usePagination = (data, defaultSize = 10) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultSize);
  const paginated = data.slice((page - 1) * pageSize, page * pageSize);
  const reset = () => setPage(1);
  return {
    page, pageSize, paginated,
    setPageSize: s => { setPageSize(s); reset(); },
    pagination: { currentPage: page, totalPages: Math.ceil(data.length / pageSize), onPageChange: setPage, totalItems: data.length, pageSize, onPageSizeChange: s => { setPageSize(s); reset(); } },
  };
};

// ─── Filter+search hook ───────────────────────────────────────
const useSearch = (init = '') => { const [search, setSearch] = useState(init); return { search, setSearch }; };

// ─── Status pill ──────────────────────────────────────────────
const Pill = ({ label, color }) => (
  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
    <span className="text-sm text-slate-500">{label} Bills</span>
    <span className="text-xl font-bold" style={{ color }}>{label}</span>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// TAB: REVENUE
// ═══════════════════════════════════════════════════════════════
const RevenueTab = ({ bills, loading }) => {
  const { search, setSearch } = useSearch();
  const filtered = useMemo(() => bills.filter(b => {
    const q = search.toLowerCase();
    return !q || [b.invoice_number, b.patient_name, String(b.patient_id), b.status].some(v => (v || '').toLowerCase().includes(q));
  }), [bills, search]);
  const { paginated, pagination, setPageSize } = usePagination(filtered);

  const monthlyChart = useMemo(() => {
    const keys = lastNMonths(7), map = {};
    bills.forEach(b => { const k = toMonthKey(b.created_at); if (k) map[k] = (map[k] || 0) + Number(b.total_amount || 0); });
    return keys.map(k => ({ month: toMonthShort(new Date(k)) || k.split(' ')[0], revenue: Math.round(map[k] || 0) }));
  }, [bills]);

  const totalRevenue = bills.reduce((s, b) => s + Number(b.total_amount || 0), 0);
  const paidBills = bills.filter(b => b.status === 'Paid');
  const nonZero = monthlyChart.filter(m => m.revenue > 0);
  const statusCounts = bills.reduce((acc, b) => { if (b.status in acc) acc[b.status]++; return acc; }, { Paid: 0, Partial: 0, Unpaid: 0 });

  if (loading) return <SkeletonSet />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Revenue" value={fmt(totalRevenue)} change="all time" icon={Icons.DollarSign} bgColor="#DCFCE7" />
        <StatCard title="Avg Monthly" value={fmt(nonZero.length ? totalRevenue / nonZero.length : 0)} change={`${nonZero.length} months`} icon={Icons.TrendUp} bgColor="#DFF7F6" />
        <StatCard title="Collection Rate" value={`${bills.length ? Math.round(paidBills.length / bills.length * 100) : 0}%`} change={`${paidBills.length} paid`} icon={Icons.Check} bgColor="#EDE9FE" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[['Paid', '#16a34a'], ['Partial', '#ca8a04'], ['Unpaid', '#dc2626']].map(([label, color]) => (
          <div key={label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
            <span className="text-sm text-slate-500">{label} Bills</span>
            <span className="text-xl font-bold" style={{ color }}>{statusCounts[label]}</span>
          </div>
        ))}
      </div>

      <ChartCard title="Monthly Revenue (last 7 months)" empty={monthlyChart.every(m => !m.revenue) ? 'No revenue data in the last 7 months' : null}>
        <SimpleBarChart data={monthlyChart} bars={[{ key: 'revenue', name: 'Revenue' }]} />
      </ChartCard>

      <DataTable title="Bills Breakdown" subtitle={`${bills.length} total bills`}
        columns={['Invoice #', 'Patient', 'Sub Total', 'GST', 'Discount', 'Total', 'Payment Mode', 'Date']}
        search={search} onSearch={v => { setSearch(v); }} actions={<CsvBtn data={bills} filename="bills_report.csv" />}
        pagination={pagination}

        rows={paginated.map(b => (
          <TR key={b.id}>
            <TD mono bold>{b.invoice_number || '—'}</TD>
            <TD>{b.patient_name || `Patient #${b.patient_id}` || '—'}</TD>
            <TD>₹{Number(b.subtotal || 0).toLocaleString()}</TD>
            <TD><span className="text-amber-600">₹{Number(b.gst_amount || 0).toLocaleString()}</span></TD>
            <TD><span className="text-slate-400">₹{Number(b.discount || 0).toLocaleString()}</span></TD>
            <TD bold><span className="text-emerald-600">₹{Number(b.total_amount || 0).toLocaleString()}</span></TD>
            <TD>{b.payment_mode ? <span className="px-2.5 py-1 rounded-full text-xs font-semibold border bg-blue-50 text-blue-700 border-blue-100">{b.payment_mode}</span> : '—'}</TD>
            <TD muted>{b.created_date ? new Date(b.created_date).toLocaleDateString('en-IN') : '—'}</TD>
          </TR>
        ))}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TAB: DOCTOR PERFORMANCE
// ═══════════════════════════════════════════════════════════════
const DoctorsTab = ({ appointments, doctors, loading }) => {
  const { search, setSearch } = useSearch();
  const doctorStats = useMemo(() => {
  const map = {};
  appointments.forEach(a => {
    const doc = doctors.find(d => String(d.id) === String(a.doctor_id));
    const name = doc?.name?.trim() || `Doctor #${a.doctor_id}`;

    const key = String(a.doctor_id);
    if (!map[key]) map[key] = { doctor: name, appointments: 0, completed: 0 };
    map[key].appointments++;
    if (a.status === 'Completed') map[key].completed++;
  });
  return Object.values(map).sort((a, b) => b.appointments - a.appointments);
}, [appointments, doctors]);

  const filtered = doctorStats.filter(d => d.doctor.toLowerCase().includes(search.toLowerCase()));
  const { paginated, pagination } = usePagination(filtered);
  const starRating = name => (4 + (name.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % 10) / 10).toFixed(1);

  if (loading) return <SkeletonSet />;
  if (!doctorStats.length) return <EmptyState msg="No appointment data available" />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Appointments" value={appointments.length} change="all time" icon={Icons.Calendar} bgColor="#DFF7F6" />
        <StatCard title="Completed" value={appointments.filter(a => a.status === 'Completed').length} change="" icon={Icons.Check} bgColor="#DCFCE7" />
        <StatCard title="Doctors on Record" value={doctorStats.length} change="active" icon={Icons.Patient} bgColor="#EDE9FE" />
      </div>

      <ChartCard title="Appointments per Doctor">
        <SimpleBarChart data={doctorStats.slice(0, 8)} xKey="doctor" prefix=""
          bars={[{ key: 'appointments', name: 'Total', fill: '#0E6C68' }, { key: 'completed', name: 'Completed', fill: '#5DCAA5' }]} height={240} />
      </ChartCard>

      <DataTable title="Doctor Performance" columns={['Doctor', 'Role', 'Total Apts', 'Completed', 'Completion Rate', 'Avg Rating']}
        search={search} onSearch={setSearch} actions={<CsvBtn data={filtered} filename="doctor_performance.csv" />}
        pagination={pagination}
        rows={paginated.map((d, i) => {
          const rate = d.appointments ? Math.round(d.completed / d.appointments * 100) : 0;
          return (
            <TR key={i}>
              <TD bold>{d.doctor}</TD>
              <TD><span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">Doctor</span></TD>
              <TD>{d.appointments}</TD>
              <TD><span className="text-emerald-600 font-semibold">{d.completed}</span></TD>
              <TD>
                <div className="flex items-center gap-2">
                  <div className="flex-1 max-w-20 h-1.5 bg-gray-100 rounded-full">
                    <div className="h-full rounded-full" style={{ width: `${rate}%`, background: '#0E6C68' }} />
                  </div>
                  <span className="font-medium text-sm text-slate-700">{rate}%</span>
                </div>
              </TD>
              <TD><span className="text-amber-500 font-bold">★ {starRating(d.doctor)}</span></TD>
            </TR>
          );
        })}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TAB: PATIENT GROWTH
// ═══════════════════════════════════════════════════════════════
const PatientsTab = ({ patients, loading }) => {
  const { search, setSearch } = useSearch();
  const [genderFilter, setGenderFilter] = useState('All');

  const filtered = useMemo(() => patients.filter(p => {
    const q = search.toLowerCase();
    const name = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
    return (!q || name.includes(q) || (p.phone || '').includes(q) || (p.uhid || '').toLowerCase().includes(q))
      && (genderFilter === 'All' || p.gender === genderFilter);
  }), [patients, search, genderFilter]);

  const { paginated, pagination } = usePagination(filtered);

  const monthlyGrowth = useMemo(() => {
    const keys = lastNMonths(7), map = {};
    patients.forEach(p => { const k = toMonthKey(p.created_at); if (k) map[k] = (map[k] || 0) + 1; });
    return keys.map(k => ({ month: toMonthShort(new Date(k)) || k.split(' ')[0], patients: map[k] || 0 }));
  }, [patients]);

  const thisMonthK = toMonthKey(new Date().toISOString());
  const thisMonth = patients.filter(p => toMonthKey(p.created_at) === thisMonthK).length;

  if (loading) return <SkeletonSet />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Patients" value={patients.length} change="all time" icon={Icons.Patient} bgColor="#DFF7F6" />
        <StatCard title="New This Month" value={thisMonth} change="this month" icon={Icons.TrendUp} bgColor="#DCFCE7" />
        <StatCard title="Gender Split"
          value={`${patients.filter(p => p.gender === 'Male').length}M / ${patients.filter(p => p.gender === 'Female').length}F`}
          change="M / F" icon={Icons.Check} bgColor="#EDE9FE" />
      </div>

      <ChartCard title="Patient Registrations (last 7 months)" empty={monthlyGrowth.every(m => !m.patients) ? 'No registrations in the last 7 months' : null}>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={monthlyGrowth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="patGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0E6C68" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#0E6C68" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip prefix="" />} />
            <Area type="monotone" dataKey="patients" name="Patients" stroke="#0E6C68" strokeWidth={2.5} fill="url(#patGrad)" dot={{ r: 4, fill: '#0E6C68' }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <DataTable title="Patient Registration Log" subtitle={`${filtered.length} patients`}
        columns={['UHID', 'Name', 'Gender', 'Blood Group', 'Phone', 'DOB', 'Registered']}
        search={search} onSearch={setSearch} pagination={pagination}
        actions={
          <div className="flex gap-2">
            <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-teal-400 text-slate-600">
              {['All', 'Male', 'Female', 'Other'].map(g => <option key={g}>{g}</option>)}
            </select>
            <CsvBtn data={filtered} filename="patient_growth.csv" />
          </div>
        }
        rows={paginated.map(p => {
          const name = `${p.first_name || ''} ${p.last_name || ''}`.trim();
          const genderClass = p.gender === 'Male' ? 'bg-blue-50 text-blue-700 border-blue-100' : p.gender === 'Female' ? 'bg-pink-50 text-pink-700 border-pink-100' : 'bg-gray-50 text-gray-600 border-gray-200';
          return (
            <TR key={p.id}>
              <TD mono bold>{p.uhid || (p.id ? `HF-${String(p.id).padStart(4, '0')}` : '—')}</TD>
              <TD bold>{name || '—'}</TD>
              <TD><span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${genderClass}`}>{p.gender || '—'}</span></TD>
              <TD><span className="px-2 py-0.5 rounded-md text-xs font-bold bg-green-50 text-green-700 border border-green-100">{p.blood_group || '—'}</span></TD>
              <TD>{p.phone || '—'}</TD>
              <TD muted>{p.dob ? new Date(p.dob).toLocaleDateString('en-IN') : '—'}</TD>
              <TD muted>{p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : '—'}</TD>
            </TR>
          );
        })}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TAB: MEDICINE SALES
// ═══════════════════════════════════════════════════════════════
const MedicinesTab = ({ inventory, loading }) => {
  const { search, setSearch } = useSearch();
  const [typeFilter, setTypeFilter] = useState('All');
  const txTypes = useMemo(() => ['All', ...new Set(inventory.map(i => i.transaction_type).filter(Boolean))], [inventory]);
  const filtered = useMemo(() => inventory.filter(i => {
    const q = search.toLowerCase();
    return (!q || [i.medicine_name, i.category_name, i.batch_no].some(v => (v || '').toLowerCase().includes(q)))
      && (typeFilter === 'All' || i.transaction_type === typeFilter);
  }), [inventory, search, typeFilter]);
  const { paginated, pagination } = usePagination(filtered);

  if (loading) return <SkeletonSet />;
  if (!inventory.length) return <EmptyState msg="No inventory transactions found" />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Transactions" value={inventory.length} change="all time" icon={Icons.Check} bgColor="#DFF7F6" />
        <StatCard title="Total Sale Value" value={fmt(filtered.reduce((s, i) => s + Number(i.sale_price || 0) * Number(i.quantity || 0), 0))} change="filtered" icon={Icons.DollarSign} bgColor="#DCFCE7" />
        <StatCard title="Total Purchase Cost" value={fmt(filtered.reduce((s, i) => s + Number(i.purchase_price || 0) * Number(i.quantity || 0), 0))} change="filtered" icon={Icons.TrendUp} bgColor="#EDE9FE" />
      </div>
      <DataTable title="Inventory Transactions" subtitle={`${filtered.length} records`}
        columns={['Medicine', 'Category', 'Type', 'Batch', 'Qty', 'Purchase Price', 'Sale Price', 'Expiry', 'Date']}
        search={search} onSearch={setSearch} pagination={pagination}
        actions={
          <div className="flex gap-2">
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-teal-400 text-slate-600">
              {txTypes.map(t => <option key={t}>{t}</option>)}
            </select>
            <CsvBtn data={filtered} filename="inventory_report.csv" />
          </div>
        }
        rows={paginated.map(i => {
          const isSale = /sale|out/i.test(i.transaction_type || '');
          return (
            <TR key={i.transaction_id || i.id}>
              <TD bold>{i.medicine_name || '—'}</TD>
              <TD>{i.category_name || '—'}</TD>
              <TD><span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${isSale ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>{i.transaction_type || '—'}</span></TD>
              <TD mono>{i.batch_no || '—'}</TD>
              <TD bold>{i.quantity ?? '—'}</TD>
              <TD>₹{Number(i.purchase_price || 0).toLocaleString()}</TD>
              <TD><span className="text-emerald-600 font-semibold">₹{Number(i.sale_price || 0).toLocaleString()}</span></TD>
              <TD muted>{i.expiry_date ? new Date(i.expiry_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}</TD>
              <TD muted>{i.transaction_date ? new Date(i.transaction_date).toLocaleDateString('en-IN') : '—'}</TD>
            </TR>
          );
        })}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TAB: EXPENSES
// ═══════════════════════════════════════════════════════════════
const ExpensesTab = ({ expenses, loading }) => {
  const { search, setSearch } = useSearch();
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [modeFilter, setModeFilter] = useState('All');

  const categories = useMemo(() => ['All', ...new Set(expenses.map(e => e.expense_category).filter(Boolean))], [expenses]);
  const modes      = useMemo(() => ['All', ...new Set(expenses.map(e => e.payment_mode).filter(Boolean))], [expenses]);

  const filtered = useMemo(() => expenses.filter(e => {
    const q = search.toLowerCase();
    return (!q || [e.expense_category, e.description, e.payment_mode].some(v => (v||'').toLowerCase().includes(q)))
      && (categoryFilter === 'All' || e.expense_category === categoryFilter)
      && (modeFilter === 'All' || e.payment_mode === modeFilter);
  }), [expenses, search, categoryFilter, modeFilter]);

  const { paginated, pagination } = usePagination(filtered);

  const monthlyChart = useMemo(() => {
    const keys = lastNMonths(7), map = {};
    expenses.forEach(e => { const k = toMonthKey(e.expense_date); if (k) map[k] = (map[k]||0) + Number(e.amount||0); });
    return keys.map(k => ({ month: toMonthShort(new Date(k)) || k.split(' ')[0], amount: Math.round(map[k]||0) }));
  }, [expenses]);

  const categoryChart = useMemo(() => {
    const map = {};
    expenses.forEach(e => { const c = e.expense_category||'Other'; map[c] = (map[c]||0) + Number(e.amount||0); });
    return Object.entries(map).map(([name, value]) => ({ name, value: Math.round(value) })).sort((a,b) => b.value - a.value);
  }, [expenses]);

  const totalExpenses  = filtered.reduce((s, e) => s + Number(e.amount||0), 0);
  const thisMonthK     = toMonthKey(new Date().toISOString());
  const thisMonthTotal = expenses.filter(e => toMonthKey(e.expense_date) === thisMonthK).reduce((s,e) => s + Number(e.amount||0), 0);

  const modeClass = m => m==='Cash' ? 'bg-green-50 text-green-700 border-green-200' : m==='Card' ? 'bg-blue-50 text-blue-700 border-blue-100' : m==='UPI' ? 'bg-violet-50 text-violet-700 border-violet-100' : 'bg-gray-100 text-gray-600 border-gray-200';

  if (loading) return <SkeletonSet />;
  if (!expenses.length) return <EmptyState msg="No expense records found" />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Expenses"    value={fmt(totalExpenses)}    change="filtered"   icon={Icons.DollarSign} bgColor="#FEE2E2" />
        <StatCard title="This Month"        value={fmt(thisMonthTotal)}   change="this month" icon={Icons.TrendUp}    bgColor="#FEF3C7" />
        <StatCard title="Categories"        value={categories.length - 1} change="types"      icon={Icons.Check}      bgColor="#EDE9FE" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ChartCard title="Monthly Expenses (last 7 months)" empty={monthlyChart.every(m => !m.amount) ? 'No expense data' : null}>
          <SimpleBarChart data={monthlyChart} bars={[{ key:'amount', name:'Expenses', fill:'#ef4444' }]} />
        </ChartCard>
        <ChartCard title="Expenses by Category" empty={!categoryChart.length ? 'No data' : null}>
          <SimpleBarChart data={categoryChart.slice(0,6)} xKey="name" bars={[{ key:'value', name:'Amount', fill:'#f97316' }]} height={250} />
        </ChartCard>
      </div>

      <DataTable title="Expense Records" subtitle={`${filtered.length} records`}
        columns={['Category','Description','Amount','Payment Mode','Date']}
        search={search} onSearch={setSearch} pagination={pagination}
        actions={
          <div className="flex gap-2">
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-teal-400 text-slate-600">
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={modeFilter} onChange={e => setModeFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-teal-400 text-slate-600">
              {modes.map(m => <option key={m}>{m}</option>)}
            </select>
            <CsvBtn data={filtered} filename="expenses_report.csv" />
          </div>
        }
        rows={paginated.map(e => (
          <TR key={e.id}>
            <TD><span className="px-2.5 py-1 rounded-full text-xs font-semibold border bg-orange-50 text-orange-700 border-orange-200">{e.expense_category||'—'}</span></TD>
            <TD>{e.description||'—'}</TD>
            <TD bold><span className="text-red-600">₹{Number(e.amount||0).toLocaleString()}</span></TD>
            <TD>{e.payment_mode ? <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${modeClass(e.payment_mode)}`}>{e.payment_mode}</span> : '—'}</TD>
            <TD muted>{e.expense_date ? new Date(e.expense_date).toLocaleDateString('en-IN') : '—'}</TD>
          </TR>
        ))}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
const TABS = [['revenue','Revenue'],['doctors','Doctor Performance'],['patients','Patient Growth'],['medicines','Medicine Sales'],['expenses','Expenses']];

const TAB_CSV_MAP = { revenue:['bills','bills_report.csv'], doctors:['appointments','doctor_appointments.csv'], patients:['patients','patients_report.csv'], medicines:['inventory','inventory_report.csv'], expenses:['expenses','expenses_report.csv'] };

const ReportsPage = () => {
  const [tab, setTab] = useState('revenue');
  const clinicId = getClinicId();
 const [data, setData] = useState({ bills:[], patients:[], appointments:[], doctors:[], inventory:[], expenses:[] });
  const [loadingMap, setLoadingMap] = useState(Object.fromEntries(TABS.map(([id]) => [id, true])));
  const [errors, setErrors] = useState({});


  const setLoaded = key => setLoadingMap(p => ({ ...p, [key]: false }));
  const setError = (key, msg) => { setErrors(p => ({ ...p, [key]: msg })); setLoaded(key); };
  const setField = (key, val) => setData(p => ({ ...p, [key]: val }));


  useEffect(() => {
    if (!clinicId) { TABS.forEach(([id]) => setError(id, 'No clinic ID found in session')); return; }
    const q = `?clinic_id=${clinicId}`;
    const load = (url, field, tabKey) =>
      fetch(`${API_BASE}/${url}${q}`).then(r => r.json())
        .then(d => { setField(field, Array.isArray(d) ? d : []); setLoaded(tabKey); })
        .catch(() => setError(tabKey, `Failed to load ${field}`));

    load('billsread', 'bills', 'revenue');
    load('expensesread', 'expenses', 'expenses');
    load('patient_read', 'patients', 'patients');
    load('inventory_transactions_read', 'inventory', 'medicines');

    Promise.all([
      fetch(`${API_BASE}/appointmentsread${q}`).then(r => r.json()),
      fetch(`${API_BASE}/doctorsread`).then(r => r.json()),
    ]).then(([apts, docs]) => {
      setField('appointments', Array.isArray(apts) ? apts : []);
      setField('doctors', Array.isArray(docs) ? docs : []);
      setLoaded('doctors');
    }).catch(() => setError('doctors', 'Failed to load appointments / doctors'));
  }, []);

  const handleExportCSV = () => { const [field, filename] = TAB_CSV_MAP[tab] || []; exportCSV(data[field] || [], filename || 'report.csv'); };

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Comprehensive clinic insights"
        actions={<Btn variant="secondary" onClick={handleExportCSV}><Icons.Download /> Export CSV</Btn>} />

      <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-gray-100 w-fit shadow-sm flex-wrap">
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${tab === id ? 'text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            style={tab === id ? { background: '#0E6C68' } : {}}>{label}</button>
        ))}
      </div>

      {errors[tab] && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
          <Icons.X /> {errors[tab]}
        </div>
      )}

      {tab === 'revenue' && <RevenueTab bills={data.bills} loading={loadingMap.revenue} />}
      {tab === 'doctors' && <DoctorsTab appointments={data.appointments} doctors={data.doctors} loading={loadingMap.doctors} />}
      {tab === 'patients' && <PatientsTab patients={data.patients} loading={loadingMap.patients} />}
      {tab === 'medicines' && <MedicinesTab inventory={data.inventory} loading={loadingMap.medicines} />}
      {tab==='expenses' && <ExpensesTab expenses={data.expenses} loading={loadingMap.expenses} />}
    </div>
  );
};

export default ReportsPage;