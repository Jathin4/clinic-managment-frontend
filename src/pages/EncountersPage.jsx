import { useState, useEffect } from 'react';
import Icons from '../components/Icons';
import { Btn, Input, Toast, PageHeader, DataTable, TR, TD, Modal } from '../components/UI';
import EncounterWorkflow from '../components/EncounterWorkflow';
 
const ITEMS_PER_PAGE = 10;
const API = 'http://127.0.0.1:5020';
const LS_KEY = 'deletedEncounters';
 
const getDeleted = () => JSON.parse(localStorage.getItem(LS_KEY) || '[]');
const addDeleted = id => localStorage.setItem(LS_KEY, JSON.stringify([...getDeleted(), id]));
 
const EncountersPage = () => {
 
  const [encounters, setEncounters] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [editingEncounter, setEditingEncounter] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [errors, setErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [encounterApt, setEncounterApt] = useState(null);
 
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
      const deleted = getDeleted();
      setEncounters(Array.isArray(data) ? data.filter(e => !deleted.includes(e.id)) : []);
    } catch { showToast("Failed to load encounters"); }
    finally { setIsLoading(false); }
  };
 
  const fetchPatients = async () => {
    try {
      const res = await fetch(`${API}/patient_read?clinic_id=1`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPatients(Array.isArray(data) ? data.map(p => ({ value: p.id, label: `${p.first_name} ${p.last_name ?? ""}`.trim() })) : []);
    } catch { showToast("Failed to load patients"); }
  };
 
  const fetchDoctors = async () => {
    try {
      const res = await fetch(`${API}/doctorsread`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDoctors(Array.isArray(data) ? data.map(d => ({ value: String(d.id ?? d.doctor_id ?? d.user_id), label: d.full_name ?? d.name ?? `${d.first_name ?? ""} ${d.last_name ?? ""}`.trim() })) : []);
    } catch { showToast("Failed to load doctors"); }
  };
 
  useEffect(() => { fetchEncounters(); fetchPatients(); fetchDoctors(); }, []);
  useEffect(() => { setCurrentPage(1); }, [search]);
 
  const patientName = id => patients.find(p => String(p.value) === String(id))?.label || "—";
  const doctorName = id => doctors.find(d => String(d.value) === String(id))?.label || "—";
 
  const handleEdit = enc => {
    setEditingEncounter(enc);
    setForm({
      patient_id: enc.patient_id ?? "", doctor_id: enc.doctor_id ?? "", appointment_id: enc.appointment_id ?? "",
      visit_date: enc.visit_date ? String(enc.visit_date).split("T")[0] : "",
      follow_up_date: enc.follow_up_date ? String(enc.follow_up_date).split("T")[0] : "",
      chief_complaint: enc.chief_complaint ?? "", notes: enc.notes ?? "",
    });
    setErrors({});
    setShowModal(true);
  };
 
  const handleSave = async () => {
    if (!validate()) return;
    try {
      const payload = {
        id: editingEncounter?.id || null, clinic_id: 1, patient_id: Number(form.patient_id),
        doctor_id: form.doctor_id ? Number(form.doctor_id) : null,
        appointment_id: form.appointment_id ? Number(form.appointment_id) : null,
        visit_date: form.visit_date, chief_complaint: form.chief_complaint,
        notes: form.notes || "", follow_up_date: form.follow_up_date || null,
        created_by: "admin", diagnoses: [], prescriptions: []
      };
      const res = await fetch(`${API}/save_encounter_with_details`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(editingEncounter ? "Encounter updated" : "Encounter added");
      closeModal();
      fetchEncounters();
    } catch (e) { showToast(e.message || "Operation failed"); }
  };
 
  const handleDelete = async id => {
    try {
      await fetch(`${API}/encounter_delete/`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, modified_by: "admin" }) });
    } catch {}
    addDeleted(id);
    setEncounters(prev => prev.filter(e => e.id !== id));
    showToast("Encounter deleted");
    setDeleteConfirm(null);
  };
 
  const filtered = encounters.filter(enc =>
    [enc.id, patientName(enc.patient_id), doctorName(enc.doctor_id), enc.chief_complaint, enc.visit_date]
      .some(v => String(v ?? "").toLowerCase().includes(search.toLowerCase()))
  );
 
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
 
  return (
    <div>
      <PageHeader
        title="Encounters"
        subtitle="Manage clinical encounter records"
        actions={
          <Btn onClick={() => setEncounterApt({ patient_id: form.patient_id, doctor_id: form.doctor_id })}>
            <Icons.Plus /> New Encounter
          </Btn>
        }
      />
 
      {isLoading ? (
        <div className="text-center py-6 text-gray-500">Loading encounters...</div>
      ) : (
        <DataTable
          title="Encounter List"
          subtitle={`${filtered.length} encounters recorded`}
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
                  <button onClick={() => setDeleteConfirm(enc.id)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-slate-400"><Icons.Trash /></button>
                </div>
              </TD>
            </TR>
          ))}
          currentPage={page} totalPages={totalPages} onPageChange={setCurrentPage}
          totalItems={filtered.length} pageSize={pageSize}
          onPageSizeChange={n => { setPageSize(n); setCurrentPage(1); }} pageSizeOptions={[10, 20, 50]}
        />
      )}
 
      {showModal && (
        <Modal title="Edit Encounter" onClose={closeModal} wide>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Visit Date" type="date" value={form.visit_date} onChange={v => setField("visit_date", v)} />
            <Input label="Follow-up Date" type="date" value={form.follow_up_date} onChange={v => setField("follow_up_date", v)} />
            <div className="col-span-2"><Input label="Chief Complaint" value={form.chief_complaint} onChange={v => setField("chief_complaint", v)} /></div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Clinical Notes</label>
              <textarea value={form.notes} onChange={e => setField("notes", e.target.value)} rows={4} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 resize-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Btn variant="secondary" onClick={closeModal}>Cancel</Btn>
            <Btn onClick={handleSave}><Icons.Check /> Update Encounter</Btn>
          </div>
        </Modal>
      )}
 
      {deleteConfirm && (
        <Modal title="Delete Encounter" onClose={() => setDeleteConfirm(null)}>
          <p className="text-sm text-slate-600 mb-6">Are you sure you want to delete this encounter? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Btn variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Btn>
            <Btn onClick={() => handleDelete(deleteConfirm)} style={{ background: "#ef4444" }}>
              <Icons.Trash /> Delete
            </Btn>
          </div>
        </Modal>
      )}
 
      {encounterApt && (
        <EncounterWorkflow
          open={!!encounterApt}
          onClose={() => setEncounterApt(null)}
          appointment={encounterApt}
          patientName={patientName(encounterApt.patient_id)}
          doctorName={doctorName(encounterApt.doctor_id)}
          onComplete={() => { showToast("Encounter saved successfully"); fetchEncounters(); setEncounterApt(null); }}
        />
      )}
 
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
};
 
export default EncountersPage;