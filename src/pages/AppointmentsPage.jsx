import { useState, useEffect, useRef } from 'react';
import Icons from '../components/Icons';
import { Badge, Modal, Btn, Input, Select, Toast, PageHeader, DataTable, TR, TD, RightDrawer } from '../components/UI';
import CalendarView from '../components/CalendarView';
import EncounterWorkflow, { printEncounterSummary } from '../components/EncounterWorkflow';
import { useApp } from '../context/AppContext';
import PrintSlip from './Appointmentslip';
import { triggerPrint } from './PrintSlip';
import { PERMISSIONS } from "../components/permissions";
// import { useLocation } from "react-router-dom";

const API = process.env.REACT_APP_API_BASE_URL;
const getClinicId = () => { try { const u = sessionStorage.getItem("user"); return u ? JSON.parse(u)?.clinic_id : null; } catch { return null; } };
const today = () => new Date().toISOString().slice(0, 10);
const BLANK = { patient_id: "", doctor_id: "", appointment_date: today(), slot_time: "", notes: "", fee: "" };
const CLINIC_OPEN_MIN = 9 * 60;
const CLINIC_CLOSE_MIN = 21 * 60;
const toMinutes = time => {
  if (!time || typeof time !== "string") return NaN;
  const [h, m] = time.split(":").map(Number);
  return Number.isNaN(h) || Number.isNaN(m) ? NaN : h * 60 + m;
};
const isWithinClinicHours = time => {
  const mins = toMinutes(time?.slice(0, 5) ?? time);
  return !Number.isNaN(mins) && mins >= CLINIC_OPEN_MIN && mins < CLINIC_CLOSE_MIN;
};
const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#14b8a6", "#6366f1", "#ec4899", "#0ea5e9", "#22c55e"];
const STATUS_COLORS = { Booked: "#3b82f6", CheckedIn: "#8b5cf6", Completed: "#10b981", Cancelled: "#ef4444" };

export const fmtTime = v => {
  if (!v) return "—";
  const [h, m] = v.slice(0, 5).split(":").map(Number);
  return `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};
const fmtDate = v => v ? v.slice(0, 10).split("-").reverse().join("/") : "—";
const fmt = (v, opts) => v ? new Date(v).toLocaleDateString("en-IN", opts) : "—";



// ─── Doctor Fee Receipt Generator ────────────────────────────────────────────
const generateDCFInvoiceNumber = async (clinicId) => {
  try {
    const res = await fetch(`${API}/bills_next_invoice?clinic_id=${clinicId}&prefix=DCF`);
    const data = await res.json();
    return data.invoice_number || `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-0001`;
  } catch {
    return `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;
  }
};

