import { useState, useEffect, useRef } from 'react';
import Icons from '../components/Icons';
import { Badge, RightDrawer, Btn, Toast, PageHeader, DataTable, TR, TD, Modal } from '../components/UI';
import { useApp } from '../context/AppContext';
import PrintSlip, { triggerPrint } from './PrintSlip';

const ITEMS_PER_PAGE = 10;
const API = process.env.REACT_APP_API_BASE_URL;
const LS_KEY = 'deletedBills';
const getDeleted = () => JSON.parse(localStorage.getItem(LS_KEY) || '[]');
const addDeleted = id => localStorage.setItem(LS_KEY, JSON.stringify([...getDeleted(), id]));

const getClinicId = () => { try { const u = sessionStorage.getItem("user"); return u ? JSON.parse(u)?.clinic_id : null; } catch { return null; } };
const todayStr = () => new Date().toISOString().split("T")[0];

// ── Invoice type badge ────────────────────────────────────────────────────────
const InvoiceTypeBadge = ({ invoiceNumber }) => {
  if (!invoiceNumber) return <span className="text-slate-300">—</span>;
  const num = String(invoiceNumber).toUpperCase();
  if (num.startsWith("DCF")) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
      <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />Doctor Fee
    </span>
  );
  if (num.startsWith("SALEC")) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />Medicine (Clinic)
    </span>
  );
  if (num.startsWith("SALEN")) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Medicine (External)
    </span>
  );
  if (num.startsWith("INV")) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />Invoice
    </span>
  );
  return <span className="text-xs text-slate-400">{invoiceNumber}</span>;
};

