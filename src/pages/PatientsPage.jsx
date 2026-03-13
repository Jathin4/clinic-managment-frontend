import { useState, useEffect } from 'react';
import Icons from '../components/Icons';
import { Badge, RightDrawer, Btn, Input, Select, Toast, PageHeader, DataTable, TR, TD } from '../components/UI';
 
const PatientsPage = () => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);
  const [errors, setErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [step, setStep] = useState(0);
 
  const baseUrl = process.env.REACT_APP_API_BASE_URL;
  const blank = { uhid:"", first_name:"", last_name:"", email:"", phone:"", dob:"", gender:"", blood_group:"", address:"" };
  const [form, setForm] = useState(blank);
 
  const showToast = (msg, type = "success") => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000); };
 
  const validateStep0 = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name  = "Required";
    if (!form.last_name.trim())  e.last_name   = "Required";
    if (!form.dob)               e.dob         = "Required";
    if (!form.gender)            e.gender      = "Required";
    if (!form.blood_group)       e.blood_group = "Required";
    if (!form.age)               e.age         = "Required";
    if (!form.weight)            e.weight      = "Required";
    if (!form.reference)        e.reference   = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
 
  const validateStep1 = () => {
    const e = {};
    if (!form.email.trim())      e.email   = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    if (!form.phone.trim())      e.phone   = "Required";
    else if (!/^\d{10}$/.test(form.phone)) e.phone = "Must be 10 digits";
    if (!form.address.trim())    e.address = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
 
  const setField = (key, val) => { setForm(p => ({ ...p, [key]: val })); setErrors(p => ({ ...p, [key]: undefined })); };
 
  useEffect(() => { fetchPatients(); }, []);
  useEffect(() => { setCurrentPage(1); }, [search]);
 
  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${baseUrl}/patient_read?clinic_id=1`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPatients(Array.isArray(data) ? data : []);
    } catch { showToast("Failed to load patients", "error"); }
    finally { setIsLoading(false); }
  };
 
  const handleEdit = p => {
    setEditingPatient(p);
    setForm({  first_name: p.first_name||"", last_name: p.last_name||"",
      email: p.email||"", phone: p.phone||"", dob: p.dob||"", age: p.age||"", weight: p.weight||"", reference: p.reference||"",
      gender: p.gender||"", blood_group: p.blood_group||"", address: p.address||"" });
    setErrors({});
    setStep(0);
    setShowModal(true);
  };
 
  const handleClose = () => {
    setShowModal(false);
    setEditingPatient(null);
    setForm(blank);
    setErrors({});
    setStep(0);
  };
 
  const handleNext = () => {
    if (!validateStep0()) return;
    setStep(1);
  };
 
  const handleBack = () => {
    setErrors({});
    setStep(0);
  };
 
  const handleSave = async () => {
    if (!validateStep1()) return;
    try {
      const res = await fetch(`${baseUrl}/patient_create_update`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingPatient?.id || null, clinic_id: 1, created_by: "admin", ...form })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(editingPatient ? "Patient updated" : "Patient added");
      handleClose();
      fetchPatients();
    } catch (e) { showToast(e.message || "Operation failed", "error"); }
  };
 
  const handleDelete = async id => {
    if (!window.confirm("Delete this patient?")) return;
    try {
      const res = await fetch(`${baseUrl}/patients_delete/`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, modified_by: "admin" })
      });
      if (!res.ok) throw new Error();
      showToast("Patient deleted");
      fetchPatients();
    } catch { showToast("Failed to delete patient", "error"); }
  };
 
  const filtered = patients.filter(p =>
    `${p.first_name} ${p.last_name}`?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.toLowerCase().includes(search.toLowerCase()) ||
    p.gender?.toLowerCase().includes(search.toLowerCase()) ||
    p.blood_group?.toLowerCase().includes(search.toLowerCase()) ||
    p.dob?.toLowerCase().includes(search.toLowerCase()) ||
    p.age?.toString().toLowerCase().includes(search.toLowerCase()) ||
    p.weight?.toString().toLowerCase().includes(search.toLowerCase()) ||
    p.refernce?.toLowerCase().includes(search.toLowerCase())
  );
 
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
 
  const genderColor = g => ({ Male:"bg-blue-50 text-blue-700 border-blue-100", Female:"bg-pink-50 text-pink-700 border-pink-100", Other:"bg-gray-50 text-gray-700 border-gray-200" }[g] || "bg-gray-100 text-gray-600");
  const Err = ({ f }) => errors[f] ? <p className="text-red-500 text-xs mt-1">{errors[f]}</p> : null;
 
  return (
    <div>
      <PageHeader title="Patients" subtitle="Manage patient records" actions={
        <Btn onClick={() => { setEditingPatient(null); setForm(blank); setErrors({}); setStep(0); setShowModal(true); }}>
          <Icons.Plus /> Add Patient
        </Btn>
      }/>
 
      {isLoading ? <div className="text-center py-6 text-gray-500">Loading patients...</div> : (
        <DataTable
          title="Patient List"
          subtitle={`${filtered.length} patients registered`}
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Search by name, phone, UHID…"
          actions={<Btn variant="secondary"><Icons.Download />Export</Btn>}
          columns={["Full Name","Email","Phone","DOB","Gender","Blood Group","Age","Weight","Reference","Actions"]}
          rows={paginated.map(p => (
            <TR key={p.id}>
              <TD>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{background:"linear-gradient(135deg,#0E6C68,#14A3A0)"}}>
                    {[p.first_name?.[0], p.last_name?.[0]].filter(Boolean).join("") || "?"}
                  </div>
                  <span className="font-semibold text-slate-700">{`${p.first_name||""} ${p.last_name||""}`.trim()||"—"}</span>
                </div>
              </TD>
              <TD>{p.email||"—"}</TD>
              <TD>{p.phone||"—"}</TD>
              <TD muted>{p.dob||"—"}</TD>
              <TD>{p.gender ? <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${genderColor(p.gender)}`}>{p.gender}</span> : "—"}</TD>
              <TD>{p.blood_group||"—"}</TD>
              <TD>{p.age||"—"}</TD>
              <TD>{p.weight||"—"}</TD>
              <TD>{p.refernce||"—"}</TD>
              <TD>
 
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(p)} className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-slate-400"><Icons.Edit /></button>
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-slate-400"><Icons.Trash /></button>
                </div>
              </TD>
            </TR>
          ))}
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageSizeChange={n => { setPageSize(n); setCurrentPage(1); }}
          pageSizeOptions={[10, 20, 50]}
        />
      )}
 
      {/* ── Right Drawer — 2 step ── */}
      <RightDrawer
        title={editingPatient ? "Edit Patient" : "Add New Patient"}
        open={showModal}
        onClose={handleClose}
      >
        <div className="h-full flex flex-col">
 
          {/* Subtitle */}
          <div className="px-8 py-4 bg-gradient-to-r from-teal-50 to-blue-50 border-b border-teal-100">
            <p className="text-sm text-gray-600">Fill in the details to register a new patient</p>
          </div>
 
          {/* Scrollable form content */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
 
            {/* ── Step 0: Patient Identity ── */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-teal-100">
                  <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                    <Icons.User />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Patient Identity</p>
                    <p className="text-xs text-gray-400 mt-0.5">Basic identification details</p>
                  </div>
                </div>
 
               
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input label="First Name *" value={form.first_name} onChange={v => setField("first_name", v.replace(/[^a-zA-Z\s]/g, ""))} placeholder="First name" />
                    <Err f="first_name" />
                  </div>
                  <div>
                    <Input label="Last Name *" value={form.last_name} onChange={v => setField("last_name", v.replace(/[^a-zA-Z\s]/g, ""))} placeholder="Last name" />
                    <Err f="last_name" />
                  </div>
                </div>
                <div>
                  <Input label="Date of Birth *" type="date" value={form.dob} onChange={v => setField("dob", v)} />
                  <Err f="dob" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Select label="Gender *" value={form.gender} onChange={v => setField("gender", v)} options={["Male","Female","Other"]} />
                    <Err f="gender" />
                  </div>
                  <div>
                    <Select label="Blood Group *" value={form.blood_group} onChange={v => setField("blood_group", v)} options={["A+","A-","B+","B-","AB+","AB-","O+","O-"]} />
                    <Err f="blood_group" />
                  </div>
                  <div>
                    <Input label="Age *" type="number" value={form.age} onChange={v => setField("age", v.replace(/[^0-9]/g, "").slice(0,3))} placeholder="Age in years" />
                    <Err f="age" />
                  </div>
                  <div>
                    <Input label="Weight *" type="number" value={form.weight} onChange={v => setField("weight", v.replace(/[^0-9]/g, "").slice(0,3))} placeholder="Weight in kg" />
                    <Err f="weight" />
                  </div>
                  <div className="col-span-2">
                    <Select label="Reference *" value={form.reference} onChange={v => setField("reference", v)} options={["Friend/Relative","Google","Social Media","Advertisement","Other"]} />
                    <Err f="reference" />
                  </div>
 
                </div>
              </div>
            )}
 
            {/* ── Step 1: Contact Details ── */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-blue-100">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Icons.Calendar />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Contact Details</p>
                    <p className="text-xs text-gray-400 mt-0.5">How to reach the patient</p>
                  </div>
                </div>
 
                <div>
                  <Input label="Email *" type="email" value={form.email} onChange={v => setField("email", v)} placeholder="email@example.com" />
                  <Err f="email" />
                </div>
                <div>
                  <Input label="Phone *" value={form.phone} onChange={v => setField("phone", v.replace(/[^0-9]/g, "").slice(0,10))} placeholder="10-digit number" />
                  <Err f="phone" />
                </div>
                <div>
                  <Input label="Address *" value={form.address} onChange={v => setField("address", v)} placeholder="Street, City, State" />
                  <Err f="address" />
                </div>
 
                {/* Info box like ClinicsPage */}
                <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 flex gap-3">
                  <div className="text-amber-700 text-lg flex-shrink-0">🔒</div>
                  <div>
                    <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">Privacy Notice</p>
                    <p className="text-sm text-amber-800 mt-1">Patient contact details are kept confidential and used only for medical communication.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
 
          {/* ── Footer — Step indicator + Prev/Next/Save ── */}
          <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <div className="text-xs text-gray-500 font-medium">Step {step + 1} of 2</div>
            <div className="flex gap-3">
              <Btn variant="secondary" onClick={step === 0 ? handleClose : handleBack}>
                {step === 0 ? "Cancel" : <><Icons.ChevronLeft /> Back</>}
              </Btn>
              <Btn onClick={step === 0 ? handleNext : handleSave}>
                {step === 0 ? <>Next <Icons.ChevronRight /></> : <><Icons.Check /> {editingPatient ? "Update Patient" : "Add Patient"}</>}
              </Btn>
            </div>
          </div>
 
        </div>
      </RightDrawer>
 
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
 
export default PatientsPage;