const storeDCFBill = async (clinicId, apt, patientName, invoiceNumber) => {
  const fee = parseFloat(apt.fee) || 0;

  // Guard: check if a bill for this appointment already exists
  try {
    const check = await fetch(`${API}/billsread?clinic_id=${clinicId}&appointment_id=${apt.id || apt.appointment_id}`);
    const existing = await check.json();
    if (Array.isArray(existing) && existing.some(b => String(b.appointment_id) === String(apt.id || apt.appointment_id))) {
      console.log("Bill already exists for this appointment, skipping insert");
      return true;
    }
  } catch { /* proceed */ }

  try {
    const res = await fetch(`${API}/bills_create_update/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: 0,
        clinic_id: clinicId,
        created_by: "admin",
        patient_id: apt.patient_id ? Number(apt.patient_id) : null,
        patient_name_override: null,
        encounter_id: apt.encounter_id || null,
        chief_complaint: apt.chief_complaint || apt.notes || "Doctor Consultation",
        invoice_number: invoiceNumber,
        sale_invoice_number: null,
        payment_mode: "Cash",
        subtotal: fee,
        gst_percent: 0,
        gst_amount: 0,
        discount_percent: 0,
        discount: 0,
        total_amount: fee,
        appointment_id: apt.id ? Number(apt.id) : null,
      }),
    });
    const data = await res.json();
    if (!res.ok) { console.error("Bill write failed:", data); return false; }
    return true;
  } catch (e) {
    console.error("Bill exception:", e);
    return false;
  }
};



// ─── Doctor Fee Receipt Button ────────────────────────────────────────────────
const DoctorFeeReceiptBtn = ({ apt, patientName, doctorName, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const CLINIC_ID = getClinicId();
  const session = (() => { try { return JSON.parse(sessionStorage.getItem("user")) || {}; } catch { return {}; } })();
  const clinicName = session.clinic_name || "Clinic Management";

  const handleClick = async () => {
    setLoading(true);
    try {
      let fee = parseFloat(apt.fee) || 0;
      let chiefComplaint = apt.notes || "";

      // Fetch from bills — fee is always saved there after encounter completes
      if (!fee || fee <= 0) {
        try {
          const billsRes = await fetch(`${API}/billsread?clinic_id=${CLINIC_ID}&patient_id=${apt.patient_id}`);
          const billsData = await billsRes.json();
          if (Array.isArray(billsData)) {
            // Match by appointment_id first
            const byApt = billsData.find(b => String(b.appointment_id) === String(apt.id));
            // Fallback: most recent bill for this patient
            const byPatient = billsData
              .filter(b => String(b.patient_id) === String(apt.patient_id) && parseFloat(b.total_amount) > 0)
              .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))[0];

            const matched = byApt || byPatient;
            if (matched) {
              fee = parseFloat(matched.total_amount) || 0;
              chiefComplaint = matched.chief_complaint || chiefComplaint;
            }
          }
        } catch { }
      }

      // Also try encounters if bills didn't work
      if (!fee || fee <= 0) {
        try {
          const encRes = await fetch(`${API}/encountersread?clinic_id=${CLINIC_ID}&patient_id=${apt.patient_id}`);
          const encData = await encRes.json();
          if (Array.isArray(encData)) {
            const byApt = encData.find(e => String(e.appointment_id) === String(apt.id));
            const byPatient = encData
              .filter(e => String(e.patient_id) === String(apt.patient_id))
              .sort((a, b) => new Date(b.visit_date || 0) - new Date(a.visit_date || 0))[0];
            const matched = byApt || byPatient;
            fee = parseFloat(matched?.fee) || parseFloat(matched?.doctor_fee) || 0;
          }
        } catch { }
      }

      if (!fee || fee <= 0) {
        alert("No fee found. Please complete the encounter and set a fee first.");
        return;
      }

      const aptWithFee = { ...apt, fee, notes: chiefComplaint };
      const invoiceNumber = await generateDCFInvoiceNumber(CLINIC_ID);
      // Don't store bill again — it's already saved during encounter Complete
      triggerPrint({
        invoice_number: invoiceNumber,
        total_amount: fee,
        subtotal: fee,
        doctor_name: doctorName,
        slot_time: fmtTime(apt.slot_time),
        created_date: apt.appointment_date,
        patient_id: apt.patient_id,
        chief_complaint: chiefComplaint || "Doctor Consultation",
      }, patientName);
      onSuccess?.("Doctor fee receipt printed");
    } catch (e) {
      alert("Failed to generate receipt. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      title="Doctor Fee Receipt"
      onClick={handleClick}
      disabled={loading}
      className="p-1.5 hover:bg-purple-50 hover:text-purple-600 rounded-lg text-slate-400 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" strokeLinecap="round" strokeLinejoin="round" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h4" />
        </svg>
      )}
    </button>
  );
};

// ─── Patient Encounters Modal ─────────────────────────────────────────────────
const PatientEncountersModal = ({ open, onClose, patientId, patientName, doctors }) => {
  const CLINIC_ID = getClinicId();
  const [encounters, setEncounters] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !patientId) return;
    setLoading(true);
    fetch(`${API}/encountersread?clinic_id=${CLINIC_ID}&patient_id=${patientId}`)
      .then(r => r.json())
      .then(d => setEncounters(Array.isArray(d) ? d.filter(e => String(e.patient_id) === String(patientId)) : []))
      .catch(() => setEncounters([]))
      .finally(() => setLoading(false));
  }, [open, patientId]);

  if (!open) return null;
  const getDoctorName = id => doctors.find(d => String(d.id) === String(id))?.name || `Dr. #${id}`;

  return (
    <div className="fixed inset-0 z-[990] flex items-center justify-center bg-black/40" style={{ backdropFilter: "blur(3px)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">Encounters — <span className="text-teal-600">{patientName}</span></h2>
            <p className="text-xs text-slate-400 mt-0.5">{loading ? "Loading..." : `${encounters.length} encounter${encounters.length !== 1 ? "s" : ""} found`}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20"><p className="text-sm text-slate-400">Loading encounters...</p></div>
          ) : encounters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <p className="text-sm font-medium text-slate-600">No encounters found</p>
              <p className="text-xs text-slate-400 mt-1">This patient has no recorded encounters yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 z-10">
                <tr>{["Date", "Doctor", "Chief Complaint", "Patient Notes", "Follow-up"].map(col => (
                  <th key={col} className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-gray-100">{col}</th>
                ))}</tr>
              </thead>
              <tbody>
                {encounters.map((enc, i) => (
                  <tr key={enc.id || i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 text-slate-500 text-xs whitespace-nowrap">{fmt(enc.visit_date, { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td className="px-6 py-3.5 font-medium text-slate-700 whitespace-nowrap">{getDoctorName(enc.doctor_id)}</td>
                    <td className="px-6 py-3.5 font-semibold text-slate-800">{enc.chief_complaint || <span className="text-slate-300">—</span>}</td>
                    <td className="px-6 py-3.5 text-slate-500 max-w-[180px]">
                      {enc.notes ? <span title={enc.notes}>{enc.notes.length > 40 ? enc.notes.slice(0, 40) + "…" : enc.notes}</span> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      {enc.follow_up_date ? <span className="text-teal-600 font-medium">{fmt(enc.follow_up_date, { day: "2-digit", month: "short", year: "numeric" })}</span> : <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
          <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-slate-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
};

const PatientPhoneSelection = ({ patients, value, onChange, onAddNew }) => {
  const [phone, setPhone] = useState("");
  const [showPatients, setShowPatients] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({
    first_name: "", last_name: "", dob: "", gender: "", age: "", email: "",
    blood_group: "", weight: "", bp: "", pulse_rate: "", reference: "", pincode: "", address: ""
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [errors, setErrors] = useState({});

  const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const REFERENCES = ["Friend/Relative", "Google", "Social Media", "Advertisement", "Other"];
  const PINCODES = {
    "500001": ["Abids", "Nampally", "King Koti"],
    "500032": ["Gachibowli", "Raidurg"],
    "500034": ["Banjara Hills", "Jubilee Hills"],
    "500072": ["Kukatpally", "HMT Township"],
    "500081": ["Madhapur", "Hitech City"],
    "500082": ["Somajiguda", "Raj Bhavan Road"],
    "500089": ["Manikonda"],
    // add more as needed
  };

  const filteredPatients = patients.filter(p => p.phone === phone && p.phone);

  const handlePhoneSubmit = () => {
    if (!phone.trim()) return;
    if (!/^\d{10}$/.test(phone)) {
      setErrors({ phone: "Phone must be exactly 10 digits" });
      return;
    }
    setErrors({});
    setShowPatients(true);
  };

  const handleAddNew = async () => {
    if (!newPatientForm.first_name.trim() || !newPatientForm.last_name.trim() || !newPatientForm.gender) {
      setErrors({ form: "First name, last name and gender are required" });
      return;
    }

    const computedAge = newPatientForm.dob
      ? Math.floor((new Date() - new Date(newPatientForm.dob)) / (365.25 * 24 * 60 * 60 * 1000))
      : parseInt(newPatientForm.age);

    if (!computedAge && computedAge !== 0) {
      setErrors({ form: "Age is required (enter manually or select DOB)" });
      return;
    }

    // Safe duplicate check — guard against null values
    const isDuplicate = patients.some(p =>
      (p.first_name || "").toLowerCase() === newPatientForm.first_name.toLowerCase().trim() &&
      (p.last_name || "").toLowerCase() === newPatientForm.last_name.toLowerCase().trim() &&
      (p.dob || "") === newPatientForm.dob &&
      (p.phone || "") === phone
    );

    if (isDuplicate) {
      setErrors({ form: "A patient with this name and DOB already exists for this phone number" });
      return;
    }

    try {
      const res = await fetch(`${API}/patient_create_update`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinic_id: getClinicId(),
          ...newPatientForm,
          phone: phone,
          dob: newPatientForm.dob || null,
          age: newPatientForm.dob
            ? Math.floor((new Date() - new Date(newPatientForm.dob)) / (365.25 * 24 * 60 * 60 * 1000))
            : newPatientForm.age ? parseInt(newPatientForm.age) : null,
          weight: newPatientForm.weight ? parseFloat(newPatientForm.weight) : null,
          blood_group: newPatientForm.blood_group || null,
          created_by: "admin",
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add patient");

      onAddNew(data.id);
      setShowAddForm(false);
      setNewPatientForm({
        first_name: "", last_name: "", dob: "", gender: "", age: "", email: "",
        blood_group: "", weight: "", bp: "", pulse_rate: "", reference: "", pincode: "", address: ""
      });
    } catch (e) {
      setErrors({ form: e.message });
    }
  };

  return (
    <div className="space-y-4">
      {!showPatients ? (
        <>
          <div style={{ position: "relative" }}>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Patient Phone Number</label>
            <input
              type="text" value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="Enter 10-digit phone number"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400"
              autoComplete="off"
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}

            {/* Dropdown suggestions while typing */}
            {phone.length >= 3 && (() => {
              const suggestions = patients.filter(p =>
                (p.phone || "").includes(phone)
              );
              if (suggestions.length === 0) return null;
              return (
                <div style={{
                  position: "absolute", zIndex: 999, top: "calc(100% + 4px)",
                  left: 0, right: 0, background: "#fff",
                  border: "1px solid #e5e7eb", borderRadius: 12,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.1)", overflow: "hidden"
                }}>
                  <div style={{ maxHeight: 220, overflowY: "auto" }}>
                    {suggestions.map(p => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setPhone(p.phone);
                          setErrors({});
                          setShowPatients(true);
                        }}
                        className="px-4 py-2.5 text-sm cursor-pointer hover:bg-teal-50 flex justify-between items-center"
                      >
                        <span className="font-medium text-gray-800">{p.first_name} {p.last_name}</span>
                        <span className="text-xs text-gray-400">{p.phone}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
          <Btn onClick={handlePhoneSubmit} disabled={!phone || phone.length !== 10}>Add Patient</Btn>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-700">Patients with phone: {phone}</h3>
            <button onClick={() => { setShowPatients(false); setPhone(""); }} className="text-xs text-teal-600 hover:text-teal-700">Change phone</button>
          </div>

          {filteredPatients.length > 0 && (
            <div className="space-y-2">
              {filteredPatients.map(p => (
                <div key={p.id} onClick={() => onChange(p.id)}
                  className={`p-3 border rounded-xl cursor-pointer transition-colors ${value === p.id ? "border-teal-400 bg-teal-50" : "border-gray-200 hover:border-teal-300"}`}>
                  <div className="font-medium text-slate-800">{p.first_name} {p.last_name}</div>
                  <div className="text-xs text-slate-500">DOB: {p.dob ? new Date(p.dob).toLocaleDateString() : "—"}</div>
                </div>
              ))}
            </div>
          )}

          {filteredPatients.length === 0 && !showAddForm && (
            <p className="text-sm text-slate-500">No patients found with this phone number.</p>
          )}

          {!showAddForm && (
            <div className="border-t pt-4">
              <button onClick={() => setShowAddForm(true)}
                className="w-full py-2 px-4 border border-teal-400 text-teal-600 rounded-xl hover:bg-teal-50 transition-colors text-sm font-medium">
                + Add New Patient
              </button>
            </div>
          )}

          {showAddForm && (
            <div className="border border-gray-100 rounded-2xl p-4 space-y-3 bg-gray-50">
              <h4 className="text-sm font-semibold text-slate-700 mb-1">Add New Patient</h4>

              {/* Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">First Name <span className="text-red-500">*</span></label>
                  <input placeholder="First name" value={newPatientForm.first_name}
                    onChange={e => setNewPatientForm(f => ({ ...f, first_name: e.target.value.replace(/[^a-zA-Z\s]/g, "") }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Last Name <span className="text-red-500">*</span></label>
                  <input placeholder="Last name" value={newPatientForm.last_name}
                    onChange={e => setNewPatientForm(f => ({ ...f, last_name: e.target.value.replace(/[^a-zA-Z\s]/g, "") }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 bg-white" />
                </div>
              </div>

              {/* Gender + DOB */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Gender <span className="text-red-500">*</span></label>
                  <select value={newPatientForm.gender}
                    onChange={e => setNewPatientForm(f => ({ ...f, gender: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 bg-white">
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date of Birth</label>
                  <input type="date" value={newPatientForm.dob} max={today()}
                    onChange={e => setNewPatientForm(f => ({ ...f, dob: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 bg-white" />
                </div>
              </div>

              {/* Blood Group + Weight */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Blood Group</label>
                  <select value={newPatientForm.blood_group}
                    onChange={e => setNewPatientForm(f => ({ ...f, blood_group: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 bg-white">
                    <option value="">Select blood group</option>
                    {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Weight (kg)</label>
                  <input type="number" placeholder="e.g. 65" value={newPatientForm.weight} min={1} max={300}
                    onChange={e => setNewPatientForm(f => ({ ...f, weight: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 bg-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Age</label>
                  <input
                    type="number"
                    min={0}
                    max={150}
                    value={newPatientForm.dob
                      ? Math.floor((new Date() - new Date(newPatientForm.dob)) / (365.25 * 24 * 60 * 60 * 1000))
                      : newPatientForm.age}
                    placeholder="Enter age or select DOB"
                    onChange={e => setNewPatientForm(f => ({ ...f, age: e.target.value, dob: "" }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Reference</label>
                  <select value={newPatientForm.reference}
                    onChange={e => setNewPatientForm(f => ({ ...f, reference: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 bg-white">
                    <option value="">Select reference</option>
                    {REFERENCES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              {/* BP + Pulse */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">BP (mmHg)</label>
                  <input placeholder="e.g. 120/80" value={newPatientForm.bp} maxLength={7}
                    onChange={e => setNewPatientForm(f => ({ ...f, bp: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Pulse Rate (bpm)</label>
                  <input type="number" placeholder="e.g. 72" value={newPatientForm.pulse_rate} min={30} max={250}
                    onChange={e => setNewPatientForm(f => ({ ...f, pulse_rate: e.target.value.replace(/\D/g, "").slice(0, 3) }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 bg-white" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                <input type="email" placeholder="email@example.com" value={newPatientForm.email}
                  onChange={e => setNewPatientForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 bg-white" />
              </div>

              {/* Pincode + Area */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Pincode</label>
                  <select value={newPatientForm.pincode}
                    onChange={e => setNewPatientForm(f => ({ ...f, pincode: e.target.value, address: "" }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 bg-white">
                    <option value="">Select pincode</option>
                    {Object.keys(PINCODES).map(pin => <option key={pin} value={pin}>{pin}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Area</label>
                  <select value={newPatientForm.address} disabled={!newPatientForm.pincode}
                    onChange={e => setNewPatientForm(f => ({ ...f, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 bg-white disabled:bg-gray-100 disabled:text-gray-400">
                    <option value="">{newPatientForm.pincode ? "Select area" : "Select pincode first"}</option>
                    {newPatientForm.pincode && PINCODES[newPatientForm.pincode]?.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
              </div>

              {errors.form && (
                <p className="text-red-500 text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2">{errors.form}</p>
              )}

              <div className="flex gap-2 pt-1">
                <Btn onClick={handleAddNew} size="sm"><Icons.Check /> Add Patient</Btn>
                <Btn onClick={() => { setShowAddForm(false); setErrors({}); }} variant="secondary" size="sm">Cancel</Btn>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
// ─── Patient Dropdown ─────────────────────────────────────────────────────────
const PatientDropdown = ({ patients, value, onChange }) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const sorted = [...patients].sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`));
  const filtered = sorted.filter(p => {
    const q = query.toLowerCase();
    return `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) || (p.phone || p.mobile || "").includes(q);
  });
  const selected = patients.find(p => p.id === value);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">Patient</label>
      <div onClick={() => { setOpen(o => !o); setQuery(""); }}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm cursor-pointer flex justify-between items-center"
        style={{ background: "#fff", minHeight: 42 }}>
        <span style={{ color: selected ? "#111827" : "#9ca3af" }}>
          {selected ? `${selected.first_name} ${selected.last_name}${selected.phone || selected.mobile ? ` · ${selected.phone || selected.mobile}` : ""}` : "Select patient…"}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
      </div>
      {open && (
        <div style={{ position: "absolute", zIndex: 999, top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", overflow: "hidden" }}>
          <div style={{ padding: "8px 10px", borderBottom: "1px solid #f3f4f6" }}>
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name or phone…" className="w-full text-sm outline-none px-2 py-1" style={{ background: "transparent" }} />
          </div>
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {filtered.length === 0
              ? <div className="text-sm text-gray-400 px-4 py-3">No patients found</div>
              : filtered.map(p => (
                <div key={p.id} onClick={() => { onChange(p.id); setOpen(false); setQuery(""); }}
                  className="px-4 py-2.5 text-sm cursor-pointer hover:bg-teal-50 flex justify-between items-center"
                  style={{ background: p.id === value ? "#f0fdfa" : undefined }}>
                  <span className="font-medium text-gray-800">{p.first_name} {p.last_name}</span>
                  {(p.phone || p.mobile) && <span className="text-xs text-gray-400">{p.phone || p.mobile}</span>}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Stats ────────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, total, color, bgColor, icon, footer, pulse }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 14, padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 500, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{label}</p>
          <p style={{ fontSize: 28, fontWeight: 600, color: "#111827", lineHeight: 1.1, marginTop: 4 }}>{value}</p>
        </div>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: bgColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
      </div>
      <div style={{ height: 5, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.8s ease" }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b7280" }}>
        {pulse && <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0, animation: "aptPulse 2s infinite" }} />}
        <span>{footer}</span>
      </div>
    </div>
  );
};

const AppointmentStatsBar = ({ apts }) => {
  const todayApts = apts.filter(a => a.appointment_date?.slice(0, 10) === today());
  const total = todayApts.length;
  const booked = todayApts.filter(a => a.status === "Booked").length;
  const checkedIn = todayApts.filter(a => a.status === "CheckedIn").length;
  const closed = todayApts.filter(a => a.status === "Cancelled").length;
  const completed = todayApts.filter(a => a.status === "Completed").length;
  const inQueue = booked + checkedIn;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <>
      <style>{`@keyframes aptPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.35)}}`}</style>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12, marginBottom: 20 }}>
        <StatCard label="In Queue" value={inQueue} total={total} color="#639922" bgColor="#EAF3DE" pulse
          footer={`${booked} booked · ${checkedIn} checked in`}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#639922" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>} />
        <StatCard label="Completed Today" value={completed} total={total} color="#1D9E75" bgColor="#E1F5EE"
          footer={`${completionRate}% of today's appointments`}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>} />
        <StatCard label="Cancelled" value={closed} total={total} color="#ef4444" bgColor="#fee2e2"
          footer={`${total} total today · ${inQueue} still pending`}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>} />
      </div>
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const AppointmentsPage = () => {
  const { showLoading, hideLoading, user, can, pageParams, setPageParams } = useApp();
  const [apts, setApts] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [view, setView] = useState("table");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [encounterApt, setEncounterApt] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [viewEncounters, setViewEncounters] = useState(null);
  const tokenColors = useRef({});
  const CLINIC_ID = getClinicId();
  const [lockedPatient, setLockedPatient] = useState(null);

  const getTokenColor = id => {
    if (!tokenColors.current[id]) tokenColors.current[id] = COLORS[Object.keys(tokenColors.current).length % COLORS.length];
    return tokenColors.current[id];
  };

  // Sort doctors by display name
  const sortedDoctors = [...doctors].sort((a, b) => {
    const nameA = a.name || a.full_name || `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim();
    const nameB = b.name || b.full_name || `${b.first_name ?? ""} ${b.last_name ?? ""}`.trim();
    return nameA.localeCompare(nameB);
  });

  // Helper functions to get patient and doctor labels by ID
  const patientLabel = (patientId) => {
    const patient = patients.find(p => String(p.id) === String(patientId));
    return patient ? `${patient.first_name} ${patient.last_name}` : "Unknown Patient";
  };

  const doctorLabel = (doctorId) => {
    const doctor = doctors.find(d => String(d.id) === String(doctorId));
    return doctor ? (doctor.name || doctor.full_name || `${doctor.first_name ?? ""} ${doctor.last_name ?? ""}`.trim()) : "Unknown Doctor";
  };

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 3500); };
  const closeModal = () => {
    setShowModal(false);
    setEditItem(null);
    setForm(BLANK);
    setLockedPatient(null);
  };

  const fetchJSON = async url => { const r = await fetch(url); return r.json(); };

  const fetchApts = async () => {
    const isDoctor = can(PERMISSIONS.DASH_OWN_PATIENTS);
    const doctorFilter = isDoctor ? `&doctor_id=${user?.id}` : "";
    const d = await fetchJSON(`${API}/appointmentsread?clinic_id=${CLINIC_ID}${doctorFilter}`);
    setApts(Array.isArray(d) ? d.sort((a, b) => new Date(b.appointment_date + ' ' + b.slot_time) - new Date(a.appointment_date + ' ' + a.slot_time)) : []);
  };

  const fetchPatients = async () => {
    const isDoctor = can(PERMISSIONS.DASH_OWN_PATIENTS);
    const doctorFilter = isDoctor ? `&doctor_id=${user?.id}` : "";
    const d = await fetchJSON(`${API}/patient_read?clinic_id=${CLINIC_ID}${doctorFilter}`);
    setPatients(Array.isArray(d) ? d : []);
  };

  useEffect(() => {
    const load = async () => {
      try {
        showLoading("Loading appointments...", "appointments");
        const isDoctor = can(PERMISSIONS.DASH_OWN_PATIENTS);
        const doctorFilter = isDoctor ? `&doctor_id=${user?.id}` : "";

        const [aptsData, patientsData, doctorsData] = await Promise.all([
          fetchJSON(`${API}/appointmentsread?clinic_id=${CLINIC_ID}${doctorFilter}`),
          fetchJSON(`${API}/patient_read?clinic_id=${CLINIC_ID}${doctorFilter}`),
          fetchJSON(`${API}/doctorsread`),
        ]);

        setApts(Array.isArray(aptsData)
          ? aptsData.sort((a, b) => new Date(b.appointment_date + ' ' + b.slot_time) - new Date(a.appointment_date + ' ' + a.slot_time))
          : []);
        setPatients(Array.isArray(patientsData) ? patientsData : []);
        setDoctors(Array.isArray(doctorsData) ? doctorsData : []);

        const params = new URLSearchParams(window.location.search);
        const patientIdFromUrl = params.get("openBookFor");
        const incoming = patientIdFromUrl ? { patient_id: Number(patientIdFromUrl) } : null;
        if (incoming?.patient_id) {
          setEditItem(null);
          setForm({ ...BLANK, patient_id: incoming.patient_id });
          setLockedPatient({ id: incoming.patient_id });
          setShowModal(true);
          window.history.replaceState({}, "", "/appointments");
        } else if (pageParams?.openBookFor) {
          const patientId = Number(pageParams.openBookFor);
          if (patientId) {
            setEditItem(null);
            setForm({ ...BLANK, patient_id: patientId });
            setLockedPatient({ id: patientId });
            setShowModal(true);
            setPageParams({});
          }
        }
      } catch (err) {
        console.error("Failed to load appointments data", err);
      } finally {
        hideLoading();
      }
    };
    load();
  }, []);


  const getAvailableSlots = (doctorId, date) => {
    if (!doctorId || !date) return [];

    // Generate all possible slots from 9:00 AM to 9:00 PM in 15-minute intervals
    const slots = [];
    for (let hour = 9; hour < 21; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        slots.push(timeString);
      }
    }

    // Filter out booked slots for this doctor on this date
    const bookedSlots = apts
      .filter(a =>
        String(a.doctor_id) === String(doctorId) &&
        a.appointment_date === date &&
        a.status !== "Cancelled"
      )
      .map(a => a.slot_time?.slice(0, 5));

    return slots.filter(slot => !bookedSlots.includes(slot));
  };

  const handleSave = async () => {
    const isDuplicate = apts.some(a =>
      String(a.doctor_id) === String(form.doctor_id) &&
      a.appointment_date?.slice(0, 10) === form.appointment_date?.slice(0, 10) &&
      a.slot_time?.slice(0, 5) === form.slot_time?.slice(0, 5) &&
      a.status !== "Cancelled" &&
      (!editItem || a.id !== editItem.id)
    );

    if (!form.notes || !form.notes.trim()) {
      showToast("Patient notes are required");
      return;
    }

    if (!form.fee || Number(form.fee) <= 0) {
      showToast("Doctor fee is required and must be greater than zero");
      return;
    }

    if (!isWithinClinicHours(form.slot_time?.slice(0, 5) ?? form.slot_time)) {
      showToast("Clinic is open only from 09:00 to 21:00");
      return;
    }

    if (isDuplicate) {
      showToast("This doctor already has an appointment at this time slot");
      return;
    }

    try {
      const res = await fetch(`${API}/appointment_create_update`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editItem ? { id: editItem.id } : {}),
          clinic_id: CLINIC_ID,
          ...form,
          patient_id: Number(form.patient_id),
          doctor_id: Number(form.doctor_id),
          fee: form.fee ? parseFloat(form.fee) : 0,
          status: editItem ? editItem.status : "Booked",
          token_number: editItem ? editItem.token_number : 1,
          is_active: true,
          user: "admin",
        }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Failed to save"); return; }

      fetchApts();
      closeModal();
      showToast(editItem ? "Appointment updated" : "Appointment booked");
    } catch { showToast("Server error"); }
  };

  const updateStatus = async (id, status) => {
    const a = apts.find(a => a.id === id);
    await fetch(`${API}/appointment_create_update`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        clinic_id: CLINIC_ID,
        patient_id: Number(a.patient_id),
        doctor_id: Number(a.doctor_id),   // ← force integer
        appointment_date: a.appointment_date,
        slot_time: a.slot_time,
        status,
        token_number: a.token_number,
        notes: a.notes,
        fee: a.fee,
        is_active: true,
        user: "admin"
      }),
    }).catch(console.error);
    await fetchApts();
  };

  const handleDelete = async id => {
    try {
      await fetch(`${API}/appointment_delete`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, modified_by: "admin" }) });
      fetchApts(); showToast("Appointment deleted");
    } catch { showToast("Delete failed"); }
    finally { setDeleteConfirm(null); }
  };

  const filtered = apts.filter(a => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [a.patient_name || patientLabel(a.patient_id), a.doctor_name || doctorLabel(a.doctor_id),
    a.status === "Cancelled" ? "Closed" : a.status, fmtDate(a.appointment_date), fmtTime(a.slot_time), a.notes
    ].some(f => f?.toLowerCase().includes(q));
  });

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      <PageHeader subtitle="Manage appointment slots" actions={
        <div className="flex items-center gap-2">
          <div className="flex bg-white border border-gray-200 rounded-xl p-1">
            {["table", "calendar"].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${view === v ? "text-white" : "text-slate-500"}`}
                style={view === v ? { background: "#0E6C68" } : {}}>
                {v}
              </button>
            ))}
          </div>
          

          <Btn onClick={() => { setEditItem(null); setForm(BLANK); setShowModal(true); }}><Icons.Plus /> Book Appointment</Btn>
        </div>
      } />

      <AppointmentStatsBar apts={apts} />

      {view === "table" && (
        <DataTable title="Appointment List" subtitle={`${apts.length} total appointments`}
          search={search} onSearch={v => { setSearch(v); setCurrentPage(1); }} searchPlaceholder="Search patient, doctor, status…"
          columns={["Token", "Patient", "Doctor", "Date", "Time", "Patient Notes", "Status", "Actions"]}
          rows={paginated.map(a => (
            <TR key={a.id}>
              <TD><div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: getTokenColor(a.id) }}>{a.token_number}</div></TD>
              <TD bold>{a.patient_name || patientLabel(a.patient_id)}</TD>
              <TD>{a.doctor_name || doctorLabel(a.doctor_id)}</TD>
              <TD>{fmtDate(a.appointment_date)}</TD>
              <TD>{fmtTime(a.slot_time)}</TD>
              <TD muted>{a.notes}</TD>
              <TD><Badge status={a.status === "Cancelled" ? "Closed" : a.status} /></TD>
              <TD>
                <div className="flex gap-1 items-center">
                  {/* View Encounters */}
                  <button title="View Encounters" onClick={() => setViewEncounters({ patientId: a.patient_id, patientName: a.patient_name || patientLabel(a.patient_id) })}
                    className="p-1.5 hover:bg-teal-50 hover:text-teal-600 rounded-lg text-slate-400 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </button>


                  {/* Encounter Slip */}        {/* 👈 add here */}
                  <PrintSlip
                    apt={a}
                    patientName={a.patient_name || patientLabel(a.patient_id)}
                    doctorName={a.doctor_name || doctorLabel(a.doctor_id)}
                    patients={patients}
                  />

                  {/* Print Encounter Summary */}

                  {a.status === "Completed" && (
                    <button
                      title="Print Encounter Summary"
                      className="p-1.5 hover:bg-green-50 hover:text-green-600 rounded-lg text-slate-400 transition-colors"
                      onClick={async () => {
                        try {
                          const encRes = await fetch(`${API}/encountersread?clinic_id=${CLINIC_ID}&patient_id=${a.patient_id}`);
                          const encData = await encRes.json();
                          const enc = encData.find(e => String(e.appointment_id) === String(a.id))
                            || [...encData].sort((x, y) => new Date(y.visit_date || 0) - new Date(x.visit_date || 0))[0];
                          if (!enc) { alert("No encounter found."); return; }

                          let prescriptions = [];
                          try {
                            const rxRes = await fetch(`${API}/prescriptionsread?clinic_id=${CLINIC_ID}&encounter_id=${enc.id}`);
                            console.log("Status:", rxRes.status);
                            const rxData = await rxRes.json();
                            console.log("enc.id:", enc.id);
                            console.log("prescriptions:", rxData);
                            prescriptions = Array.isArray(rxData) ? rxData : [];
                          } catch (e) {
                            console.log("Error:", e);
                          }

                          printEncounterSummary({
                            patientName: a.patient_name || patientLabel(a.patient_id),
                            doctorName: a.doctor_name || doctorLabel(a.doctor_id),
                            encounter: enc,
                            prescriptions,
                          });
                        } catch { alert("Failed to print."); }
                      }}
                    >
                      <Icons.Download />
                    </button>
                  )}

                  {/* Check In - REMOVED */}
                  {/* {a.status === "Booked" && <Btn size="sm" onClick={() => updateStatus(a.id, "CheckedIn")}>Check In</Btn>} */}

                  {/* Encounter - Show for Booked status directly */}
                  {a.status === "Booked" && (
                    <Btn size="sm" onClick={() => setEncounterApt({ ...a, patientBP: patients.find(p => p.id === a.patient_id)?.bp || "", patient_name: a.patient_name || patientLabel(a.patient_id), })}>
                      <Icons.Encounter /> Encounter
                    </Btn>
                  )}


                  {/* Appointment Slip (print) */}
                  {a.status === "CheckedIn" && (
                    <PrintSlip apt={a} patientName={a.patient_name || patientLabel(a.patient_id)} doctorName={a.doctor_name || doctorLabel(a.doctor_id)} patients={patients} />
                  )}

                  {/* ── Doctor Fee Receipt ── shown for Booked, CheckedIn, Completed */}
                  {(a.status === "Booked" || a.status === "CheckedIn" || a.status === "Completed") && (
                    <DoctorFeeReceiptBtn
                      apt={a}
                      patientName={a.patient_name || patientLabel(a.patient_id)}
                      doctorName={a.doctor_name || doctorLabel(a.doctor_id)}
                      onSuccess={showToast}
                    />
                  )}

                  {/* Close */}
                  {a.status === "CheckedIn" && (
                    <Btn size="sm" variant="secondary" onClick={() => updateStatus(a.id, "Cancelled")}>Close</Btn>
                  )}

                  {/* Delete */}
                  <button onClick={() => setDeleteConfirm(a.id)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg text-slate-400"><Icons.Trash /></button>
                </div>
              </TD>
            </TR>
          ))}
          currentPage={currentPage} totalPages={Math.ceil(filtered.length / pageSize)} onPageChange={setCurrentPage}
          totalItems={filtered.length} pageSize={pageSize} onPageSizeChange={s => { setPageSize(s); setCurrentPage(1); }}
        />
      )}

      {view === "calendar" && (
        <CalendarView apts={apts} tokenColors={tokenColors} statusColor={s => STATUS_COLORS[s] || "#0E6C68"} patientName={patientLabel} doctorName={doctorLabel} fmtTime={fmtTime} />
      )}

      {/* ── BOOK DRAWER ── */}
      <RightDrawer title="Book Appointment" open={showModal} onClose={closeModal}>
        <div className="h-full flex flex-col">
          <div className="px-8 py-4 bg-gradient-to-r from-teal-50 to-blue-50 border-b border-teal-100">
            <p className="text-sm text-gray-600">Fill in the details to schedule an appointment</p>
          </div>
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-teal-100">
              <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600"><Icons.Calendar /></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Appointment Details</p>
                <p className="text-xs text-gray-400 mt-0.5">Select patient, doctor and schedule</p>
              </div>
            </div>

            {lockedPatient ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Patient</label>
                <div className="w-full px-3 py-2.5 border border-teal-200 bg-teal-50 rounded-xl text-sm flex items-center justify-between" style={{ minHeight: 42 }}>
                  <span className="font-medium text-gray-800">
                    {(() => {
                      const p = patients.find(x => String(x.id) === String(lockedPatient.id));
                      return p ? `${p.first_name} ${p.last_name}${p.phone ? ` · ${p.phone}` : ""}` : `Patient #${lockedPatient.id}`;
                    })()}
                  </span>
                  <span className="text-xs text-teal-600 font-semibold bg-white px-2 py-0.5 rounded-lg border border-teal-200">Pre-filled</span>
                </div>
              </div>
            ) : (
              <PatientPhoneSelection
                patients={patients}
                value={form.patient_id}
                onChange={v => setForm(f => ({ ...f, patient_id: v }))}
                onAddNew={(newPatientId) => {
                  setForm(f => ({ ...f, patient_id: newPatientId }));
                  fetchPatients(); // Refresh patients list
                }}
              />
            )}

            <Select label="Doctor" value={form.doctor_id} onChange={v => setForm(f => ({ ...f, doctor_id: v }))}
              options={sortedDoctors.map(d => ({ value: d.id, label: d.name || d.full_name || `${d.first_name ?? ""} ${d.last_name ?? ""}`.trim() }))} />

            <Input label="Appointment Date" type="date" value={form.appointment_date} min={today()}
              onChange={v => setForm(f => ({ ...f, appointment_date: v, slot_time: "" }))} />

            {/* ── Slot Time Grid Picker ── */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-medium text-slate-700">Select Time Slot</label>
                <span className="text-xs text-slate-400">(15-min sessions)</span>
                <span className="text-red-500">*</span>
              </div>

              {!form.doctor_id || !form.appointment_date ? (
                <p className="text-xs text-slate-400 py-3">
                  {!form.doctor_id ? "Select doctor first" : "Select date first"}
                </p>
              ) : (() => {
                const isToday = form.appointment_date === today();
                const nowMins = isToday ? new Date().getHours() * 60 + new Date().getMinutes() : 0;

                // All slots 9am–9pm in 15-min intervals
                const allSlots = [];
                for (let h = 9; h < 21; h++) {
                  for (let m = 0; m < 60; m += 15) {
                    allSlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
                  }
                }

                // Booked slots for this doctor+date
                const bookedSlots = new Set(
                  apts
                    .filter(a =>
                      String(a.doctor_id) === String(form.doctor_id) &&
                      a.appointment_date === form.appointment_date &&
                      a.status !== "Cancelled" &&
                      (!editItem || a.id !== editItem.id)
                    )
                    .map(a => a.slot_time?.slice(0, 5))
                );

                // Group by hour
                const byHour = {};
                allSlots.forEach(slot => {
                  const [h] = slot.split(':').map(Number);
                  if (!byHour[h]) byHour[h] = [];
                  byHour[h].push(slot);
                });

                const fmtHour = h => {
                  const h12 = h % 12 || 12;
                  return `${h12}:00 ${h >= 12 ? 'PM' : 'AM'}`;
                };
                const fmtSlot = slot => {
                  const [h, m] = slot.split(':').map(Number);
                  return `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                };

                return (
                  <>
                    {/* Legend */}
                    <div className="flex items-center gap-4 mb-3">
                      {[
                        { color: "bg-teal-600", label: "Available" },
                        { color: "bg-red-100 border border-red-200", label: "Booked" },
                        { color: "bg-gray-100 border border-gray-200", label: "Unavailable" },
                      ].map(({ color, label }) => (
                        <div key={label} className="flex items-center gap-1.5">
                          <div className={`w-3 h-3 rounded-full ${color}`} />
                          <span className="text-xs text-slate-500">{label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border border-gray-200 rounded-2xl overflow-hidden">
                      <div className="max-h-48 overflow-y-auto">
                        {Object.entries(byHour).map(([hour, slots]) => {
                          const h = Number(hour);
                          // Skip entire hour row if all slots are past (today only)
                          const allPast = isToday && slots.every(s => {
                            const [sh, sm] = s.split(':').map(Number);
                            return sh * 60 + sm <= nowMins;
                          });
                          if (allPast) return null;

                          return (
                            <div key={hour} className="flex items-center border-b border-gray-100 last:border-0 px-3 py-2 gap-3">
                              <div className="w-16 shrink-0 text-xs font-medium text-slate-400">{fmtHour(h)}</div>
                              <div className="flex flex-wrap gap-2">
                                {slots.map(slot => {
                                  const [sh, sm] = slot.split(':').map(Number);
                                  const slotMins = sh * 60 + sm;
                                  const isPast = isToday && slotMins <= nowMins;
                                  const isBooked = bookedSlots.has(slot);
                                  const isSelected = form.slot_time === slot;

                                  if (isPast) return null; // hide past slots

                                  return (
                                    <button
                                      key={slot}
                                      type="button"
                                      disabled={isBooked}
                                      onClick={() => !isBooked && setForm(f => ({ ...f, slot_time: slot }))}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${isSelected
                                        ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                                        : isBooked
                                          ? "bg-red-50 text-red-300 border-red-100 line-through cursor-not-allowed"
                                          : "bg-white text-slate-700 border-gray-200 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50"
                                        }`}
                                    >
                                      {fmtSlot(slot)}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {form.slot_time && (
                      <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-teal-50 border border-teal-100 rounded-xl">
                        <div className="w-2 h-2 rounded-full bg-teal-500" />
                        <span className="text-xs text-teal-700 font-medium">
                          Selected: {(() => {
                            const [h, m] = form.slot_time.split(':').map(Number);
                            return `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
                          })()}
                        </span>
                        <button onClick={() => setForm(f => ({ ...f, slot_time: "" }))}
                          className="ml-auto text-teal-400 hover:text-teal-600 text-xs">✕ Clear</button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Patient Notes <span className="text-red-500">*</span>
              </label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={3} placeholder="Reason for visit…"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Doctor Fee (₹) <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm select-none">₹</span>
                  <input type="number" min="0" value={form.fee || ""} onChange={e => setForm(f => ({ ...f, fee: e.target.value }))}
                    placeholder="0.00" className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400" />
                </div>
                {["100", "200", "500"].map(amt => (
                  <button key={amt} type="button" onClick={() => setForm(f => ({ ...f, fee: amt }))}
                    className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${form.fee === amt ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-500 border-gray-200 hover:border-teal-400 hover:text-teal-600"}`}>
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <Btn variant="secondary" onClick={closeModal}>Cancel</Btn>
            <Btn onClick={handleSave} disabled={!form.patient_id || !form.doctor_id || !form.appointment_date || !form.slot_time}>
              <Icons.Check /> Book Appointment
            </Btn>
          </div>
        </div>
      </RightDrawer>

      {/* ── DELETE CONFIRM ── */}
      {deleteConfirm && (
        <Modal title="Delete Appointment" onClose={() => setDeleteConfirm(null)}>
          <p className="text-sm text-slate-600 mb-6">Are you sure you want to delete this appointment? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Btn variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Btn>
            <Btn onClick={() => handleDelete(deleteConfirm)} style={{ background: "#ef4444" }}><Icons.Trash /> Delete</Btn>
          </div>
        </Modal>
      )}

      {/* ── ENCOUNTER WORKFLOW ── */}
      {encounterApt && (
        <EncounterWorkflow open onClose={() => setEncounterApt(null)} appointment={encounterApt}
          onComplete={async () => { await updateStatus(encounterApt.id, "Completed"); setEncounterApt(null); showToast("Encounter completed!"); }}
        />
      )}

      {/* ── PATIENT ENCOUNTERS MODAL ── */}
      <PatientEncountersModal open={!!viewEncounters} onClose={() => setViewEncounters(null)}
        patientId={viewEncounters?.patientId} patientName={viewEncounters?.patientName} doctors={doctors} />

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AppointmentsPage;