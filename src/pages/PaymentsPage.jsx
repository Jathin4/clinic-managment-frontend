import { useState, useEffect } from 'react';
import Icons from '../components/Icons';
import { RightDrawer, Btn, Input, Toast, PageHeader, DataTable, TR, TD } from '../components/UI';
import { useApp } from '../context/AppContext';

const API_BASE = process.env.REACT_APP_API_BASE_URL;
const BLANK = { bill_id: "", payment_mode: "", transaction_reference: "", amount_paid: "", payment_date: "" };
const PAYMENT_MODES = ["Cash", "Card", "UPI"];
const modeBadge = m => ({ Cash: "bg-green-50 text-green-700 border-green-100", Card: "bg-blue-50 text-blue-700 border-blue-100", UPI: "bg-purple-50 text-purple-700 border-purple-100" }[m] || "bg-gray-50 text-gray-600 border-gray-200");

const userObj = JSON.parse(sessionStorage.getItem("user") || "{}");
const CLINIC_ID = userObj?.clinic_id;

const PaymentsPage = () => {
    const { showLoading, hideLoading } = useApp();
    const [payments, setPayments] = useState([]);
    const [bills, setBills] = useState([]);
    const [patients, setPatients] = useState([]);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [errors, setErrors] = useState({});
    const [form, setForm] = useState(BLANK);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [modeFilter, setModeFilter] = useState("All");

    const showToast = (msg, type = "success") => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000); };
    const Required = () => <span className="text-red-500">*</span>;
    const Err = ({ f }) => errors[f] ? <p className="text-red-500 text-xs mt-1">{errors[f]}</p> : null;
    const ptName = p => p ? `${p.first_name || ""} ${p.last_name || ""}`.trim() : "—";
    const getPatient = billId => { const b = bills.find(b => String(b.id) === String(billId)); return b ? patients.find(p => String(p.id) === String(b.patient_id)) : null; };
    const setField = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: undefined })); };

    const fetchPayments = async () => {
        try {
            setIsLoading(true); showLoading("Loading payments...", "payments");
            const data = await fetch(`${API_BASE}/payment_read`).then(r => r.json());
            setPayments(Array.isArray(data) ? data : []);
        } catch { showToast("Failed to load payments", "error"); }
        finally { setIsLoading(false); hideLoading(); }
    };

    const fetchBillsAndPatients = async () => {
        try {
            const [bData, pData] = await Promise.all([
                fetch(`${API_BASE}/billsread?clinic_id=${CLINIC_ID}`).then(r => r.json()),
                fetch(`${API_BASE}/patient_read?clinic_id=${CLINIC_ID}`).then(r => r.json()),
            ]);
            setBills(Array.isArray(bData) ? bData : []);
            setPatients(Array.isArray(pData) ? pData : []);
        } catch (e) { console.error("Failed to load bills/patients:", e); }
    };

    useEffect(() => { fetchPayments(); }, []);
    useEffect(() => { if (CLINIC_ID) fetchBillsAndPatients(); }, [CLINIC_ID]);
    useEffect(() => { setCurrentPage(1); }, [search, modeFilter]);

    const openAdd = () => { setEditing(null); setForm(BLANK); setErrors({}); setShowModal(true); };
    const openEdit = p => { setEditing(p); setForm({ bill_id: p.bill_id || "", payment_mode: p.payment_mode || "", transaction_reference: p.transaction_reference || "", amount_paid: p.amount_paid != null ? String(p.amount_paid) : "", payment_date: p.payment_date || "" }); setErrors({}); setShowModal(true); };
    const handleClose = () => { setShowModal(false); setEditing(null); setForm(BLANK); setErrors({}); };

    const handleSave = async () => {
        const e = {};
        if (!form.bill_id) e.bill_id = "Required";
        if (!form.amount_paid || Number(form.amount_paid) <= 0) e.amount_paid = "Must be greater than 0";
        if (!form.payment_mode) e.payment_mode = "Required";
        if (Object.keys(e).length) { setErrors(e); return; }
        try {
            const res = await fetch(`${API_BASE}/payment_create_update`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editing?.id || null,
                    bill_id: Number(form.bill_id),
                    payment_mode: form.payment_mode,
                    transaction_reference: form.transaction_reference || null,
                    amount_paid: parseFloat(form.amount_paid),
                    payment_date: form.payment_date || new Date().toISOString(),
                    created_by: userObj?.full_name || userObj?.email || "admin",
                }),
            });
            const data = await res.json();
            if (!res.ok) { showToast(data.error || "Operation failed", "error"); return; }
            showToast(editing ? "Payment updated" : "Payment recorded");
            handleClose(); fetchPayments();
        } catch { showToast("Server error", "error"); }
    };

    const handleDelete = async id => {
        if (!window.confirm("Delete this payment?")) return;
        try {
            await fetch(`${API_BASE}/payments_delete/`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, deleted_by: userObj?.full_name || userObj?.email || "admin" }) });
            showToast("Payment deleted"); fetchPayments();
        } catch { showToast("Failed to delete", "error"); }
    };

    const filtered = payments.filter(p => {
        const q = search.toLowerCase();
        const name = ptName(getPatient(p.bill_id)).toLowerCase();
        return (name.includes(q) || (p.payment_mode || "").toLowerCase().includes(q) || String(p.bill_id).includes(q) || String(p.id || "").includes(q) || (p.transaction_reference || "").toLowerCase().includes(q))
            && (modeFilter === "All" || p.payment_mode === modeFilter);
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const total = payments.reduce((s, p) => s + Number(p.amount_paid || 0), 0);
    const cashTotal = payments.filter(p => p.payment_mode === "Cash").reduce((s, p) => s + Number(p.amount_paid || 0), 0);
    const digTotal = payments.filter(p => p.payment_mode !== "Cash").reduce((s, p) => s + Number(p.amount_paid || 0), 0);

    const billOptions = bills
        .filter(b => b.status !== "Paid")
        .map(b => {
            const pat = patients.find(p => String(p.id) === String(b.patient_id));
            return { value: b.id, label: `${b.invoice_number || `BILL-${b.id}`} — ₹${Number(b.total_amount || 0).toLocaleString("en-IN")}${pat ? ` · ${ptName(pat)}` : ""}` };
        });

    const cls = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white";
    const lbl = "block text-sm font-medium text-gray-700 mb-1";

    return (
        <div>
            <PageHeader title="Payments" subtitle="Payment records and transaction history"
                actions={<Btn onClick={openAdd}><Icons.Plus /> Record Payment</Btn>} />

            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: "Total Collected", value: total, dot: "bg-teal-500", sub: `${payments.length} transactions` },
                    { label: "Cash Payments", value: cashTotal, dot: "bg-green-500", sub: `${payments.filter(p => p.payment_mode === "Cash").length} records` },
                    { label: "Digital Payments", value: digTotal, dot: "bg-purple-500", sub: `${payments.filter(p => p.payment_mode !== "Cash").length} records` },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                            <div className={`w-3 h-3 rounded-full ${s.dot}`} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">{s.label}</p>
                            <p className="text-xl font-bold text-gray-900">₹{s.value.toLocaleString("en-IN")}</p>
                            <p className="text-xs text-gray-400">{s.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-2 mb-4">
                {["All", "Cash", "Card", "UPI"].map(m => (
                    <button key={m} onClick={() => setModeFilter(m)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${modeFilter === m ? "bg-teal-700 text-white border-teal-700" : "bg-white text-gray-500 border-gray-200 hover:border-teal-400 hover:text-teal-700"}`}>
                        {m}{m !== "All" && ` (${payments.filter(p => p.payment_mode === m).length})`}
                    </button>
                ))}
            </div>

            {isLoading ? <div className="text-center py-6 text-gray-500">Loading payments...</div> : (
                <DataTable
                    title="Payment History" subtitle={`${filtered.length} transaction${filtered.length !== 1 ? "s" : ""}`}
                    search={search} onSearch={setSearch} searchPlaceholder="Search patient, mode, bill…"
                    actions={<Btn variant="secondary"><Icons.Download /> Export</Btn>}
                    columns={["Payment ID", "Bill", "Patient", "Mode", "Ref", "Amount", "Date", "Actions"]}
                    rows={paginated.map(p => {
                        const bill = bills.find(b => String(b.id) === String(p.bill_id));
                        const pat = getPatient(p.bill_id);
                        return (
                            <TR key={p.id}>
                                <TD mono bold>{p.id ? `PAY-${String(p.id).padStart(4, "0")}` : "—"}</TD>
                                <TD mono>{bill?.invoice_number || `BILL-${p.bill_id}` || "—"}</TD>
                                <TD><span className="font-semibold text-slate-700">{ptName(pat)}</span></TD>
                                <TD><span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${modeBadge(p.payment_mode)}`}>{p.payment_mode}</span></TD>
                                <TD muted>{p.transaction_reference || "—"}</TD>
                                <TD bold>₹{Number(p.amount_paid || 0).toLocaleString("en-IN")}</TD>
                                <TD muted>{p.payment_date || "—"}</TD>
                                <TD>
                                    <div className="flex gap-1">
                                        <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-400"><Icons.Edit /></button>
                                        <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg text-slate-400"><Icons.Trash /></button>
                                    </div>
                                </TD>
                            </TR>
                        );
                    })}
                    currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage}
                    totalItems={filtered.length} pageSize={pageSize}
                    onPageSizeChange={n => { setPageSize(n); setCurrentPage(1); }} pageSizeOptions={[10, 20, 50]}
                />
            )}

            <RightDrawer title={editing ? "Edit Payment" : "Record Payment"} open={showModal} onClose={handleClose}>
                <div className="h-full flex flex-col">
                    <div className="px-8 py-4 bg-gradient-to-r from-teal-50 to-blue-50 border-b border-teal-100">
                        <p className="text-sm text-gray-600">{editing ? "Update the payment details below" : "Fill in the details to record a new payment"}</p>
                    </div>
                    <div className="flex-1 overflow-y-auto px-8 py-4 space-y-4">

                        {/* Bill */}
                        <div>
                            <label className={lbl}>Bill / Invoice <Required /></label>
                            <select className={cls} value={form.bill_id}
                                onChange={e => {
                                    const v = e.target.value;
                                    setField("bill_id", v);
                                    if (!editing && v) { const b = bills.find(b => String(b.id) === String(v)); if (b) setField("amount_paid", String(b.total_amount || "")); }
                                }}>
                                <option value="" disabled>— Select a bill —</option>
                                {billOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            <Err f="bill_id" />
                        </div>

                        {/* Bill Preview */}
                        {form.bill_id && (() => {
                            const pat = getPatient(form.bill_id);
                            const bill = bills.find(b => String(b.id) === String(form.bill_id));
                            if (!pat && !bill) return null;
                            return (
                                <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 flex items-center justify-between">
                                    <div>
                                        {pat && <p className="text-sm font-semibold text-teal-800">{ptName(pat)}</p>}
                                        {bill && <p className="text-xs text-teal-600">Bill total: ₹{Number(bill.total_amount || 0).toLocaleString("en-IN")}</p>}
                                    </div>
                                    {bill && <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${bill.status === "Paid" ? "bg-green-50 text-green-700 border-green-100" : "bg-yellow-50 text-yellow-700 border-yellow-100"}`}>{bill.status}</span>}
                                </div>
                            );
                        })()}

                        {/* Amount */}
                        <div>
                            <label className={lbl}>Amount Paid (₹) <Required /></label>
                            <input type="number" className={cls} value={form.amount_paid} onChange={e => setField("amount_paid", e.target.value)} placeholder="Enter amount" />
                            <Err f="amount_paid" />
                        </div>

                        {/* Payment Mode */}
                        <div>
                            <label className={lbl}>Payment Mode <Required /></label>
                            <select className={cls} value={form.payment_mode}
                                onChange={e => { setField("payment_mode", e.target.value); setField("transaction_reference", ""); }}>
                                <option value="" disabled>— Select mode —</option>
                                {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <Err f="payment_mode" />
                        </div>

                        {/* Ref for Card/UPI */}
                        {(form.payment_mode === "Card" || form.payment_mode === "UPI") && (
                            <div>
                                <label className={lbl}>Transaction Reference</label>
                                <input className={cls} value={form.transaction_reference} onChange={e => setField("transaction_reference", e.target.value)} placeholder={form.payment_mode === "UPI" ? "UPI reference ID" : "Card ref no."} />
                            </div>
                        )}

                        {/* Date */}
                        <div>
                            <label className={lbl}>Payment Date</label>
                            <input type="datetime-local" className={cls} value={form.payment_date} onChange={e => setField("payment_date", e.target.value)} />
                        </div>

                    </div>
                    <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                        <Btn variant="secondary" onClick={handleClose}>Cancel</Btn>
                        <Btn onClick={handleSave} disabled={!form.bill_id || !form.amount_paid || !form.payment_mode || Number(form.amount_paid) <= 0}>
                            <Icons.Check />{editing ? "Update Payment" : "Record Payment"}
                        </Btn>
                    </div>
                </div>
            </RightDrawer>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default PaymentsPage;