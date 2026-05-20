import { useState, useEffect, useCallback } from "react";

const API_BASE = process.env.REACT_APP_API_BASE_URL;

// ─── Constants ────────────────────────────────────────────────────────────────
const GENDERS = ["Male", "Female", "Other"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const REFERENCES = ["Friend/Relative", "Google", "Social Media", "Advertisement", "Other"];
const TODAY = new Date().toISOString().slice(0, 10);

const PINCODES = {
  "500001": ["Abids", "Nampally", "King Koti", "Gunfoundry", "Mozampura", "Ramkote"],
  "500002": ["Charminar", "CharKaman", "Moghulpura", "Purani Haveli", "Dewan Devdi"],
  "500003": ["Secunderabad", "Begumpet", "Picket"],
  "500004": ["Khairatabad", "Chintal Basti", "Lakdikapul", "Bazar Ghat", "Erramanzil"],
  "500012": ["Begumbazar", "Bazarghat"],
  "500013": ["Amberpet", "Gandhi Nagar"],
  "500018": ["Ameerpet", "Sanathnagar", "Vivekananda Nagar"],
  "500023": ["Yakutpura"],
  "500027": ["Barkatpura", "Himayatnagar", "Kacheguda"],
  "500029": ["Himayatnagar"],
  "500030": ["Rajendranagar", "Agricultural College"],
  "500032": ["Gachibowli", "Raidurg"],
  "500034": ["Banjara Hills", "Jubilee Hills"],
  "500035": ["Saroor Nagar"],
  "500037": ["Balanagar"],
  "500043": ["Maisammaguda", "Kompally", "Dullapally"],
  "500050": ["Chanda Nagar", "Chandan Nagar"],
  "500053": ["Falaknuma"],
  "500064": ["Bahadurpura"],
  "500072": ["Kukatpally", "HMT Township"],
  "500074": ["L.B. Nagar"],
  "500081": ["Madhapur", "Hitech City"],
  "500082": ["Somajiguda", "Raj Bhavan Road"],
  "500089": ["Manikonda"],
};

const BLANK_PATIENT = {
  first_name: "", last_name: "", email: "", phone: "", dob: "", age: "",
  gender: "", blood_group: "", weight: "", reference: "", address: "",
  bp: "", pulse_rate: "", pincode: "",
};

const BLANK_APPT = { doctor_id: "", appointment_date: TODAY, slot_time: "", notes: "", fee: "" };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const calcAge = (dob) => {
  if (!dob || dob.length < 10) return "";
  const b = new Date(dob), t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
  return a >= 0 ? String(a) : "";
};

const CLINIC_OPEN_MIN = 9 * 60;
const CLINIC_CLOSE_MIN = 21 * 60; // clinic closes at 21:00, last start slot is 20:45

const toMinutes = time => {
  if (!time || typeof time !== "string") return NaN;
  const [h, m] = time.split(":").map(Number);
  return Number.isNaN(h) || Number.isNaN(m) ? NaN : h * 60 + m;
};

const isWithinClinicHours = (slotTime) => {
  const mins = toMinutes(slotTime);
  return !Number.isNaN(mins) && mins >= CLINIC_OPEN_MIN && mins < CLINIC_CLOSE_MIN;
};

// Generate all 15-min slots from 09:00 to 20:45
const generateSlots = () => {
  const slots = [];
  for (let h = 9; h < 21; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    slots.push(`${String(h).padStart(2, "0")}:15`);
    slots.push(`${String(h).padStart(2, "0")}:30`);
    slots.push(`${String(h).padStart(2, "0")}:45`);
  }
  return slots;
};
const ALL_SLOTS = generateSlots();

// Check if a slot is in the past (for today only)
const isSlotInPast = (date, slotTime) => {
  if (date !== TODAY) return false;
  const now = new Date();
  const [h, m] = slotTime.split(":").map(Number);
  const slotDate = new Date();
  slotDate.setHours(h, m, 0, 0);
  return slotDate <= now;
};

// ─── Tiny UI primitives (standalone, no import needed) ───────────────────────
const Label = ({ children, required }) => (
  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
    {children}{required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);

const FieldError = ({ msg }) =>
  msg ? <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
    {msg}
  </p> : null;

const SInput = ({ label, required, error, type = "text", value, onChange, placeholder, min, max, disabled }) => (
  <div>
    <Label required={required}>{label}</Label>
    <input
      type={type} value={value ?? ""} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} min={min} max={max} disabled={disabled}
      className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all
        ${error ? "border-red-300 focus:border-red-400 focus:ring-red-50 bg-red-50/30" : "border-gray-200 focus:border-teal-400 focus:ring-teal-50"}
        ${disabled ? "bg-gray-50 text-slate-400 cursor-not-allowed" : "bg-white"}`}
    />
    <FieldError msg={error} />
  </div>
);

const SSelect = ({ label, required, error, value, onChange, options, disabled, placeholder = "Select" }) => (
  <div>
    <Label required={required}>{label}</Label>
    <select
      value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
      className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all bg-white
        ${error ? "border-red-300 focus:border-red-400 focus:ring-red-50" : "border-gray-200 focus:border-teal-400 focus:ring-teal-50"}
        ${disabled ? "bg-gray-50 text-slate-400 cursor-not-allowed" : ""}`}
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
    </select>
    <FieldError msg={error} />
  </div>
);

