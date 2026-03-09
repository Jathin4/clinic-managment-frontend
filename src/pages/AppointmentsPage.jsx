import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import Icons from '../components/Icons';
import { Badge, StatCard, Modal, Btn, Input, Select, Toast, PageHeader, DataTable, TR, TD } from '../components/UI';
import CalendarView from '../components/CalendarView';

const API_BASE =  process.env.REACT_APP_API_BASE_URL;
const CLINIC_ID = 1;

const COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444",
  "#14b8a6", "#6366f1", "#ec4899", "#0ea5e9", "#22c55e"
];

// ── Display formatters ────────────────────────────────────────────────────────

// "2025-03-04"       → "04-03-2025"
const fmtDate = val => {
  if (!val) return "—";
  const s = val.slice(0, 10); // YYYY-MM-DD
  const [y, m, d] = s.split("-");
  return `${d}-${m}-${y}`;
};

// "09:30:00" or "09:30" → "09:30"
const fmtTime = val => {
  if (!val) return "—";
  return val.slice(0, 5); // HH:MM
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const AppointmentsPage = () => {

  const [apts,     setApts]     = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors,  setDoctors]  = useState([]);

  const [view,          setView]          = useState("table");
  const [search,        setSearch]        = useState("");
  const [showModal,     setShowModal]     = useState(false);
  const [editItem,      setEditItem]      = useState(null);   // null = add mode, object = edit mode
  const [toast,         setToast]         = useState(null);
  const [currentPage,   setCurrentPage]   = useState(1);
  const [pageSize,      setPageSize]      = useState(10);
  const [deleteConfirm, setDeleteConfirm] = useState(null);  // holds id pending delete

  const blank = { patient_id: "", doctor_id: "", appointment_date: "", slot_time: "", notes: "" };
  const [form, setForm] = useState(blank);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // ── Stable token colours ──────────────────────────────────────────────────
  const tokenColors = useRef({});
  const getTokenColor = id => {
    if (!tokenColors.current[id]) {
      tokenColors.current[id] = COLORS[Object.keys(tokenColors.current).length % COLORS.length];
    }
    return tokenColors.current[id];
  };

  // ── Data fetching ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchAppointments();
    fetchPatients();
    fetchDoctors();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res  = await fetch(`${API_BASE}/appointmentsread?clinic_id=${CLINIC_ID}`);
      const data = await res.json();
      setApts(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Error loading appointments", err); }
  };

  const fetchPatients = async () => {
    try {
      const res  = await fetch(`${API_BASE}/patient_read?clinic_id=${CLINIC_ID}`);
      const data = await res.json();
      setPatients(data);
    } catch (err) { console.error(err); }
  };

  const fetchDoctors = async () => {
    try {
      const res  = await fetch(`${API_BASE}/doctorsread`);
      const data = await res.json();
      setDoctors(data);
    } catch (err) { console.error(err); }
  };

  // ── Open modal helpers ────────────────────────────────────────────────────
  const openAdd = () => {
    setEditItem(null);
    setForm(blank);
    setShowModal(true);
  };

  // Pre-fill form with existing appointment data for editing
  const openEdit = apt => {
    setEditItem(apt);
    setForm({
      patient_id:       apt.patient_id       ?? "",
      doctor_id:        apt.doctor_id        ?? "",
      // slice to YYYY-MM-DD in case backend returns datetime string
      appointment_date: apt.appointment_date ? apt.appointment_date.slice(0, 10) : "",
      // slice to HH:MM in case backend returns HH:MM:SS
      slot_time:        apt.slot_time        ? apt.slot_time.slice(0, 5) : "",
      notes:            apt.notes            || "",
    });
    setShowModal(true);
  };

  // ── Save: create or update ────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      const payload = {
        // include id only when editing — SP treats NULL id as INSERT
        ...(editItem ? { id: editItem.id } : {}),
        clinic_id:        CLINIC_ID,
        patient_id:       form.patient_id,
        doctor_id:        form.doctor_id,
        appointment_date: form.appointment_date,
        slot_time:        form.slot_time,
        // preserve existing status on edit; default to Booked on create
        status:           editItem ? editItem.status : "Booked",
        token_number:     editItem ? editItem.token_number : 1,
        notes:            form.notes,
        is_active:        true,
        user:             "admin",
      };

      const res    = await fetch(`${API_BASE}/appointment_create_update`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const result = await res.json();

      if (res.ok) {
        fetchAppointments();
        setShowModal(false);
        setForm(blank);
        setEditItem(null);
        showToast(editItem ? "Appointment updated" : "Appointment booked");
      } else {
        showToast(result.error || "Failed to save appointment");
      }
    } catch (err) {
      console.error(err);
      showToast("Server error");
    }
  };

  // ── Update status (Check In / Complete / Cancel) ──────────────────────────
  const updateStatus = async (id, status) => {
    const apt = apts.find(a => a.id === id);
    try {
      const payload = {
        id,
        clinic_id:        CLINIC_ID,
        patient_id:       apt.patient_id,
        doctor_id:        apt.doctor_id,
        appointment_date: apt.appointment_date,
        slot_time:        apt.slot_time,
        status,
        token_number:     apt.token_number,
        notes:            apt.notes,
        is_active:        true,
        user:             "admin",
      };
      await fetch(`${API_BASE}/appointment_create_update`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      fetchAppointments();
    } catch (err) { console.error(err); }
  };

  // ── Delete: fixed — SP requires both `id` and `modified_by` ──────────────
  const handleDelete = async id => {
    try {
      await fetch(`${API_BASE}/appointment_delete`, {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id, modified_by: "admin" }),  // ← fixed
      });
      fetchAppointments();
      showToast("Appointment deleted");
    } catch (err) {
      console.error(err);
      showToast("Delete failed");
    } finally {
      setDeleteConfirm(null);
    }
  };

  // ── Display helpers ───────────────────────────────────────────────────────
  const patientName = id => {
    const p = patients.find(p => p.id === id);
    return p ? `${p.first_name} ${p.last_name}` : "—";
  };

  const doctorName = id => {
    const d = doctors.find(d => d.id === id);
    return d ? d.name : "—";
  };

  const statusColor = s => ({
    Booked:    "#3b82f6",
    CheckedIn: "#8b5cf6",
    Completed: "#10b981",
    Cancelled: "#ef4444",
  }[s] || "#0E6C68");

  const filtered = v => {
    if (!v) return apts;
    return apts.filter(a => {
      const pn = patientName(a.patient_id);
      const dn = doctorName(a.doctor_id);
      return (
        pn.toLowerCase().includes(v.toLowerCase()) ||
        dn.toLowerCase().includes(v.toLowerCase()) ||
        a.status.toLowerCase().includes(v.toLowerCase())
      );
    });
  };

  const rows      = filtered(search);
  const paginated = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        subtitle="Manage appointment slots"
        actions={
          <div className="flex items-center gap-2">

            {/* Table / Calendar toggle */}
            <div className="flex bg-white border border-gray-200 rounded-xl p-1">
              {["table", "calendar"].map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${view === v ? "text-white" : "text-slate-500"}`}
                  style={view === v ? { background: "#0E6C68" } : {}}
                >
                  {v}
                </button>
              ))}
            </div>

            <Btn onClick={openAdd}>
              <Icons.Plus />Book Appointment
            </Btn>

          </div>
        }
      />

      {/* ── Table view ─────────────────────────────────────────────────────── */}
      {view === "table" && (
        <DataTable
          title="Appointment List"
          subtitle={`${apts.length} total appointments`}
          search={search}
          onSearch={v => { setSearch(v); setCurrentPage(1); }}
          searchPlaceholder="Search patient, doctor, status…"
          columns={["Token", "Patient", "Doctor", "Date", "Time", "Notes", "Status", "Actions"]}
          rows={paginated.map(a => (
            <TR key={a.id}>

              {/* Coloured token bubble */}
              <TD>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: getTokenColor(a.id) }}
                >
                  {a.token_number}
                </div>
              </TD>

              <TD bold>{patientName(a.patient_id)}</TD>
              <TD>{doctorName(a.doctor_id)}</TD>
              <TD>{fmtDate(a.appointment_date)}</TD>
              <TD>{fmtTime(a.slot_time)}</TD>
              <TD muted>{a.notes}</TD>
              <TD><Badge status={a.status} /></TD>

              {/* Actions column */}
              <TD>
                <div className="flex gap-1 items-center">

                  {/* Status transition buttons */}
                  {a.status === "Booked" && (
                    <Btn size="sm" onClick={() => updateStatus(a.id, "CheckedIn")}>Check In</Btn>
                  )}
                  {a.status === "CheckedIn" && (
                    <Btn size="sm" onClick={() => updateStatus(a.id, "Completed")}>Complete</Btn>
                  )}
                  {(a.status === "Booked" || a.status === "CheckedIn") && (
                    <Btn size="sm" variant="secondary" onClick={() => updateStatus(a.id, "Cancelled")}>Cancel</Btn>
                  )}

                  {/* Edit icon — pencil, always visible */}
                  <button
                    onClick={() => openEdit(a)}
                    className="p-1.5 hover:bg-teal-50 hover:text-teal-600 rounded-lg transition-colors text-slate-400"
                    title="Edit appointment"
                  >
                    <Icons.Edit />
                  </button>

                  {/* Delete icon — trash, always visible, opens confirm modal */}
                  <button
                    onClick={() => setDeleteConfirm(a.id)}
                    className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-slate-400"
                    title="Delete appointment"
                  >
                    <Icons.Trash />
                  </button>

                </div>
              </TD>

            </TR>
          ))}
          currentPage={currentPage}
          totalPages={Math.ceil(rows.length / pageSize)}
          onPageChange={setCurrentPage}
          totalItems={rows.length}
          pageSize={pageSize}
          onPageSizeChange={s => { setPageSize(s); setCurrentPage(1); }}
        />
      )}

      {/* ── Calendar view ───────────────────────────────────────────────────── */}
      {view === "calendar" && (
        <CalendarView
          apts={apts}
          patientName={patientName}
          doctorName={doctorName}
          tokenColors={tokenColors}
          statusColor={statusColor}
        />
      )}

      {/* ── Add / Edit Modal ─────────────────────────────────────────────────── */}
      {showModal && (
        <Modal
          title={editItem ? "Edit Appointment" : "Book Appointment"}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          wide
        >
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Patient"
              value={form.patient_id}
              onChange={v => setForm({ ...form, patient_id: v })}
              options={patients.map(p => ({ value: p.id, label: `${p.first_name} ${p.last_name}` }))}
            />
            <Select
              label="Doctor"
              value={form.doctor_id}
              onChange={v => setForm({ ...form, doctor_id: v })}
              options={doctors.map(d => ({ value: d.id, label: d.name }))}
            />
            <Input
              label="Appointment Date"
              type="date"
              value={form.appointment_date}
              onChange={v => setForm({ ...form, appointment_date: v })}
            />
            <Input
              label="Slot Time"
              type="time"
              value={form.slot_time}
              onChange={v => setForm({ ...form, slot_time: v })}
            />
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 resize-none"
                placeholder="Reason for visit…"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Btn variant="secondary" onClick={() => { setShowModal(false); setEditItem(null); }}>
              Cancel
            </Btn>
            <Btn
              onClick={handleSave}
              disabled={!form.patient_id || !form.doctor_id || !form.appointment_date}
            >
              <Icons.Check />
              {editItem ? "Update Appointment" : "Book Appointment"}
            </Btn>
          </div>
        </Modal>
      )}

      {/* ── Delete confirmation modal ─────────────────────────────────────────── */}
      {deleteConfirm && (
        <Modal title="Delete Appointment" onClose={() => setDeleteConfirm(null)}>
          <p className="text-sm text-slate-600 mb-6">
            Are you sure you want to delete this appointment? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Btn variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Btn>
            <Btn
              onClick={() => handleDelete(deleteConfirm)}
              style={{ background: "#ef4444" }}
            >
              <Icons.Trash /> Delete
            </Btn>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

    </div>
  );
};

export default AppointmentsPage;