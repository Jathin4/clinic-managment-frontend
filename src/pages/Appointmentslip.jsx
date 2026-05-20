// PrintSlip.jsx
// Usage: <PrintSlip apt={apt} patientName="..." doctorName="..." patients={patients} />
// Shown only when appointment status === "CheckedIn"
// Clicking the button opens a new window with the formatted A4 slip and auto-prints.

const SLIP_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:#f8fafc;color:#1e293b;display:flex;justify-content:center;padding:20px}
::-webkit-scrollbar{width:8px;height:8px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}
::-webkit-scrollbar-thumb:hover{background:#94a3b8}
.a4{width:794px;min-height:1123px;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,.15);display:flex;flex-direction:column}
.top{border-bottom:2px dashed #0E6C68}
.hdr{background:#0E6C68;color:#fff;padding:10px 20px;display:flex;align-items:center;justify-content:space-between}
.hdr-left{display:flex;align-items:center;gap:10px}
.hdr-left h1{font-size:16px;font-weight:800;letter-spacing:.02em}
.hdr-left p{font-size:9px;opacity:.8;margin-top:1px}
.meta{background:#f0fdf9;border-bottom:1px solid #b2dfdb;display:grid;grid-template-columns:repeat(4,1fr)}
.mc{padding:5px 14px;border-right:1px solid #b2dfdb}
.mc:last-child{border-right:none}
.mc span{display:block;font-size:8.5px;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8}
.mc strong{font-size:11px;font-weight:700;color:#0E6C68}
.info{padding:10px 20px;display:grid;grid-template-columns:1fr 1fr;gap:6px 40px}
.f span{display:block;font-size:8.5px;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8}
.f strong{font-size:12px;font-weight:600;color:#111}
.apt-row{padding:8px 20px;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;border-top:1px dashed #e2e8f0}
.ab{border:1px solid #e2e8f0;border-radius:6px;padding:6px 10px;background:#f8fffe}
.ab span{display:block;font-size:8px;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8}
.ab strong{font-size:13px;font-weight:700;color:#94a3b8}
.writing{flex:1;padding:16px 20px;display:flex;flex-direction:column;gap:14px}
.rx-head{display:flex;align-items:center;gap:8px}
.rx-symbol{font-size:26px;font-weight:800;color:#0E6C68;font-family:'Times New Roman',serif;line-height:1}
.rx-label{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#0E6C68;border-bottom:1.5px solid #0E6C68;padding-bottom:3px;flex:1}
.rx-sub{font-weight:400;text-transform:none;letter-spacing:0;font-size:8px}
.block{border:1px solid #e2e8f0;border-radius:6px;padding:8px 12px}
.block-title{font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;margin-bottom:6px}
.lines{display:flex;flex-direction:column;gap:8px}
.line{border-bottom:1px solid #d1d5db;height:20px}
.line.dot{border-bottom-style:dotted;border-color:#cbd5e1}
.sig-row{display:flex;justify-content:space-between;align-items:flex-end;margin-top:auto;padding-top:10px;border-top:1px dashed #e2e8f0}
.sig-box{text-align:center}
.sig-line{border-bottom:1.5px solid #111;width:150px;height:40px}
.sig-lbl{font-size:8.5px;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-top:3px}
.next{border:1px solid #e2e8f0;border-radius:6px;padding:6px 12px;display:flex;align-items:center;gap:8px}
.next label{font-size:9px;color:#64748b;font-weight:700;white-space:nowrap}
.next-line{width:140px;border-bottom:1.5px solid #cbd5e1;height:20px}
.ftr{background:#0E6C68;color:#fff;padding:7px 20px;display:flex;justify-content:space-between;font-size:9px}
.ftr strong{font-weight:700}
@media print{@page{margin:0;size:A4 portrait}html,body{margin:0;padding:0;background:white;width:100%;height:100%}body{display:block;padding:0}.a4{box-shadow:none;width:100%;min-height:100vh;margin:0}}
`;



// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDisplay = (v, opts) =>
  v ? new Date(v).toLocaleDateString("en-IN", opts) : "—";

const fmtDate = v =>
  v ? v.slice(0, 10).split("-").reverse().join("/") : "—";

const fmtTime = v => {
  if (!v) return "—";
  const [h, m] = v.slice(0, 5).split(":").map(Number);
  return `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

const mc = (label, value) => `<div class="mc"><span>${label}</span><strong>${value}</strong></div>`;
const fi = (label, value) => `<div class="f"><span>${label}</span><strong>${value}</strong></div>`;
const ab = label => `<div class="ab"><span>${label}</span><strong>_______</strong></div>`;
const ln = (n, dot = false) =>
  Array.from({ length: n }, () => `<div class="line${dot ? " dot" : ""}"></div>`).join("");

// ─── PrintSlip Component ──────────────────────────────────────────────────────
const PrintSlip = ({ apt, patientName, doctorName, patients }) => {
  const session = JSON.parse(sessionStorage.getItem('user')); // or however you store session
  const clinicName = session?.clinic_name || 'Clinic Management';
  const patient = patients.find(p => String(p.id) === String(apt?.patient_id)) || {};

  const handlePrint = () => {
    // ── Dynamic values ──────────────────────────────────────────────────────
    const now = fmtDisplay(new Date(), { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const dob = fmtDisplay(patient.dob || patient.date_of_birth, { day: "2-digit", month: "short", year: "numeric" });
    const feeVal = apt?.fee ?? null;
    const fee = (feeVal !== null && feeVal !== undefined && feeVal !== "")
      ? `₹${Number(feeVal).toLocaleString("en-IN")}`
      : "—";
    const phone = patient.phone || patient.mobile || "—";
    const blood = patient.blood_group || patient.bloodgroup || "—";
    const addr = patient.address || patient.address_line1 || "—";
    const ptId = apt?.patient_id ?? "—";

    // ── Full A4 HTML ────────────────────────────────────────────────────────
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Appointment Slip — ${patientName}</title>
  <style>${SLIP_CSS}</style>
</head>
<body>
<div class="a4">

  <!-- TOP SECTION -->
  <div class="top">

    <!-- Header -->
    <div class="hdr">
      <div class="hdr-left">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white"
          stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
          style="background:rgba(255,255,255,.15);border-radius:50%;padding:6px">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
        <div>
          <h1>${clinicName.toUpperCase()}</h1>
          <p>Patient Appointment Slip · Generated: ${now}</p>
        </div>
      </div>

    </div>

    <!-- Meta strip: Doctor | Pt.ID | Date·Time | Fee -->
    <div class="meta">
      ${mc("Doctor", doctorName || "—")}
      ${mc("Pt. ID", ptId)}
      ${mc("Date · Time", `${fmtDate(apt?.appointment_date)} · ${fmtTime(apt?.slot_time)}`)}
      ${mc("Fee", fee)}
    </div>

    <!-- Patient info -->
    <div class="info">
      ${fi("Patient Name", patientName || "—")}
      ${fi("Phone", phone)}
      ${fi("DOB · Blood Group", `${dob} · ${blood}`)}
      ${fi("Address", addr)}
    </div>

    <!-- Vitals (to be filled manually) -->
    <div class="apt-row">
      ${ab("Blood Pressure")}
      ${ab("Pulse (bpm)")}
      ${ab("Weight (kg)")}
      ${ab("SpO₂ (%)")}
    </div>

  </div><!-- end .top -->

  <!-- WRITING SPACE -->
  <div class="writing">

    <!-- Rx heading -->
    <div class="rx-head">
      <div class="rx-symbol">℞</div>
      <div class="rx-label">
        Diagnosis &amp; Prescription
        <span class="rx-sub">(Doctor's use only)</span>
      </div>
    </div>

    <!-- Diagnosis -->
    <div class="block">
      <div class="block-title">Diagnosis / Chief Complaint</div>
      <div class="lines">${ln(3)}</div>
    </div>



    <!-- Next visit + Signature -->
    <div class="sig-row">
      <div class="next">
        <label>Next Visit :</label>
        <div class="next-line"></div>
      </div>
      <div class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-lbl">Doctor's Signature &amp; Stamp</div>
      </div>
    </div>

  </div><!-- end .writing -->

  <!-- Footer -->
  <div class="ftr">
    <span>${clinicName} · Please carry this slip to your appointment</span>
    <strong>Note: Don't repeat medicine without doctor's permission</strong>
  </div>

</div>
<script>window.onload = () => window.print();
  window.onafterprint = () => window.close();</script>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) { alert("Please allow popups to print the slip."); return; }
    win.document.write(html);
    win.document.close();
  };

  return (
    <button
      title="Print Appointment Slip"
      onClick={handlePrint}
      className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-400 transition-colors"
    >
      {/* Printer icon */}
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <polyline points="6 9 6 2 18 2 18 9" strokeLinecap="round" strokeLinejoin="round" />
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" rx="1"
          strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
};

export default PrintSlip;