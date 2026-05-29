import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Icons from '../components/Icons';
import { Badge, StatCard, Btn, PageHeader } from '../components/UI';
import { BarChart, DonutChart, EncountersLineChart } from '../components/Charts';
import { PERMISSIONS } from "../components/permissions";


const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const COLOR_MAP = {
  Cash: "#6366F1",   // indigo/purple
  cash: "#6366F1",
  UPI: "#EC4899",   // pink
  upi: "#EC4899",
  Card: "#F59E0B",   // amber/orange
  card: "#F59E0B",
  "Bank Transfer": "#3B82F6",   // blue
  Insurance: "#10B981",   // green
  Credit: "#F43F5E",   // red
  Partial: "#8B5CF6",   // violet
};

const DashboardPage = () => {
  const { setPage, user, can } = useApp();
  const today = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  const clinic_id = user?.clinic_id;
  const doctor_id = user?.id;

  // ── State ──────────────────────────────────────────────────
  const [kpis, setKpis] = useState(null);
  const [aptsPerDoctor, setAptsPerDoctor] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [todaysApts, setTodaysApts] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [encountersCount, setEncountersCount] = useState(null);
  const [encountersTrend, setEncountersTrend] = useState([]);   // [{ month, count }]
  const [loading, setLoading] = useState(true);
  const [encLoading, setEncLoading] = useState(true);

  // ── Fetch dashboard KPIs ───────────────────────────────────
  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ clinic_id });
      if (can(PERMISSIONS.DASH_OWN_PATIENTS)) {
        params.append("doctor_id", doctor_id);
      }
      const res = await fetch(`${API_BASE_URL}/dashboard_kpis?${params}`);
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      const data = await res.json();

      setKpis({
        total_patients: data.total_patients,
        todays_appointments: data.todays_appointments,
        todays_revenue: data.todays_revenue,
        monthly_revenue: data.monthly_revenue,
        monthly_expenses: data.monthly_expenses,
      });

      setTodaysApts(data.todays_apts || []);
      setRecentPayments(data.recent_payments || []);
      setAptsPerDoctor(data.apts_per_doctor || []);

      const FALLBACK_COLORS = ["#6366F1", "#F59E0B", "#EC4899", "#3B82F6", "#10B981", "#F43F5E", "#8B5CF6", "#06B6D4"];

      // Deduplicate: merge entries with the same name (case-insensitive)
      const rawModes = data.payment_modes || [];
      const mergedMap = {};
      rawModes.forEach(m => {
        const key = m.name?.trim().toLowerCase();
        if (!key) return;
        if (mergedMap[key]) {
          mergedMap[key].value = (parseFloat(mergedMap[key].value) + parseFloat(m.value || 0));
        } else {
          mergedMap[key] = { ...m, value: parseFloat(m.value || 0) };
        }
      });

      // Normalize values to percentages summing to 100
      const total = Object.values(mergedMap).reduce((s, m) => s + m.value, 0);
      setPaymentModes(
        Object.values(mergedMap).map((m, i) => ({
          ...m,
          value: parseFloat(m.value.toFixed(1)),
          color: COLOR_MAP[m.name] || COLOR_MAP[m.name?.toLowerCase()] || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
        }))
      );
      console.log("payment_modes from API:", JSON.stringify(data.payment_modes));
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch encounters (count + 7-month trend) ───────────────
  const fetchEncounters = async () => {
    setEncLoading(true);
    try {
      const params = new URLSearchParams({ clinic_id });
      if (can(PERMISSIONS.DASH_OWN_PATIENTS)) {
        params.append("doctor_id", doctor_id);
      }
      const res = await fetch(`${API_BASE_URL}/encountersread?${params}`);
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      const data = await res.json();   // array of encounter objects with visit_date

      // ── KPI: total encounters ────────────────────────────
      setEncountersCount(data.length);

      // ── Trend: group by month for last 7 months ──────────
      const now = new Date();
      const months = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
          month: d.toLocaleString('en-IN', { month: 'short' }),
          count: 0,
        });
      }

      data.forEach(enc => {
        if (!enc.visit_date) return;
        const d = new Date(enc.visit_date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const slot = months.find(m => m.key === key);
        if (slot) slot.count += 1;
      });

      setEncountersTrend(months.map(({ month, count }) => ({ month, count })));

    } catch (e) {
      console.error("Encounters fetch error:", e);
    } finally {
      setEncLoading(false);
    }
  };

  useEffect(() => {
    if (!clinic_id) return;
    fetchAll();
    fetchEncounters();
  }, [clinic_id]);

  // ── Helpers ────────────────────────────────────────────────
  const formatCurrency = (val) => {
    if (!val && val !== 0) return '—';
    const num = Number(val);
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const formatSlotTime = (t) => {
    if (!t) return '—';
    return String(t).slice(0, 5);
  };

  const formatDate = (dt) => {
    if (!dt) return '—';
    const d = new Date(dt);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user?.full_name || 'User'}  •  ${today}`}
        actions={
          can(PERMISSIONS.VIEW_APPOINTMENTS) && (
            <Btn onClick={() => setPage("appointments")}>
              <Icons.Plus /> New Appointment
            </Btn>
          )
        }
      />

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">

        {/* Patients */}
        <StatCard
          title={can(PERMISSIONS.DASH_ALL_PATIENTS) ? "Total Patients" : "My Patients"}
          value={loading ? '...' : (kpis?.total_patients ?? '—').toLocaleString()}
          change="+12%"
          icon={Icons.Patient}
          bgColor="#DBEAFE"
        />

        {/* Appointments */}
        <StatCard
          title={can(PERMISSIONS.DASH_ALL_APPOINTMENTS) ? "Today's Apts" : "My Apts Today"}
          value={loading ? '...' : kpis?.todays_appointments ?? '—'}
          change="+3"
          icon={Icons.Calendar}
          bgColor="#FFEDD5"
        />

        {/* Encounters — all roles that can view encounters */}
        {can(PERMISSIONS.VIEW_ENCOUNTERS) && !can(PERMISSIONS.DASH_ALL_PATIENTS) && (
          <StatCard
            title="My Encounters"
            value={encLoading ? '...' : (encountersCount ?? '—').toLocaleString()}
            change=""
            icon={Icons.Encounters ?? Icons.Document ?? Icons.Calendar}
            bgColor="#E0F2FE"
          />
        )}

        {/* Today's Revenue */}
        {can(PERMISSIONS.DASH_REVENUE) && (
          <StatCard
            title="Today's Revenue"
            value={loading ? '...' : formatCurrency(kpis?.todays_revenue)}
            change="+5.2%"
            icon={Icons.DollarSign}
            bgColor="#D1FAE5"
          />
        )}

        {/* Monthly Revenue */}
        {can(PERMISSIONS.DASH_REVENUE) && (
          <StatCard
            title="Monthly Revenue"
            value={loading ? '...' : formatCurrency(kpis?.monthly_revenue)}
            change="+18%"
            icon={Icons.TrendUp}
            bgColor="#F3E8FF"
          />
        )}

        {/* Monthly Expenses */}
        {can(PERMISSIONS.DASH_EXPENSES) && (
          <StatCard
            title="Monthly Expenses"
            value={loading ? '...' : formatCurrency(kpis?.monthly_expenses)}
            change="+8%"
            icon={Icons.DollarSign}
            bgColor="#FFE4E6"
            positive={false}
          />
        )}

      </div>



      {/* ── Bottom Lists: Today's Appointments + This Month (side by side) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* 1. My Appointments Today — LEFT */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col h-full">
          <div className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            {can(PERMISSIONS.DASH_ALL_APPOINTMENTS)
              ? "Today's Appointments"
              : "My Appointments Today"}
          </div>
          {loading ? (
            <div className="text-slate-400 text-sm text-center py-6">Loading...</div>
          ) : todaysApts.length === 0 ? (
            <div className="text-slate-400 text-sm text-center py-6">No appointments today</div>
          ) : (
            <div className="overflow-y-auto max-h-[220px] pr-1">
              {todaysApts.map((a, i) => (
                <div key={a.id ?? i} className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 text-xs font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-700 truncate">
                      {a.patient_name}
                    </div>
                    <div className="text-xs text-slate-400">
                      {formatSlotTime(a.slot_time)} • {a.doctor_name}
                    </div>
                  </div>
                  <Badge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. My Appointments This Month (bar chart) — RIGHT */}
        {(can(PERMISSIONS.DASH_APT_PER_DOCTOR_ALL) || can(PERMISSIONS.DASH_APT_PER_DOCTOR_OWN)) && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col h-full">
            <div className="font-bold text-slate-800 mb-1">
              {can(PERMISSIONS.DASH_APT_PER_DOCTOR_ALL)
                ? "Appointments per Doctor"
                : "My Appointments This Month"}
            </div>
            <div className="text-xs text-slate-400 mb-4">This month</div>
            {loading ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Loading...</div>
            ) : aptsPerDoctor.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data</div>
            ) : (
              <BarChart data={aptsPerDoctor} height={200} />
            )}
          </div>
        )}

      </div>

      {can(PERMISSIONS.DASH_RECENT_PAYMENTS) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

          {/* Recent Payments — LEFT */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="font-bold text-slate-800 mb-4">Recent Payments</div>
            {loading ? (
              <div className="text-slate-400 text-sm text-center py-6">Loading...</div>
            ) : recentPayments.length === 0 ? (
              <div className="text-slate-400 text-sm text-center py-6">No payments found</div>
            ) : (
              recentPayments.map((pay, i) => (
                <div key={pay.payment_id ?? i} className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-medium text-slate-700">{pay.patient_name}</div>
                    <div className="text-xs text-slate-400">
                      {pay.payment_mode} • {formatDate(pay.payment_date)}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-blue-600">
                    ₹{Number(pay.amount_paid).toLocaleString('en-IN')}
                  </span>
                </div>
              ))
            )}

          </div>

          {/* Payment Modes — RIGHT */}
          {can(PERMISSIONS.DASH_REVENUE) && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="font-bold text-slate-800 mb-1">Payment Modes</div>
              <div className="text-xs text-slate-400 mb-4">Current month</div>
              {loading ? (
                <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Loading...</div>
              ) : paymentModes.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data</div>
              ) : (
                <>
                  <DonutChart data={paymentModes} height={200} />
                  <div className="mt-4 space-y-2">
                    {paymentModes.map((m, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ background: m.color }} />
                          <span className="text-slate-600">{m.name}</span>
                        </div>
                        <span className="font-semibold text-slate-700">{m.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      )}




      {/* ── Encounters Trend Chart (last 7 months) ── */}
      {can(PERMISSIONS.VIEW_ENCOUNTERS) && !can(PERMISSIONS.DASH_ALL_PATIENTS) && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <div className="font-bold text-slate-800 mb-1">
            {can(PERMISSIONS.DASH_ALL_PATIENTS) ? "Recent Encounters" : "My Encounters"}
          </div>
          <div className="text-xs text-slate-400 mb-4">Monthly encounter count</div>
          {encLoading ? (
            <div className="h-52 flex items-center justify-center text-slate-400 text-sm">Loading...</div>
          ) : (
            <EncountersLineChart data={encountersTrend} height={210} />
          )}
        </div>
      )}

    </div>
  );
};

export default DashboardPage;