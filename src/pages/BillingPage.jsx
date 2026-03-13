import { useState, useEffect } from 'react';
import Icons from '../components/Icons';
import { Badge, Btn, Input, Toast, PageHeader, DataTable, TR, TD, Modal } from '../components/UI';
 
const ITEMS_PER_PAGE = 10;
const API = process.env.REACT_APP_API_BASE_URL;
 
const BillingPage = () => {
  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [allEncounters, setAllEncounters] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [editingBill, setEditingBill] = useState(null);
  const [viewBill, setViewBill] = useState(null);
  const [errors, setErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
 
  const blank = { patient_id: "", encounter_id: "", chief_complaint: "", invoice_number: "", status: "Unpaid", subtotal: "", gst_amount: "", discount: "", total_amount: "" };
  const [form, setForm] = useState(blank);
 
  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 3000); };
  const setField = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: undefined })); };
  const closeModal = () => { setShowModal(false); setEditingBill(null); setForm(blank); setErrors({}); };
 
  const validate = () => {
    const e = {};
    if (!form.patient_id) e.patient_id = "Required";
    if (!form.invoice_number.trim()) e.invoice_number = "Required";
    if (!form.subtotal) e.subtotal = "Required";
    setErrors(e);
    return !Object.keys(e).length;
  };
 
  const fetchBills = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API}/billsread?clinic_id=1`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBills(Array.isArray(data) ? data : []);
    } catch { showToast("Failed to load bills"); }
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
 
  const fetchEncounters = async () => {
    try {
      const res = await fetch(`${API}/encountersread?clinic_id=1`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAllEncounters(Array.isArray(data) ? data : []);
    } catch { /* fail silently */ }
  };
 
  useEffect(() => { fetchBills(); fetchPatients(); fetchEncounters(); }, []);
  useEffect(() => { setCurrentPage(1); }, [search]);
 
  // SP returns patient_id — filter encounters for selected patient
  const patientEncounters = allEncounters.filter(e => String(e.patient_id) === String(form.patient_id));
 
  const handlePatientChange = (pid) => {
    setForm(p => ({ ...p, patient_id: pid, encounter_id: "", chief_complaint: "" }));
    setErrors(p => ({ ...p, patient_id: undefined }));
  };
 
  const handleEncounterChange = (encId) => {
    const enc = allEncounters.find(e => String(e.id) === String(encId));
    setForm(p => ({ ...p, encounter_id: encId, chief_complaint: enc?.chief_complaint ?? "" }));
  };
 
  const patientName = id => patients.find(p => String(p.value) === String(id))?.label || "—";
  const sel = `w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400`;
 
  const handleEdit = bill => {
    setEditingBill(bill);
    setForm({
      patient_id: bill.patient_id ?? "", encounter_id: bill.encounter_id ?? "",
      chief_complaint: bill.chief_complaint ?? "", invoice_number: bill.invoice_number ?? "",
      status: bill.status ?? "Unpaid", subtotal: bill.subtotal ?? "",
      gst_amount: bill.gst_amount ?? "", discount: bill.discount ?? "", total_amount: bill.total_amount ?? "",
    });
    setErrors({});
    setShowModal(true);
  };
 
  const handleSave = async () => {
    if (!validate()) return;
    try {
      const res = await fetch(`${API}/bills_create_update/`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingBill?.id ?? null, clinic_id: 1, created_by: "admin",
          patient_id: Number(form.patient_id),
          encounter_id: form.encounter_id ? Number(form.encounter_id) : null,
          chief_complaint: form.chief_complaint || null,
          invoice_number: form.invoice_number, status: form.status,
          subtotal: Number(form.subtotal), gst_amount: Number(form.gst_amount || 0),
          discount: Number(form.discount || 0), total_amount: Number(form.total_amount || 0),
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(editingBill ? "Bill updated" : "Bill created");
      closeModal(); fetchBills();
    } catch (e) { showToast(e.message || "Operation failed"); }
  };
 
  const handleDelete = async id => {
    if (!window.confirm("Delete this bill?")) return;
    setBills(prev => prev.filter(b => b.id !== id));
    showToast("Bill deleted");
    try {
      const res = await fetch(`${API}/bills_delete/`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, modified_by: "admin" })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { fetchBills(); showToast(data?.error || "Failed to delete bill"); }
    } catch { fetchBills(); showToast("Failed to delete bill"); }
  };
 
  const filtered = bills.filter(b =>
    [b.invoice_number, patientName(b.patient_id), b.status, b.chief_complaint]
      .some(v => String(v ?? "").toLowerCase().includes(search.toLowerCase()))
  );
 
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
 
  return (
    <div>
      <PageHeader title="Bills & Invoices" subtitle="Manage billing records" actions={
        <Btn onClick={() => { setEditingBill(null); setForm(blank); setErrors({}); setShowModal(true); }}>
          <Icons.Plus /> New Invoice
        </Btn>
      } />
 
      {isLoading ? <div className="text-center py-6 text-gray-500">Loading bills...</div> : (
        <div>
          <DataTable
            title="Invoice List" subtitle={`${filtered.length} invoices`}
            search={search} onSearch={setSearch} searchPlaceholder="Search invoice #, patient, status…"
            actions={<Btn variant="secondary"><Icons.Download />Export CSV</Btn>}
            columns={["Invoice #", "Patient", "Chief Complaint", "Date", "Subtotal", "GST", "Discount", "Total", "Status", "Actions"]}
            rows={paginated.map(b => (
              <TR key={b.id}>
                <TD mono bold style={{ color: "#0E6C68" }}>{b.invoice_number}</TD>
                <TD bold>{patientName(b.patient_id)}</TD>
                <TD muted>{b.chief_complaint || "—"}</TD>
                <TD muted>{b.created_at ? String(b.created_at).split("T")[0] : "—"}</TD>
                <TD>₹{Number(b.subtotal || 0).toLocaleString()}</TD>
                <TD>₹{Number(b.gst_amount || 0).toLocaleString()}</TD>
                <TD>₹{Number(b.discount || 0).toLocaleString()}</TD>
                <TD bold>₹{Number(b.total_amount || 0).toLocaleString()}</TD>
                <TD><Badge status={b.status} /></TD>
                <TD>
                  <div className="flex gap-1">
                    <button onClick={() => setViewBill(b)} className="p-1.5 hover:bg-teal-50 hover:text-teal-700 rounded-lg transition-colors text-slate-400"><Icons.Eye /></button>
                    <button onClick={() => handleEdit(b)} className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-slate-400"><Icons.Edit /></button>
                    <button onClick={() => handleDelete(b.id)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-slate-400"><Icons.Trash /></button>
                  </div>
                </TD>
              </TR>
            ))}
          />
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <span className="text-sm text-slate-500">
              Showing <b>{filtered.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)}</b> of <b>{filtered.length}</b>
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">← Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setCurrentPage(n)}
                  className={`w-8 h-8 text-sm rounded-lg font-medium border ${n === page ? "text-white border-transparent" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                  style={n === page ? { background: "linear-gradient(135deg,#0E6C68,#14A3A0)" } : {}}>{n}
                </button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
            </div>
          </div>
        </div>
      )}
 
      {viewBill && (
        <Modal title={`Invoice — ${viewBill.invoice_number}`} onClose={() => setViewBill(null)} wide>
          <div className="space-y-4">
            <div className="flex justify-between">
              <div>
                <div className="font-bold text-slate-800">{patientName(viewBill.patient_id)}</div>
                <div className="text-sm text-slate-400">Date: {viewBill.created_at ? String(viewBill.created_at).split("T")[0] : "—"} • {viewBill.chief_complaint || "No chief complaint"}</div>
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
                <span className="text-slate-800">Total Amount</span>
                <span style={{ color: "#0E6C68" }}>₹{Number(viewBill.total_amount || 0).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex justify-end"><Btn variant="secondary" onClick={() => setViewBill(null)}>Close</Btn></div>
          </div>
        </Modal>
      )}
 
      {showModal && (
        <Modal title={editingBill ? "Edit Invoice" : "New Invoice"} onClose={closeModal} wide>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Patient *</label>
              <select value={form.patient_id} onChange={e => handlePatientChange(e.target.value)} className={`${sel} ${errors.patient_id ? "border-red-400" : ""}`}>
                <option value="">Select patient…</option>
                {patients.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              {errors.patient_id && <p className="text-red-500 text-xs mt-1">{errors.patient_id}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Encounter</label>
              <select value={form.encounter_id} onChange={e => handleEncounterChange(e.target.value)} disabled={!form.patient_id} className={`${sel} ${!form.patient_id ? "opacity-50 cursor-not-allowed" : ""}`}>
                <option value="">{form.patient_id ? patientEncounters.length ? "Select encounter…" : "No encounters found" : "Select a patient first"}</option>
                {patientEncounters.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.chief_complaint || `Encounter #${e.id}`}{e.visit_date ? ` — ${String(e.visit_date).split("T")[0]}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <Input label="Chief Complaint" value={form.chief_complaint} onChange={v => setField("chief_complaint", v)} placeholder="Auto-filled from encounter or enter manually" />
            </div>
            <div>
              <Input label="Invoice Number *" value={form.invoice_number} onChange={v => setField("invoice_number", v)} className={errors.invoice_number ? "border-red-400" : ""} />
              {errors.invoice_number && <p className="text-red-500 text-xs mt-1">{errors.invoice_number}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
              <select value={form.status} onChange={e => setField("status", e.target.value)} className={sel}>
                {["Unpaid", "Paid", "Partial"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <Input label="Subtotal (₹) *" type="number" value={form.subtotal} onChange={v => setField("subtotal", v)} className={errors.subtotal ? "border-red-400" : ""} />
              {errors.subtotal && <p className="text-red-500 text-xs mt-1">{errors.subtotal}</p>}
            </div>
            <div><Input label="GST Amount (₹)" type="number" value={form.gst_amount} onChange={v => setField("gst_amount", v)} /></div>
            <div><Input label="Discount (₹)" type="number" value={form.discount} onChange={v => setField("discount", v)} /></div>
            <div><Input label="Total Amount (₹)" type="number" value={form.total_amount} onChange={v => setField("total_amount", v)} /></div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Btn variant="secondary" onClick={closeModal}>Cancel</Btn>
            <Btn onClick={handleSave}><Icons.Check />{editingBill ? "Update Invoice" : "Create Invoice"}</Btn>
          </div>
        </Modal>
      )}
 
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
};
 
export default BillingPage;