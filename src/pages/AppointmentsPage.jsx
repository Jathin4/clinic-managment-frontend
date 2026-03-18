import { useState, useEffect, useRef } from 'react';
import Icons from '../components/Icons';
import { Badge, Modal, Btn, Input, Select, Toast, PageHeader, DataTable, TR, TD, RightDrawer } from '../components/UI';
import CalendarView from '../components/CalendarView';
import EncounterWorkflow from '../components/EncounterWorkflow';
import { useApp } from '../context/AppContext';
 
const API       = process.env.REACT_APP_API_BASE_URL;
const CLINIC_ID = 1;
const COLORS    = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ef4444","#14b8a6","#6366f1","#ec4899","#0ea5e9","#22c55e"];
const STATUS_COLORS = { Booked:"#3b82f6", CheckedIn:"#8b5cf6", Completed:"#10b981", Cancelled:"#ef4444" };
const BLANK     = { patient_id:"", doctor_id:"", appointment_date:"", slot_time:"", notes:"" };
 
const today   = () => new Date().toISOString().slice(0,10);
const nowTime = () => new Date().toTimeString().slice(0,5);
const fmtDate = v => v ? v.slice(0,10).split("-").reverse().join("-") : "—";
const fmtTime = v => v ? v.slice(0,5) : "—";
 
