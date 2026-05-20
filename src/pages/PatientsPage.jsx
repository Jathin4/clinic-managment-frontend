import { useState, useEffect, useRef } from 'react';
import Icons from '../components/Icons';
import { RightDrawer, Btn, Input, Select, Toast, PageHeader, DataTable, TR, TD } from '../components/UI';
import { useApp } from '../context/AppContext';
import { PERMISSIONS } from "../components/permissions"; // ← CHANGE 1: added import
// import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_BASE_URL;
const getClinicId = () => { try { const u = sessionStorage.getItem("user"); return u ? JSON.parse(u)?.clinic_id : null; } catch { return null; } };
const TODAY = new Date().toISOString().slice(0, 10);
const BLANK = { first_name: "", last_name: "", email: "", phone: "", dob: "", age: "", gender: "", blood_group: "", weight: "", reference: "", address: "", bp: "", pulse_rate: "", pincode: "" };
const GENDERS = ["Male", "Female", "Other"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const REFERENCES = ["Friend/Relative", "Google", "Social Media", "Advertisement", "Other"];
const PINCODES = {
  "500001": ["Abids", "Nampally", "King Koti", "Gunfoundry", "Mozampura", "Ramkote"],
  "500002": ["Charminar", "CharKaman", "Moghulpura", "Purani Haveli", "Dewan Devdi"],
  "500003": ["Secunderabad", "Begumpet", "Picket"],
  "500004": ["Khairatabad", "Chintal Basti", "Lakdikapul", "Bazar Ghat", "Erramanzil"],
  "500012": ["Begumbazar", "Bazarghat"], "500013": ["Amberpet", "Gandhi Nagar"],
  "500018": ["Ameerpet", "Sanathnagar", "Vivekananda Nagar"], "500023": ["Yakutpura"],
  "500027": ["Barkatpura", "Himayatnagar", "Kacheguda"], "500029": ["Himayatnagar"],
  "500030": ["Rajendranagar", "Agricultural College"], "500032": ["Gachibowli", "Raidurg"],
  "500034": ["Banjara Hills", "Jubilee Hills"], "500035": ["Saroor Nagar"], "500037": ["Balanagar"],
  "500043": ["Maisammaguda", "Kompally", "Dullapally"], "500050": ["Chanda Nagar", "Chandan Nagar"],
  "500053": ["Falaknuma"], "500064": ["Bahadurpura"], "500072": ["Kukatpally", "HMT Township"],
  "500074": ["L.B. Nagar"], "500081": ["Madhapur", "Hitech City"],
  "500082": ["Somajiguda", "Raj Bhavan Road"], "500089": ["Manikonda"],
};

const calcAge = dob => {
  if (!dob || dob.length < 10) return "";
  const b = new Date(dob), t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
  return a >= 0 ? String(a) : "";
};
const formatDOB = dob => { if (!dob) return "—"; const [y, m, d] = dob.split("-"); return `${d}-${m}-${y}`; };
const genderColor = g => ({ Male: "bg-blue-50 text-blue-700 border-blue-100", Female: "bg-pink-50 text-pink-700 border-pink-100" }[g] || "bg-gray-50 text-gray-700 border-gray-200");
const STATUS_PILL = { Booked: "bg-blue-50 text-blue-700 border-blue-100", CheckedIn: "bg-purple-50 text-purple-700 border-purple-100", Completed: "bg-green-50 text-green-700 border-green-100", Cancelled: "bg-red-50 text-red-700 border-red-100" };

const isDuplicatePatient = (patients, form, editingId = null) =>
  patients.some(p =>
    p.id !== editingId &&
    (p.phone || "").trim() === (form.phone || "").trim() &&
    (p.dob || "").trim() === (form.dob || "").trim() &&
    (p.phone || "").trim() !== ""
  );

// ─── Status Badge Component ───────────────────────────────────────────────────
const SBadge = ({ s }) => {
  const c = { CheckedIn: "bg-purple-100 text-purple-700", Scheduled: "bg-blue-100 text-blue-700", Completed: "bg-green-100 text-green-700", Cancelled: "bg-red-100 text-red-700" };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${c[s] || "bg-gray-100 text-gray-600"}`}>{s}</span>;
};

// ─── Required Indicator Component ─────────────────────────────────────────────
const Required = () => <span className="text-red-500">*</span>;

// ─── Error Message Component ──────────────────────────────────────────────────
const ErrorMsg = ({ f, errors }) => 
  errors[f] ? <p className="text-red-500 text-xs mt-1">{errors[f]}</p> : null;

// ─── QR Modal ─────────────────────────────────────────────────────────────────
const QRModal = ({ clinicId, onClose }) => {
  const canvasRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const url = `${window.location.protocol}//${window.location.hostname}:${window.location.port}/self-register?clinic_id=${clinicId}`;

  useEffect(() => {
    if (window.QRCode) { setLoaded(true); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    s.onload = () => setLoaded(true);
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    if (!loaded || !canvasRef.current) return;
    canvasRef.current.innerHTML = "";
    new window.QRCode(canvasRef.current, { text: url, width: 220, height: 220, colorDark: "#0f766e", colorLight: "#ffffff", correctLevel: window.QRCode.CorrectLevel.H });
  }, [loaded, url]);

  const handlePrint = () => {
    const w = window.open("", "_blank");
    w.document.write(`<html><head><title>Patient Self-Registration QR</title><style>body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0}.card{border:2px solid #0f766e;border-radius:16px;padding:32px 40px;text-align:center;max-width:320px}h2{color:#0f766e;font-size:20px;margin-bottom:4px}p{color:#64748b;font-size:13px;margin-bottom:20px}.url{font-size:10px;color:#94a3b8;margin-top:16px;word-break:break-all}</style></head><body><div class="card"><h2>Register & Book Appointment</h2><p>Scan this QR code to register and book an appointment</p><div>${canvasRef.current?.innerHTML || ""}</div><div class="url">${url}</div></div></body></html>`);
    w.document.close(); w.focus(); w.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 w-96 flex flex-col items-center relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
        <div className="w-12 h-12 rounded-xl bg-teal-700 flex items-center justify-center mb-4">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="3" height="3" /><rect x="18" y="14" width="3" height="3" /><rect x="14" y="18" width="3" height="3" /><rect x="18" y="18" width="3" height="3" /></svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Patient Self-Registration</h3>
        <p className="text-sm text-gray-400 text-center mb-5">Patients scan this QR to register and book appointments</p>
        <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 mb-4">
          {!loaded ? <div className="w-[220px] h-[220px] flex items-center justify-center text-sm text-gray-400">Loading…</div> : <div ref={canvasRef} />}
        </div>
        <div className="w-full bg-gray-50 rounded-xl px-4 py-2.5 mb-5 border border-gray-100">
          <p className="text-xs text-gray-400 mb-0.5">Registration URL</p>
          <p className="text-xs text-teal-700 font-medium break-all">{url}</p>
        </div>
        <div className="flex gap-3 w-full">
          <button onClick={() => navigator.clipboard.writeText(url)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>Copy Link
          </button>
          <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-700 rounded-xl text-sm font-semibold text-white hover:bg-teal-800">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>Print QR
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Today's Appointments Dropdown ───────────────────────────────────────────
const TodayAppointmentsToggle = ({ todayApts, getPatientName, getDoctorName }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const counts = { Booked: 0, CheckedIn: 0, Completed: 0, Cancelled: 0 };
  todayApts.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++; });

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all whitespace-nowrap ${open ? "bg-teal-700 text-white border-teal-700" : "bg-white text-slate-600 border-gray-200 hover:border-teal-400 hover:text-teal-700"}`}>
        <Icons.Calendar />Today's Appointments
        <span className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${open ? "bg-white text-teal-700" : "bg-teal-700 text-white"}`}>{todayApts.length}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-96 bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden">
          <div className="px-5 py-3.5 bg-gradient-to-r from-teal-50 to-blue-50 border-b border-teal-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-bold text-gray-800">Today's Appointments</p>
                <p className="text-xs text-gray-400">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-700 text-white">{todayApts.length} total</span>
            </div>
            <div className="flex gap-2">
              {[["In Queue", counts.Booked, "bg-blue-100 text-blue-700"],
              //  ["Checked In", counts.CheckedIn, "bg-purple-100 text-purple-700"], 
               ["Done", counts.Completed, "bg-green-100 text-green-700"], ["Cancelled", counts.Cancelled, "bg-red-100 text-red-700"]].map(([l, c, cls]) => (
                <div key={l} className={`flex-1 rounded-lg px-2 py-1.5 text-center ${cls}`}><p className="text-sm font-bold">{c}</p><p className="text-xs opacity-80">{l}</p></div>
              ))}
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
            {todayApts.length === 0 ? <div className="px-5 py-10 text-center text-sm text-gray-400">No appointments today</div> : (
              [...todayApts].sort((a, b) => (a.slot_time || "").localeCompare(b.slot_time || "")).map((a, i) => (
                <div key={i} className="px-5 py-3 hover:bg-gray-50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-teal-700 flex items-center justify-center text-white text-xs font-bold shrink-0">{a.token_number}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{a.patient_name || getPatientName(a.patient_id)}</p>
                      <p className="text-xs text-gray-400 truncate">{a.doctor_name || getDoctorName(a.doctor_id)}{a.slot_time ? ` · ${a.slot_time.slice(0, 5)}` : ""}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_PILL[a.status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>{a.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Patient Detail ───────────────────────────────────────────────────────────
const PatientDetailPage = ({ patient, onBack, onEdit }) => {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState("overview");
  const [appointments, setAppointments] = useState([]);
  const [encounters, setEncounters] = useState([]);
  const initials = `${patient.first_name?.[0] || ""}${patient.last_name?.[0] || ""}`.toUpperCase();
  const TABS = user?.role === "Admin" ? ["overview", "appointments", "encounters", "bills", "payments"] : ["overview", "appointments", "encounters"];

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/appointmentsread?clinic_id=${getClinicId()}`).then(r => r.json()),
      fetch(`${API_BASE}/encountersread?clinic_id=${getClinicId()}`).then(r => r.json()),
    ]).then(([a, e]) => {
      setAppointments(Array.isArray(a) ? a.filter(x => x.patient_id === patient.id) : []);
      setEncounters(Array.isArray(e) ? e.filter(x => x.patient_id === patient.id) : []);
    }).catch(console.error);
  }, [patient.id]);

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-teal-700 mb-4"><Icons.ChevronLeft /> Back to Patients</button>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-teal-700 flex items-center justify-center text-white text-xl font-bold">{initials || "?"}</div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-gray-900">{`${patient.first_name || ""} ${patient.last_name || ""}`.trim()}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-100">Active</span>
            </div>
            <p className="text-sm text-gray-500 mb-1">{patient.id ? `HF-${String(patient.id).padStart(4, "0")}` : "—"} · {patient.gender || "—"} · DOB: {formatDOB(patient.dob)}</p>
            <div className="flex gap-4 text-sm text-gray-500">
              {patient.phone && <span>Phone: <strong className="text-gray-800">{patient.phone}</strong></span>}
              {patient.email && <span>Email: <strong className="text-gray-800">{patient.email}</strong></span>}
              {patient.blood_group && <span>Blood: <strong className="text-gray-800">{patient.blood_group}</strong></span>}
              {patient.bp && <span>BP: <strong className="text-gray-800">{patient.bp}</strong></span>}
              {patient.pulse_rate && <span>Pulse: <strong className="text-gray-800">{patient.pulse_rate} bpm</strong></span>}
            </div>
          </div>
        </div>
        <button onClick={onEdit} className="flex items-center gap-2 px-4 py-2 bg-teal-700 text-white text-sm font-semibold rounded-xl hover:bg-teal-800"><Icons.Edit /> Edit</button>
      </div>

      <div className="flex gap-1 mb-5 bg-white rounded-xl border border-gray-100 shadow-sm p-1 w-fit">
        {TABS.map(t => <button key={t} onClick={() => setActiveTab(t)} className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${activeTab === t ? "bg-teal-700 text-white" : "text-gray-500 hover:text-gray-800"}`}>{t}</button>)}
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-800 mb-5">Personal Information</h3>
            <div className="space-y-3">
              {[["UHID", patient.id ? `HF-${String(patient.id).padStart(4, "0")}` : "—"], ["Full Name", `${patient.first_name || ""} ${patient.last_name || ""}`.trim() || "—"], ["Gender", patient.gender || "—"], ["DOB", formatDOB(patient.dob)], ["Phone", patient.phone || "—"], ["Email", patient.email || "—"], ["Address", patient.address || "—"], ["Blood Group", patient.blood_group || "—"], ["Weight", patient.weight ? `${patient.weight} kg` : "—"], ["BP", patient.bp || "—"], ["Pulse Rate", patient.pulse_rate ? `${patient.pulse_rate} bpm` : "—"]].map(([l, v]) => (
                <div key={l} className="flex justify-between text-sm border-b border-gray-50 pb-2 last:border-0">
                  <span className="text-gray-400">{l}</span><span className="text-gray-800 font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-800 mb-5">Medical History</h3>
            {[...appointments.slice(0, 2).map(a => ({ title: "Appointment", date: a.appointment_date, desc: a.notes || "Scheduled visit" })), ...encounters.slice(0, 3).map(e => ({ title: "Encounter", date: e.visit_date, desc: e.chief_complaint || "Visit" }))].map((x, i) => (
              <div key={i} className="flex gap-3 pb-3">
                <div className="flex flex-col items-center"><div className="w-3 h-3 rounded-full bg-teal-600 mt-0.5" /><div className="w-px flex-1 bg-teal-100 mt-1" /></div>
                <div><p className="text-sm font-semibold text-gray-800">{x.title}</p><p className="text-xs text-gray-400">{x.date || "—"}</p><p className="text-sm text-gray-500">{x.desc}</p></div>
              </div>
            ))}
            {appointments.length === 0 && encounters.length === 0 && <p className="text-sm text-gray-400">No history available.</p>}
          </div>
        </div>
      )}

      {activeTab === "appointments" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-800 mb-5">Appointments ({appointments.length})</h3>
          {appointments.length === 0 ? <p className="text-sm text-gray-400">No appointments found.</p> : (
            <table className="w-full text-sm">
              <thead><tr className="text-xs uppercase text-gray-400 border-b border-gray-100">{["Date", "Time", "Doctor", "Token", "Notes", "Status"].map(h => <th key={h} className="text-left py-2 pr-4 font-semibold">{h}</th>)}</tr></thead>
              <tbody>{appointments.map((a, i) => <tr key={i} className="border-b border-gray-50"><td className="py-3 pr-4">{a.appointment_date}</td><td className="py-3 pr-4 text-gray-500">{a.slot_time || "—"}</td><td className="py-3 pr-4">{a.doctor_name || `Dr. #${a.doctor_id}`}</td><td className="py-3 pr-4 font-bold">#{a.token_number || "—"}</td><td className="py-3 pr-4 text-gray-400">{a.notes || "—"}</td><td className="py-3"><SBadge s={a.status || "Scheduled"} /></td></tr>)}</tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "encounters" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-800 mb-5">Encounters ({encounters.length})</h3>
          {encounters.length === 0 ? <p className="text-sm text-gray-400">No encounters found.</p> : (
            <table className="w-full text-sm">
              <thead><tr className="text-xs uppercase text-gray-400 border-b border-gray-100">{["Date", "Doctor", "Chief Complaint", "Notes", "Follow-Up"].map(h => <th key={h} className="text-left py-2 pr-4 font-semibold">{h}</th>)}</tr></thead>
              <tbody>{encounters.map((e, i) => <tr key={i} className="border-b border-gray-50"><td className="py-3 pr-4">{e.visit_date || "—"}</td><td className="py-3 pr-4">{e.doctor_name || `Dr. #${e.doctor_id}`}</td><td className="py-3 pr-4 font-semibold">{e.chief_complaint || "—"}</td><td className="py-3 pr-4 text-gray-400">{e.notes || "—"}</td><td className="py-3 text-gray-500">{e.follow_up_date || "—"}</td></tr>)}</tbody>
            </table>
          )}
        </div>
      )}

      {["bills", "payments"].includes(activeTab) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-800 mb-3 capitalize">{activeTab}</h3>
          <p className="text-sm text-gray-400">{activeTab} feature coming soon.</p>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const PatientsPage = () => {
  const { showLoading, hideLoading, user, can, setPage } = useApp(); // ← CHANGE 2: added user, can, setPage
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [viewingPatient, setViewingPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(BLANK);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // const [showApptModal, setShowApptModal] = useState(false);
  // const [apptForm, setApptForm] = useState({ patient_id: "", doctor_id: "", appointment_date: "", slot_time: "", notes: "" });
  const [doctors, setDoctors] = useState([]);
  const [todayApts, setTodayApts] = useState([]);
  const [showQRModal, setShowQRModal] = useState(false);

  const showToast = (msg, type = "success") => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000); };
  const getPatientName = id => { const p = patients.find(x => x.id === id); return p ? `${p.first_name} ${p.last_name}`.trim() : `Patient #${id}`; };
  const getDoctorName = id => { const d = doctors.find(x => x.id === id); return d ? (d.name || d.full_name || `${d.first_name ?? ""} ${d.last_name ?? ""}`.trim()) : `Dr. #${id}`; };
  // const navigate = useNavigate();
  const setField = (key, val) => {
    setForm(p => ({ ...p, [key]: val, ...(key === "dob" ? { age: calcAge(val) } : {}) }));
    setErrors(p => ({ ...p, [key]: undefined }));
  };

  // ← CHANGE 3: fetchTodayApts and fetchPatients now filter by doctor_id when doctor is logged in
  const fetchTodayApts = () => {
    const url = can(PERMISSIONS.DASH_OWN_PATIENTS)
      ? `${API_BASE}/appointmentsread?clinic_id=${getClinicId()}&doctor_id=${user?.id}`
      : `${API_BASE}/appointmentsread?clinic_id=${getClinicId()}`;
    fetch(url).then(r => r.json())
      .then(d => { if (Array.isArray(d)) setTodayApts(d.filter(a => a.appointment_date?.slice(0, 10) === TODAY)); })
      .catch(() => { });
  };

  const fetchPatients = async () => {
    try {
      setIsLoading(true); showLoading("Loading patients...", "patients");
      const url = can(PERMISSIONS.DASH_OWN_PATIENTS)
        ? `${API_BASE}/patient_read?clinic_id=${getClinicId()}&doctor_id=${user?.id}`
        : `${API_BASE}/patient_read?clinic_id=${getClinicId()}`;
      const res = await fetch(url);
      const data = await res.json();
      setPatients(Array.isArray(data) ? data : []);
    } catch { showToast("Failed to load patients", "error"); }
    finally { setIsLoading(false); hideLoading(); }
  };

  useEffect(() => {
    fetchPatients();
    fetch(`${API_BASE}/doctorsread`).then(r => r.json()).then(d => setDoctors(Array.isArray(d) ? d : [])).catch(() => { });
    fetchTodayApts();
  }, []);

  useEffect(() => { setCurrentPage(1); }, [search]);

  const openAdd = () => { setEditingPatient(null); setForm(BLANK); setErrors({}); setShowModal(true); };
  const openEdit = p => {
    setEditingPatient(p);
    setForm({ first_name: p.first_name || "", last_name: p.last_name || "", email: p.email || "", phone: p.phone || "", dob: p.dob || "", age: p.age || "", gender: p.gender || "", blood_group: p.blood_group || "", weight: p.weight || "", reference: p.reference || p.refernce || "", address: p.address || "", bp: p.bp || "", pulse_rate: p.pulse_rate || "", pincode: p.pincode || "" });
    setErrors({}); setShowModal(true);
  };
  const handleClose = () => { setShowModal(false); setEditingPatient(null); setForm(BLANK); setErrors({}); };

  const validateAll = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = "First name is required";
    if (!form.last_name.trim()) e.last_name = "Last name is required";

    if (form.dob > TODAY) e.dob = "Date of birth cannot be a future date";
    if (!form.gender) e.gender = "Gender is required";
    if (!form.age) e.age = "Age is required";
    if (!form.weight) e.weight = "Weight is required";
    // if (!form.bp.trim()) e.bp = "Blood pressure is required";
    // if (!form.pulse_rate) e.pulse_rate = "Pulse rate is required";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email format";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(form.phone)) e.phone = "Phone must be exactly 10 digits";
    if (!e.phone && !e.dob && isDuplicatePatient(patients, form, editingPatient?.id))
      e._duplicate = "A patient with this phone number and date of birth already exists.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (goToAppointments = false) => {
    if (!validateAll()) return;
    try {
      const res = await fetch(`${API_BASE}/patient_create_update`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPatient?.id || null,
          clinic_id: getClinicId(),
          created_by: "admin",
          ...form,
          age: form.age ? parseInt(form.age) : null,
          weight: form.weight ? parseFloat(form.weight) : null,
          dob: form.dob || null,
          blood_group: form.blood_group || null,
          // remove the email line — let ...form handle it as ""
        })
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "";
        if (msg.includes("phone number and date of birth")) { setErrors(p => ({ ...p, _duplicate: "A patient with this phone number and date of birth already exists." })); return; }
        if (msg.includes("same email")) { setErrors(p => ({ ...p, email: "Patient already exists with this email" })); return; }
        throw new Error(msg);
      }
      if (goToAppointments) {
        setPage("appointments", { openBookFor: data.id });
        return;
      }
      showToast(editingPatient ? "Patient updated" : "Patient added");
      handleClose(); fetchPatients();
    } catch (e) { showToast(e.message || "Operation failed", "error"); }
  };

  const handleDelete = async id => {
    if (!window.confirm("Delete this patient?")) return;
    try {
      const res = await fetch(`${API_BASE}/patients_delete/`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, modified_by: "admin" }) });
      if (!res.ok) { const d = await res.json(); showToast(d.error || "Failed to delete patient", "error"); return; }
      showToast("Patient deleted"); fetchPatients();
    } catch { showToast("Failed to delete patient", "error"); }
  };

  const filtered = patients
    .filter(p => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return `${p.first_name} ${p.last_name} ${p.email} ${p.phone} ${p.gender} ${p.blood_group} ${formatDOB(p.dob)}`.toLowerCase().includes(q);
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (viewingPatient) return (
    <div>
      <PatientDetailPage patient={viewingPatient} onBack={() => setViewingPatient(null)} onEdit={() => { openEdit(viewingPatient); setViewingPatient(null); }} />
      {showModal && <RightDrawer title={editingPatient ? "Edit Patient" : "Add New Patient"} open={showModal} onClose={handleClose}><DrawerContent {...{ form, setField, errors, Required, Err: ErrorMsg, editingPatient, handleClose, handleSave }} /></RightDrawer>}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );

  return (
    <div>
      <PageHeader title="Patients" subtitle="View patient records" actions={<Btn onClick={() => setShowQRModal(true)}>Patient QR</Btn>} />
      {isLoading ? <div className="text-center py-6 text-gray-500">Loading patients...</div> : (
        <DataTable
          title="Patient List" subtitle={`${filtered.length} patients registered`}
          search={search} onSearch={setSearch} searchPlaceholder="Search by name, phone, DOB…"
          actions={
            <div className="flex items-center gap-2">
              {/* <button onClick={() => setShowQRModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-slate-600 hover:border-teal-400 hover:text-teal-700 text-sm font-medium transition-all whitespace-nowrap" title="Show self-registration QR code">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="3" height="3" /><rect x="18" y="14" width="3" height="3" /><rect x="14" y="18" width="3" height="3" /><rect x="18" y="18" width="3" height="3" /></svg>
                Patient QR
              </button> */}
              <TodayAppointmentsToggle todayApts={todayApts} getPatientName={getPatientName} getDoctorName={getDoctorName} />
              <Btn variant="secondary"><Icons.Download /> Export</Btn>
            </div>
          }
          columns={["Full Name", "Email", "Phone", "DOB", "Gender", "Blood Group", "Actions"]}
          rows={paginated.map(p => (
            <TR key={p.id}>
              <TD><span className="font-semibold text-slate-700">{`${p.first_name || ""} ${p.last_name || ""}`.trim() || "—"}</span></TD>
              <TD>{p.email || "—"}</TD>
              <TD>{p.phone || "—"}</TD>
              <TD muted>{formatDOB(p.dob)}</TD>
              <TD>{p.gender ? <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${genderColor(p.gender)}`}>{p.gender}</span> : "—"}</TD>
              <TD>{p.blood_group || "—"}</TD>
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
        <DrawerContent {...{ form, setField, errors, Required, Err: ErrorMsg, editingPatient, handleClose, handleSave }} />
      </RightDrawer>

      {/* <RightDrawer title="Book Appointment" open={showApptModal} onClose={() => setShowApptModal(false)}>
        <div className="h-full flex flex-col">
          <div className="px-8 py-4 bg-gradient-to-r from-teal-50 to-blue-50 border-b border-teal-100">
            <p className="text-sm text-gray-600">Fill in the details to schedule an appointment</p>
          </div>
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
            <Select label="Patient" value={apptForm.patient_id} onChange={v => setApptForm(f => ({ ...f, patient_id: v }))} options={patients.map(p => ({ value: p.id, label: `${p.first_name} ${p.last_name}` }))} />
            <Select label="Doctor" value={apptForm.doctor_id} onChange={v => setApptForm(f => ({ ...f, doctor_id: v }))} options={doctors.map(d => ({ value: d.id, label: d.name }))} />
            <Input label="Appointment Date" type="date" value={apptForm.appointment_date} min={TODAY} onChange={v => setApptForm(f => ({ ...f, appointment_date: v, slot_time: "" }))} />
            <Input label="Slot Time" type="time" value={apptForm.slot_time} onChange={v => setApptForm(f => ({ ...f, slot_time: v }))} />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
              <textarea value={apptForm.notes} onChange={e => setApptForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Reason for visit…" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 resize-none" />
            </div>
          </div>
          <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <Btn variant="secondary" onClick={() => setShowApptModal(false)}>Cancel</Btn>
            <Btn disabled={!apptForm.patient_id || !apptForm.doctor_id || !apptForm.appointment_date}
              onClick={async () => {
                try {
                  const res = await fetch(`${API_BASE}/appointment_create_update`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clinic_id: getClinicId(), ...apptForm, status: "Booked", token_number: 1, is_active: true, user: "admin" }) });
                  const data = await res.json();
                  if (!res.ok) { showToast(data.error || "Failed to book", "error"); return; }
                  showToast("Appointment booked!"); setShowApptModal(false);
                  if (apptForm.appointment_date === TODAY) fetchTodayApts();
                } catch { showToast("Server error", "error"); }
              }}>
              <Icons.Check /> Book Appointment
            </Btn>
          </div>
        </div>
      </RightDrawer> */}

      {showQRModal && <QRModal clinicId={getClinicId()} onClose={() => setShowQRModal(false)} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

// ─── Drawer Content ───────────────────────────────────────────────────────────
const DrawerContent = ({ form, setField, errors, Required, Err, editingPatient, handleClose, handleSave }) => {
  const onlyDigits = (v, max) => v.replace(/\D/g, "").slice(0, max);
  const onlyAlpha = v => v.replace(/[^a-zA-Z\s]/g, "");
  const canSave = form.first_name && form.last_name && form.gender && form.age && form.phone && form.weight;
  // form.bp && form.pulse_rate
  return (
    <div className="h-full flex flex-col">
      <div className="px-8 py-4 bg-gradient-to-r from-teal-50 to-blue-50 border-b border-teal-100">
        <p className="text-sm text-gray-600">Fill in the details to register a new patient</p>
      </div>
      <div className="flex-1 overflow-y-auto px-8 py-4 space-y-3">
        {errors._duplicate && (
          <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            {errors._duplicate}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div><Input label={<>First Name <Required /></>} value={form.first_name} maxLength={50} onChange={v => setField("first_name", onlyAlpha(v))} placeholder="First name" /><Err f="first_name" /></div>
          <div><Input label={<>Last Name <Required /></>} value={form.last_name} maxLength={50} onChange={v => setField("last_name", onlyAlpha(v))} placeholder="Last name" /><Err f="last_name" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Input label={<>Date of Birth </>} type="date" value={form.dob} max={TODAY} onChange={v => setField("dob", v)} /><Err f="dob" /></div>
          <div><Input label={<>Age <Required /></>} type="number" value={form.age} min={0} max={120} onChange={v => setField("age", onlyDigits(v, 3))} placeholder="Age in years" /><Err f="age" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Select label={<>Gender <Required /></>} value={form.gender} onChange={v => setField("gender", v)} options={GENDERS} /><Err f="gender" /></div>
          <div><Input label={<>Weight (kg) <Required /></>} type="number" value={form.weight} min={1} max={300} onChange={v => setField("weight", onlyDigits(v, 3))} placeholder="Weight in kg" /><Err f="weight" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Input label={<>B/P (mmHg) </>} value={form.bp} maxLength={7} onChange={v => setField("bp", v)} placeholder="e.g. 120/80" /><Err f="bp" /></div>
          <div><Input label={<>Pulse Rate (bpm) </>} type="number" value={form.pulse_rate} min={30} max={250} onChange={v => setField("pulse_rate", onlyDigits(v, 3))} placeholder="e.g. 72" /><Err f="pulse_rate" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Select label={<>Blood Group </>} value={form.blood_group} onChange={v => setField("blood_group", v)} options={BLOOD_GROUPS} /><Err f="blood_group" /></div>
          <div><Select label="Reference" value={form.reference} onChange={v => setField("reference", v)} options={REFERENCES} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Input label="Email" type="email" value={form.email} maxLength={100} onChange={v => setField("email", v)} placeholder="email@example.com" /><Err f="email" /></div>
          <div><Input label={<>Phone <Required /></>} value={form.phone} maxLength={10} onChange={v => setField("phone", onlyDigits(v, 10))} placeholder="10-digit number" /><Err f="phone" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Pincode</label>
            <select value={form.pincode} onChange={e => { setField("pincode", e.target.value); setField("address", ""); }} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 bg-white text-gray-700">
              <option value="">Select pincode</option>
              {Object.keys(PINCODES).map(pin => <option key={pin} value={pin}>{pin}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Area</label>
            <select value={form.address} onChange={e => setField("address", e.target.value)} disabled={!form.pincode} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 bg-white text-gray-700 disabled:bg-gray-50 disabled:text-gray-400">
              <option value="">{form.pincode ? "Select area" : "Select pincode first"}</option>
              {form.pincode && PINCODES[form.pincode]?.map(area => <option key={area} value={area}>{area}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <Btn variant="secondary" onClick={handleClose}>Cancel</Btn>
        <Btn onClick={() => handleSave(false)} disabled={!canSave}>
          <Icons.Check /> {editingPatient ? "Update Patient" : "Save Patient"}
        </Btn>
      </div>
    </div>
  );
};

export default PatientsPage;