// ─── Main Component ───────────────────────────────────────────────────────────
const BillingPage = () => {
  const { showLoading, hideLoading, user } = useApp();
  const userObj = { clinic_id: getClinicId(), role: user?.role };

  const [bills, setBills]               = useState([]);
  const [patients, setPatients]         = useState([]);
  const [allEncounters, setAllEncounters] = useState([]);
  const [search, setSearch]             = useState("");
  const [isLoading, setIsLoading]       = useState(true);
  const [toast, setToast]               = useState(null);
  const [viewBill, setViewBill]         = useState(null);
  const [viewItems, setViewItems]       = useState([]);
  const [viewLoading, setViewLoading]   = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [currentPage, setCurrentPage]   = useState(1);
  const [pageSize, setPageSize]         = useState(ITEMS_PER_PAGE);

  // ── Filter state ────────────────────────────────────────────────────────────
  const [typeFilter, setTypeFilter] = useState("all");

  const showToast = (msg, type = "success") => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000); };

  // ── Fetchers ────────────────────────────────────────────────────────────────
  const fetchBills = async () => {
    try {
      setIsLoading(true);
      showLoading("Loading bills...", "billing");
      const data = await fetch(`${API}/billsread?clinic_id=${userObj.clinic_id}`).then(r => r.json());
      let billsData = Array.isArray(data) ? data : [];

      // If Diagnosist, restrict bills to diagnostic-related ones
      if (userObj.role === "Diagnosist") {
        try {
          const ordRes = await fetch(`${API}/api/diagnostic_orders_read?clinic_id=${userObj.clinic_id}`);
          const orders = await ordRes.json().catch(() => []);
          const patientIds = new Set(
            Array.isArray(orders)
              ? orders.flatMap(o => [o.patient_id, o.v_patient_id].filter(Boolean)).map(id => String(id))
              : []
          );
          const encounterIds = new Set(
            Array.isArray(orders)
              ? orders.flatMap(o => [o.encounter_id, o.v_encounter_id].filter(Boolean)).map(id => String(id))
              : []
          );
          billsData = billsData.filter(b =>
            patientIds.has(String(b.patient_id)) ||
            encounterIds.has(String(b.encounter_id)) ||
            String(b.invoice_number || "").startsWith("DCC")
          );
        } catch (e) {
          // fallback: keep no bills
          billsData = [];
        }
      }

      const deleted = getDeleted();
      setBills(billsData.filter(b => !deleted.includes(b.id)));
    } catch { showToast("Failed to load bills", "error"); }
    finally { setIsLoading(false); hideLoading(); }
  };

  const fetchPatients = async () => {
    try {
      const data = await fetch(`${API}/patient_read?clinic_id=${userObj.clinic_id}`).then(r => r.json());
      setPatients(Array.isArray(data) ? data.map(p => ({
        value: p.id,
        label: `${p.first_name} ${p.last_name ?? ""}`.trim() + (p.phone ? ` — ${p.phone}` : ""),
      })) : []);
    } catch { }
  };

  const fetchEncounters = async () => {
    try {
      const data = await fetch(`${API}/encountersread?clinic_id=${userObj.clinic_id}`).then(r => r.json());
      setAllEncounters(Array.isArray(data) ? data : []);
    } catch { }
  };

  useEffect(() => { fetchBills(); fetchPatients(); fetchEncounters(); }, []);
  useEffect(() => { setCurrentPage(1); }, [search, typeFilter]);

  // ── Derived helpers ─────────────────────────────────────────────────────────
  const patientName    = id => patients.find(p => String(p.value) === String(id))?.label || "—";
  const getComplaint   = b => b.chief_complaint || b._chief_complaint || allEncounters.find(e => String(e.id) === String(b.encounter_id))?.chief_complaint || "—";
  const getDate        = b => { const d = b.created_at || b.created_date; return d ? String(d).split("T")[0] : "—"; };
  const getDisplayName = b => b.patient_name_override || patientName(b.patient_id);
  const viewGstAmt     = vb => { if (!vb) return 0; if (vb.gst_amount != null) return Number(vb.gst_amount); const sub = parseFloat(vb.subtotal) || 0; return parseFloat((sub * ((parseFloat(vb.gst_percent) || 0) / 100)).toFixed(2)); };
  const viewDiscAmt    = vb => { if (!vb) return 0; if (vb.discount != null) return Number(vb.discount); const sub = parseFloat(vb.subtotal) || 0; return parseFloat((sub * ((parseFloat(vb.discount_percent) || 0) / 100)).toFixed(2)); };

  const getInvoiceType = inv => {
    if (!inv) return "other";
    const n = String(inv).toUpperCase();
    if (n.startsWith("DCF")) return "dcf";
    if (n.startsWith("SALEC")) return "salec";
    if (n.startsWith("SALEN")) return "salen";
    return "other";
  };

  const fetchSaleItems = async (bill) => {
    const inv = bill.invoice_number;
    const isPharmacy = inv.startsWith("SALEC") || inv.startsWith("SALEN");
    if (!isPharmacy) { setViewItems([]); return; }
    
    setViewLoading(true);
    try {
      // 1. Get all sales to find sale_id
      const salesRes = await fetch(`${API}/pharmacy_sales_read?clinic_id=${userObj.clinic_id}`);
      const sales = await salesRes.json();
      const sale = sales.find(s => s.sale_invoice_no === inv);
      
      if (sale) {
        // 2. Get sale items
        const itemsRes = await fetch(`${API}/pharmacy_sale_items_read?sale_id=${sale.sale_id}&clinic_id=${userObj.clinic_id}`);
        const data = await itemsRes.json();
        setViewItems(Array.isArray(data) ? data : []);
      } else {
        setViewItems([]);
      }
    } catch {
      showToast("Failed to load items", "error");
    } finally {
      setViewLoading(false);
    }
  };

  useEffect(() => {
    if (viewBill) {
      fetchSaleItems(viewBill);
    } else {
      setViewItems([]);
    }
  }, [viewBill]);

  const handleDelete = async id => {
    try {
      await fetch(`${API}/bills_delete/`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, modified_by: "admin" }) });
    } catch { }
    addDeleted(id);
    setBills(prev => prev.filter(b => b.id !== id));
    showToast("Bill deleted");
    setDeleteConfirm(null);
  };

  // ── Filter & paginate ───────────────────────────────────────────────────────
  const typeFiltered = typeFilter === "all" ? bills : bills.filter(b => getInvoiceType(b.invoice_number) === typeFilter);
  const filtered = typeFiltered.filter(b => {
    const name = getDisplayName(b);
    return [b.invoice_number, name, b.payment_mode, getComplaint(b)].some(v => String(v ?? "").toLowerCase().includes(search.toLowerCase()));
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page       = Math.min(currentPage, totalPages);
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize);

  // ── Summary stats ───────────────────────────────────────────────────────────
  const dcfCount   = bills.filter(b => getInvoiceType(b.invoice_number) === "dcf").length;
  const salecCount = bills.filter(b => getInvoiceType(b.invoice_number) === "salec").length;
  const salenCount = bills.filter(b => getInvoiceType(b.invoice_number) === "salen").length;
  const totalAmt   = bills.reduce((s, b) => s + (Number(b.total_amount) || 0), 0);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader title="Bills & Invoices" subtitle="View all billing records" />

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Doctor Fee", count: dcfCount, color: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", dot: "bg-purple-500", type: "dcf" },
          { label: "Medicine (Clinic)", count: salecCount, color: "bg-teal-50", border: "border-teal-200", text: "text-teal-700", dot: "bg-teal-500", type: "salec" },
          { label: "Medicine (External)", count: salenCount, color: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500", type: "salen" },
          { label: "Total Revenue", count: `₹${totalAmt.toLocaleString("en-IN")}`, color: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500", type: null },
        ].map((s, i) => (
          <div
            key={i}
            onClick={() => s.type && setTypeFilter(f => f === s.type ? "all" : s.type)}
            className={`bg-white rounded-2xl p-5 border ${s.type && typeFilter === s.type ? s.border + " ring-2 ring-offset-1 " + s.border.replace("border-", "ring-") : "border-gray-100"} shadow-sm transition-all ${s.type ? "cursor-pointer hover:shadow-md" : ""}`}
          >
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.color} ${s.text} border ${s.border} mb-3`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
            </div>
            <div className="text-2xl font-bold text-slate-800">{s.count}</div>
            {s.type && <div className="text-xs text-slate-400 mt-1">{typeFilter === s.type ? "Click to clear filter" : "Click to filter"}</div>}
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      {isLoading ? (
        <div className="text-center py-6 text-gray-500">Loading bills...</div>
      ) : (
        <DataTable
          title="Invoice List"
          subtitle={`${filtered.length} invoice${filtered.length !== 1 ? "s" : ""}${typeFilter !== "all" ? " (filtered)" : ""}`}
          search={search} onSearch={v => { setSearch(v); setCurrentPage(1); }} searchPlaceholder="Search invoice #, patient, payment mode…"
          actions={
            <div className="flex items-center gap-2">
              {typeFilter !== "all" && (
                <button onClick={() => setTypeFilter("all")} className="text-xs px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
                  Clear filter ×
                </button>
              )}
              <Btn variant="secondary"><Icons.Download /> Export CSV</Btn>
            </div>
          }
          // columns={["Invoice #", "Type", "Patient", "Chief Complaint", "Date", "Subtotal", "GST", "Discount", "Total", "Payment", "Actions"]}

          columns={["Invoice #", "Patient", "Date", "Subtotal", "Discount", "Total", "Payment", "Actions"]}
          rows={paginated.map(b => (
            <TR key={b.id}>
              <TD mono bold style={{ color: "#0E6C68" }}>{b.invoice_number}</TD>
              {/* <TD><InvoiceTypeBadge invoiceNumber={b.invoice_number} /></TD> */}
              <TD bold>{getDisplayName(b)}</TD>
              {/* <TD muted>{getComplaint(b)}</TD> */}
              <TD muted>{getDate(b)}</TD>
              <TD>₹{Number(b.subtotal || 0).toLocaleString()}</TD>
              {/* <TD>{b.gst_percent != null ? `${b.gst_percent}%` : `₹${Number(b.gst_amount || 0).toLocaleString()}`}</TD> */}
              <TD>{b.discount_percent != null ? `${b.discount_percent}%` : `₹${Number(b.discount || 0).toLocaleString()}`}</TD>
              <TD bold>₹{Number(b.total_amount || 0).toLocaleString()}</TD>
              <TD>{b.payment_mode || "Cash"}</TD>
              <TD>
                <div className="flex gap-1">
                  <button onClick={() => setViewBill(b)} className="p-1.5 hover:bg-teal-50 hover:text-teal-700 rounded-lg transition-colors text-slate-400" title="View details"><Icons.Eye /></button>
                  <button onClick={() => setDeleteConfirm(b.id)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-slate-400" title="Delete"><Icons.Trash /></button>
                  {(() => {
                    const enc = allEncounters.find(e => String(e.id) === String(b.encounter_id));
                    const enrichedBill = {
                      ...b,
                      doctor_name: b.doctor_name || enc?.doctor_name || enc?.doctor,
                      slot_time: b.slot_time || enc?.slot_time || enc?.time,
                      chief_complaint: getComplaint(b)
                    };
                    return <PrintSlip bill={enrichedBill} patientName={getDisplayName(b)} clinicName="Your Clinic Name" />;
                  })()}
                </div>
              </TD>
            </TR>
          ))}
          currentPage={page} totalPages={totalPages} onPageChange={setCurrentPage}
          totalItems={filtered.length} pageSize={pageSize}
          onPageSizeChange={n => { setPageSize(n); setCurrentPage(1); }} pageSizeOptions={[10, 20, 50]}
        />
      )}

      {/* ── VIEW MODAL ── */}
      {viewBill && (
        <Modal title={`Invoice — ${viewBill.invoice_number}`} onClose={() => setViewBill(null)} wide>
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-slate-800">{getDisplayName(viewBill)}</div>
                <div className="text-sm text-slate-400 mt-0.5">Date: {getDate(viewBill)} • {getComplaint(viewBill)}</div>
              </div>
              <div className="flex items-center gap-2">
                <InvoiceTypeBadge invoiceNumber={viewBill.invoice_number} />
                <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-lg font-medium">{viewBill.payment_mode || "Cash"}</span>
              </div>
            </div>
            {viewItems.length > 0 && (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sale Items</div>
                {viewItems.map((item, idx) => (
                  <div key={idx} className="border border-gray-100 rounded-xl px-4 py-3 bg-white shadow-sm flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-slate-800 text-sm">{item.medicine_name}</div>
                      <div className="text-xs text-slate-400">Qty: {item.quantity} · Price: ₹{Number(item.sale_price).toFixed(2)}</div>
                    </div>
                    <div className="text-sm font-bold text-teal-700">₹{Number(item.total_amount).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
            {viewLoading && <div className="text-center py-4 text-sm text-slate-400 animate-pulse">Loading items...</div>}
            
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span className="text-slate-700">₹{Number(viewBill.subtotal || 0).toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Discount{viewBill.discount_percent != null ? ` (${viewBill.discount_percent}%)` : ""}</span><span className="text-green-600 font-medium">-₹{viewDiscAmt(viewBill).toLocaleString()}</span></div>
              <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2"><span>Total Amount</span><span style={{ color: "#0E6C68" }}>₹{Number(viewBill.total_amount || 0).toLocaleString()}</span></div>
            </div>
            <div className="flex justify-end">
              <Btn variant="secondary" onClick={() => setViewBill(null)}>Close</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── DELETE CONFIRM ── */}
      {deleteConfirm && (
        <Modal title="Delete Bill" onClose={() => setDeleteConfirm(null)}>
          <p className="text-sm text-slate-600 mb-6">Are you sure you want to delete this bill? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Btn variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Btn>
            <Btn onClick={() => handleDelete(deleteConfirm)} style={{ background: "#ef4444" }}><Icons.Trash /> Delete</Btn>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default BillingPage;