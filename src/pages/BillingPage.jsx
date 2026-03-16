import { useState, useEffect } from 'react';
import Icons from '../components/Icons';
import { Badge, RightDrawer, Btn, Toast, PageHeader, DataTable, TR, TD, Modal } from '../components/UI';
 
const ITEMS_PER_PAGE = 10;
const API = process.env.REACT_APP_API_BASE_URL;
const LS_KEY = 'deletedBills';
 
const getDeleted = () => JSON.parse(localStorage.getItem(LS_KEY) || '[]');
const addDeleted = id => localStorage.setItem(LS_KEY, JSON.stringify([...getDeleted(), id]));
 
const sel = `w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400`;
const Field = ({ label, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
    {children}
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);
 
const BillingPage = () => {
  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [allEncounters, setAllEncounters] = useState([]);
  const [search, setSearch] = useState("");
  const [showDrawer, setShowDrawer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [editingBill, setEditingBill] = useState(null);
  const [viewBill, setViewBill] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [errors, setErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
 
  const blank = { patient_id: "", encounter_id: "", chief_complaint: "", invoice_number: "", status: "Unpaid", subtotal: "", gst_amount: "", discount: "", total_amount: "" };
  const [form, setForm] = useState(blank);
 
  const showToast = (msg, type = "success") => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000); };
  const setField = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: undefined })); };
  const closeDrawer = () => { setShowDrawer(false); setEditingBill(null); setForm(blank); setErrors({}); };
 
  const validate = () => {
    const e = {};
    if (!form.patient_id) e.patient_id = "Required";
    if (!form.invoice_number) e.invoice_number = "Required";
    if (!form.subtotal) e.subtotal = "Required";
    setErrors(e);
    return !Object.keys(e).length;
  };
 
  const fetchBills = async () => {
    try {
      setIsLoading(true);
      const data = await fetch(`${API}/billsread?clinic_id=1`).then(r => r.json());
      const deleted = getDeleted();
      setBills(Array.isArray(data) ? data.filter(b => !deleted.includes(b.id)) : []);
    } catch { showToast("Failed to load bills", "error"); }
    finally { setIsLoading(false); }
  };
 
  const fetchPatients = async () => {
    try {
      const data = await fetch(`${API}/patient_read?clinic_id=1`).then(r => r.json());
      setPatients(Array.isArray(data) ? data.map(p => ({ value: p.id, label: `${p.first_name} ${p.last_name ?? ""}`.trim() })) : []);
    } catch {}
  };
 
  const fetchEncounters = async () => {
    try {
      const data = await fetch(`${API}/encountersread?clinic_id=1`).then(r => r.json());
      setAllEncounters(Array.isArray(data) ? data : []);
    } catch {}
  };
 
  useEffect(() => { fetchBills(); fetchPatients(); fetchEncounters(); }, []);
  useEffect(() => { setCurrentPage(1); }, [search]);
 
  const patientEncounters = allEncounters.filter(e => String(e.patient_id) === String(form.patient_id));
  const patientName = id => patients.find(p => String(p.value) === String(id))?.label || "—";
  const getComplaint = b => b.chief_complaint || allEncounters.find(e => String(e.id) === String(b.encounter_id))?.chief_complaint || "—";
  const getDate = b => { const d = b.created_at || b.created_date; return d ? String(d).split("T")[0] : "—"; };
 
  const handlePatientChange = pid => {
    setForm(p => ({ ...p, patient_id: pid, encounter_id: "", chief_complaint: "" }));
    setErrors(p => ({ ...p, patient_id: undefined }));
  };
 
  const handleEncounterChange = encId => {
    const enc = allEncounters.find(e => String(e.id) === String(encId));
    setForm(p => ({ ...p, encounter_id: encId, chief_complaint: enc?.chief_complaint ?? "" }));
  };
 
  const handleEdit = bill => {
    setEditingBill(bill);
    setForm({ patient_id: bill.patient_id ?? "", encounter_id: bill.encounter_id ?? "", chief_complaint: getComplaint(bill) === "—" ? "" : getComplaint(bill), invoice_number: bill.invoice_number ?? "", status: bill.status ?? "Unpaid", subtotal: bill.subtotal ?? "", gst_amount: bill.gst_amount ?? "", discount: bill.discount ?? "", total_amount: bill.total_amount ?? "" });
    setShowDrawer(true);
  };
 
  const handleSave = async () => {
    if (!validate()) return;
    try {
      const res = await fetch(`${API}/bills_create_update/`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingBill?.id ?? null, clinic_id: 1, created_by: "admin", patient_id: Number(form.patient_id), encounter_id: form.encounter_id ? Number(form.encounter_id) : null, chief_complaint: form.chief_complaint || null, invoice_number: form.invoice_number, status: form.status, subtotal: Number(form.subtotal), gst_amount: Number(form.gst_amount || 0), discount: Number(form.discount || 0), total_amount: Number(form.total_amount || 0) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(editingBill ? "Bill updated" : "Bill created");
      closeDrawer(); fetchBills();
    } catch (e) { showToast(e.message || "Operation failed", "error"); }
  };
 
  const handleDelete = async id => {
    try {
      await fetch(`${API}/bills_delete/`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, modified_by: "admin" }) });
    } catch {}
    addDeleted(id);
    setBills(prev => prev.filter(b => b.id !== id));
    showToast("Bill deleted");
    setDeleteConfirm(null);
  };
 
  const filtered = bills.filter(b => [b.invoice_number, patientName(b.patient_id), b.status, getComplaint(b)].some(v => String(v ?? "").toLowerCase().includes(search.toLowerCase())));
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
 
  return (
    <div>
      <PageHeader title="Bills & Invoices" subtitle="Manage billing records" actions={
        <Btn onClick={() => { setEditingBill(null); setForm(blank); setErrors({}); setShowDrawer(true); }}><Icons.Plus /> New Invoice</Btn>
      } />
 
      {isLoading ? <div className="text-center py-6 text-gray-500">Loading bills...</div> : (
        <DataTable
          title="Invoice List" subtitle={`${filtered.length} invoices`}
          search={search} onSearch={setSearch} searchPlaceholder="Search invoice #, patient, status…"
          actions={<Btn variant="secondary"><Icons.Download />Export CSV</Btn>}
          columns={["Invoice #", "Patient", "Chief Complaint", "Date", "Subtotal", "GST", "Discount", "Total", "Status", "Actions"]}
          rows={paginated.map(b => (
            <TR key={b.id}>
              <TD mono bold style={{ color: "#0E6C68" }}>{b.invoice_number}</TD>
              <TD bold>{patientName(b.patient_id)}</TD>
              <TD muted>{getComplaint(b)}</TD>
              <TD muted>{getDate(b)}</TD>
              <TD>₹{Number(b.subtotal || 0).toLocaleString()}</TD>
              <TD>₹{Number(b.gst_amount || 0).toLocaleString()}</TD>
              <TD>₹{Number(b.discount || 0).toLocaleString()}</TD>
              <TD bold>₹{Number(b.total_amount || 0).toLocaleString()}</TD>
              <TD><Badge status={b.status} /></TD>
              <TD>
                <div className="flex gap-1">
                  <button onClick={() => setViewBill(b)} className="p-1.5 hover:bg-teal-50 hover:text-teal-700 rounded-lg transition-colors text-slate-400"><Icons.Eye /></button>
                  <button onClick={() => handleEdit(b)} className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-slate-400"><Icons.Edit /></button>
                  <button onClick={() => setDeleteConfirm(b.id)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-slate-400"><Icons.Trash /></button>
                </div>
              </TD>
            </TR>
          ))}
          currentPage={page} totalPages={totalPages} onPageChange={setCurrentPage}
          totalItems={filtered.length} pageSize={pageSize}
          onPageSizeChange={n => { setPageSize(n); setCurrentPage(1); }} pageSizeOptions={[10, 20, 50]}
        />
      )}
 
      {viewBill && (
        <Modal title={`Invoice — ${viewBill.invoice_number}`} onClose={() => setViewBill(null)} wide>
          <div className="space-y-4">
            <div className="flex justify-between">
              <div>
                <div className="font-bold text-slate-800">{patientName(viewBill.patient_id)}</div>
                <div className="text-sm text-slate-400">Date: {getDate(viewBill)} • {getComplaint(viewBill)}</div>
              </div>
              <Badge status={viewBill.status} />
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              {[["Subtotal", viewBill.subtotal], ["GST Amount", viewBill.gst_amount], ["Discount", -viewBill.discount]].map(([l, v]) => (
                <div key={l} className="flex justify-between text-sm">
                  <span className="text-slate-500">{l}</span>
                  <span className={v < 0 ? "text-green-600 font-medium" : "text-slate-700"}>₹{Math.abs(Number(v || 0)).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2">
                <span>Total Amount</span>
                <span style={{ color: "#0E6C68" }}>₹{Number(viewBill.total_amount || 0).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex justify-end"><Btn variant="secondary" onClick={() => setViewBill(null)}>Close</Btn></div>
          </div>
        </Modal>
      )}
 
      {deleteConfirm && (
        <Modal title="Delete Bill" onClose={() => setDeleteConfirm(null)}>
          <p className="text-sm text-slate-600 mb-6">Are you sure you want to delete this bill? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Btn variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Btn>
            <Btn onClick={() => handleDelete(deleteConfirm)} style={{ background: "#ef4444" }}>
              <Icons.Trash /> Delete
            </Btn>
          </div>
        </Modal>
      )}
 
      <RightDrawer title={editingBill ? "Edit Invoice" : "New Invoice"} open={showDrawer} onClose={closeDrawer}>
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
            <Field label="Patient *" error={errors.patient_id}>
              <select value={form.patient_id} onChange={e => handlePatientChange(e.target.value)} className={`${sel} ${errors.patient_id ? "border-red-400" : ""}`}>
                <option value="">Select patient…</option>
                {patients.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </Field>
            <Field label="Encounter ID">
              <select value={form.encounter_id} onChange={e => handleEncounterChange(e.target.value)} disabled={!form.patient_id} className={`${sel} ${!form.patient_id ? "opacity-50 cursor-not-allowed" : ""}`}>
                <option value="">{!form.patient_id ? "Select a patient first" : patientEncounters.length ? "Select encounter ID…" : "No encounters found"}</option>
                {patientEncounters.map(e => <option key={e.id} value={e.id}>#{e.id}{e.visit_date ? ` — ${String(e.visit_date).split("T")[0]}` : ""}</option>)}
              </select>
            </Field>
            <Field label="Chief Complaint">
              <input value={form.chief_complaint} onChange={e => setField("chief_complaint", e.target.value)} placeholder="Auto-filled from encounter or enter manually" className={sel} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Invoice Number *" error={errors.invoice_number}>
                <input type="number" min="0" value={form.invoice_number} onChange={e => setField("invoice_number", e.target.value)} className={`${sel} ${errors.invoice_number ? "border-red-400" : ""}`} />
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={e => setField("status", e.target.value)} className={sel}>
                  {["Unpaid", "Paid", "Partial"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Subtotal (₹) *" error={errors.subtotal}>
                <input type="number" min="0" value={form.subtotal} onChange={e => setField("subtotal", e.target.value)} className={`${sel} ${errors.subtotal ? "border-red-400" : ""}`} />
              </Field>
              <Field label="GST Amount (₹)">
                <input type="number" min="0" value={form.gst_amount} onChange={e => setField("gst_amount", e.target.value)} className={sel} />
              </Field>
              <Field label="Discount (₹)">
                <input type="number" min="0" value={form.discount} onChange={e => setField("discount", e.target.value)} className={sel} />
              </Field>
              <Field label="Total Amount (₹)">
                <input type="number" min="0" value={form.total_amount} onChange={e => setField("total_amount", e.target.value)} className={sel} />
              </Field>
            </div>
          </div>
          <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <Btn variant="secondary" onClick={closeDrawer}>Cancel</Btn>
            <Btn onClick={handleSave}><Icons.Check />{editingBill ? "Update Invoice" : "Create Invoice"}</Btn>
          </div>
        </div>
      </RightDrawer>
 
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
 
export default BillingPage;