import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CURRENT_USER } from '../data/mockData';
import Icons from '../components/Icons';
import { Badge, Btn, Input, Toast, PageHeader } from '../components/UI';

const EmployeeProfilePage = () => {
  const { setPage } = useApp();
  const u = CURRENT_USER;
  const [editMode, setEditMode] = useState(false);
  const [phone, setPhone] = useState(u.phone);
  const [address, setAddress] = useState(u.address);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  return (
    <div>
      <button onClick={() => setPage("dashboard")} className="flex items-center gap-2 text-sm text-slate-500 hover:text-teal-700 mb-5 transition-colors font-medium">
        <Icons.ChevronLeft /> Back to Dashboard
      </button>

      {/* Hero Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
        {/* Cover banner */}
        <div className="h-28 w-full" style={{ background: "linear-gradient(120deg, #0A5955 0%, #0E6C68 50%, #14A3A0 100%)" }}>
          <div className="h-full w-full opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
        </div>
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg" style={{ background: "linear-gradient(135deg, #0E6C68, #14A3A0)" }}>
              {u.initials}
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">{u.role}</span>
              <Btn variant="secondary" size="sm" onClick={() => setEditMode(!editMode)}>
                <Icons.Edit />{editMode ? "Cancel" : "Edit Profile"}
              </Btn>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">{u.name}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{u.designation} · {u.department}</p>
          <p className="text-slate-400 text-sm mt-0.5">{u.clinic}</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {[
          { label: "Patients Handled", value: u.stats.patientsHandled, icon: Icons.Patient, bg: "#DFF7F6" },
          { label: "Apts This Month", value: u.stats.appointmentsThisMonth, icon: Icons.Calendar, bg: "#EDE9FE" },
          { label: "Avg Patient Rating", value: `★ ${u.stats.avgRating}`, icon: Icons.Activity, bg: "#FEF3C7" },
          { label: "Years Experience", value: u.stats.yearsExperience, icon: Icons.TrendUp, bg: "#DCFCE7" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
              <s.icon />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-800">{s.value}</div>
              <div className="text-xs text-slate-400">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Personal Details */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="font-bold text-slate-800 text-lg">Personal Information</div>
            {editMode && (
              <Btn size="sm" onClick={() => { setEditMode(false); showToast("Profile updated successfully"); }}>
                <Icons.Check /> Save Changes
              </Btn>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
            {[
              ["Employee ID", u.employeeId],
              ["Gender", u.gender],
              ["Date of Birth", u.dob],
              ["Blood Group", u.bloodGroup],
              ["Join Date", u.joinDate],
              ["Specialization", u.specialization],
            ].map(([label, val]) => (
              <div key={label} className="border-b border-gray-50 pb-4">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</div>
                <div className="text-sm font-medium text-slate-700">{val}</div>
              </div>
            ))}

            <div className="border-b border-gray-50 pb-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Email Address</div>
              <div className="text-sm font-medium text-slate-700">{u.email}</div>
            </div>

            <div className="border-b border-gray-50 pb-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Phone Number</div>
              {editMode
                ? <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-400" />
                : <div className="text-sm font-medium text-slate-700">{phone}</div>}
            </div>

            <div className="sm:col-span-2 border-b border-gray-50 pb-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Address</div>
              {editMode
                ? <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-400 resize-none" />
                : <div className="text-sm font-medium text-slate-700">{address}</div>}
            </div>
          </div>

          {/* Qualifications */}
          <div className="mt-5">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Qualifications</div>
            <div className="space-y-2">
              {u.qualifications.map((q, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-teal-50 rounded-xl">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "#0E6C68" }}>{i + 1}</div>
                  <span className="text-sm font-medium text-teal-800">{q}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Recent Activity
            </div>
            <div className="space-y-4">
              {u.recentActivity.map((a, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#14A3A0" }}></div>
                    {i < u.recentActivity.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1"></div>}
                  </div>
                  <div className="pb-3">
                    <div className="text-xs text-slate-400 mb-0.5">{a.date}</div>
                    <div className="text-sm text-slate-600">{a.action}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="font-bold text-slate-800 mb-3">Quick Actions</div>
            <div className="space-y-2">
              {[
                ["Change Password", Icons.Settings, () => {}],
                ["Download ID Card", Icons.Download, () => {}],
                ["View Audit Log", Icons.Reports, () => {}],
              ].map(([label, Ic, fn]) => (
                <button key={label} onClick={fn} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-teal-50 hover:text-teal-700 rounded-xl transition-all">
                  <Ic />{label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
};

// ============================================================
// MAIN APP


export default EmployeeProfilePage;
