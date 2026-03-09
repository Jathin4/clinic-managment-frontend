import { useState, useEffect } from 'react';
import Icons from '../components/Icons';
import { Badge, Modal, Btn, Input, Select, Toast, PageHeader, DataTable, TR, TD } from '../components/UI';
 
const ITEMS_PER_PAGE = 10;
 
const PatientsPage = () => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);
  const [errors, setErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
 
  const baseUrl = process.env.REACT_APP_API_BASE_URL;
  const blank = { uhid:"", first_name:"", last_name:"", email:"", phone:"", dob:"", gender:"", blood_group:"", address:"" };
  const [form, setForm] = useState(blank);
  const showToast = (msg, type = "success") => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000); };
  const validate = () => {
    const e = {};
    if (!form.uhid.trim())       e.uhid        = "Required";
    if (!form.first_name.trim()) e.first_name  = "Required";
    if (!form.last_name.trim())  e.last_name   = "Required";
    if (!form.email.trim())      e.email       = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    if (!form.phone.trim())      e.phone       = "Required";
    else if (!/^\d{10}$/.test(form.phone))     e.phone = "Must be 10 digits";
    if (!form.dob)               e.dob         = "Required";
    if (!form.gender)            e.gender      = "Required";
    if (!form.blood_group)       e.blood_group = "Required";
    if (!form.address.trim())    e.address     = "Required";
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
    setForm({ uhid: p.uhid||"", first_name: p.first_name||"", last_name: p.last_name||"",
      email: p.email||"", phone: p.phone||"", dob: p.dob||"",
      gender: p.gender||"", blood_group: p.blood_group||"", address: p.address||"" });
    setErrors({});
    setShowModal(true);
  };
 
  const handleSave = async () => {
    if (!validate()) return;
    try {
      const res = await fetch(`${baseUrl}/patient_create_update`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingPatient?.id || null, clinic_id: 1, created_by: "admin", ...form })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(editingPatient ? "Patient updated" : "Patient added");
      setShowModal(false); setForm(blank); setEditingPatient(null); setErrors({});
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
 
  const filtered = patients.filter(p => {
    const q = search.toLowerCase();
    return [`${p.first_name} ${p.last_name}`, p.email, p.phone, p.gender, p.blood_group, p.uhid]
      .some(v => v?.toLowerCase().includes(q));
  });
 
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
 
  const genderColor = g => ({ Male:"bg-blue-50 text-blue-700 border-blue-100", Female:"bg-pink-50 text-pink-700 border-pink-100", Other:"bg-gray-50 text-gray-700 border-gray-200" }[g] || "bg-gray-100 text-gray-600");
  const Err = ({ f }) => errors[f] ? <p className="text-red-500 text-xs mt-1">{errors[f]}</p> : null;
 
  return (
    <div>
      <PageHeader title="Patients" subtitle="Manage patient records" actions={
        <Btn onClick={() => { setEditingPatient(null); setForm(blank); setErrors({}); setShowModal(true); }}>
          <Icons.Plus /> Add Patient
        </Btn>
      }/>
 
      {isLoading ? <div className="text-center py-6 text-gray-500">Loading patients...</div> : (
        <div>
          <DataTable
            title="Patient List" subtitle={`${filtered.length} patients registered`}
            search={search} onSearch={setSearch} searchPlaceholder="Search by name, phone, UHID…"
            actions={<Btn variant="secondary"><Icons.Download />Export</Btn>}
            columns={["Full Name","UHID","Email","Phone","DOB","Gender","Blood Group","Actions"]}
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
                <TD muted>{p.uhid||"—"}</TD>
                <TD>{p.email||"—"}</TD>
                <TD>{p.phone||"—"}</TD>
                <TD muted>{p.dob||"—"}</TD>
                <TD>{p.gender ? <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${genderColor(p.gender)}`}>{p.gender}</span> : "—"}</TD>
                <TD>{p.blood_group||"—"}</TD>
                <TD>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(p)} className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-slate-400"><Icons.Edit /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-slate-400"><Icons.Trash /></button>
                  </div>
                </TD>
              </TR>
            ))}
          />
 
         
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <span className="text-sm text-slate-500">
              Showing <b>{filtered.length === 0 ? 0 : (page-1)*ITEMS_PER_PAGE+1}–{Math.min(page*ITEMS_PER_PAGE, filtered.length)}</b> of <b>{filtered.length}</b>
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={page===1} className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">← Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i+1).map(n => (
                <button key={n} onClick={() => setCurrentPage(n)} className={`w-8 h-8 text-sm rounded-lg font-medium border ${n===page ? "text-white border-transparent" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`} style={n===page ? {background:"linear-gradient(135deg,#0E6C68,#14A3A0)"} : {}}>{n}</button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
            </div>
          </div>
        </div>
      )}
 
      {showModal && (
        <Modal title={editingPatient ? "Edit Patient" : "Add New Patient"} onClose={() => { setShowModal(false); setEditingPatient(null); setForm(blank); setErrors({}); }} wide>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label:"UHID *",        key:"uhid",        type:"text" },
              { label:"First Name *",  key:"first_name",  type:"text",  filter:/[^a-zA-Z\s]/g },
              { label:"Last Name *",   key:"last_name",   type:"text",  filter:/[^a-zA-Z\s]/g },
              { label:"Email *",       key:"email",       type:"email" },
              { label:"Phone *",       key:"phone",       type:"text",  filter:/[^0-9]/g, max:10 },
              { label:"Date of Birth *", key:"dob",       type:"date" },
            ].map(({ label, key, type, filter, max }) => (
              <div key={key}>
                <Input label={label} type={type} value={form[key]}
                  onChange={v => setField(key, filter ? v.replace(filter,"").slice(0, max||999) : v)}
                  className={errors[key] ? "border-red-400" : ""}
                />
                <Err f={key} />
              </div>
            ))}
            <div>
              <Select label="Gender *" value={form.gender} onChange={v => setField("gender", v)} options={["Male","Female","Other"]} className={errors.gender ? "border-red-400" : ""} />
              <Err f="gender" />
            </div>
            <div>
              <Select label="Blood Group *" value={form.blood_group} onChange={v => setField("blood_group", v)} options={["A+","A-","B+","B-","AB+","AB-","O+","O-"]} className={errors.blood_group ? "border-red-400" : ""} />
              <Err f="blood_group" />
            </div>
            <div className="col-span-2">
              <Input label="Address *" value={form.address} onChange={v => setField("address", v)} className={errors.address ? "border-red-400" : ""} placeholder="Street, City, State" />
              <Err f="address" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Btn variant="secondary" onClick={() => { setShowModal(false); setEditingPatient(null); setForm(blank); setErrors({}); }}>Cancel</Btn>
            <Btn onClick={handleSave}><Icons.Check />{editingPatient ? "Update Patient" : "Add Patient"}</Btn>
          </div>
        </Modal>
      )}
 
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
 
export default PatientsPage;
 