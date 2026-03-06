import { useState, useEffect } from 'react';
import Icons from '../components/Icons';
import { Badge, Btn, Input, Select, Toast, PageHeader, DataTable, TR, TD, Modal } from '../components/UI';

const CLINIC_ID = 1;
const CREATED_BY = "admin";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
 
const PatientsPage = () => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editPatient, setEditPatient] = useState(null);
  const [viewPatient, setViewPatient] = useState(null);
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
 
  const blank = {
    first_name: "", last_name: "", gender: "Male", dob: "",
    phone: "", email: "", address: "", blood_group: "O+",
    uhid: "", clinic_id: CLINIC_ID, created_by: CREATED_BY
  };
  const [form, setForm] = useState(blank);
 
  const showToast = (msg, type = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };
 
  useEffect(() => { fetchPatients(); }, []);
 
  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/patient_read?clinic_id=${CLINIC_ID}`);
      const data = await res.json();
      if (Array.isArray(data)) setPatients(data);
      else if (data.data && Array.isArray(data.data)) setPatients(data.data);
      else setPatients([]);
    } catch {
      showToast("Failed to fetch patients", "error");
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  };
 
  /* ── Validation ── */
  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = "First name is required";
    if (form.phone && !/^\d{10}$/.test(form.phone))
      e.phone = "Phone must be exactly 10 digits";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email address";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
 
  const handleUpsert = async () => {
    if (!validate()) return;
    try {
      setIsSubmitting(true);
      const payload = {
        ...form,
        id: editPatient ? editPatient.id : null,
        clinic_id: CLINIC_ID,
        created_by: CREATED_BY,
      };
 
      console.log("Sending payload:", payload);
 
      const res = await fetch(`${API_BASE_URL}/patient_create_update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
 
      const data = await res.json();
      console.log("Response:", res.status, data);
 
      if (!res.ok) {
        showToast(data.error || "Something went wrong", "error");
        return;
      }
 
      showToast(editPatient ? "Patient updated successfully" : "Patient registered successfully");
      handleClose();
      fetchPatients();
    } catch (e) {
      console.error("Fetch error:", e);
      showToast("Request failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };
 
  const handleDelete = async (patient) => {
    if (!window.confirm(`Delete ${patient.first_name} ${patient.last_name || ""}?`)) return;
    try {
      setIsSubmitting(true);
 
      console.log("Deleting patient id:", patient.id);
 
      const res = await fetch(`${API_BASE_URL}/patients_delete/`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: patient.id, modified_by: CREATED_BY }),
      });
 
      const text = await res.text();
      console.log("Delete response:", res.status, text);
 
      let data = {};
      try { data = JSON.parse(text); } catch {}
 
      if (!res.ok) {
        showToast(data.error || data.message || "Delete failed", "error");
        return;
      }
 
      showToast("Patient deleted successfully");
      fetchPatients();
    } catch (e) {
      console.error("Delete error:", e);
      showToast("Delete request failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };
 
  const handleEdit = (patient) => {
    setEditPatient(patient);
    setErrors({});
    setForm({
      first_name: patient.first_name || "", last_name: patient.last_name || "",
      gender: patient.gender || "Male", dob: patient.dob || "",
      phone: patient.phone || "", email: patient.email || "",
      address: patient.address || "", blood_group: patient.blood_group || "O+",
      uhid: patient.uhid || "", clinic_id: CLINIC_ID, created_by: CREATED_BY,
    });
    setShowModal(true);
  };
 
  const handleClose = () => {
    setShowModal(false);
    setEditPatient(null);
    setForm(blank);
    setErrors({});
  };
 
  /* Phone: strip non-digits, cap at 10 */
  const handlePhone = (v) => {
    const digits = v.replace(/\D/g, "").slice(0, 10);
    setForm(f => ({ ...f, phone: digits }));
    if (errors.phone && digits.length === 10) setErrors(e => ({ ...e, phone: undefined }));
  };
 
  const filtered = patients.filter(p =>
    `${p.first_name} ${p.last_name || ""}`.toLowerCase().includes(search.toLowerCase()) ||
    (p.uhid || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.phone || "").includes(search) ||
    (p.blood_group || "").toLowerCase().includes(search.toLowerCase())
  );
 
  if (viewPatient) return <PatientProfile patient={viewPatient} onBack={() => setViewPatient(null)} />;
 
  return (
    <div>
      <PageHeader
        title="Patients"
        subtitle="Manage patient records & registrations"
        actions={
          <Btn onClick={() => { setEditPatient(null); setForm(blank); setErrors({}); setShowModal(true); }}>
            <Icons.Plus />Add Patient
          </Btn>
        }
      />
 
      {/* DataTable — search is INSIDE the card, matching UsersPage */}
      <DataTable
        title="Patient List"
        subtitle={`${patients.length} patients registered`}
        search={search}
        onSearch={v => { setSearch(v); setCurrentPage(1); }}
        searchPlaceholder="Search by UHID, name, phone…"
        actions={<Btn variant="secondary"><Icons.Download />Export</Btn>}
        columns={["UHID", "Patient Name", "Gender", "Contact", "Blood Group", "Registered", "Actions"]}
        rows={
          isLoading
            ? [<TR key="loading"><td colSpan={7} className="text-center py-8 text-slate-400">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-teal-700 mr-2 align-middle"></div>
                Loading...
              </td></TR>]
            : filtered.length === 0
              ? [<TR key="empty"><td colSpan={7} className="text-center py-8 text-slate-400">No patients found</td></TR>]
              : (() => {
                  const totalPages = Math.ceil(filtered.length / pageSize);
                  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
                  return paginated.map(p => (
                  <TR key={p.id}>
                    <TD mono bold>{p.uhid}</TD>
 
                    <TD>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: "linear-gradient(135deg,#0E6C68,#14A3A0)" }}>
                          {p.first_name?.[0]}{p.last_name?.[0] || ""}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{p.first_name} {p.last_name || ""}</div>
                          {p.dob && <div className="text-xs text-slate-400">DOB: {p.dob}</div>}
                        </div>
                      </div>
                    </TD>
 
                    <TD>{p.gender}</TD>
 
                    <TD>
                      <div className="flex flex-col gap-0.5">
                        {p.phone && <span className="flex items-center gap-1.5 text-slate-600 text-xs"><span className="text-slate-400">📞</span>{p.phone}</span>}
                        {p.email && <span className="flex items-center gap-1.5 text-slate-400 text-xs"><span>✉</span>{p.email}</span>}
                      </div>
                    </TD>
 
                    <TD>
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold border"
                        style={{ background: "#f0fdf4", color: "#166534", borderColor: "#bbf7d0" }}>
                        {p.blood_group}
                      </span>
                    </TD>
 
                    <TD muted>{p.created_at}</TD>
 
                    <TD>
                      <div className="flex gap-1">
                        <button onClick={() => setViewPatient(p)} className="p-1.5 hover:bg-teal-50 hover:text-teal-700 rounded-lg transition-colors text-slate-400"><Icons.Eye /></button>
                        <button onClick={() => handleEdit(p)} className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-slate-400"><Icons.Edit /></button>
                        <button onClick={() => handleDelete(p)} disabled={isSubmitting} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-slate-400 disabled:opacity-50"><Icons.Trash /></button>
                      </div>
                    </TD>
                  </TR>
                ))
        })()
        }
      currentPage={currentPage} totalPages={Math.ceil(filtered.length / pageSize)} onPageChange={setCurrentPage} totalItems={filtered.length} pageSize={pageSize} onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
      />
 
      {/* Modal — same pattern as UsersPage */}
      {showModal && (
        <Modal
          title={editPatient ? "Edit Patient" : "Register New Patient"}
          onClose={handleClose}
          wide
        >
          <div className="grid grid-cols-2 gap-4">
 
            {/* First Name */}
            <div>
              <Input
                label="First Name"
                value={form.first_name}
                onChange={v => { setForm(f => ({ ...f, first_name: v })); if (errors.first_name) setErrors(e => ({ ...e, first_name: undefined })); }}
                placeholder="First name"
                required
              />
              {errors.first_name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1">⚠ {errors.first_name}</p>}
            </div>
 
            {/* Last Name */}
            <Input
              label="Last Name"
              value={form.last_name}
              onChange={v => setForm(f => ({ ...f, last_name: v }))}
              placeholder="Last name"
            />
 
            {/* UHID */}
            <Input
              label="UHID"
              value={form.uhid}
              onChange={v => setForm(f => ({ ...f, uhid: v }))}
              placeholder="e.g. HF-2025-001"
            />
 
            {/* Gender */}
            <Select
              label="Gender"
              value={form.gender}
              onChange={v => setForm(f => ({ ...f, gender: v }))}
              options={["Male", "Female", "Other"]}
            />
 
            {/* Date of Birth */}
            <Input
              label="Date of Birth"
              type="date"
              value={form.dob}
              onChange={v => setForm(f => ({ ...f, dob: v }))}
            />
 
            {/* Blood Group */}
            <Select
              label="Blood Group"
              value={form.blood_group}
              onChange={v => setForm(f => ({ ...f, blood_group: v }))}
              options={["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]}
            />
 
            {/* Phone — digits only, max 10 */}
            <div>
              <Input
                label="Phone"
                value={form.phone}
                onChange={handlePhone}
                placeholder="10-digit number"
              />
              {errors.phone
                ? <p className="text-xs text-red-500 mt-1 flex items-center gap-1">⚠ {errors.phone}</p>
                : form.phone.length > 0 && (
                    <p className={`text-xs mt-1 font-medium ${form.phone.length === 10 ? "text-emerald-600" : "text-amber-500"}`}>
                      {form.phone.length === 10 ? "✓ Valid number" : `${form.phone.length}/10 digits`}
                    </p>
                  )
              }
            </div>
 
            {/* Email */}
            <div>
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={v => { setForm(f => ({ ...f, email: v })); if (errors.email) setErrors(e => ({ ...e, email: undefined })); }}
                placeholder="email@example.com"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1 flex items-center gap-1">⚠ {errors.email}</p>}
            </div>
 
            {/* Address — full width */}
            <div className="col-span-2">
              <Input
                label="Address"
                value={form.address}
                onChange={v => setForm(f => ({ ...f, address: v }))}
                placeholder="Full address"
              />
            </div>
          </div>
 
          <div className="flex justify-end gap-3 mt-6">
            <Btn variant="secondary" onClick={handleClose}>Cancel</Btn>
            <Btn onClick={handleUpsert} disabled={!form.first_name || isSubmitting}>
              <Icons.Check />
              {isSubmitting ? "Saving…" : editPatient ? "Update Patient" : "Register Patient"}
            </Btn>
          </div>
        </Modal>
      )}
 
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
 
 
/* ─── Patient Profile ─── */
const PatientProfile = ({ patient, onBack }) => {
  const [tab, setTab] = useState("overview");
  const tabs = ["overview", "appointments", "encounters", "bills", "payments"];
 
  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-teal-700 mb-4 transition-colors">
        <Icons.ChevronLeft />Back to Patients
      </button>
 
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold"
            style={{ background: "linear-gradient(135deg,#0E6C68,#14A3A0)" }}>
            {patient.first_name[0]}{patient.last_name?.[0] || ""}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-slate-800">{patient.first_name} {patient.last_name || ""}</h2>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
            </div>
            <div className="text-sm text-slate-500 mb-3">{patient.uhid} • {patient.gender} • DOB: {patient.dob}</div>
            <div className="flex flex-wrap gap-4 text-sm">
              {[["Phone", patient.phone], ["Email", patient.email], ["Blood Group", patient.blood_group]].map(([l, v]) => (
                <div key={l}><span className="text-slate-400">{l}: </span><span className="font-medium text-slate-700">{v}</span></div>
              ))}
            </div>
          </div>
          <Btn><Icons.Edit />Edit</Btn>
        </div>
      </div>
 
      <div className="flex gap-1 mb-4 bg-white rounded-xl p-1 border border-gray-100 w-fit shadow-sm">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all ${tab === t ? "text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            style={tab === t ? { background: "#0E6C68" } : {}}>
            {t}
          </button>
        ))}
      </div>
 
      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="font-bold text-slate-800 mb-4">Personal Information</div>
            {[
              ["UHID", patient.uhid], ["Full Name", `${patient.first_name} ${patient.last_name || ""}`],
              ["Gender", patient.gender], ["Date of Birth", patient.dob],
              ["Phone", patient.phone], ["Email", patient.email],
              ["Address", patient.address], ["Blood Group", patient.blood_group]
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-slate-500">{l}</span>
                <span className="text-sm font-medium text-slate-700">{v}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="font-bold text-slate-800 mb-4">Medical History Timeline</div>
            {[
              { date: patient.created_at, event: "Registration", note: "Patient registered in system" },
              { date: "2025-02-01", event: "Encounter", note: "Routine consultation" },
              { date: "2024-12-10", event: "Prescription", note: "Medicines prescribed" },
              { date: "2024-10-05", event: "Lab Test", note: "CBC & Lipid Profile" }
            ].map((e, i) => (
              <div key={i} className="flex gap-3 mb-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full mt-1.5" style={{ background: "#0E6C68" }}></div>
                  {i < 3 && <div className="w-0.5 h-8 bg-gray-200 mt-1"></div>}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-700">{e.event}</div>
                  <div className="text-xs text-slate-400">{e.date}</div>
                  <div className="text-sm text-slate-500 mt-0.5">{e.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
 
export default PatientsPage;
 