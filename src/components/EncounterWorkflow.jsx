import { useState, useEffect, useRef } from "react";
import Icons from "./Icons";
import { RightDrawer, Btn, Input, Select, Toast } from "./UI";

const API_BASE = process.env.REACT_APP_API_BASE_URL;
const CLINIC_ID = 1;

const TABS       = ["encounter", "diagnoses", "prescriptions"];
const TAB_ICONS  = { encounter: Icons.Encounter, diagnoses: Icons.Diagnosis, prescriptions: Icons.Prescription };
const FREQUENCIES = ["Once a day(OD)", "Twice a day(BID)", "Three times a day(TID)", "Four times a day(QID)", "As needed(SOS)", "Before sleep(HS)"];

// ── Searchable ICD dropdown ───────────────────────────────────────────────────
const ICDSelect = ({ value, codes = [], onChange }) => {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const filtered = codes.filter(c => c.toLowerCase().includes(search.toLowerCase()));
  const pick = (v) => { onChange(v); setOpen(false); setSearch(""); };

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-slate-700 mb-1.5">ICD Code</label>

      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white flex items-center justify-between focus:outline-none focus:border-teal-400">
        <span className={value ? "text-slate-800" : "text-slate-400"}>{value || "Select ICD code..."}</span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search..." className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-teal-400" />
          </div>

          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0
              ? <p className="text-xs text-slate-400 text-center py-4">No matching codes</p>
              : filtered.map(c => (
                  <button key={c} type="button" onClick={() => pick(c)}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-teal-50 hover:text-teal-700 ${c === value ? "bg-teal-50 text-teal-700 font-medium" : "text-slate-700"}`}>
                    {c}
                  </button>
                ))
            }
          </div>

          <div className="border-t border-gray-100">
            <button type="button" onClick={() => pick("__other__")}
              className="w-full text-left px-4 py-2.5 text-sm text-teal-600 font-medium hover:bg-teal-50 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Other (Add new ICD code)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Add new ICD code popup ────────────────────────────────────────────────────
const ICDPopup = ({ onClose, onAdded }) => {
  const [code,   setCode]   = useState("");
  const [error,  setError]  = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!code.trim()) { setError("ICD code is required"); return; }
    setSaving(true);
    try {
      const res  = await fetch(`${API_BASE}/icd_codes_create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icd_code: code.trim(), created_by: "admin" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create");
      // Response: { message, data: { icd_id, icd_code, ... } }
      onAdded(json.data.icd_code);
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
            <p className="text-xs text-gray-400 mt-0.5">Saved to database and available immediately</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icons.X /></button>
        </div>

        <Input label="ICD Code" value={code}
          onChange={v => { setCode(v.toUpperCase()); setError(""); }}
          placeholder="e.g. A01.0" />

        {error && <p className="mt-2 text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3 mt-5">
          <Btn variant="secondary" onClick={onClose} className="flex-1">Cancel</Btn>
          <Btn onClick={save} disabled={saving} className="flex-1">
            {saving ? "Saving..." : <><Icons.Plus /> Add ICD Code</>}
          </Btn>
        </div>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const EncounterWorkflow = ({ open, onClose, appointment, onComplete }) => {
  const [tab,          setTab]          = useState("encounter");
  const [saving,       setSaving]       = useState(false);
  const [toast,        setToast]        = useState(null);
  const [showICDPopup, setShowICDPopup] = useState(false);

  const [patients, setPatients] = useState([]);
  const [doctors,  setDoctors]  = useState([]);
  const [icdCodes, setIcdCodes] = useState([]);  // plain string[]  e.g. ["A00-B99", ...]

  const [selectedPatient, setSelectedPatient] = useState(appointment?.patient_id || "");
  const [selectedDoctor,  setSelectedDoctor]  = useState(appointment?.doctor_id  || "");

  const [encounter, setEncounter] = useState({
    chief_complaint: appointment?.notes || "", notes: "", follow_up_date: "",
  });
  const [diagnoses,     setDiagnoses]     = useState([]);
  const [dxForm,        setDxForm]        = useState({ icd_code: "", description: "" });
  const [prescriptions, setPrescriptions] = useState([]);
  const [rxForm,        setRxForm]        = useState({
    medicine_name: "", dosage: "", frequency: FREQUENCIES[0], duration: "", instructions: "",
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch dropdown data whenever drawer opens
  useEffect(() => {
    if (!open) return;
    fetch(`${API_BASE}/patient_read?clinic_id=${CLINIC_ID}`).then(r => r.json()).then(d => setPatients(Array.isArray(d) ? d : [])).catch(console.error);
    fetch(`${API_BASE}/doctorsread`).then(r => r.json()).then(d => setDoctors(Array.isArray(d) ? d : [])).catch(console.error);
    loadIcdCodes();
  }, [open]);

  // GET /icd_codes_read → [{ icd_id, icd_code, ... }]  — store only the code strings
  const loadIcdCodes = () =>
    fetch(`${API_BASE}/icd_codes_read`)
      .then(r => r.json())
      .then(d => setIcdCodes(Array.isArray(d) ? d.map(i => i.icd_code) : []))
      .catch(console.error);

  // ICD selection — "__other__" opens the add popup
  const handleIcdSelect = (val) => {
    if (val === "__other__") { setShowICDPopup(true); return; }
    setDxForm(f => ({ ...f, icd_code: val }));
  };

  // After new code created: reload list from DB, auto-select the new code
  const handleICDAdded = async (newCode) => {
    setShowICDPopup(false);
    await loadIcdCodes();
    setDxForm(f => ({ ...f, icd_code: newCode }));
    showToast(`ICD code ${newCode} added`);
  };

  const addDiagnosis = () => {
    if (!dxForm.icd_code) { showToast("ICD Code is required", "error"); return; }
    setDiagnoses(p => [...p, { ...dxForm, id: Date.now() }]);
    setDxForm({ icd_code: "", description: "" });
  };

  const addPrescription = () => {
    if (!rxForm.medicine_name || !rxForm.dosage) { showToast("Medicine name and dosage are required", "error"); return; }
    setPrescriptions(p => [...p, { ...rxForm, id: Date.now() }]);
    setRxForm({ medicine_name: "", dosage: "", frequency: FREQUENCIES[0], duration: "", instructions: "" });
  };

  const handleComplete = async () => {
    if (!encounter.chief_complaint) { setTab("encounter"); showToast("Chief complaint is required", "error"); return; }
    setSaving(true);
    try {
      const payload = {
        id: null, clinic_id: CLINIC_ID,
        patient_id: Number(selectedPatient),
        doctor_id:  Number(selectedDoctor),
        appointment_id: appointment?.id || null,
        visit_date: new Date().toISOString(),
        ...encounter,
        follow_up_date: encounter.follow_up_date || null,
        created_by: "admin",
        diagnoses:     diagnoses.map(({ icd_code, description }) => ({ icd_code, description })),
        prescriptions: prescriptions.map(({ medicine_name, dosage, frequency, duration, instructions }) => ({ medicine_name, dosage, frequency, duration, instructions })),
      };
      const res = await fetch(`${API_BASE}/save_encounter_with_details`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      showToast("Encounter saved successfully");
      setTimeout(() => { onComplete?.(payload); onClose(); }, 500);
    } catch {
      showToast("Failed to save encounter", "error");
    } finally {
      setSaving(false);
    }
  };

  const tabIndex = TABS.indexOf(tab);

  return (
    <>
      <RightDrawer title="Patient Encounter" open={open} onClose={onClose}>
        <div className="h-full flex flex-col">

          <div className="px-8 py-4 bg-gradient-to-r from-teal-50 to-blue-50 border-b border-teal-100">
            <p className="text-sm text-gray-600">Fill in the details to register a new patient encounter</p>
          </div>

          {/* Tab bar */}
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

            {/* ── Encounter ── */}
            {tab === "encounter" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Patient" value={selectedPatient} onChange={setSelectedPatient}
                    options={patients.map(p => ({ value: p.id, label: `${p.first_name} ${p.last_name}` }))} />
                  <Select label="Doctor" value={selectedDoctor} onChange={setSelectedDoctor}
                    options={doctors.map(d => ({ value: d.id, label: d.name }))} />
                </div>

                {[["Chief Complaint", "chief_complaint", 2], ["Clinical Notes", "notes", 4]].map(([lbl, key, rows]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{lbl}</label>
                    <textarea rows={rows} value={encounter[key]}
                      onChange={e => setEncounter(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 resize-none" />
                  </div>
                ))}

                <Input label="Follow-up Date" type="date" value={encounter.follow_up_date}
                  onChange={v => setEncounter(f => ({ ...f, follow_up_date: v }))} />
              </>
            )}

            {/* ── Diagnoses ── */}
            {tab === "diagnoses" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <ICDSelect value={dxForm.icd_code} codes={icdCodes} onChange={handleIcdSelect} />
                  <Input label="Description" value={dxForm.description}
                    onChange={v => setDxForm(f => ({ ...f, description: v }))} placeholder="Optional description" />
                </div>

                <Btn onClick={addDiagnosis}><Icons.Plus /> Add Diagnosis</Btn>

                {diagnoses.map(d => (
                  <div key={d.id} className="flex justify-between items-center border border-gray-200 rounded-xl px-4 py-2.5 text-sm">
                    <span>
                      <span className="font-medium text-teal-700">{d.icd_code}</span>
                      {d.description && ` — ${d.description}`}
                    </span>
                    <button onClick={() => setDiagnoses(p => p.filter(x => x.id !== d.id))}
                      className="text-slate-400 hover:text-red-500"><Icons.Trash /></button>
                  </div>
                ))}
              </>
            )}

            {/* ── Prescriptions ── */}
            {tab === "prescriptions" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Medicine Name" value={rxForm.medicine_name} onChange={v => setRxForm(f => ({ ...f, medicine_name: v }))} />
                  <Input label="Dosage" value={rxForm.dosage} onChange={v => setRxForm(f => ({ ...f, dosage: v }))} placeholder="e.g. 1 tablet 500mg" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Frequency" value={rxForm.frequency} onChange={v => setRxForm(f => ({ ...f, frequency: v }))} options={FREQUENCIES} />
                  <Input label="Duration" value={rxForm.duration} onChange={v => setRxForm(f => ({ ...f, duration: v }))} placeholder="e.g. 5 days" />
                </div>
                <Input label="Instructions" value={rxForm.instructions} onChange={v => setRxForm(f => ({ ...f, instructions: v }))} placeholder="e.g. After meals" />

                <Btn onClick={addPrescription}><Icons.Plus /> Add Medicine</Btn>

                {prescriptions.map(p => (
                  <div key={p.id} className="flex justify-between items-center border border-gray-200 rounded-xl px-4 py-2.5 text-sm">
                    <span>
                      <span className="font-medium text-teal-700">{p.medicine_name}</span>
                      {` • ${p.dosage} • ${p.frequency} • ${p.duration}`}
                    </span>
                    <button onClick={() => setPrescriptions(p2 => p2.filter(x => x.id !== p.id))}
                      className="text-slate-400 hover:text-red-500"><Icons.Trash /></button>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
            {tabIndex > 0 && (
              <Btn variant="secondary" onClick={() => setTab(TABS[tabIndex - 1])}>Back</Btn>
            )}
            {tabIndex < TABS.length - 1
              ? <Btn onClick={() => setTab(TABS[tabIndex + 1])}>Next</Btn>
              : <Btn onClick={handleComplete} disabled={saving}>{saving ? "Saving..." : "Complete Encounter"}</Btn>
            }
          </div>

        </div>
      </RightDrawer>

      {showICDPopup && <ICDPopup onClose={() => setShowICDPopup(false)} onAdded={handleICDAdded} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
};

export default EncounterWorkflow;