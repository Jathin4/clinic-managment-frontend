import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import Icons from '../components/Icons';
import { Badge, StatCard, Modal, Btn, Input, Select, Toast, PageHeader, DataTable, TR, TD } from '../components/UI';

const API_BASE = "http://localhost:5020";
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

// ── Calendar helpers ──────────────────────────────────────────────────────────

const getDaysInMonth     = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ── CalendarView ──────────────────────────────────────────────────────────────

const CalendarView = ({ apts, patientName, doctorName, tokenColors, statusColor }) => {
  const today = new Date();
  const [year,     setYear]     = useState(today.getFullYear());
  const [month,    setMonth]    = useState(today.getMonth());
  const [selected, setSelected] = useState(null);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelected(null);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelected(null);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay    = getFirstDayOfMonth(year, month);

  const aptsOnDay = day => {
    const dateStr = `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return apts.filter(a => a.appointment_date === dateStr);
  };

  const selectedApts = selected ? aptsOnDay(selected) : [];

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = day =>
    day &&
    today.getFullYear() === year &&
    today.getMonth()    === month &&
    today.getDate()     === day;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-slate-800">
          {MONTH_NAMES[month]} {year}
        </h2>
        <div className="flex gap-1">
          <button
            onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-slate-500 hover:bg-gray-50 transition-colors text-sm font-bold"
          >‹</button>
          <button
            onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelected(null); }}
            className="px-3 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-slate-500 hover:bg-gray-50 transition-colors text-xs font-medium"
          >Today</button>
          <button
            onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-slate-500 hover:bg-gray-50 transition-colors text-sm font-bold"
          >›</button>
        </div>
      </div>

      <div className="flex">

        {/* Grid */}
        <div className="flex-1 p-4">
          <div className="grid grid-cols-7 mb-2">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-slate-400 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) => {
              if (!day) return <div key={`e-${idx}`} />;
              const dayApts    = aptsOnDay(day);
              const isSelected = selected === day;
              const isTodayDay = isToday(day);

              return (
                <button
                  key={day}
                  onClick={() => setSelected(isSelected ? null : day)}
                  className={`
                    relative min-h-[64px] p-1.5 rounded-xl border text-left transition-all
                    ${isSelected
                      ? "border-teal-400 bg-teal-50"
                      : isTodayDay
                        ? "border-teal-200 bg-teal-50/40"
                        : "border-transparent hover:border-gray-200 hover:bg-gray-50"}
                  `}
                >
                  <span
                    className="inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-medium mb-1"
                    style={isTodayDay ? { background: "#0E6C68", color: "#fff" } : { color: "#475569" }}
                  >
                    {day}
                  </span>
                  <div className="space-y-0.5">
                    {dayApts.slice(0, 2).map(a => (
                      <div
                        key={a.id}
                        className="text-[10px] font-medium px-1 py-0.5 rounded text-white truncate"
                        style={{ background: tokenColors.current[a.id] || "#0E6C68" }}
                        title={patientName(a.patient_id)}
                      >
                        {fmtTime(a.slot_time)} {patientName(a.patient_id).split(" ")[0]}
                      </div>
                    ))}
                    {dayApts.length > 2 && (
                      <div className="text-[10px] text-slate-400 pl-1">+{dayApts.length - 2} more</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Side panel */}
        {selected && (
          <div className="w-72 border-l border-gray-100 p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              {MONTH_NAMES[month]} {selected}
              <span className="ml-2 text-xs font-normal text-slate-400">
                {selectedApts.length} apt{selectedApts.length !== 1 ? "s" : ""}
              </span>
            </h3>
            {selectedApts.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No appointments this day.</p>
            ) : (
              <div className="space-y-3">
                {selectedApts.map(a => (
                  <div key={a.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: tokenColors.current[a.id] || "#0E6C68" }}
                      >
                        {a.token_number}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{patientName(a.patient_id)}</p>
                        <p className="text-[11px] text-slate-400 truncate">{doctorName(a.doctor_id)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">{fmtTime(a.slot_time)}</span>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                        style={{ background: statusColor(a.status) }}
                      >
                        {a.status}
                      </span>
                    </div>
                    {a.notes && (
                      <p className="mt-1.5 text-[11px] text-slate-400 italic truncate">{a.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
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
        title="Appointments"
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