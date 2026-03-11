import { useState, useEffect } from 'react';
import Icons from '../components/Icons';
import { Btn, Input, Select, Toast, PageHeader, DataTable, TR, TD, Modal } from '../components/UI';
 
const ITEMS_PER_PAGE = 10;
const API = 'http://127.0.0.1:5020';
 
const EncountersPage = () => {
  const [encounters, setEncounters] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [editingEncounter, setEditingEncounter] = useState(null);
  const [errors, setErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
 
  const blank = { patient_id: "", doctor_id: "", appointment_id: "", visit_date: "", follow_up_date: "", chief_complaint: "", notes: "" };
  const [form, setForm] = useState(blank);
 
  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 3000); };
  const setField = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: undefined })); };
  const closeModal = () => { setShowModal(false); setEditingEncounter(null); setForm(blank); setErrors({}); };
 
  const validate = () => {
    const e = {};
    if (!form.patient_id) e.patient_id = "Required";
    if (!form.visit_date) e.visit_date = "Required";
    if (!form.chief_complaint.trim()) e.chief_complaint = "Required";
    setErrors(e);
    return !Object.keys(e).length;
  };
 
  const fetchEncounters = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API}/encountersread?clinic_id=1`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEncounters(Array.isArray(data) ? data : []);
    } catch { showToast("Failed to load encounters"); }
    finally { setIsLoading(false); }
  };
 
  const fetchPatients = async () => {
    try {
      const res = await fetch(`${API}/patient_read?clinic_id=1`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPatients(Array.isArray(data) ? data.map(p => ({
        value: p.id,
        label: `${p.first_name} ${p.last_name ?? ""}`.trim()
      })) : []);
    } catch { showToast("Failed to load patients"); }
  };
 
 
  const fetchDoctors = async () => {
    try {
      const res = await fetch(`${API}/doctorsread`);  // removed trailing slash
      if (!res.ok) throw new Error();
      const data = await res.json();
      console.log("doctors data:", data); // ← check this in browser console
      setDoctors(Array.isArray(data) ? data.map(d => ({
        value: String(d.id ?? d.doctor_id ?? d.user_id),
        label: d.full_name ?? d.name ?? `${d.first_name ?? ""} ${d.last_name ?? ""}`.trim()
      })) : []);
    } catch (e) {
      console.log("doctors error:", e);
      showToast("Failed to load doctors");
    }
  };
 
  useEffect(() => { fetchEncounters(); fetchPatients(); fetchDoctors(); }, []);
  useEffect(() => { setCurrentPage(1); }, [search]);
 
  const patientName = id => patients.find(p => String(p.value) === String(id))?.label || "—";
  const doctorName  = id => doctors.find(d => String(d.value) === String(id))?.label  || "—";
 
  const handleEdit = enc => {
    setEditingEncounter(enc);
    setForm({
      patient_id:      enc.patient_id      ?? "",
      doctor_id:       enc.doctor_id       ?? "",
      appointment_id:  enc.appointment_id  ?? "",
      visit_date:      enc.visit_date      ? String(enc.visit_date).split("T")[0] : "",
      follow_up_date:  enc.follow_up_date  ? String(enc.follow_up_date).split("T")[0] : "",
      chief_complaint: enc.chief_complaint ?? "",
      notes:           enc.notes           ?? "",
    });
    setErrors({});
    setShowModal(true);
  };
 
  const handleSave = async () => {
    if (!validate()) return;
    try {
      const res = await fetch(`${API}/encounters_create_update/`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingEncounter?.id ?? null, clinic_id: 1, created_by: "admin",
          patient_id:      Number(form.patient_id),
          doctor_id:       form.doctor_id      ? Number(form.doctor_id)      : null,
          appointment_id:  form.appointment_id ? Number(form.appointment_id) : null,
          visit_date:      form.visit_date,
          follow_up_date:  form.follow_up_date || null,
          chief_complaint: form.chief_complaint,
          notes:           form.notes,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(editingEncounter ? "Encounter updated" : "Encounter added");
      closeModal();
      fetchEncounters();
    } catch (e) { showToast(e.message || "Operation failed"); }
  };
 
  const handleDelete = async id => {
    if (!window.confirm("Delete this encounter?")) return;
    setEncounters(prev => prev.filter(enc => enc.id !== id));
    showToast("Encounter deleted");
    try {
      const res = await fetch(`${API}/encounter_delete/`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, modified_by: "admin" })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { fetchEncounters(); showToast(data?.error || "Failed to delete encounter"); }
    } catch { fetchEncounters(); showToast("Failed to delete encounter"); }
  };
 
  const filtered = encounters.filter(enc =>
    [enc.id, patientName(enc.patient_id), doctorName(enc.doctor_id), enc.chief_complaint, enc.visit_date]
      .some(v => String(v ?? "").toLowerCase().includes(search.toLowerCase()))
  );
 
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const Err = ({ f }) => errors[f] ? <p className="text-red-500 text-xs mt-1">{errors[f]}</p> : null;
 
  return (
    <div>
      <PageHeader title="Encounters" subtitle="Manage clinical encounter records" actions={
        <Btn onClick={() => { setEditingEncounter(null); setForm(blank); setErrors({}); setShowModal(true); }}>
          <Icons.Plus /> New Encounter
        </Btn>
      } />
 
      {isLoading ? <div className="text-center py-6 text-gray-500">Loading encounters...</div> : (
        <div>
          <DataTable
            title="Encounter List" subtitle={`${filtered.length} encounters recorded`}
            search={search} onSearch={setSearch} searchPlaceholder="Search by patient, doctor, complaint…"
            columns={["ID", "Patient", "Doctor", "Visit Date", "Chief Complaint", "Follow-up Date", "Actions"]}
            rows={paginated.map(enc => (
              <TR key={enc.id}>
                <TD muted>#{enc.id}</TD>
                <TD bold>{patientName(enc.patient_id)}</TD>
                <TD>{doctorName(enc.doctor_id)}</TD>
                <TD muted>{enc.visit_date ? String(enc.visit_date).split("T")[0] : "—"}</TD>
                <TD>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold border bg-teal-50 text-teal-700 border-teal-100">
                    {enc.chief_complaint || "—"}
                  </span>
                </TD>
                <TD muted>{enc.follow_up_date ? String(enc.follow_up_date).split("T")[0] : "—"}</TD>
                <TD>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(enc)} className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-slate-400"><Icons.Edit /></button>
                    <button onClick={() => handleDelete(enc.id)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-slate-400"><Icons.Trash /></button>
                  </div>
                </TD>
              </TR>
            ))}
          />
 
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <span className="text-sm text-slate-500">
              Showing <b>{filtered.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)}</b> of <b>{filtered.length}</b>
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">← Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setCurrentPage(n)}
                  className={`w-8 h-8 text-sm rounded-lg font-medium border ${n === page ? "text-white border-transparent" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                  style={n === page ? { background: "linear-gradient(135deg,#0E6C68,#14A3A0)" } : {}}>{n}
                </button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
            </div>
          </div>
        </div>
      )}
 
      {showModal && (
        <Modal title={editingEncounter ? "Edit Encounter" : "New Encounter"} onClose={closeModal} wide>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Patient *</label>
              <select
                value={form.patient_id}
                onChange={e => setField("patient_id", e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-teal-400 ${errors.patient_id ? "border-red-400" : "border-gray-200"}`}
              >
                <option value="">Select patient…</option>
                {patients.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <Err f="patient_id" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Doctor</label>
              <select
                value={form.doctor_id}
                onChange={e => setField("doctor_id", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400"
              >
                <option value="">Select doctor…</option>
                {doctors.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <Input label="Visit Date *" type="date" value={form.visit_date} onChange={v => setField("visit_date", v)} className={errors.visit_date ? "border-red-400" : ""} />
              <Err f="visit_date" />
            </div>
            <div>
              <Input label="Follow-up Date" type="date" value={form.follow_up_date} onChange={v => setField("follow_up_date", v)} />
            </div>
            <div className="col-span-2">
              <Input label="Chief Complaint *" value={form.chief_complaint} onChange={v => setField("chief_complaint", v)} className={errors.chief_complaint ? "border-red-400" : ""} placeholder="Primary reason for visit" />
              <Err f="chief_complaint" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Clinical Notes</label>
              <textarea value={form.notes} onChange={e => setField("notes", e.target.value)} rows={4}
                placeholder="Detailed clinical observations…"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 resize-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Btn variant="secondary" onClick={closeModal}>Cancel</Btn>
            <Btn onClick={handleSave}><Icons.Check />{editingEncounter ? "Update Encounter" : "Save Encounter"}</Btn>
          </div>
        </Modal>
      )}
 
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
};
 
export default EncountersPage;