// ─── Step indicator ───────────────────────────────────────────────────────────
const StepIndicator = ({ step }) => (
  <div className="flex items-center justify-center gap-3 mb-8">
    {[
      { n: 1, label: "Your Details" },
      { n: 2, label: "Book Slot" },
      { n: 3, label: "Confirmed" },
    ].map(({ n, label }, i, arr) => (
      <div key={n} className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
            ${step > n ? "bg-teal-600 text-white" : step === n ? "bg-teal-700 text-white ring-4 ring-teal-100" : "bg-gray-100 text-gray-400"}`}>
            {step > n ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
            ) : n}
          </div>
          <span className={`text-xs font-semibold hidden sm:block ${step === n ? "text-teal-700" : step > n ? "text-teal-500" : "text-gray-400"}`}>{label}</span>
        </div>
        {i < arr.length - 1 && (
          <div className={`w-8 h-0.5 rounded-full ${step > n ? "bg-teal-400" : "bg-gray-200"}`} />
        )}
      </div>
    ))}
  </div>
);

// ─── STEP 1: Patient Form ─────────────────────────────────────────────────────
const PatientForm = ({ clinicId, onNext }) => {
  const [form, setForm] = useState(BLANK_PATIENT);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [dupPatient, setDupPatient] = useState(null); // existing patient found

  const set = (key, val) => {
    setForm(p => ({ ...p, [key]: val, ...(key === "dob" ? { age: calcAge(val) } : {}) }));
    setErrors(p => ({ ...p, [key]: undefined, _dup: undefined }));
    setDupPatient(null);
  };

  // ── Client-side duplicate check via patient_read ──
  const checkDuplicate = useCallback(async (f) => {
    if (!f.first_name || !f.last_name || !f.phone || !f.dob) return null;
    try {
      const res = await fetch(`${API_BASE}/patient_read?clinic_id=${clinicId}`);
      const data = await res.json();
      if (!Array.isArray(data)) return null;
      const norm = s => (s || "").trim().toLowerCase();
      return data.find(p =>
        norm(p.first_name) === norm(f.first_name) &&
        norm(p.last_name) === norm(f.last_name) &&
        (p.phone || "").trim() === (f.phone || "").trim() &&
        (p.dob || "").trim() === (f.dob || "").trim()
      ) || null;
    } catch { return null; }
  }, [clinicId]);

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = "First name is required";
    if (!form.last_name.trim()) e.last_name = "Last name is required";
    // ── Validation 2: DOB must not be a future date ──
    if (form.dob && form.dob > TODAY) e.dob = "Date of birth cannot be a future date";
    if (!form.age) e.age = "Age is required";
    else if (isNaN(form.age) || Number(form.age) < 0 || Number(form.age) > 120) e.age = "Enter a valid age";
    if (!form.gender) e.gender = "Gender is required";
    // if (!form.blood_group) e.blood_group = "Blood group is required";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(form.phone)) e.phone = "Must be exactly 10 digits";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email format";
    if (!form.weight) e.weight = "Weight is required";
    else if (isNaN(form.weight) || Number(form.weight) < 1 || Number(form.weight) > 300) e.weight = "Enter a valid weight (1–300 kg)";
    // if (!form.bp.trim()) e.bp = "Blood pressure is required";
    // else if (!/^\d{2,3}\/\d{2,3}$/.test(form.bp)) e.bp = "Use format like 120/80";
    // if (!form.pulse_rate) e.pulse_rate = "Pulse rate is required";
    // else if (isNaN(form.pulse_rate) || Number(form.pulse_rate) < 30 || Number(form.pulse_rate) > 250) e.pulse_rate = "Enter a valid pulse (30–250 bpm)";
    // if (!form.notes.trim()) e.notes = "Patient notes are required";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    setSaving(true);
    // Check duplicate first
    const existing = await checkDuplicate(form);
    if (existing) {
      setSaving(false);
      setDupPatient(existing);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/patient_self_register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinic_id: clinicId,
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          dob: form.dob || null,
          age: parseInt(form.age),
          gender: form.gender,
          blood_group: form.blood_group,
          weight: parseFloat(form.weight),
          reference: form.reference,
          address: form.address,
          bp: form.bp.trim(),
          pulse_rate: form.pulse_rate,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "";
        if (msg.includes("phone")) setErrors(p => ({ ...p, phone: "This phone number is already registered" }));
        else if (msg.includes("email")) setErrors(p => ({ ...p, email: "This email is already registered" }));
        else if (msg.includes("name")) setErrors(p => ({ ...p, _dup: "A patient with this name already exists." }));
        else setErrors(p => ({ ...p, _dup: msg || "Registration failed. Please try again." }));
        return;
      }
      onNext({ patientId: data.id, patientName: `${form.first_name} ${form.last_name}`, isNew: true });
    } catch {
      setErrors(p => ({ ...p, _dup: "Network error. Please check your connection." }));
    } finally {
      setSaving(false);
    }
  };

  // If duplicate found, let them proceed to booking
  if (dupPatient) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-full bg-teal-50 border-2 border-teal-200 flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0f766e" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Welcome back!</h3>
        <p className="text-sm text-gray-500 mb-1">We found your existing record:</p>
        <p className="font-bold text-teal-700 text-base mb-1">{dupPatient.first_name} {dupPatient.last_name}</p>
        <p className="text-sm text-gray-400 mb-6">Phone: {dupPatient.phone} · DOB: {dupPatient.dob}</p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => onNext({ patientId: dupPatient.id, patientName: `${dupPatient.first_name} ${dupPatient.last_name}`, isNew: false })}
            className="w-full py-3 bg-teal-700 text-white font-bold rounded-xl hover:bg-teal-800 transition-all flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            Book Appointment
          </button>
          <button
            onClick={() => { setDupPatient(null); setForm(BLANK_PATIENT); }}
            className="w-full py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 text-sm"
          >
            Not you? Register differently
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Patient Registration</h2>
      <p className="text-sm text-gray-400 mb-6">Please fill in your details accurately</p>

      {errors._dup && (
        <div className="mb-4 flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          {errors._dup}
        </div>
      )}

      <div className="space-y-4">
        {/* Name */}
        <div className="grid grid-cols-2 gap-3">
          <SInput label="First Name" required error={errors.first_name} value={form.first_name}
            onChange={v => set("first_name", v.replace(/[^a-zA-Z\s]/g, ""))} placeholder="First name" />
          <SInput label="Last Name" required error={errors.last_name} value={form.last_name}
            onChange={v => set("last_name", v.replace(/[^a-zA-Z\s]/g, ""))} placeholder="Last name" />
        </div>

        {/* DOB + Age */}
        <div className="grid grid-cols-2 gap-3">
          <SInput label="Date of Birth" type="date" error={errors.dob} value={form.dob}
            max={TODAY} onChange={v => set("dob", v)} />
          <SInput label="Age (years)" required type="number" error={errors.age} value={form.age}
            onChange={v => set("age", v.replace(/\D/g, "").slice(0, 3))} placeholder="Age" />
        </div>

        {/* Gender + Blood Group */}
        <div className="grid grid-cols-2 gap-3">
          <SSelect label="Gender" required error={errors.gender} value={form.gender}
            onChange={v => set("gender", v)} options={GENDERS} />
          <SSelect label="Blood Group" error={errors.blood_group} value={form.blood_group}
            onChange={v => set("blood_group", v)} options={BLOOD_GROUPS} />
        </div>

        {/* Phone + Email */}
        <div className="grid grid-cols-2 gap-3">
          <SInput label="Phone" required type="tel" error={errors.phone} value={form.phone}
            onChange={v => set("phone", v.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit number" />
          <SInput label="Email" type="email" error={errors.email} value={form.email}
            onChange={v => set("email", v)} placeholder="Optional" />
        </div>

        {/* Weight + BP */}
        <div className="grid grid-cols-2 gap-3">
          <SInput label="Weight (kg)" required type="number" error={errors.weight} value={form.weight}
            onChange={v => set("weight", v.replace(/\D/g, "").slice(0, 3))} placeholder="e.g. 70" />
          <SInput label="Blood Pressure" error={errors.bp} value={form.bp}
            onChange={v => set("bp", v)} placeholder="e.g. 120/80" />
        </div>

        {/* Pulse Rate + Reference */}
        <div className="grid grid-cols-2 gap-3">
          <SInput label="Pulse Rate (bpm)" type="number" error={errors.pulse_rate} value={form.pulse_rate}
            onChange={v => set("pulse_rate", v.replace(/\D/g, "").slice(0, 3))} placeholder="e.g. 72" />
          <SSelect label="How did you hear about us?" value={form.reference}
            onChange={v => set("reference", v)} options={REFERENCES} />
        </div>

        {/* Pincode + Area */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Pincode</Label>
            <select value={form.pincode}
              onChange={e => { set("pincode", e.target.value); set("address", ""); }}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 bg-white">
              <option value="">Select pincode</option>
              {Object.keys(PINCODES).map(pin => <option key={pin} value={pin}>{pin}</option>)}
            </select>
          </div>
          <div>
            <Label>Area</Label>
            <select value={form.address} onChange={e => set("address", e.target.value)} disabled={!form.pincode}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 bg-white disabled:bg-gray-50 disabled:text-gray-400">
              <option value="">{form.pincode ? "Select area" : "Select pincode first"}</option>
              {form.pincode && PINCODES[form.pincode]?.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={handleSubmit} disabled={saving}
        className="mt-6 w-full py-3.5 bg-teal-700 text-white font-bold rounded-xl hover:bg-teal-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-base"
      >
        {saving ? (
          <>
            <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
            Checking...
          </>
        ) : (
          <>
            Continue to Book Appointment
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </>
        )}
      </button>
    </div>
  );
};

// ─── STEP 2: Appointment Booking ──────────────────────────────────────────────
const AppointmentForm = ({ clinicId, patientId, patientName, onBack, onSuccess }) => {
  const [form, setForm] = useState(BLANK_APPT);
  const [errors, setErrors] = useState({});
  const [doctors, setDoctors] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]); // [{slot_time}] for selected doctor+date
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load doctors
  useEffect(() => {
    fetch(`${API_BASE}/doctorsread`)
      .then(r => r.json())
      .then(d => setDoctors(Array.isArray(d) ? d : []))
      .catch(() => { });
  }, []);

  // Whenever doctor or date changes, fetch that doctor's booked slots
  useEffect(() => {
    if (!form.doctor_id || !form.appointment_date) {
      setBookedSlots([]);
      setForm(p => ({ ...p, slot_time: "" }));
      return;
    }
    setLoadingSlots(true);
    setForm(p => ({ ...p, slot_time: "" })); // reset slot on doctor/date change
    fetch(`${API_BASE}/appointmentsread?clinic_id=${clinicId}`)
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        const taken = data
          .filter(a =>
            String(a.doctor_id) === String(form.doctor_id) &&
            a.appointment_date?.slice(0, 10) === form.appointment_date &&
            a.status !== "Cancelled"
          )
          .map(a => a.slot_time?.slice(0, 5)); // "HH:MM"
        setBookedSlots(taken);
      })
      .catch(() => { })
      .finally(() => setLoadingSlots(false));
  }, [form.doctor_id, form.appointment_date, clinicId]);

  const setField = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    setErrors(p => ({ ...p, [key]: undefined, _submit: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.doctor_id) e.doctor_id = "Please select a doctor";
    if (!form.appointment_date) e.appointment_date = "Appointment date is required";
    else if (form.appointment_date < TODAY) e.appointment_date = "Cannot book a past date";
    if (!form.slot_time) e.slot_time = "Please select a time slot";
    else if (!isWithinClinicHours(form.slot_time)) e.slot_time = "Clinic is open only from 09:00 to 21:00";
    else if (bookedSlots.includes(form.slot_time)) e.slot_time = "This slot is already booked. Please choose another.";
    else if (isSlotInPast(form.appointment_date, form.slot_time)) e.slot_time = "This time has already passed";
    if (!(form.notes || "").trim()) e.notes = "Patient notes are required";
    return e;
  };

  const handleBook = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/appointment_create_update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinic_id: clinicId,
          patient_id: patientId,
          doctor_id: parseInt(form.doctor_id),
          appointment_date: form.appointment_date,
          slot_time: form.slot_time + ":00",
          notes: (form.notes || "").trim(),
          status: "Booked",
          token_number: 1,
          is_active: true,
          user: "self_register",
          fee: form.fee ? parseInt(form.fee) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = (data.error || "").toLowerCase();
        if (msg.includes("already") || msg.includes("slot")) {
          setErrors(p => ({ ...p, slot_time: "This slot was just taken. Please choose another time." }));
          // Refresh booked slots
          const refresh = await fetch(`${API_BASE}/appointmentsread?clinic_id=${clinicId}`);
          const rdata = await refresh.json();
          if (Array.isArray(rdata)) {
            const taken = rdata
              .filter(a =>
                String(a.doctor_id) === String(form.doctor_id) &&
                a.appointment_date?.slice(0, 10) === form.appointment_date &&
                a.status !== "Cancelled"
              )
              .map(a => a.slot_time?.slice(0, 5));
            setBookedSlots(taken);
          }
        } else {
          setErrors(p => ({ ...p, _submit: data.error || "Booking failed. Please try again." }));
        }
        return;
      }
      const doctor = doctors.find(d => String(d.id) === String(form.doctor_id));
      const doctorName = doctor ? (doctor.name || `${doctor.first_name || ""} ${doctor.last_name || ""}`.trim()) : `Doctor #${form.doctor_id}`;
      onSuccess({
        appointmentId: data.appointment_id,
        patientName,
        doctorName,
        date: form.appointment_date,
        time: form.slot_time,
        notes: form.notes,
      });
    } catch {
      setErrors(p => ({ ...p, _submit: "Network error. Please try again." }));
    } finally {
      setSaving(false);
    }
  };

  // Available slot grid: group by hour
  const slotsByHour = {};
  ALL_SLOTS.forEach(slot => {
    const hour = slot.split(":")[0];
    if (!slotsByHour[hour]) slotsByHour[hour] = [];
    slotsByHour[hour].push(slot);
  });

  const slotStatus = (slot) => {
    if (bookedSlots.includes(slot)) return "booked";
    if (isSlotInPast(form.appointment_date, slot)) return "past";
    return "available";
  };

  return (
    <div>
      {/* Patient badge */}
      <div className="flex items-center gap-3 mb-5 p-3 bg-teal-50 rounded-xl border border-teal-100">
        <div className="w-9 h-9 rounded-full bg-teal-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {patientName?.[0]?.toUpperCase() || "P"}
        </div>
        <div>
          <p className="text-xs text-teal-500 font-medium">Booking for</p>
          <p className="text-sm font-bold text-teal-800">{patientName}</p>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-1">Book Appointment</h2>
      <p className="text-sm text-gray-400 mb-6">Select your preferred doctor, date and time</p>

      {errors._submit && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {errors._submit}
        </div>
      )}

      <div className="space-y-5">
        {/* Doctor */}
        <SSelect label="Select Doctor" required error={errors.doctor_id} value={form.doctor_id}
          onChange={v => setField("doctor_id", v)}
          options={doctors.map(d => ({
            value: d.id,
            label: d.name || `${d.first_name || ""} ${d.last_name || ""}`.trim() || `Doctor #${d.id}`,
          }))}
          placeholder="Choose a doctor"
        />

        {/* Date */}
        <SInput label="Appointment Date" required type="date" error={errors.appointment_date}
          value={form.appointment_date} min={TODAY}
          onChange={v => setField("appointment_date", v)} />

        {/* Slot picker */}
        {form.doctor_id && form.appointment_date && (
          <div>
            <Label required>Select Time Slot <span className="text-xs text-gray-400 font-normal ml-1">(15-min sessions)</span></Label>
            {loadingSlots ? (
              <div className="flex items-center gap-2 py-4 text-sm text-gray-400">
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
                Loading available slots...
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Legend */}
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-teal-600 inline-block"></span>Available</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 border border-red-200 inline-block"></span>Booked</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-100 inline-block"></span>Unavailable</span>
                </div>
                <div className="p-3 max-h-40 overflow-y-auto space-y-2">
                  {Object.entries(slotsByHour).map(([hour, slots]) => (
                    <div key={hour} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-12 shrink-0 font-mono">
                        {Number(hour) < 12 ? `${hour}:00` : `${Number(hour) > 12 ? Number(hour) - 12 : 12}:00`}
                        {Number(hour) < 12 ? " AM" : " PM"}
                      </span>
                      <div className="flex gap-1 flex-wrap">
                        {slots.map(slot => {
                          const status = slotStatus(slot);
                          const selected = form.slot_time === slot;
                          return (
                            <button
                              key={slot}
                              disabled={status !== "available"}
                              onClick={() => { setField("slot_time", slot); }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border
                                ${selected
                                  ? "bg-teal-700 text-white border-teal-700 ring-2 ring-teal-200"
                                  : status === "booked"
                                    ? "bg-red-50 text-red-300 border-red-100 cursor-not-allowed line-through"
                                    : status === "past"
                                      ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                                      : "bg-white text-gray-700 border-gray-200 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 cursor-pointer"
                                }`}
                              title={status === "booked" ? "Already booked" : status === "past" ? "Time passed" : slot}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <FieldError msg={errors.slot_time} />

            {/* Booked slots summary */}
            {bookedSlots.length > 0 && (
              <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                {bookedSlots.length} slot{bookedSlots.length !== 1 ? "s" : ""} already booked for this doctor on this date
              </p>
            )}
          </div>
        )}

        {/* Notes */}
        <div>
          <Label required>Patient Notes</Label>
          <textarea
            value={form.notes} onChange={e => setField("notes", e.target.value)}
            rows={3} placeholder="Briefly describe your symptoms or reason for the visit…"
            className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 resize-none transition-all
      ${errors.notes ? "border-red-300 focus:border-red-400 focus:ring-red-50 bg-red-50/30" : "border-gray-200 focus:border-teal-400 focus:ring-teal-50"}`}
          />
          <FieldError msg={errors.notes} />
        </div>
        {/* Doctor Fee */}             {/* 👈 move it inside space-y-5 */}
        <SInput
          label="Consultation Fee (₹)"
          type="number"
          error={errors.fee}
          value={form.fee}
          onChange={v => setField("fee", v.replace(/\D/g, "").slice(0, 6))}
          placeholder="e.g. 500"
        />
      </div>



      <div className="flex gap-3 mt-6">
        <button onClick={onBack}
          className="px-5 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-all text-sm flex items-center gap-1.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Back
        </button>
        <button onClick={handleBook} disabled={saving}
          className="flex-1 py-3 bg-teal-700 text-white font-bold rounded-xl hover:bg-teal-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
          {saving ? (
            <>
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
              Booking...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
              Confirm Appointment
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// ─── STEP 3: Success Screen ───────────────────────────────────────────────────
const SuccessScreen = ({ booking }) => {
  const formatDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d + "T00:00:00");
    return dt.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };
  const formatTime = (t) => {
    if (!t) return "—";
    const [h, m] = t.split(":").map(Number);
    const ampm = h < 12 ? "AM" : "PM";
    const hh = h % 12 || 12;
    return `${hh}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  return (
    <div className="text-center py-2">
      {/* Animated checkmark */}
      <div className="w-20 h-20 rounded-full bg-teal-50 border-4 border-teal-200 flex items-center justify-center mx-auto mb-5">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Appointment Confirmed!</h2>
      <p className="text-sm text-gray-500 mb-6">You'll be seen at your scheduled time. Please arrive 10 minutes early.</p>

      <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-2xl border border-teal-100 p-5 text-left space-y-3 mb-6">
        <div className="flex items-start justify-between border-b border-teal-100 pb-3">
          <div>
            <p className="text-xs text-gray-400 font-medium">PATIENT</p>
            <p className="font-bold text-gray-900 text-base">{booking.patientName}</p>
          </div>
          {booking.appointmentId && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Appt. ID</p>
              <p className="font-mono font-bold text-teal-700">#{booking.appointmentId}</p>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 font-medium mb-0.5">DOCTOR</p>
            <p className="font-semibold text-gray-800 text-sm">{booking.doctorName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium mb-0.5">DATE</p>
            <p className="font-semibold text-gray-800 text-sm">{formatDate(booking.date)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium mb-0.5">TIME</p>
            <p className="font-bold text-teal-700 text-base">{formatTime(booking.time)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium mb-0.5">DURATION</p>
            <p className="font-semibold text-gray-800 text-sm">15 minutes</p>
          </div>
        </div>
        {booking.notes && (
          <div className="border-t border-teal-100 pt-3">
            <p className="text-xs text-gray-400 font-medium mb-0.5">NOTES</p>
            <p className="text-sm text-gray-600">{booking.notes}</p>
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-left mb-4">
        <p className="text-xs font-semibold text-amber-700 mb-1">📋 What to bring</p>
        <ul className="text-xs text-amber-600 space-y-0.5 list-disc list-inside">
          <li>Valid government ID</li>
          <li>Any previous prescriptions or reports</li>
          <li>Arrive 10 minutes before your slot</li>
        </ul>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="w-full py-3 border-2 border-teal-200 text-teal-700 font-bold rounded-xl hover:bg-teal-50 transition-all text-sm"
      >
        Book Another Appointment
      </button>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const SelfRegisterPage = () => {
  const [step, setStep] = useState(1); // 1 = patient form, 2 = appointment, 3 = success
  const [patientData, setPatientData] = useState(null); // { patientId, patientName }
  const [bookingData, setBookingData] = useState(null);

  // Get clinic_id from URL ?clinic_id=...
  const clinicId = (() => {
    try {
      const p = new URLSearchParams(window.location.search);
      return parseInt(p.get("clinic_id")) || null;
    } catch { return null; }
  })();

  if (!clinicId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Invalid Registration Link</h2>
          <p className="text-sm text-gray-400">This QR code or link is invalid. Please ask the clinic for a new one.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 py-6 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-700 rounded-2xl mb-3 shadow-lg">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z" />
              <path d="M12 8v8M8 12h8" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Portal</h1>
          <p className="text-sm text-gray-400 mt-1">Register & Book Your Appointment</p>
        </div>

        {/* Step indicator */}
        <StepIndicator step={step} />

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
          {step === 1 && (
            <PatientForm
              clinicId={clinicId}
              onNext={({ patientId, patientName, isNew }) => {
                setPatientData({ patientId, patientName });
                setStep(2);
              }}
            />
          )}
          {step === 2 && patientData && (
            <AppointmentForm
              clinicId={clinicId}
              patientId={patientData.patientId}
              patientName={patientData.patientName}
              onBack={() => setStep(1)}
              onSuccess={(booking) => {
                setBookingData(booking);
                setStep(3);
              }}
            />
          )}
          {step === 3 && bookingData && (
            <SuccessScreen booking={bookingData} />
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-300 mt-6">
          Powered by Clinic Management System
        </p>
      </div>
    </div>
  );
};

export default SelfRegisterPage;