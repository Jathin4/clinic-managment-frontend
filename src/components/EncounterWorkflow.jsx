import { useState, useEffect, useRef, useCallback } from "react";
import Icons from "./Icons";
import { RightDrawer, Btn, Input, Select, Toast, Modal } from "./UI";

const API_BASE = process.env.REACT_APP_API_BASE_URL;

const getClinicId = () => {
  try { return JSON.parse(sessionStorage.getItem("user"))?.clinic_id ?? null; }
  catch { return null; }
};

const Required = () => <span className="text-red-500">*</span>;

// ── REMOVED "diagnoses" and "previous" from TABS ──────────────────────────────
const TABS = ["encounter", "prescriptions"];
const TAB_ICONS = {
  encounter: Icons.Encounter,
  prescriptions: Icons.Prescription,
};

// ── Debounce hook ─────────────────────────────────────────────────────────────
const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debouncedValue;
};

// ── Generic Searchable dropdown ───────────────────────────────────────────────
const SearchableSelect = ({ label, value, options = [], onChange, placeholder = "Select..." }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );
  const selected = options.find(o => String(o.value) === String(value));
  const pick = (v) => { onChange(v); setOpen(false); setSearch(""); };

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white flex items-center justify-between focus:outline-none focus:border-teal-400">
        <span className={selected ? "text-slate-800" : "text-slate-400"}>
          {selected ? selected.label : placeholder}
        </span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-teal-400" />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0
              ? <p className="text-xs text-slate-400 text-center py-4">No results</p>
              : filtered.map(o => (
                <button key={o.value} type="button" onClick={() => pick(o.value)}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-teal-50 hover:text-teal-700
                      ${String(o.value) === String(value) ? "bg-teal-50 text-teal-700 font-medium" : "text-slate-700"}`}>
                  {o.label}
                </button>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
};


// ── Inventory / Medicine searchable dropdown ──────────────────────────────────
const MedicineSelect = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value || "");
  const [allMedicines, setAllMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    const userObj = userData ? JSON.parse(userData) : {};
    const clinicId = userObj.clinic_id;

    setLoading(true);
    fetch(`${API_BASE}/inventory_transactions_read?clinic_id=${clinicId}`)
      .then(r => r.json())
      .then(d => {
        if (!Array.isArray(d)) { setAllMedicines([]); return; }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const seen = new Set();
        const unique = d.filter(m => {
          if (m.expiry_date) {
            const expiry = new Date(m.expiry_date);
            if (expiry < today) return false;
          }
          const key = `${(m.medicine_name || m.name || "").toLowerCase()}_${(m.dosage || "").toLowerCase()}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setAllMedicines(unique);
      })
      .catch(() => setAllMedicines([]))
      .finally(() => setLoading(false));
  }, []);

  const results = search.trim()
    ? allMedicines.filter(m =>
      (m.medicine_name || m.name || "").toLowerCase().includes(search.toLowerCase())
    )
    : allMedicines;

  const pick = (medicine) => {
    const name = medicine.medicine_name || medicine.name;
    onChange(name, medicine);
    setSearch(name);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-slate-700 mb-1.5">Medicine Name</label>
      <input
        value={search}
        onChange={e => { setSearch(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search medicine from inventory..."
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-50 transition-all"
      />
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <p className="text-xs text-slate-400 text-center py-4">Loading inventory...</p>
            ) : results.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No medicines found in inventory</p>
            ) : (
              results.map((m, i) => (
                <button key={m.id || i} type="button" onClick={() => pick(m)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-teal-50 hover:text-teal-700 text-slate-700 border-b border-gray-50 last:border-0">
                  <span className="font-medium">{m.medicine_name || m.name}</span>
                  {m.dosage && <span className="text-slate-400 ml-2 text-xs">{m.dosage}</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};


// ── Doctor Fee Receipt CSS ───────────────────────────────────────────────────
const RECEIPT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:#f8fafc;color:#1e293b;display:flex;justify-content:center;padding:30px}
.receipt{width:420px;background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.15);overflow:hidden}
.hdr{background:#0E6C68;color:#fff;padding:18px 24px}
.hdr h1{font-size:15px;font-weight:800;letter-spacing:.02em}
.hdr p{font-size:9px;opacity:.75;margin-top:3px}
.badge{display:inline-block;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.35);border-radius:20px;padding:3px 10px;font-size:9px;font-weight:700;letter-spacing:.08em;margin-top:8px}
.body{padding:20px 24px}
.inv-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding-bottom:14px;border-bottom:1px dashed #e2e8f0}
.inv-no{font-size:13px;font-weight:700;color:#0E6C68;font-family:monospace;letter-spacing:.04em}
.inv-date{font-size:10px;color:#94a3b8}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}
.info-item span{display:block;font-size:8.5px;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;margin-bottom:2px}
.info-item strong{font-size:12px;font-weight:600;color:#1e293b}
.fee-box{background:#f0fdf9;border:1.5px solid #0E6C68;border-radius:10px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.fee-label{font-size:11px;font-weight:600;color:#0E6C68;text-transform:uppercase;letter-spacing:.06em}
.fee-amount{font-size:26px;font-weight:800;color:#0E6C68}
.status-row{display:flex;align-items:center;gap:8px;padding:10px 14px;background:#f8fafc;border-radius:8px;margin-bottom:16px}
.status-dot{width:8px;height:8px;border-radius:50%;background:#10b981;flex-shrink:0}
.status-text{font-size:11px;font-weight:600;color:#10b981}
.ftr{background:#f8fafc;border-top:1px solid #e2e8f0;padding:12px 24px;text-align:center;font-size:9px;color:#94a3b8}
.ftr strong{color:#0E6C68}
@media print{
  @page{margin:0;size:80mm auto}
  html,body{margin:0;padding:10px;background:white}
  .receipt{box-shadow:none;border-radius:0;width:100%}
}
`;

// ── Doctor Fee Receipt Generator ────────────────────────────────────────────
const generateDCFInvoiceNumber = async (clinicId) => {
  try {
    const res  = await fetch(`${API_BASE}/bills_next_invoice?clinic_id=${clinicId}&prefix=INV`);
    const data = await res.json();
    return data.invoice_number || `INV-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-0001`;
  } catch {
    return `INV-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${String(Math.floor(Math.random()*9999)).padStart(4,"0")}`;
  }
};

const storeDCFBill = async (clinicId, encounter, patientName, invoiceNumber) => {
  const fee = parseFloat(encounter.fee) || 0;
  try {
    const res = await fetch(`${API_BASE}/bills_create_update/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: 0,          // ← use 0 not null
        clinic_id: clinicId,
        created_by: "admin",
        patient_id: encounter.patient_id ? Number(encounter.patient_id) : null,
        patient_name_override: null,
        encounter_id: encounter.id || null,
        chief_complaint: encounter.chief_complaint || `Doctor Consultation`,
        invoice_number: invoiceNumber,
        sale_invoice_number: null,
        payment_mode: "Cash",
        subtotal: fee,
        gst_percent: 0,
        gst_amount: 0,
        discount_percent: 0,
        discount: 0,
        total_amount: fee,
        appointment_id: encounter.appointment_id || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("DCF bill write failed:", data);
      alert(`Failed to save bill: ${JSON.stringify(data)}`);
      return false;
    }
    console.log("DCF bill written:", data);
    return true;
  } catch (e) {
    console.error("DCF bill exception:", e);
    return false;
  }
};

const printDCFReceipt = ({ invoiceNumber, encounter, patientName, doctorName, clinicName }) => {
  const fee = parseFloat(encounter.fee) || 0;
  const now = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const fmtD = v => v ? v.slice(0, 10).split("-").reverse().join("/") : "—";
  const fmtT = v => {
    if (!v) return "—";
    const [h, m] = v.slice(0, 5).split(":")?.map(Number) || [];
    return `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Fee Receipt — ${patientName}</title>
  <style>${RECEIPT_CSS}</style>
</head>
<body>
<div class="receipt">
  <div class="hdr">
    <h1>${clinicName.toUpperCase()}</h1>
    <p>Doctor Fee Receipt · Generated: ${now}</p>
    <div class="badge">DOCTOR CONSULTATION</div>
  </div>
  <div class="body">
    <div class="inv-row">
      <div class="inv-no">${invoiceNumber}</div>
      <div class="inv-date">${fmtD(encounter.visit_date || new Date().toISOString())}</div>
    </div>
    <div class="info-grid">
      <div class="info-item"><span>Patient</span><strong>${patientName}</strong></div>
      <div class="info-item"><span>Doctor</span><strong>${doctorName}</strong></div>
      <div class="info-item"><span>Date</span><strong>${fmtD(encounter.visit_date || new Date().toISOString())}</strong></div>
      <div class="info-item"><span>Time</span><strong>${fmtT(encounter.visit_time || new Date().toTimeString())}</strong></div>
    </div>
    <div class="fee-box">
      <div class="fee-label">Consultation Fee</div>
      <div class="fee-amount">₹${fee.toLocaleString("en-IN")}</div>
    </div>
    <div class="status-row">
      <div class="status-dot"></div>
      <div class="status-text">Payment Received — Cash</div>
    </div>
  </div>
  <div class="ftr">
    <strong>${clinicName}</strong> · Thank you for visiting us<br/>
    Please keep this receipt for your records
  </div>
</div>
<script>window.onload = () => window.print(); window.onafterprint = () => window.close();</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) { alert("Please allow popups to print the receipt."); return; }
  win.document.write(html);
  win.document.close();
};
export const printEncounterSummary = ({patientName, doctorName, encounter, prescriptions }) => {
  const rows = prescriptions.map(p => `
    <tr>
      <td>${p.medicine_name || "—"}</td>
      <td>${p.dosage || "—"}</td>
      <td>${p.frequency || "—"}</td>
      <td>${p.duration || "—"}</td>
      <td>${p.instructions || "—"}</td>
    </tr>
  `).join("");

  const win = window.open("", "_blank");
  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Encounter Summary</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', sans-serif; color: #1e293b; padding: 32px; font-size: 13px; }
          .header { border-bottom: 2px solid #0d9488; padding-bottom: 16px; margin-bottom: 20px; }
          .header h1 { font-size: 20px; font-weight: 700; color: #0d9488; }
          .header p  { color: #64748b; font-size: 12px; margin-top: 4px; }
          .section   { margin-bottom: 20px; }
          .section h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #64748b; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
          .grid2     { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .field label { display: block; font-size: 11px; color: #94a3b8; margin-bottom: 2px; }
          .field p   { font-size: 13px; color: #1e293b; font-weight: 500; }
          .notes-box { background: #f8fafc; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #334155; }
          table      { width: 100%; border-collapse: collapse; font-size: 12px; }
          th         { text-align: left; padding: 8px 12px; background: #f8fafc; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0; }
          td         { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
          tr:last-child td { border-bottom: none; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Encounter Summary</h1>
          <p>Generated on ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
        </div>

        <div class="section">
          <h2>Basic Info</h2>
          <div class="grid2">
            <div class="field"><label>Patient</label><p>${patientName || "—"}</p></div>
            <div class="field"><label>Doctor</label><p>${doctorName || "—"}</p></div>
            <div class="field"><label>Visit Date</label><p>${new Date().toLocaleDateString()}</p></div>
            ${encounter.follow_up_date ? `<div class="field"><label>Follow-up</label><p>${encounter.follow_up_date}</p></div>` : ""}
            ${encounter.BP ? `<div class="field"><label>Blood Pressure</label><p>${encounter.BP}</p></div>` : ""}
          </div>
        </div>

        ${encounter.chief_complaint ? `
        <div class="section">
          <h2>Patient Notes</h2>
          <div class="notes-box">${encounter.chief_complaint}</div>
        </div>` : ""}

        ${encounter.notes ? `
        <div class="section">
          <h2>Diagnosis and Clinical Notes</h2>
          <div class="notes-box">${encounter.notes}</div>
        </div>` : ""}

        ${encounter.test_notes ? `
        <div class="section">
          <h2>Any lab Test?</h2>
          <div class="notes-box">${encounter.test_notes}</div>
        </div>` : ""}

        <div class="section">
          <h2>Prescriptions (${prescriptions.length})</h2>
          ${prescriptions.length === 0
            ? `<p style="color:#94a3b8;font-style:italic">No prescriptions added</p>`
            : `<table>
                <thead><tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr></thead>
                <tbody>${rows}</tbody>
               </table>`
          }
        </div>
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 400);
};


// ── Main component ────────────────────────────────────────────────────────────
const EncounterWorkflow = ({ open, onClose, appointment, onComplete }) => {
  const CLINIC_ID = getClinicId();
  const [tab, setTab] = useState("encounter");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [selectedPatient, setSelectedPatient] = useState(appointment?.patient_id || "");
  const [selectedDoctor, setSelectedDoctor] = useState(appointment?.doctor_id || "");

  // ── chief_complaint auto-filled from appointment notes ────────────────────
  const [encounter, setEncounter] = useState({
    chief_complaint: appointment?.notes || "",   // ← auto-filled from apt notes
    notes: "",
    follow_up_date: "",
    BP: appointment?.patientBP || "",
    pulse: "",
    weight: "",
    age: "",
    fee: appointment?.fee || "",
    test_notes: "",
  });


  // Patients name directly visible if coming from appointment, else select dropdown is shown. Doctor is always a dropdown but disabled if coming from appointment (since doctor is fixed for that appointment).
  const [patientDisplayName, setPatientDisplayName] = useState(
  appointment?.patient_name || ""
);

// When patients load, update the display name
useEffect(() => {
  if (patients.length > 0 && selectedPatient) {
    const p = patients.find(x => String(x.id) === String(selectedPatient));
    if (p) setPatientDisplayName(`${p.first_name} ${p.last_name}`);
  }
}, [patients, selectedPatient]);

  // diagnoses kept for payload but tab is hidden
  const [diagnoses] = useState([]);

  const [prescriptions, setPrescriptions] = useState([]);
  const [rxForm, setRxForm] = useState({
    medicine_name: "", dosage: "", frequency: "", duration: "", instructions: "",
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!open) return;
    fetch(`${API_BASE}/patient_read?clinic_id=${CLINIC_ID}`).then(r => r.json()).then(d => setPatients(Array.isArray(d) ? d : [])).catch(console.error);
    fetch(`${API_BASE}/doctorsread`).then(r => r.json()).then(d => setDoctors(Array.isArray(d) ? d : [])).catch(console.error);
  }, [open]);

  // Auto-populate encounter fields from patient data
  useEffect(() => {
    if (selectedPatient && patients.length > 0) {
      const patient = patients.find(p => String(p.id) === String(selectedPatient));
      if (patient) {
        setEncounter(prev => ({
          ...prev,
          pulse: patient.pulse_rate || prev.pulse,
          weight: patient.weight || prev.weight,
          age: patient.age || prev.age,
        }));
      }
    }
  }, [selectedPatient, patients]);

  const addPrescription = () => {
    if (!rxForm.medicine_name) { showToast("Medicine name is required", "error"); return; }
    setPrescriptions(p => [...p, { ...rxForm, id: Date.now() }]);
    setRxForm({ medicine_name: "", dosage: "", frequency: "", duration: "", instructions: "" });
  };

  // ── validate encounter tab fields ─────────────────────────────────────────
  const validateEncounter = () => {
    if (!selectedPatient) { showToast("Patient is required", "error"); return false; }
    if (!selectedDoctor) { showToast("Doctor is required", "error"); return false; }
    // BP is now optional — removed from validation
    if (!encounter.chief_complaint.trim()) { showToast("Patient Notes is required", "error"); return false; }
    return true;
  };

  // ── Save only (no print) ──────────────────────────────────────────────────
  const handleComplete = async () => {
    if (!validateEncounter()) { setTab("encounter"); return; }
    setSaving(true);
    try {
      const payload = buildPayload();
      const res = await fetch(`${API_BASE}/save_encounter_with_details`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();

      // Create a billing entry from the appointment fee when the encounter is completed
      const appointmentFee = parseFloat(appointment?.fee);
      let billingSuccess = false;
      if (appointment?.id && appointmentFee > 0) {
        const patientObj = patients.find(p => String(p.id) === String(selectedPatient));
        const patientName = patientObj ? `${patientObj.first_name} ${patientObj.last_name}` : "";
        const invoiceNumber = await generateDCFInvoiceNumber(CLINIC_ID);
        billingSuccess = await storeDCFBill(
          CLINIC_ID,
          { ...encounter, patient_id: selectedPatient, appointment_id: appointment.id, fee: appointmentFee },
          patientName,
          invoiceNumber
        );
      }

      showToast(billingSuccess ? "Encounter saved and doctor fee billed" : "Encounter saved successfully");
      setTimeout(() => { onComplete?.(payload); onClose(); }, 500);
    } catch {
      showToast("Failed to save encounter", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Print only (no save, no pre-check popup) ──────────────────────────────
 const handlePrint = () => {
  console.log("prescriptions at print time:", prescriptions); // 👈 add this
  const patientObj = patients.find(p => String(p.id) === String(selectedPatient));
  const patientName = patientObj ? `${patientObj.first_name} ${patientObj.last_name}` : "";
  const doctorName = doctors.find(d => String(d.id) === String(selectedDoctor))?.name || "";

  // Auto-add any medicine that's typed but not yet added
  let finalPrescriptions = [...prescriptions];
  if (rxForm.medicine_name.trim()) {
    finalPrescriptions = [...finalPrescriptions, { ...rxForm, id: Date.now() }];
    setPrescriptions(finalPrescriptions);
    setRxForm({ medicine_name: "", dosage: "", frequency: "", duration: "", instructions: "" });
  }

  printEncounterSummary({ patientName, doctorName, encounter, prescriptions: finalPrescriptions });
};



  const buildPayload = () => ({
    id: null,
    clinic_id: CLINIC_ID,
    patient_id: Number(selectedPatient),
    doctor_id: Number(selectedDoctor),
    appointment_id: appointment?.id || null,
    visit_date: new Date().toISOString(),
    ...encounter,
    fee: encounter.fee ? parseFloat(encounter.fee) : 0,
    follow_up_date: encounter.follow_up_date || null,
    created_by: "admin",
    diagnoses: diagnoses.map(({ description }) => ({ description })),
    prescriptions: prescriptions.map(({ medicine_name, dosage, frequency, duration, instructions }) => ({
      medicine_name, dosage, frequency, duration, instructions,
    })),
  });

  const tabIndex = TABS.indexOf(tab);

  return (
    <>
      <RightDrawer title="Patient Encounter" open={open} onClose={onClose}>
        <div className="h-full flex flex-col">

          <div className="px-8 py-4 bg-gradient-to-r from-teal-50 to-blue-50 border-b border-teal-100">
            <p className="text-sm text-gray-600">Fill in the details to register a new patient encounter</p>
          </div>

          {/* Tab bar — 2 tabs: encounter + prescriptions */}
          <div className="flex border-b px-6 pt-3 bg-white">
            {TABS.map(t => {
              const Icon = TAB_ICONS[t];
              return (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium capitalize transition-colors ${
                    tab === t ? "text-teal-600 border-b-2 border-teal-600" : "text-gray-500 hover:text-gray-700"
                  }`}>
                  <Icon /> {t}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">

            {/* ── Encounter tab ── */}
            {tab === "encounter" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {appointment ? (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Patient <span className="text-red-500">*</span></label>
                      <div className="w-full px-4 py-2.5 border border-teal-200 bg-teal-50 rounded-xl text-sm flex items-center justify-between" style={{ minHeight: 42 }}>
                        <span className="font-medium text-gray-800">
  {patientDisplayName || `Patient #${selectedPatient}`}
</span>
                        {/* <span className="text-xs text-teal-600 font-semibold bg-white px-2 py-0.5 rounded-lg border border-teal-200">Fixed</span> */}
                      </div>
                    </div>
                  ) : (
                    <SearchableSelect
                      label={<>Patient <Required /></>}
                      value={selectedPatient}
                      onChange={setSelectedPatient}
                      placeholder="Select patient..."
                      options={patients.map(p => ({ value: p.id, label: `${p.first_name} ${p.last_name}` }))}
                    />
                  )}
                  <SearchableSelect
                    label={<>Doctor <Required /></>}
                    value={selectedDoctor}
                    onChange={appointment ? () => {} : setSelectedDoctor}
                    placeholder="Select doctor..."
                    options={doctors.map(d => ({ value: d.id, label: d.name }))}
                  />
                </div>

                {/* Doctor Fee Display Badge */}
                {/* {encounter.fee && Number(encounter.fee) > 0 && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-teal-50 border border-teal-200 rounded-xl">
                    <span className="text-sm font-medium text-teal-700">Doctor Fee:</span>
                    <span className="text-lg font-bold text-teal-600">₹{Number(encounter.fee).toLocaleString("en-IN")}</span>
                  </div>
                )} */}

                {/* Vital Signs - BP, Pulse, Weight, Age in one row */}
                <div className="grid grid-cols-4 gap-4">
                  <Input
                    label="BP (mmHg)"
                    value={encounter.BP}
                    onChange={v => setEncounter(f => ({ ...f, BP: v }))}
                    placeholder="120/80"
                  />
                  <Input
                    label="Pulse (bpm)"
                    value={encounter.pulse}
                    onChange={v => setEncounter(f => ({ ...f, pulse: v }))}
                    placeholder="72"
                  />
                  <Input
                    label="Weight (kg)"
                    value={encounter.weight}
                    onChange={v => setEncounter(f => ({ ...f, weight: v }))}
                    placeholder="70"
                  />
                  <Input
                    label="Age"
                    value={encounter.age}
                    onChange={v => setEncounter(f => ({ ...f, age: v }))}
                    placeholder="25"
                  />
                </div>

                {/* Patient Notes — renamed from Chief Complaint, auto-filled from apt notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Patient Notes <Required />
                  </label>
                  <textarea
                    rows={2}
                    value={encounter.chief_complaint}
                    onChange={e => setEncounter(f => ({ ...f, chief_complaint: e.target.value }))}
                    placeholder="Reason for visit / patient notes…"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 resize-none"
                  />
                </div>

                {/* Clinical Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Diagnosis and Clinical Notes</label>
                  <textarea
                    rows={4}
                    value={encounter.notes}
                    onChange={e => setEncounter(f => ({ ...f, notes: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 resize-none"
                  />
                </div>

                {/* Test Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Any lab Test ?</label>
                  <textarea
                    rows={3}
                    value={encounter.test_notes}
                    onChange={e => setEncounter(f => ({ ...f, test_notes: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 resize-none"
                  />
                </div>

                <Input
                  label="Follow-up Date"
                  type="date"
                  value={encounter.follow_up_date}
                  onChange={v => setEncounter(f => ({ ...f, follow_up_date: v }))}
                />
              </>
            )}

            {/* ── Prescriptions tab ── */}
            {tab === "prescriptions" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <MedicineSelect
                    value={rxForm.medicine_name}
                    onChange={(name, medicine) => setRxForm(f => ({
                      ...f,
                      medicine_name: name,
                      dosage: medicine?.dosage || f.dosage,
                    }))}
                  />
                  <Input
                    label="Frequency"
                    value={rxForm.frequency}
                    onChange={v => setRxForm(f => ({ ...f, frequency: v }))}
                    placeholder="e.g. Twice a day"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  
                  <Input
                    label="Duration"
                    value={rxForm.duration}
                    onChange={v => setRxForm(f => ({ ...f, duration: v }))}
                    placeholder="e.g. 5 days"
                  />
                  <Input
                  label="Instructions"
                  value={rxForm.instructions}
                  onChange={v => setRxForm(f => ({ ...f, instructions: v }))}
                  placeholder="e.g. After meals"
                  />
                </div>
                
                <Btn onClick={addPrescription}><Icons.Plus /> Add Medicine</Btn>

                {prescriptions.map(p => (
                  <div key={p.id} className="flex justify-between items-center border border-gray-200 rounded-xl px-4 py-2.5 text-sm">
                    <span>
                      <span className="font-medium text-teal-700">{p.medicine_name}</span>
                      {` • ${p.dosage} • ${p.frequency} • ${p.duration}`}
                    </span>
                    <button
                      onClick={() => setPrescriptions(p2 => p2.filter(x => x.id !== p.id))}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Icons.Trash />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Footer */}
          {/* Footer */}
<div className="p-6 border-t bg-gray-50 flex justify-between items-center gap-3">
  <div>
    {tabIndex > 0 && (
      <Btn variant="secondary" onClick={() => setTab(TABS[tabIndex - 1])}>Back</Btn>
    )}
  </div>

  <div className="flex gap-3">
    {tabIndex < TABS.length - 1 ? (
      <Btn onClick={() => {
        if (!validateEncounter()) return;
        setTab(TABS[tabIndex + 1]);
      }}>
        Next
      </Btn>
    ) : (
      <>
        <Btn variant="secondary" onClick={handlePrint}>
          <Icons.Download /> Print
        </Btn>
        <Btn onClick={handleComplete} disabled={saving}>
          {saving ? "Saving..." : <><Icons.Check /> Complete</>}
        </Btn>
      </>
    )}
  </div>
</div>

        </div>
      </RightDrawer>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
};

export default EncounterWorkflow;