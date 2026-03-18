import { useState, useEffect } from 'react';
import Icons from '../components/Icons';
import { Badge, RightDrawer, Btn, Input, Select, Toast, PageHeader, DataTable, TR, TD } from '../components/UI';
import { useApp } from '../context/AppContext';

const API_BASE  = process.env.REACT_APP_API_BASE_URL;
const CLINIC_ID = 1;

const BLANK = { first_name:"", last_name:"", email:"", phone:"", dob:"", age:"", gender:"", blood_group:"", weight:"", reference:"", address:"" };
const GENDERS      = ["Male","Female","Other"];
const BLOOD_GROUPS = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];
const REFERENCES   = ["Friend/Relative","Google","Social Media","Advertisement","Other"];

const calcAge = (dob) => {
  if (!dob || dob.length < 10) return "";
  const today = new Date();
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return "";
  const year = birth.getFullYear();
  if (year < 1900 || year > today.getFullYear()) return "";
  let age = today.getFullYear() - year;
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? String(age) : "";
};

const genderColor = g => ({
  Male:   "bg-blue-50 text-blue-700 border-blue-100",
  Female: "bg-pink-50 text-pink-700 border-pink-100",
  Other:  "bg-gray-50 text-gray-700 border-gray-200",
}[g] || "bg-gray-100 text-gray-600");

// ─── Patient Detail Page ────────────────────────────────────────────────────

const PatientDetailPage = ({ patient, onBack, onEdit }) => {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState("overview");
  const [appointments, setAppointments] = useState([]);
  const [encounters, setEncounters]     = useState([]);
  const [loading, setLoading]           = useState(false);

  const initials = `${patient.first_name?.[0] || ""}${patient.last_name?.[0] || ""}`.toUpperCase();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [apptRes, encRes] = await Promise.all([
          fetch(`${API_BASE}/appointmentsread?clinic_id=${CLINIC_ID}`),
          fetch(`${API_BASE}/encountersread?clinic_id=${CLINIC_ID}`),
        ]);
        const apptData = await apptRes.json();
        const encData  = await encRes.json();
        setAppointments(Array.isArray(apptData) ? apptData.filter(a => a.patient_id === patient.id) : []);
        setEncounters(Array.isArray(encData)  ? encData.filter(e => e.patient_id  === patient.id) : []);
      } catch (err) {
        console.error("Failed to load detail data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [patient.id]);

  const baseTabs = ["overview", "appointments", "encounters"];
  const TABS = user?.role === "Admin" ? [...baseTabs, "bills", "payments"] : baseTabs;

  const StatusBadge = ({ status }) => {
    const colors = {
      CheckedIn:  "bg-purple-100 text-purple-700 border border-purple-200",
      Scheduled:  "bg-blue-100 text-blue-700 border border-blue-200",
      Completed:  "bg-green-100 text-green-700 border border-green-200",
      Cancelled:  "bg-red-100 text-red-700 border border-red-200",
      Paid:       "bg-green-100 text-green-700 border border-green-200",
      Unpaid:     "bg-red-100 text-red-700 border border-red-200",
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colors[status] || "bg-gray-100 text-gray-600"}`}>
        {status}
      </span>
    );
  };

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-teal-700 mb-4 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Patients
      </button>

      {/* Patient Header Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-teal-700 flex items-center justify-center text-white text-xl font-bold">
            {initials || "?"}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-gray-900">{`${patient.first_name || ""} ${patient.last_name || ""}`.trim()}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-100">Active</span>
            </div>
            <p className="text-sm text-gray-500 mb-1">
              {patient.id ? `HF-${String(patient.id).padStart(4, "0")}` : "—"} • {patient.gender || "—"} • DOB: {patient.dob || "—"}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              {patient.phone && <span>Phone: <strong className="text-gray-800">{patient.phone}</strong></span>}
              {patient.email && <span>Email: <strong className="text-gray-800">{patient.email}</strong></span>}
              {patient.blood_group && <span>Blood Group: <strong className="text-gray-800">{patient.blood_group}</strong></span>}
            </div>
          </div>
        </div>
        <button onClick={onEdit} className="flex items-center gap-2 px-4 py-2 bg-teal-700 text-white text-sm font-semibold rounded-xl hover:bg-teal-800 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-white rounded-xl border border-gray-100 shadow-sm p-1 w-fit">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${activeTab === tab ? "bg-teal-700 text-white shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : (
        <>
          {activeTab === "overview" && (
            <div className="grid grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-base font-bold text-gray-800 mb-5">Personal Information</h3>
                <div className="space-y-3">
                  {[
                    ["UHID",          patient.id ? `HF-${String(patient.id).padStart(4, "0")}` : "—"],
                    ["Full Name",     `${patient.first_name || ""} ${patient.last_name || ""}`.trim() || "—"],
                    ["Gender",        patient.gender || "—"],
                    ["Date of Birth", patient.dob || "—"],
                    ["Phone",         patient.phone || "—"],
                    ["Email",         patient.email || "—"],
                    ["Address",       patient.address || "—"],
                    ["Blood Group",   patient.blood_group || "—"],
                    ["Weight",        patient.weight ? `${patient.weight} kg` : "—"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                      <span className="text-gray-400">{label}</span>
                      <span className="text-gray-800 font-medium text-right max-w-xs">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-base font-bold text-gray-800 mb-5">Medical History Timeline</h3>
                <div className="space-y-4">
                  {encounters.length === 0 && appointments.length === 0 ? (
                    <p className="text-sm text-gray-400">No history available.</p>
                  ) : (
                    <>
                      {appointments.slice(0, 2).map((a, i) => (
                        <TimelineItem key={`appt-${i}`} title="Appointment" date={a.appointment_date} desc={a.notes || "Scheduled visit"} />
                      ))}
                      {encounters.slice(0, 3).map((e, i) => (
                        <TimelineItem key={`enc-${i}`} title="Encounter" date={e.visit_date} desc={e.chief_complaint || e.notes || "Visit"} />
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "appointments" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-800 mb-5">Appointments ({appointments.length})</h3>
              {appointments.length === 0 ? <p className="text-sm text-gray-400">No appointments found.</p> : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs uppercase text-gray-400 border-b border-gray-100">
                      {["Date","Time","Doctor","Token","Notes","Status"].map(h => (
                        <th key={h} className="text-left py-2 pr-4 font-semibold tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((a, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0">
                        <td className="py-3 pr-4 text-gray-700">{a.appointment_date}</td>
                        <td className="py-3 pr-4 text-gray-500">{a.slot_time || "—"}</td>
                        <td className="py-3 pr-4 text-gray-700">{a.doctor_name || `Dr. #${a.doctor_id}`}</td>
                        <td className="py-3 pr-4 font-bold text-gray-800">#{a.token_number || "—"}</td>
                        <td className="py-3 pr-4 text-gray-400">{a.notes || "—"}</td>
                        <td className="py-3"><StatusBadge status={a.status || "Scheduled"} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "encounters" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-800 mb-5">Encounters ({encounters.length})</h3>
              {encounters.length === 0 ? <p className="text-sm text-gray-400">No encounters found.</p> : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs uppercase text-gray-400 border-b border-gray-100">
                      {["Date","Doctor","Chief Complaint","Notes","Follow-Up"].map(h => (
                        <th key={h} className="text-left py-2 pr-4 font-semibold tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {encounters.map((e, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0">
                        <td className="py-3 pr-4 text-gray-700">{e.visit_date || "—"}</td>
                        <td className="py-3 pr-4 text-gray-700">{e.doctor_name || `Dr. #${e.doctor_id}`}</td>
                        <td className="py-3 pr-4 font-semibold text-gray-800">{e.chief_complaint || "—"}</td>
                        <td className="py-3 pr-4 text-gray-400">{e.notes || "—"}</td>
                        <td className="py-3 text-gray-500">{e.follow_up_date || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "bills" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-800 mb-3">Bills</h3>
              <p className="text-sm text-gray-400">Bills feature coming soon.</p>
            </div>
          )}

          {activeTab === "payments" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-800 mb-3">Payments</h3>
              <p className="text-sm text-gray-400">Payments feature coming soon.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const TimelineItem = ({ title, date, desc }) => (
  <div className="flex gap-3">
    <div className="flex flex-col items-center">
      <div className="w-3 h-3 rounded-full bg-teal-600 mt-0.5 shrink-0" />
      <div className="w-px flex-1 bg-teal-100 mt-1" />
    </div>
    <div className="pb-3">
      <p className="text-sm font-semibold text-gray-800">{title}</p>
      <p className="text-xs text-gray-400 mt-0.5">{date || "—"}</p>
      <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
    </div>
  </div>
);

// ─── Main Patients Page ─────────────────────────────────────────────────────

const PatientsPage = () => {
  const { showLoading, hideLoading } = useApp();
  const [patients,        setPatients]        = useState([]);
  const [search,          setSearch]          = useState("");
  const [showModal,       setShowModal]       = useState(false);
  const [editingPatient,  setEditingPatient]  = useState(null);
  const [viewingPatient,  setViewingPatient]  = useState(null);
  const [isLoading,       setIsLoading]       = useState(true);
  const [toast,           setToast]           = useState(null);
  const [errors,          setErrors]          = useState({});
  const [step,            setStep]            = useState(0);
  const [form,            setForm]            = useState(BLANK);
  const [currentPage,     setCurrentPage]     = useState(1);
  const [pageSize,        setPageSize]        = useState(10);

  const showToast = (msg, type = "success") => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000); };
  const Required  = () => <span className="text-red-500">*</span>;
  const Err       = ({ f }) => errors[f] ? <p className="text-red-500 text-xs mt-1">{errors[f]}</p> : null;

  const setField = (key, val) => {
    setForm(p => {
      const updated = { ...p, [key]: val };
      if (key === "dob") updated.age = calcAge(val); // auto-calc age from DOB
      return updated;
    });
    setErrors(p => ({ ...p, [key]: undefined }));
  };

  useEffect(() => { fetchPatients(); }, []);
  useEffect(() => { setCurrentPage(1); }, [search]);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      showLoading("Loading patients...", "patients");
      const res  = await fetch(`${API_BASE}/patient_read?clinic_id=${CLINIC_ID}`);
      const data = await res.json();
      setPatients(Array.isArray(data) ? data : []);
    } catch { showToast("Failed to load patients", "error"); }
    finally   { setIsLoading(false); hideLoading(); }
  };

  const openAdd = () => { setEditingPatient(null); setForm(BLANK); setErrors({}); setStep(0); setShowModal(true); };

  const openEdit = (p) => {
    setEditingPatient(p);
    setForm({
      first_name: p.first_name || "", last_name:   p.last_name   || "",
      email:      p.email      || "", phone:       p.phone        || "",
      dob:        p.dob        || "", age:         p.age          || "",
      gender:     p.gender     || "", blood_group: p.blood_group  || "",
      weight:     p.weight     || "", reference:   p.reference || p.refernce || "",
      address:    p.address    || "",
    });
    setErrors({}); setStep(0); setShowModal(true);
  };

  const handleClose = () => { setShowModal(false); setEditingPatient(null); setForm(BLANK); setErrors({}); setStep(0); };

  const validateStep0 = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name  = "Required";
    if (!form.last_name.trim())  e.last_name   = "Required";
    if (!form.dob)               e.dob         = "Required";
    if (!form.gender)            e.gender      = "Required";
    if (!form.blood_group)       e.blood_group = "Required";
    if (!form.age)               e.age         = "Required";
    if (!form.weight)            e.weight      = "Required";
    if (!form.reference)         e.reference   = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep1 = () => {
    const e = {};
    if (!form.email.trim())   e.email   = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    if (!form.phone.trim())   e.phone   = "Required";
    else if (!/^\d{10}$/.test(form.phone)) e.phone = "Must be 10 digits";
    if (!form.address.trim()) e.address = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validateStep1()) return;
    try {
      const res  = await fetch(`${API_BASE}/patient_create_update`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingPatient?.id || null, clinic_id: CLINIC_ID, created_by: "admin", ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "";
        if (msg.includes("same phone number")) { setErrors(p => ({ ...p, phone: "Patient already exists with this phone number" })); return; }
        if (msg.includes("same email"))        { setErrors(p => ({ ...p, email: "Patient already exists with this email" })); return; }
        if (msg.includes("same name"))         { setErrors(p => ({ ...p, first_name: "Patient already exists with this name" })); setStep(0); return; }
        throw new Error(msg);
      }
      showToast(editingPatient ? "Patient updated" : "Patient added");
      handleClose();
      fetchPatients();
    } catch (e) { showToast(e.message || "Operation failed", "error"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this patient?")) return;
    try {
      const res = await fetch(`${API_BASE}/patients_delete/`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, modified_by: "admin" }),
      });
      if (!res.ok) throw new Error();
      showToast("Patient deleted");
      fetchPatients();
    } catch { showToast("Failed to delete patient", "error"); }
  };

  const filtered   = patients.filter(p =>
    `${p.first_name} ${p.last_name} ${p.email} ${p.phone} ${p.gender} ${p.blood_group} ${p.dob} ${p.age} ${p.weight} ${p.reference||p.refernce||""}`
      .toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated  = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (viewingPatient) {
    return (
      <div>
        <PatientDetailPage
          patient={viewingPatient}
          onBack={() => setViewingPatient(null)}
          onEdit={() => { openEdit(viewingPatient); setViewingPatient(null); }}
        />
        {showModal && (
          <RightDrawer title={editingPatient ? "Edit Patient" : "Add New Patient"} open={showModal} onClose={handleClose}>
            <DrawerContent step={step} setStep={setStep} form={form} setField={setField}
              errors={errors} Required={Required} Err={Err}
              editingPatient={editingPatient} handleClose={handleClose}
              validateStep0={validateStep0} handleSave={handleSave} />
          </RightDrawer>
        )}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Patients" subtitle="Manage patient records"
        actions={<Btn onClick={openAdd}><Icons.Plus /> Add Patient</Btn>}
      />

      {isLoading ? (
        <div className="text-center py-6 text-gray-500">Loading patients...</div>
      ) : (
        <DataTable
          title="Patient List" subtitle={`${filtered.length} patients registered`}
          search={search} onSearch={setSearch} searchPlaceholder="Search by name, phone, UHID…"
          actions={<Btn variant="secondary"><Icons.Download /> Export</Btn>}
          columns={["Full Name","Email","Phone","DOB","Gender","Blood Group","Age","Weight","Reference","Actions"]}
          rows={paginated.map(p => (
            <TR key={p.id}>
              <TD><span className="font-semibold text-slate-700">{`${p.first_name||""} ${p.last_name||""}`.trim()||"—"}</span></TD>
              <TD>{p.email||"—"}</TD>
              <TD>{p.phone||"—"}</TD>
              <TD muted>{p.dob||"—"}</TD>
              <TD>{p.gender ? <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${genderColor(p.gender)}`}>{p.gender}</span> : "—"}</TD>
              <TD>{p.blood_group||"—"}</TD>
              <TD>{p.age||"—"}</TD>
              <TD>{p.weight||"—"}</TD>
              <TD>{p.reference || p.refernce || "—"}</TD>
              <TD>
                <div className="flex gap-1">
                  <button onClick={() => setViewingPatient(p)} className="p-1.5 hover:bg-teal-50 hover:text-teal-600 rounded-lg text-slate-400" title="View"><Icons.Eye /></button>
                  <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-400" title="Edit"><Icons.Edit /></button>
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg text-slate-400" title="Delete"><Icons.Trash /></button>
                </div>
              </TD>
            </TR>
          ))}
          currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage}
          totalItems={filtered.length} pageSize={pageSize}
          onPageSizeChange={n => { setPageSize(n); setCurrentPage(1); }} pageSizeOptions={[10, 20, 50]}
        />
      )}

      <RightDrawer title={editingPatient ? "Edit Patient" : "Add New Patient"} open={showModal} onClose={handleClose}>
        <DrawerContent step={step} setStep={setStep} form={form} setField={setField}
          errors={errors} Required={Required} Err={Err}
          editingPatient={editingPatient} handleClose={handleClose}
          validateStep0={validateStep0} handleSave={handleSave} />
      </RightDrawer>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

// ─── Drawer Content ─────────────────────────────────────────────────────────

const DrawerContent = ({ step, setStep, form, setField, errors, Required, Err, editingPatient, handleClose, validateStep0, handleSave }) => (
  <div className="h-full flex flex-col">
    <div className="px-8 py-4 bg-gradient-to-r from-teal-50 to-blue-50 border-b border-teal-100">
      <p className="text-sm text-gray-600">Fill in the details to register a new patient</p>
    </div>

    <div className="flex-1 overflow-y-auto px-8 py-6">
      {step === 0 && (
        <div className="space-y-4">
          <SectionHeader icon={<Icons.User />} title="Patient Identity" subtitle="Basic identification details" color="teal" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input label={<>First Name <Required /></>} value={form.first_name}
                onChange={v => setField("first_name", v.replace(/[^a-zA-Z\s]/g, ""))} placeholder="First name" />
              <Err f="first_name" />
            </div>
            <div>
              <Input label={<>Last Name <Required /></>} value={form.last_name}
                onChange={v => setField("last_name", v.replace(/[^a-zA-Z\s]/g, ""))} placeholder="Last name" />
              <Err f="last_name" />
            </div>
          </div>
          <div>
            <Input label={<>Date of Birth <Required /></>} type="date" value={form.dob} onChange={v => setField("dob", v)} />
            <Err f="dob" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Select label={<>Gender <Required /></>} value={form.gender} onChange={v => setField("gender", v)} options={GENDERS} />
              <Err f="gender" />
            </div>
            <div>
              <Select label={<>Blood Group <Required /></>} value={form.blood_group} onChange={v => setField("blood_group", v)} options={BLOOD_GROUPS} />
              <Err f="blood_group" />
            </div>
            <div>
              {/* ✅ Age is editable — also auto-filled when DOB is entered */}
              <Input label={<>Age <Required /></>} type="number" value={form.age}
                onChange={v => setField("age", v.replace(/\D/g, "").slice(0, 3))} placeholder="Age in years" />
              <Err f="age" />
            </div>
            <div>
              <Input label={<>Weight (kg) <Required /></>} type="number" value={form.weight}
                onChange={v => setField("weight", v.replace(/\D/g, "").slice(0, 3))} placeholder="Weight in kg" />
              <Err f="weight" />
            </div>
            <div className="col-span-2">
              <Select label={<>Reference <Required /></>} value={form.reference} onChange={v => setField("reference", v)} options={REFERENCES} />
              <Err f="reference" />
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <SectionHeader icon={<Icons.Calendar />} title="Contact Details" subtitle="How to reach the patient" color="blue" />
          <div>
            <Input label={<>Email <Required /></>} type="email" value={form.email} onChange={v => setField("email", v)} placeholder="email@example.com" />
            <Err f="email" />
          </div>
          <div>
            <Input label={<>Phone <Required /></>} value={form.phone} onChange={v => setField("phone", v.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit number" />
            <Err f="phone" />
          </div>
          <div>
            <Input label={<>Address <Required /></>} value={form.address} onChange={v => setField("address", v)} placeholder="Street, City, State" />
            <Err f="address" />
          </div>
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex gap-3">
            <span className="text-amber-700 text-lg">🔒</span>
            <div>
              <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">Privacy Notice</p>
              <p className="text-sm text-amber-800 mt-1">Patient contact details are kept confidential and used only for medical communication.</p>
            </div>
          </div>
        </div>
      )}
    </div>

    <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
      <div className="text-xs text-gray-500 font-medium">Step {step + 1} of 2</div>
      <div className="flex gap-3">
        <Btn variant="secondary" onClick={step === 0 ? handleClose : () => setStep(0)}>
          {step === 0 ? "Cancel" : <><Icons.ChevronLeft /> Back</>}
        </Btn>
        <Btn onClick={step === 0 ? () => { if (validateStep0()) setStep(1); } : handleSave}>
          {step === 0 ? <>Next <Icons.ChevronRight /></> : <><Icons.Check /> {editingPatient ? "Update Patient" : "Add Patient"}</>}
        </Btn>
      </div>
    </div>
  </div>
);

const SectionHeader = ({ icon, title, subtitle, color }) => (
  <div className={`flex items-center gap-3 mb-4 pb-3 border-b border-${color}-100`}>
    <div className={`w-9 h-9 rounded-lg bg-${color}-50 flex items-center justify-center text-${color}-600`}>{icon}</div>
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-gray-600">{title}</p>
      <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
    </div>
  </div>
);

export default PatientsPage;