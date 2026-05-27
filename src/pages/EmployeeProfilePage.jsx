import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Icons from '../components/Icons';
import { Toast, Btn } from '../components/UI';

const API_BASE = process.env.REACT_APP_API_BASE_URL;

const Field = ({ label, value, editMode, type = "text", onChange, options }) => (
  <div className="border-b border-gray-50 pb-4">
    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</div>
    {editMode ? (
      options ? (
        <select value={value} onChange={e => onChange(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-400 bg-white">
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-400" />
      )
    ) : (
      <div className="text-sm font-medium text-slate-700">{value || "—"}</div>
    )}
  </div>
);

const BLANK_QUAL = { qualification_name: "", institute_name: "", year: "" };

const EmployeeProfilePage = ({ user }) => {
  const { setPage, showLoading, hideLoading } = useApp();

  // ── Profile & stats ──
  const [profile,   setProfile]   = useState(null);
  const [stats,     setStats]     = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Profile edit ──
  const [editMode,  setEditMode]  = useState(false);
  const [isSaving,  setIsSaving]  = useState(false);
  const [form,      setForm]      = useState({ phone: "", specialization: "", blood_group: "", date_of_birth: "", join_date: "", qualifications: [] });
  const [newQual,   setNewQual]   = useState(BLANK_QUAL);

  // ── Password change ──
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdForm,      setPwdForm]      = useState({ current: "", newPwd: "", confirm: "" });
  const [pwdError,     setPwdError]     = useState("");
  const [isSavingPwd,  setIsSavingPwd]  = useState(false);
  const [showPwd,      setShowPwd]      = useState({ current: false, newPwd: false, confirm: false });

  // ── Toast ──
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "error") => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000); };
  const setField  = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // ── Step 1: Load profile ──
  useEffect(() => {
    if (!user?.id || !user?.clinic_id) return;
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        showLoading("Loading profile...", "my-profile");
        const res  = await fetch(`${API_BASE}/get_user_profile?user_id=${user.id}&clinic_id=${user.clinic_id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load profile");
        setProfile(data);
        setForm({
          phone:          data.phone          || "",
          specialization: data.specialization || "",
          blood_group:    data.blood_group    || "",
          date_of_birth:  data.date_of_birth  || "",
          join_date:      data.join_date       || "",
          qualifications: data.qualifications  || [],
        });
      } catch (e) {
        showToast(e.message);
      } finally {
        setIsLoading(false);
        hideLoading();
      }
    };
    fetchProfile();
  }, [user]);

  // ── Step 2: Load stats lazily ──
  useEffect(() => {
    if (!user?.clinic_id) return;
    const fetchStats = async () => {
      try {
        const [aptsRes, encRes] = await Promise.all([
          fetch(`${API_BASE}/appointmentsread?clinic_id=${user.clinic_id}&doctor_id=${user.id}`),
          fetch(`${API_BASE}/encountersread?clinic_id=${user.clinic_id}&doctor_id=${user.id}`),
        ]);
        const [aptsData, encData] = await Promise.all([aptsRes.json(), encRes.json()]);

        const now = new Date();
        const aptsThisMonth = Array.isArray(aptsData)
          ? aptsData.filter(a => {
              const d = new Date(a.appointment_date);
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }).length
          : 0;

        const uniquePatients = Array.isArray(encData)
          ? new Set(encData.map(e => e.patient_id)).size
          : 0;

        setStats({
          patients:     uniquePatients,
          appointments: aptsThisMonth,
          encounters:   Array.isArray(encData) ? encData.length : 0,
        });
      } catch {
        setStats({ patients: "—", appointments: "—", encounters: "—" });
      }
    };
    fetchStats();
  }, [user?.clinic_id]);

  // ── Qualifications ──
  const addQualification = () => {
    if (!newQual.qualification_name || !newQual.institute_name) return showToast("Fill in qualification name and institute", "warning");
    setField("qualifications", [...form.qualifications, { ...newQual, id: Date.now() }]);
    setNewQual(BLANK_QUAL);
  };

  const removeQualification = (id) => setField("qualifications", form.qualifications.filter(q => q.id !== id));

  // ── Save profile ──
  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await fetch(`${API_BASE}/users_create_update/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: profile.user_id, clinic_id: profile.clinic_id,
          full_name: profile.full_name, email: profile.email,
          role: profile.role, is_active: profile.is_active, user: "admin",
          ...form,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      setProfile(p => ({ ...p, ...form }));
      setEditMode(false);
      showToast("Profile updated successfully", "success");
    } catch (e) {
      showToast(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      phone:          profile.phone          || "",
      specialization: profile.specialization || "",
      blood_group:    profile.blood_group    || "",
      date_of_birth:  profile.date_of_birth  || "",
      join_date:      profile.join_date       || "",
      qualifications: profile.qualifications  || [],
    });
    setNewQual(BLANK_QUAL);
    setEditMode(false);
  };

  // ── Password change ──
  const closePwdModal = () => {
    setShowPwdModal(false);
    setPwdForm({ current: "", newPwd: "", confirm: "" });
    setPwdError("");
    setShowPwd({ current: false, newPwd: false, confirm: false });
  };

  const handlePasswordChange = async () => {
    setPwdError("");

    if (!pwdForm.current)                    return setPwdError("Enter your current password");
    if (pwdForm.newPwd.length < 6)           return setPwdError("New password must be at least 6 characters");
    if (pwdForm.newPwd !== pwdForm.confirm)  return setPwdError("Passwords do not match");
    if (pwdForm.newPwd === pwdForm.current)  return setPwdError("New password must differ from current password");

    try {
      setIsSavingPwd(true);

      // Step 1: Verify current password via login endpoint
      const verifyRes = await fetch(`${API_BASE}/auth_login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile.email, password: pwdForm.current }),
      });
      if (!verifyRes.ok) throw new Error("Current password is incorrect");

      // Step 2: Set new password (bcrypt hashing handled by backend)
      const updateRes = await fetch(`${API_BASE}/auth_set_password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: profile.user_id, new_password: pwdForm.newPwd }),
      });
      const updateData = await updateRes.json();
      if (!updateRes.ok) throw new Error(updateData.detail || "Failed to update password");

      closePwdModal();
      showToast("Password updated successfully", "success");
    } catch (e) {
      setPwdError(e.message);
    } finally {
      setIsSavingPwd(false);
    }
  };

  // ── Guards ──
  if (isLoading) return <div className="text-center py-20 text-slate-400">Loading profile...</div>;
  if (!profile)  return <div className="text-center py-20 text-slate-400">Profile not found.</div>;

  const initials  = profile.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const statCards = [
    { label: "Total Patients",   value: stats?.patients,     icon: Icons.Patient,  bg: "#DFF7F6" },
    { label: "Apts This Month",  value: stats?.appointments, icon: Icons.Calendar, bg: "#EDE9FE" },
    { label: "Total Encounters", value: stats?.encounters,   icon: Icons.Activity, bg: "#FEF3C7" },
  ];

  return (
    <div>
      <button onClick={() => setPage("dashboard")} className="flex items-center gap-2 text-sm text-slate-500 hover:text-teal-700 mb-5 transition-colors font-medium">
        <Icons.ChevronLeft /> Back to Dashboard
      </button>

      {/* Hero Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
        <div className="h-28 w-full" style={{ background: "linear-gradient(120deg, #0A5955 0%, #0E6C68 50%, #14A3A0 100%)" }} />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg"
              style={{ background: "linear-gradient(135deg, #0E6C68, #14A3A0)" }}>
              {initials}
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">{profile.role}</span>
              <Btn variant="secondary" size="sm" onClick={() => editMode ? handleCancel() : setEditMode(true)}>
                <Icons.Edit /> {editMode ? "Cancel" : "Edit Profile"}
              </Btn>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">{profile.full_name}</h1>
          {profile.specialization && <p className="text-slate-500 text-sm mt-0.5">{profile.specialization}</p>}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {statCards.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}><s.icon /></div>
            <div>
              <div className="text-xl font-bold text-slate-800">
                {stats === null ? <span className="inline-block w-8 h-5 bg-gray-100 rounded animate-pulse" /> : s.value}
              </div>
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
              <div className="flex gap-2">
                <Btn variant="secondary" size="sm" onClick={handleCancel} disabled={isSaving}>Cancel</Btn>
                <Btn size="sm" onClick={handleSave} disabled={isSaving}>
                  <Icons.Check /> {isSaving ? "Saving..." : "Save Changes"}
                </Btn>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
            <Field label="Email Address"  value={profile.email}                              editMode={false} />
            <Field label="Role"           value={profile.role}                               editMode={false} />
            <Field label="Status"         value={profile.is_active ? "Active" : "Inactive"}  editMode={false} />
            <Field label="Date of Birth"  value={form.date_of_birth} type="date" editMode={editMode} onChange={v => setField("date_of_birth", v)} />
            <Field label="Join Date"      value={form.join_date}     type="date" editMode={editMode} onChange={v => setField("join_date", v)} />
            <Field label="Phone Number"   value={form.phone}         type="tel"  editMode={editMode} onChange={v => setField("phone", v.replace(/\D/g, "").slice(0, 10))} />
            <Field label="Specialization" value={form.specialization}            editMode={editMode} onChange={v => setField("specialization", v)} />
            <Field label="Blood Group"    value={form.blood_group}   options={["O+","O-","A+","A-","B+","B-","AB+","AB-"]} editMode={editMode} onChange={v => setField("blood_group", v)} />
          </div>

          {/* Qualifications */}
          <div className="mt-6">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Qualifications</div>

            {form.qualifications.length > 0 ? (
              <div className="space-y-2 mb-4">
                {form.qualifications.map((q, i) => (
                  <div key={q.id || q.qualification_id || i} className="flex items-center justify-between p-3 bg-teal-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: "#0E6C68" }}>{i + 1}</div>
                      <div>
                        <p className="text-sm font-medium text-teal-800">{q.qualification_name}</p>
                        <p className="text-xs text-teal-600">{q.institute_name}{q.year ? ` (${q.year})` : ""}</p>
                      </div>
                    </div>
                    {editMode && (
                      <button onClick={() => removeQualification(q.id)} className="p-1.5 hover:bg-teal-100 rounded-lg text-teal-400 hover:text-red-500 transition-colors">
                        <Icons.Trash />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 mb-4">No qualifications added.</p>
            )}

            {editMode && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Add Qualification</p>
                <div className="grid grid-cols-3 gap-2">
                  <input value={newQual.qualification_name} onChange={e => setNewQual(q => ({ ...q, qualification_name: e.target.value }))}
                    placeholder="Degree (e.g. MBBS)" className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-400" />
                  <input value={newQual.institute_name} onChange={e => setNewQual(q => ({ ...q, institute_name: e.target.value }))}
                    placeholder="Institute name" className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-400" />
                  <input value={newQual.year} onChange={e => setNewQual(q => ({ ...q, year: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                    placeholder="Year (e.g. 2002)" className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-400" />
                </div>
                <Btn onClick={addQualification} className="w-full"><Icons.Plus /> Add</Btn>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="font-bold text-slate-800 mb-3">Quick Actions</div>
          <div className="space-y-2">
            <button
              onClick={() => { setPwdError(""); setShowPwdModal(true); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-teal-50 hover:text-teal-700 rounded-xl transition-all">
              <Icons.Settings /> Change Password
            </button>
          </div>
        </div>

      </div>

      {/* ── Password Change Modal ── */}
      {showPwdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md mx-4 p-6">

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800">Change Password</h2>
              <button
                onClick={closePwdModal}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                <Icons.X />
              </button>
            </div>

            {/* Fields */}
            <div className="space-y-4">
              {[
                { key: "current", label: "Current Password" },
                { key: "newPwd",  label: "New Password" },
                { key: "confirm", label: "Confirm New Password" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</div>
                  <div className="relative">
                    <input
                      type={showPwd[key] ? "text" : "password"}
                      value={pwdForm[key]}
                      onChange={e => setPwdForm(f => ({ ...f, [key]: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && handlePasswordChange()}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:border-teal-400"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(s => ({ ...s, [key]: !s[key] }))}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPwd[key] ? <Icons.EyeOff /> : <Icons.Eye />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Error */}
            {pwdError && (
              <p className="mt-3 text-xs text-red-500 font-medium">{pwdError}</p>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-6">
              <Btn variant="secondary" className="flex-1" onClick={closePwdModal} disabled={isSavingPwd}>
                Cancel
              </Btn>
              <Btn className="flex-1" onClick={handlePasswordChange} disabled={isSavingPwd}>
                <Icons.Check /> {isSavingPwd ? "Saving..." : "Update Password"}
              </Btn>
            </div>

          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default EmployeeProfilePage;