const AppointmentsPage = () => {
  const { showLoading, hideLoading } = useApp();
  const [apts,          setApts]          = useState([]);
  const [patients,      setPatients]      = useState([]);
  const [doctors,       setDoctors]       = useState([]);
  const [formReady,     setFormReady]     = useState(false);
  const [view,          setView]          = useState("table");
  const [search,        setSearch]        = useState("");
  const [showModal,     setShowModal]     = useState(false);
  const [editItem,      setEditItem]      = useState(null);
  const [toast,         setToast]         = useState(null);
  const [currentPage,   setCurrentPage]   = useState(1);
  const [pageSize,      setPageSize]      = useState(10);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [encounterApt,  setEncounterApt]  = useState(null);
  const [form,          setForm]          = useState(BLANK);
 
  const tokenColors = useRef({});
  const getTokenColor = id => {
    if (!tokenColors.current[id])
      tokenColors.current[id] = COLORS[Object.keys(tokenColors.current).length % COLORS.length];
    return tokenColors.current[id];
  };
 
  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 3000); };
  const closeModal = () => { setShowModal(false); setEditItem(null); setForm(BLANK); };
 
  const fetchJSON = async url => { const r = await fetch(url); return r.json(); };
  const fetchApts = () =>
    fetchJSON(`${API}/appointmentsread?clinic_id=${CLINIC_ID}`).then(d => setApts(Array.isArray(d) ? d : []));
 
  useEffect(() => {
    const loadData = async () => {
      try {
        showLoading("Loading appointments...", "appointments");
        await fetchApts();
        await fetchJSON(`${API}/patient_read?clinic_id=${CLINIC_ID}`).then(d => setPatients(Array.isArray(d) ? d : []));
        await fetchJSON(`${API}/doctorsread`).then(d => setDoctors(Array.isArray(d) ? d : []));
        setFormReady(true);
      } catch (err) {
        console.error("Failed to load appointments data", err);
      } finally {
        hideLoading();
      }
    };
    loadData();
  }, []);
 
  // No-op if already loaded
  const loadFormData = async () => {};
 
  const patientLabel = id => { const p = patients.find(p => p.id === id); return p ? `${p.first_name} ${p.last_name}` : "—"; };
  const doctorLabel  = id => { const d = doctors.find(d => d.id === id);  return d ? (d.name || d.full_name || `${d.first_name ?? ""} ${d.last_name ?? ""}`.trim()) : "—"; };
 
  // Names come from DB join — lookups are fallback only until patients/doctors load
 
  const openAdd = async () => {
    await loadFormData();
    setEditItem(null);
    setForm(BLANK);
    setShowModal(true);
  };
 
  const openEdit = async apt => {
    await loadFormData();
    setEditItem(apt);
    setForm({
      patient_id:       apt.patient_id ?? "",
      doctor_id:        apt.doctor_id  ?? "",
      appointment_date: apt.appointment_date?.slice(0,10) ?? "",
      slot_time:        apt.slot_time?.slice(0,5) ?? "",
      notes:            apt.notes ?? "",
    });
    setShowModal(true);
  };
 
  const handleSave = async () => {
    try {
      const res = await fetch(`${API}/appointment_create_update`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editItem ? { id: editItem.id } : {}),
          clinic_id: CLINIC_ID, ...form,
          status:       editItem ? editItem.status : "Booked",
          token_number: editItem ? editItem.token_number : 1,
          is_active:    true,
          user:         "admin",
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
    const apt = apts.find(a => a.id === id);
    await fetch(`${API}/appointment_create_update`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, clinic_id: CLINIC_ID, patient_id: apt.patient_id, doctor_id: apt.doctor_id,
        appointment_date: apt.appointment_date, slot_time: apt.slot_time, status,
        token_number: apt.token_number, notes: apt.notes, is_active: true, user: "admin" }),
    }).catch(console.error);
    fetchApts();
  };
 
  const handleDelete = async id => {
    try {
      await fetch(`${API}/appointment_delete`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, modified_by: "admin" }),
      });
      fetchApts();
      showToast("Appointment deleted");
    } catch { showToast("Delete failed"); }
    finally { setDeleteConfirm(null); }
  };
 
  const filtered  = apts.filter(a =>
    `${a.patient_name || patientLabel(a.patient_id)} ${a.doctor_name || doctorLabel(a.doctor_id)} ${a.status}`.toLowerCase().includes(search.toLowerCase())
  );
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
 
  return (
    <div>
      <PageHeader subtitle="Manage appointment slots" actions={
        <div className="flex items-center gap-2">
          <div className="flex bg-white border border-gray-200 rounded-xl p-1">
            {["table","calendar"].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${view === v ? "text-white" : "text-slate-500"}`}
                style={view === v ? { background: "#0E6C68" } : {}}>
                {v}
              </button>
            ))}
          </div>
          <Btn onClick={openAdd}>
            <Icons.Plus /> Book Appointment
          </Btn>
        </div>
      } />
 
      {view === "table" && (
        <DataTable
          title="Appointment List" subtitle={`${apts.length} total appointments`}
          search={search} onSearch={v => { setSearch(v); setCurrentPage(1); }}
          searchPlaceholder="Search patient, doctor, status…"
          columns={["Token","Patient","Doctor","Date","Time","Notes","Status","Actions"]}
          rows={paginated.map(a => (
            <TR key={a.id}>
              <TD>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: getTokenColor(a.id) }}>{a.token_number}</div>
              </TD>
              <TD bold>{a.patient_name || patientLabel(a.patient_id)}</TD>
              <TD>{a.doctor_name || doctorLabel(a.doctor_id)}</TD>
              <TD>{fmtDate(a.appointment_date)}</TD>
              <TD>{fmtTime(a.slot_time)}</TD>
              <TD muted>{a.notes}</TD>
              <TD><Badge status={a.status} /></TD>
              <TD>
                <div className="flex gap-1 items-center">
                  {a.status === "Booked"    && <Btn size="sm" onClick={() => updateStatus(a.id, "CheckedIn")}>Check In</Btn>}
                  {a.status === "CheckedIn" && <Btn size="sm" onClick={() => setEncounterApt(a)}><Icons.Encounter /> Start Encounter</Btn>}
                  {["Booked","CheckedIn"].includes(a.status) && (
                    <Btn size="sm" variant="secondary" onClick={() => updateStatus(a.id, "Cancelled")}>Cancel</Btn>
                  )}
                  <button onClick={() => openEdit(a)} className="p-1.5 hover:bg-teal-50 hover:text-teal-600 rounded-lg text-slate-400"><Icons.Edit /></button>
                  <button onClick={() => setDeleteConfirm(a.id)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg text-slate-400"><Icons.Trash /></button>
                </div>
              </TD>
            </TR>
          ))}
          currentPage={currentPage} totalPages={Math.ceil(filtered.length / pageSize)}
          onPageChange={setCurrentPage} totalItems={filtered.length}
          pageSize={pageSize} onPageSizeChange={s => { setPageSize(s); setCurrentPage(1); }}
        />
      )}
 
      {view === "calendar" && (
        <CalendarView apts={apts} tokenColors={tokenColors} statusColor={s => STATUS_COLORS[s] || "#0E6C68"} />
      )}
 
      {/* Book / Edit Drawer */}
      <RightDrawer title={editItem ? "Edit Appointment" : "Book Appointment"} open={showModal} onClose={closeModal}>
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
            <Select label="Patient" value={form.patient_id} onChange={v => setForm(f => ({ ...f, patient_id: v }))}
              options={patients.map(p => ({ value: p.id, label: `${p.first_name} ${p.last_name}` }))} />
            <Select label="Doctor" value={form.doctor_id} onChange={v => setForm(f => ({ ...f, doctor_id: v }))}
              options={doctors.map(d => ({ value: d.id, label: d.name }))} />
            <Input label="Appointment Date" type="date" value={form.appointment_date} min={today()}
              onChange={v => setForm(f => ({ ...f, appointment_date: v, slot_time: "" }))} />
            <Input label="Slot Time" type="time" value={form.slot_time}
              onChange={v => setForm(f => ({ ...f, slot_time: v }))}
              min={form.appointment_date === today() ? nowTime() : undefined} />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={3} placeholder="Reason for visit…"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 resize-none" />
            </div>
          </div>
          <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <Btn variant="secondary" onClick={closeModal}>Cancel</Btn>
            <Btn onClick={handleSave} disabled={!form.patient_id || !form.doctor_id || !form.appointment_date}>
              <Icons.Check /> {editItem ? "Update Appointment" : "Book Appointment"}
            </Btn>
          </div>
        </div>
      </RightDrawer>
 
      {/* Delete Confirm */}
      {deleteConfirm && (
        <Modal title="Delete Appointment" onClose={() => setDeleteConfirm(null)}>
          <p className="text-sm text-slate-600 mb-6">Are you sure you want to delete this appointment? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Btn variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Btn>
            <Btn onClick={() => handleDelete(deleteConfirm)} style={{ background: "#ef4444" }}><Icons.Trash /> Delete</Btn>
          </div>
        </Modal>
      )}
 
      {/* Encounter Workflow */}
      {encounterApt && (
        <EncounterWorkflow open onClose={() => setEncounterApt(null)}
          appointment={encounterApt}
          patientName={encounterApt.patient_name || patientLabel(encounterApt.patient_id)}
          doctorName={encounterApt.doctor_name   || doctorLabel(encounterApt.doctor_id)}
          onComplete={() => { fetchApts(); showToast("Encounter completed!"); }} />
      )}
 
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
};
 
export default AppointmentsPage;