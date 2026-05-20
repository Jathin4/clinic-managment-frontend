import { useState, useEffect, useRef } from 'react';
import Icons from '../components/Icons';
import { RightDrawer, Btn, Input, Toast, PageHeader, DataTable, TR, TD } from '../components/UI';
import { useApp } from '../context/AppContext';
import PrintSlip, { triggerPrint as triggerInventoryPrint } from './PrintSlip';

// ── Helpers ───────────────────────────────────────────────────────────────────
const API = process.env.REACT_APP_API_BASE_URL;
const fmtDate = d => d ? d.split("T")[0].split("-").reverse().join("/") : "—";
const todayStr = () => new Date().toISOString().split("T")[0];
const isExpired = d => d && new Date(d).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);

// Categories where sell_qty must be a whole number
const WHOLE_CATS = ["Tablet", "Capsule", "Injection", "Strip"];

const OUT_COLS = ["Invoice No.", "Sale Date", "Patient", "Chief Complaint", "Items", "Total", "Payment", "Status", ""];

const BLANK_SALE = { medicine_name: "", sell_qty: "", batch_id: "" };

const getClinicId = () => {
  try { const u = sessionStorage.getItem("user"); return u ? JSON.parse(u)?.clinic_id : null; } catch { return null; }
};
const getUser = () => {
  try { const u = sessionStorage.getItem("user"); if (!u) return "admin"; const p = JSON.parse(u); return p?.username || p?.name || p?.email || "admin"; } catch { return "admin"; }
};

// ── Invoice number helper ─────────────────────────────────────────────────────
const fetchNextSaleInvoiceNumber = async (clinicId, prefix) => {
  try {
    const res = await fetch(`${API}/bills_next_invoice?clinic_id=${clinicId}&prefix=${prefix}`);
    const data = await res.json();
    return data.invoice_number || `${prefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-0001`;
  } catch {
    return `${prefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-0001`;
  }
};

// ── Sub-components ────────────────────────────────────────────────────────────
const MedicineSearchDropdown = ({ medicineOptions = [], value, onChange }) => {
  const [search, setSearch] = useState(value || "");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const filtered = search
    ? medicineOptions.filter(n => n.toLowerCase().includes(search.toLowerCase()))
    : medicineOptions;
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        Medicine Name <span className="text-red-500">*</span>
      </label>
      <input
        value={search}
        onChange={e => { setSearch(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search medicine…"
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filtered.map(name => (
            <button key={name} type="button"
              onClick={() => { setSearch(name); onChange(name); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-teal-50 hover:text-teal-700 text-slate-700"
            >{name}</button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Stat card icons ───────────────────────────────────────────────────────────
const IconCart = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0E6C68" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" /></svg>;
const IconTrendUp = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
const IconPill = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.5 20H4a2 2 0 01-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 011.66.9l.82 1.2a2 2 0 001.66.9H20a2 2 0 012 2v2" /><circle cx="17" cy="17" r="5" /><path d="M17 14v6m-3-3h6" /></svg>;
const IconReceipt = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>;

// ── Main Page ─────────────────────────────────────────────────────────────────
const PharmacySales = () => {
  const { showLoading, hideLoading } = useApp();

  // ── Core data ─────────────────────────────────────────────────────────────
  const [inventory, setInventory] = useState([]);
  const [sales, setSales] = useState([]);
  const [patients, setPatients] = useState([]);
  const [allEncounters, setAllEncounters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // ── Table state ───────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ── Sales drawer ──────────────────────────────────────────────────────────
  const [showSales, setShowSales] = useState(false);
  const [sale, setSale] = useState(BLANK_SALE);
  const [salesList, setSalesList] = useState([]);
  const [isSaleSubmitting, setIsSaleSubmitting] = useState(false);

  // ── Sale detail drawer ────────────────────────────────────────────────────
  const [viewBill, setViewBill] = useState(null);
  const [viewItems, setViewItems] = useState([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [showViewDrawer, setShowViewDrawer] = useState(false);

  // ── Auto-print ────────────────────────────────────────────────────────────
  const [pendingSalePrint, setPendingSalePrint] = useState(null);

  // ── Invoice ───────────────────────────────────────────────────────────────
  const [saleInvoiceNumber, setSaleInvoiceNumber] = useState("");
  const [saleInvoiceLoading, setSaleInvoiceLoading] = useState(false);

  // ── Patient / encounter ───────────────────────────────────────────────────
  const [salePatientType, setSalePatientType] = useState("encounter");
  const [salePatientId, setSalePatientId] = useState("");
  const [saleOtherName, setSaleOtherName] = useState("");
  const [saleChiefComplaint, setSaleChiefComplaint] = useState("");
  const [saleDate, setSaleDate] = useState(todayStr());
  const [saleSelectedEncounterId, setSaleSelectedEncounterId] = useState("");

  // ── Bill-level fields ─────────────────────────────────────────────────────
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [discountPercent, setDiscountPercent] = useState(0);

  // ── Batch state ───────────────────────────────────────────────────────────
  const [batches, setBatches] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);

  const userObj = { clinic_id: getClinicId() };
  const currentUser = getUser();
  const salePrefix = salePatientType === "encounter" ? "SALEC" : "SALEN";

  const showToast = (msg, type = "success") => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000); };

  // ── Batch fetcher ─────────────────────────────────────────────────────────
  const fetchBatches = async (medicineName) => {
    if (!medicineName) { setBatches([]); return; }
    setBatchLoading(true);
    try {
      const res = await fetch(`${API}/get_batch_medicine_name?medicine_name=${encodeURIComponent(medicineName)}&clinic_id=${userObj.clinic_id}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setBatches(list);
      if (list.length > 0) setSale(p => ({ ...p, batch_id: list[0].batch_no }));
    } catch { setBatches([]); }
    finally { setBatchLoading(false); }
  };

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  useEffect(() => { fetchInventory(); fetchSales(); fetchPatients(); fetchEncounters(); }, []);
  useEffect(() => { setCurrentPage(1); }, [search]);
  useEffect(() => {
    if (!pendingSalePrint) return;
    const t = setTimeout(() => {
      triggerInventoryPrint({
        ...pendingSalePrint,
        invoice_number: pendingSalePrint.sale_invoice_number
      }, pendingSalePrint.patient_name, pendingSalePrint.items);
      setPendingSalePrint(null);
    }, 400);
    return () => clearTimeout(t);
  }, [pendingSalePrint]);
  useEffect(() => { fetchBatches(sale.medicine_name); }, [sale.medicine_name]);

  // ── Fetchers ──────────────────────────────────────────────────────────────
  const fetchInventory = async () => {
    try {
      const res = await fetch(`${API}/inventory_transactions_read?clinic_id=${userObj.clinic_id}`);
      const data = await res.json();
      setInventory(Array.isArray(data) ? data : []);
    } catch { }
  };

  const fetchSales = async () => {
    try {
      setIsLoading(true);
      showLoading("Loading sales...", "pharmacy-sales");
      const res = await fetch(`${API}/pharmacy_sales_read?clinic_id=${userObj.clinic_id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSales(Array.isArray(data) ? data : []);
    } catch { showToast("Failed to load sales data", "error"); }
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

  const fetchSaleItems = async (saleId) => {
    setViewLoading(true);
    try {
      const res = await fetch(`${API}/pharmacy_sale_items_read?sale_id=${saleId}&clinic_id=${userObj.clinic_id}`);
      const data = await res.json();
      setViewItems(Array.isArray(data) ? data : []);
    } catch { showToast("Failed to load sale items", "error"); }
    finally { setViewLoading(false); }
  };

  // ── Net stock — scoped to medicine + batch (matches InventoryPage logic) ──
  /**
   * IN  records: uses effective_quantity (base units).
   * OUT records: quantity field = base units sold.
   * Both scoped to the same medicine_name + batch_no.
   */
  const getNetStock = (medicineName, batchNo = null, pendingQty = 0) => {
    const nm = (medicineName || "").toLowerCase();
    const active = inventory.filter(i => !i.is_deleted && !i.deleted);

    // Build IN records — optionally scoped to a specific batch
    const inRecs = active.filter(i =>
      i.transaction_type === "IN" &&
      (i.medicine_name || "").toLowerCase() === nm &&
      !isExpired(i.expiry_date) &&
      (batchNo === null || (i.batch_no || "").toLowerCase() === batchNo.toLowerCase())
    );
    if (!inRecs.length) return { inRecord: null, netQty: 0 };

    const totalIn = inRecs.reduce((s, i) => {
      if (i.effective_quantity) return s + Number(i.effective_quantity);
      const ps = i.pack_size ? parseInt(i.pack_size) : 1;
      return s + Number(i.quantity) * ps;
    }, 0);

    const batchFilter = batchNo !== null
      ? i => (i.batch_no || "").toLowerCase() === batchNo.toLowerCase()
      : () => true;

    const totalOut = active.filter(i =>
      i.transaction_type === "OUT" &&
      (i.medicine_name || "").toLowerCase() === nm &&
      batchFilter(i)
    ).reduce((s, i) => s + Number(i.quantity), 0);

    return {
      inRecord: inRecs[inRecs.length - 1],
      netQty: Math.max(0, totalIn - totalOut - pendingQty),
    };
  };

  // ── Drawer helpers ────────────────────────────────────────────────────────
  const openSalesDrawer = async (patientType = salePatientType) => {
    const prefix = patientType === "encounter" ? "SALEC" : "SALEN";
    setSaleInvoiceLoading(true);
    setSaleInvoiceNumber("");
    try { setSaleInvoiceNumber(await fetchNextSaleInvoiceNumber(userObj.clinic_id, prefix)); }
    finally { setSaleInvoiceLoading(false); }
  };

  const resetSaleDrawer = () => {
    setSale(BLANK_SALE);
    setSalesList([]);
    setSaleInvoiceNumber("");
    setSalePatientType("encounter");
    setSalePatientId("");
    setSaleOtherName("");
    setSaleChiefComplaint("");
    setSaleDate(todayStr());
    setSaleSelectedEncounterId("");
    setPaymentMode("Cash");
    setPaymentStatus("Paid");
    setDiscountPercent(0);
    setBatches([]);
  };

  // ── Currently selected batch record ──────────────────────────────────────
  // When user picks a batch from the dropdown we resolve pricing from the
  // corresponding inventory IN record for that specific batch.
  const selectedBatchRecord = (() => {
    if (!sale.medicine_name || !sale.batch_id) return null;
    const nm = sale.medicine_name.toLowerCase();
    const bn = sale.batch_id.toLowerCase();
    const active = inventory.filter(i => !i.is_deleted && !i.deleted);
    // Find the most recent IN record for this medicine + batch
    const candidates = active
      .filter(i =>
        i.transaction_type === "IN" &&
        (i.medicine_name || "").toLowerCase() === nm &&
        (i.batch_no || "").toLowerCase() === bn &&
        !isExpired(i.expiry_date)
      )
      .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
    return candidates[0] || null;
  })();

  // ── Per-unit sale price for the selected batch ────────────────────────────
  // unit_sale_price is stored in the DB (= box_sale_price ÷ strips ÷ units_per_strip)
  const unitPrice = selectedBatchRecord
    ? Number(selectedBatchRecord.unit_sale_price || 0)
    : 0;

  // ── Pending qty already in salesList for same medicine + batch ────────────
  const pendingQtyForBatch = salesList
    .filter(s =>
      (s.medicine_name || "").toLowerCase() === (sale.medicine_name || "").toLowerCase() &&
      (s.batch_no || "").toLowerCase() === (sale.batch_id || "").toLowerCase()
    )
    .reduce((sum, s) => sum + Number(s.sell_qty), 0);

  // Net available for the selected batch
  const { netQty: netAvail } = (sale.medicine_name && sale.batch_id)
    ? getNetStock(sale.medicine_name, sale.batch_id, pendingQtyForBatch)
    : { netQty: 0 };

  const saleTotal = selectedBatchRecord && sale.sell_qty && unitPrice > 0
    ? (Number(sale.sell_qty) * unitPrice).toFixed(2)
    : null;

  const grandSubtotal = salesList.reduce((sum, s) => sum + Number(s.sell_qty) * Number(s.salePrice), 0);
  const discountAmt = grandSubtotal * (Number(discountPercent) / 100);
  const grandTotal = Math.max(0, grandSubtotal - discountAmt);

  // ── Available medicines (those with stock > 0 across any batch) ───────────
  const medicineOptions = [...new Set(
    inventory.filter(i => {
      if (i.is_deleted || i.deleted || i.transaction_type !== "IN" || isExpired(i.expiry_date)) return false;
      const name = i.medicine_name;
      if (!name) return false;
      // Pending qty across all batches for this medicine
      const pend = salesList
        .filter(s => (s.medicine_name || "").toLowerCase() === name.toLowerCase())
        .reduce((s, x) => s + Number(x.sell_qty), 0);
      return getNetStock(name, null, pend).netQty > 0;
    }).map(i => i.medicine_name)
  )];

  // ── Patient / encounter filters ───────────────────────────────────────────
  const saleDateEncounters = allEncounters.filter(e => !saleDate || (e.encounter_date || e.created_at || e.date || "").split("T")[0] === saleDate);
  const saleDatePatientIds = new Set(saleDateEncounters.map(e => String(e.patient_id)));
  const filteredSalePatients = salePatientType === "encounter"
    ? patients.filter(p => saleDatePatientIds.has(String(p.value)))
    : patients;
  const salePatientEncounters = allEncounters.filter(e => String(e.patient_id) === String(salePatientId));

  const resolvedPatientName = salePatientType === "other"
    ? saleOtherName
    : patients.find(p => String(p.value) === String(salePatientId))?.label || "";

  // ── Add sale item ─────────────────────────────────────────────────────────
  const handleAddSaleItem = () => {
    if (!sale.medicine_name) { showToast("Select a medicine", "error"); return; }
    if (!sale.batch_id) { showToast("Select a batch", "error"); return; }
    const sellQty = parseFloat(sale.sell_qty);
    if (!sale.sell_qty || sellQty <= 0) { showToast("Enter a valid quantity", "error"); return; }

    const cat = inventory.find(i =>
      (i.medicine_name || "").toLowerCase() === sale.medicine_name.toLowerCase()
    )?.category_name;
    if (cat && WHOLE_CATS.includes(cat) && !Number.isInteger(sellQty)) {
      showToast(`${cat} quantity must be a whole number`, "error"); return;
    }

    if (!selectedBatchRecord) { showToast("Medicine batch not found in stock", "error"); return; }
    if (isExpired(selectedBatchRecord.expiry_date)) { showToast("This batch has expired", "error"); return; }
    if (sellQty > netAvail) { showToast(`Only ${netAvail} units available in this batch`, "error"); return; }
    if (unitPrice <= 0) { showToast("Sale price not set for this medicine", "error"); return; }

    if (salesList.some(s =>
      (s.medicine_name || "").toLowerCase() === (sale.medicine_name || "").toLowerCase() &&
      (s.batch_no || "").toLowerCase() === (sale.batch_id || "").toLowerCase()
    )) {
      if (!window.confirm(`"${sale.medicine_name}" (batch ${sale.batch_id}) is already in the list. Add another line?`)) return;
    }

    setSalesList(p => [...p, {
      ...sale,
      salePrice: unitPrice,                          // per unit (what we charge)
      batch_no: selectedBatchRecord.batch_no,
      expiry_date: selectedBatchRecord.expiry_date,
      purchase_price: selectedBatchRecord.purchase_price, // per strip (for margin tracking)
      category_name: selectedBatchRecord.category_name,
      pack_size: selectedBatchRecord.pack_size,
      unit: selectedBatchRecord.unit,
      id: Date.now(),
    }]);
    setSale(BLANK_SALE);
    setBatches([]);
  };

  // ── Submit sale ───────────────────────────────────────────────────────────
  const handleSaleSubmit = async () => {
    if (!salesList.length || isSaleSubmitting) return;
    if (salePatientType === "encounter" && !salePatientId) { showToast("Please select a patient", "error"); return; }
    if (salePatientType === "other" && !saleOtherName.trim()) { showToast("Please enter patient name", "error"); return; }

    setIsSaleSubmitting(true);

    const usedInvoice = saleInvoiceNumber;
    let patientName = resolvedPatientName;
    let resolvedPatientId = salePatientType === "encounter" ? Number(salePatientId) : undefined;

    // Create patient record for external / walk-in customers
    if (salePatientType === "other" && saleOtherName.trim()) {
      const nameParts = saleOtherName.trim().split(/\s+/);
      const firstName = nameParts[0] || saleOtherName.trim();
      const lastName = nameParts.slice(1).join(" ") || "";
      try {
        const ptRes = await fetch(`${API}/patient_create_update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: null, clinic_id: getClinicId(), created_by: currentUser,
            first_name: firstName, last_name: lastName,
            phone: "", email: "", gender: "Other",
            age: null, weight: null, dob: null, blood_group: null,
            address: null, reference: null, bp: null, pulse_rate: null,
          }),
        });
        const ptData = await ptRes.json();
        if (ptRes.ok && ptData.id) { resolvedPatientId = ptData.id; patientName = saleOtherName.trim(); }
      } catch { } // non-fatal
    }

    try {
      // Step 1 — Sale header
      const saleRes = await fetch(`${API}/pharmacy_sales_create_update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sale_id: 0,
          clinic_id: userObj.clinic_id,
          sale_invoice_no: usedInvoice,
          sale_date: saleDate,
          patient_id: resolvedPatientId,
          patient_name: patientName,
          chief_complaint: saleChiefComplaint || null,
          prescription_id: null,
          subtotal: grandSubtotal,
          discount_percent: Number(discountPercent),
          discount_amount: discountAmt,
          tax_amount: 0,
          total_amount: grandTotal,
          paid_amount: paymentStatus === "Paid" ? grandTotal : 0,
          balance_amount: paymentStatus === "Paid" ? 0 : grandTotal,
          payment_mode: paymentMode,
          payment_status: paymentStatus,
          created_by: currentUser,
        }),
      });
      const saleData = await saleRes.json();
      if (!saleRes.ok) throw new Error(saleData.error || "Failed to create sale");
      const saleId = saleData.data?.sale_id;

      // Step 2 — Sale items
      for (const s of salesList) {
        const itemRes = await fetch(`${API}/pharmacy_sale_items_create_update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sale_item_id: 0,
            sale_id: saleId,
            clinic_id: userObj.clinic_id,
            category_name: s.category_name,
            medicine_name: s.medicine_name,
            batch_no: s.batch_no || null,
            expiry_date: s.expiry_date?.split("T")[0] || null,
            pack_size: s.pack_size || null,
            unit: s.unit || null,
            quantity: parseFloat(s.sell_qty),           // base units sold
            free_qty: 0,
            sale_price: parseFloat(s.salePrice || 0),     // per unit
            discount_percent: 0,
            discount_amount: 0,
            total_amount: parseFloat(s.sell_qty) * parseFloat(s.salePrice || 0),
            created_by: currentUser,
          }),
        });
        if (!itemRes.ok) { const d = await itemRes.json(); throw new Error(d.error || "Failed to save sale item"); }
      }

      // Step 3 — Inventory OUT records (base units deducted)
      for (const s of salesList) {
        await fetch(`${API}/inventory_create_update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transaction_id: 0,
            clinic_id: userObj.clinic_id,
            created_by: currentUser,
            category_name: s.category_name,
            medicine_name: s.medicine_name,
            transaction_type: "OUT",
            batch_no: s.batch_no || "",
            expiry_date: s.expiry_date?.split("T")[0] || "",
            quantity: parseFloat(s.sell_qty),   // base units (matches effective_quantity tracking)
            purchase_price: parseFloat(s.purchase_price || 0),
            sale_price: parseFloat(s.salePrice || 0),
            remarks: "Pharmacy Sale",
            transaction_date: saleDate,
            sale_invoice_number: usedInvoice,
            patient_name: patientName,
            chief_complaint: saleChiefComplaint || null,
          }),
        });
      }

      // Step 4 — Bill record
      const billRes = await fetch(`${API}/bills_create_update/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: 0,
          clinic_id: userObj.clinic_id,
          created_by: currentUser,
          patient_id: resolvedPatientId,
          patient_name_override: salePatientType === "other" ? saleOtherName : null,
          encounter_id: saleSelectedEncounterId ? Number(saleSelectedEncounterId) : null,
          chief_complaint: saleChiefComplaint || null,
          invoice_number: usedInvoice,
          sale_invoice_number: usedInvoice,
          payment_mode: "Cash",
          subtotal: grandTotal,
          gst_percent: 0,
          gst_amount: 0,
          discount_percent: 0,
          discount: 0,
          total_amount: grandTotal,
          appointment_id: null,
        }),
      });
      const billData = await billRes.json();
      if (!billRes.ok) throw new Error(billData.error || "Failed to create billing record");

      // Trigger print (batch info hidden on receipt)
      setPendingSalePrint({
        sale_invoice_number: usedInvoice,
        patient_name: patientName,
        chief_complaint: saleChiefComplaint,
        items: salesList.map(item => ({ ...item, batch_no: undefined })),
        date: saleDate,
      });

      resetSaleDrawer();
      setShowSales(false);
      fetchSales();
      fetchInventory();
      showToast("Sale recorded successfully");
    } catch (e) {
      showToast(e.message || "Failed to save sale", "error");
    } finally {
      setIsSaleSubmitting(false);
    }
  };

  // ── Filter & paginate ─────────────────────────────────────────────────────
  const filtered = sales.filter(s => {
    const q = search.toLowerCase();
    return [s.sale_invoice_no, s.patient_name, s.chief_complaint, s.payment_mode, s.payment_status]
      .some(v => v?.toLowerCase().includes(q)) ||
      s.total_amount?.toString().includes(q) ||
      fmtDate(s.sale_date).includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalRevenue = sales.reduce((s, r) => s + Number(r.total_amount || 0), 0);
  const todaySales = sales.filter(r => (r.sale_date || "").split("T")[0] === todayStr());
  const todayRevenue = todaySales.reduce((s, r) => s + Number(r.total_amount || 0), 0);

  const statusBadge = status => ({
    Paid: "bg-green-50 text-green-700 border-green-200",
    Partial: "bg-amber-50 text-amber-700 border-amber-200",
    Pending: "bg-red-50 text-red-700 border-red-200",
  }[status] || "bg-gray-50 text-gray-600 border-gray-200");

  // ── Row renderer ──────────────────────────────────────────────────────────
  const renderRow = bill => (
    <TR key={bill.sale_id}>
      <TD>
        <button
          onClick={async () => { setViewBill(bill); setShowViewDrawer(true); await fetchSaleItems(bill.sale_id); }}
          className="font-mono text-xs text-teal-700 hover:underline"
        >
          {bill.sale_invoice_no}
        </button>
      </TD>
      <TD muted>{fmtDate(bill.sale_date)}</TD>
      <TD>{bill.patient_name || "—"}</TD>
      <TD>{bill.chief_complaint || "—"}</TD>
      <TD muted>{bill.item_count ?? "—"}</TD>
      <TD><span className="font-semibold text-slate-800">Rs.{Number(bill.total_amount || 0).toLocaleString()}</span></TD>
      <TD muted>{bill.payment_mode || "—"}</TD>
      <td className="px-5 py-3.5 text-sm">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadge(bill.payment_status)}`}>
          {bill.payment_status || "—"}
        </span>
      </td>
      <TD>
        <PrintSlip
          bill={{
            invoice_number: bill.sale_invoice_no,
            patient_name: bill.patient_name,
            chief_complaint: bill.chief_complaint,
            total_amount: bill.total_amount,
            subtotal: bill.subtotal,
            discount: bill.discount_amount,
            discount_percent: bill.discount_percent,
            payment_mode: bill.payment_mode,
            date: bill.sale_date,
            clinic_id: userObj.clinic_id
          }}
          patientName={bill.patient_name}
        />
      </TD>
    </TR>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="Pharmacy Sales"
        subtitle="Medicine dispensing and sales management"
        actions={
          <Btn onClick={async () => { resetSaleDrawer(); setShowSales(true); await openSalesDrawer("encounter"); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
            </svg>
            New Sale
          </Btn>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { bg: "bg-teal-50", icon: <IconCart />, trendColor: "text-emerald-600", trend: "↗ All time", value: sales.length, label: "Total Bills" },
          { bg: "bg-emerald-50", icon: <IconTrendUp />, trendColor: "text-emerald-600", trend: "↗ Today", value: `Rs.${todayRevenue.toLocaleString()}`, label: "Today's Revenue" },
          { bg: "bg-indigo-50", icon: <IconPill />, trendColor: "text-indigo-600", trend: "↗ Today", value: todaySales.length, label: "Today's Bills" },
          { bg: "bg-amber-50", icon: <IconReceipt />, trendColor: "text-emerald-600", trend: "↗ Total", value: `Rs.${totalRevenue.toLocaleString()}`, label: "Total Revenue" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${s.bg}`}>{s.icon}</div>
              <span className={`text-xs font-semibold ${s.trendColor}`}>{s.trend}</span>
            </div>
            <div className="text-2xl font-bold text-slate-800 mb-1">{s.value}</div>
            <div className="text-sm text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Sales Table */}
      {isLoading ? (
        <div className="text-center py-6 text-gray-500">Loading sales...</div>
      ) : (
        <DataTable
          title="Sales Bills"
          subtitle={`${filtered.length} bills recorded`}
          search={search} onSearch={setSearch}
          searchPlaceholder="Search by invoice, patient, status..."
          actions={<Btn variant="secondary"><Icons.Download />Export</Btn>}
          columns={OUT_COLS}
          rows={paginated.map(renderRow)}
          currentPage={page} totalPages={totalPages} onPageChange={setCurrentPage}
          totalItems={filtered.length} pageSize={pageSize}
          onPageSizeChange={n => { setPageSize(n); setCurrentPage(1); }}
          pageSizeOptions={[10, 20, 50]}
        />
      )}

      {/* ── View Sale Items Drawer ── */}
      <RightDrawer
        title={`Bill: ${viewBill?.sale_invoice_no || ""}`}
        open={showViewDrawer}
        onClose={() => { setShowViewDrawer(false); setViewBill(null); setViewItems([]); }}
      >
        {viewBill && (
          <div className="h-full flex flex-col">
            <div className="px-8 py-4 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-100 space-y-1">
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
                <span><span className="font-medium">Patient:</span> {viewBill.patient_name || "—"}</span>
                <span><span className="font-medium">Date:</span> {fmtDate(viewBill.sale_date)}</span>
                <span><span className="font-medium">Payment:</span> {viewBill.payment_mode} — {viewBill.payment_status}</span>
              </div>
              {viewBill.chief_complaint && <p className="text-xs text-slate-500">Complaint: {viewBill.chief_complaint}</p>}
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6">
              {viewLoading ? (
                <div className="text-center py-8 text-gray-400 text-sm">Loading items...</div>
              ) : viewItems.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">No items found for this bill.</div>
              ) : (
                <div className="space-y-3">
                  {viewItems.map((item, idx) => (
                    <div key={item.sale_item_id || idx} className="border border-gray-200 rounded-xl px-4 py-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{item.medicine_name}</p>
                          {item.expiry_date && (
                            <p className="text-xs text-slate-500 mt-0.5">Exp: {fmtDate(item.expiry_date)}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-teal-700 text-sm">Rs.{Number(item.total_amount || 0).toLocaleString()}</p>
                          <p className="text-xs text-slate-500">{item.quantity} units × Rs.{Number(item.sale_price).toFixed(2)}/unit</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="mt-4 space-y-2 px-4 py-4 bg-teal-50 border border-teal-200 rounded-xl">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Subtotal</span><span>Rs.{Number(viewBill.subtotal || 0).toLocaleString()}</span>
                    </div>
                    {Number(viewBill.discount_amount) > 0 && (
                      <div className="flex justify-between text-sm text-amber-600">
                        <span>Discount ({viewBill.discount_percent}%)</span>
                        <span>- Rs.{Number(viewBill.discount_amount).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold text-teal-700 border-t border-teal-200 pt-2">
                      <span>Total</span><span>Rs.{Number(viewBill.total_amount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>Paid</span><span>Rs.{Number(viewBill.paid_amount || 0).toLocaleString()}</span>
                    </div>
                    {Number(viewBill.balance_amount) > 0 && (
                      <div className="flex justify-between text-sm text-red-600 font-semibold">
                        <span>Balance Due</span><span>Rs.{Number(viewBill.balance_amount).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-end">
              <Btn variant="secondary" onClick={() => { setShowViewDrawer(false); setViewBill(null); setViewItems([]); }}>Close</Btn>
            </div>
          </div>
        )}
      </RightDrawer>

      {/* ── New Sale Drawer ── */}
      <RightDrawer title="New Sale" open={showSales} onClose={() => { setShowSales(false); resetSaleDrawer(); }}>
        <div className="h-full flex flex-col">
          <div className="px-8 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-teal-100">
            <p className="text-sm text-gray-600">Fill in patient details and add medicines to record a sale</p>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-4 space-y-5">

            {/* Invoice Number */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Sale Invoice Number</label>
              <div className="relative">
                <input
                  value={saleInvoiceLoading ? "Generating…" : saleInvoiceNumber}
                  readOnly
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-slate-500 cursor-not-allowed font-mono focus:outline-none"
                />
                {!saleInvoiceLoading && saleInvoiceNumber && (
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold px-2 py-0.5 rounded-full border ${salePrefix === "SALEC" ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>{salePrefix}</span>
                )}
                {saleInvoiceLoading && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-teal-500 animate-pulse">●</span>
                )}
              </div>
            </div>

            {/* Sale Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Sale Date</label>
              <input
                type="date" value={saleDate} max={todayStr()}
                onChange={e => { setSaleDate(e.target.value); setSalePatientId(""); setSaleChiefComplaint(""); }}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400"
              />
            </div>

            {/* Patient Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Patient Type</label>
              <div className="flex gap-2">
                {[
                  { type: "encounter", label: "From Encounters", prefix: "SALEC" },
                  { type: "other", label: "Other (External)", prefix: "SALEN" },
                ].map(({ type, label, prefix }) => (
                  <button key={type} type="button"
                    onClick={async () => {
                      setSalePatientType(type); setSalePatientId(""); setSaleOtherName("");
                      setSaleChiefComplaint(""); setSaleSelectedEncounterId("");
                      setSaleInvoiceLoading(true); setSaleInvoiceNumber("");
                      try { setSaleInvoiceNumber(await fetchNextSaleInvoiceNumber(userObj.clinic_id, prefix)); }
                      finally { setSaleInvoiceLoading(false); }
                    }}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${salePatientType === type ? "bg-teal-500 text-white border-teal-500" : "bg-white text-slate-600 border-gray-200 hover:border-teal-300"
                      }`}
                  >{label} <span className="ml-1.5 text-xs font-bold opacity-70">({prefix})</span></button>
                ))}
              </div>
            </div>

            {/* From Encounters */}
            {salePatientType === "encounter" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Patient <span className="text-red-500">*</span></label>
                  <select
                    value={salePatientId}
                    onChange={e => {
                      const pid = e.target.value;
                      setSalePatientId(pid); setSaleChiefComplaint(""); setSaleSelectedEncounterId("");
                      if (pid) {
                        const onDate = allEncounters.filter(en =>
                          String(en.patient_id) === String(pid) &&
                          (en.encounter_date || en.created_at || en.date || "").split("T")[0] === saleDate
                        );
                        if (onDate.length === 1) { setSaleChiefComplaint(onDate[0].chief_complaint || ""); setSaleSelectedEncounterId(String(onDate[0].id)); }
                      }
                    }}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400"
                  >
                    <option value="">{filteredSalePatients.length === 0 ? "No patients with encounters on this date" : "Select patient…"}</option>
                    {filteredSalePatients.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                  {saleDate && filteredSalePatients.length === 0 && (
                    <p className="text-amber-600 text-xs mt-1">No encounters found for {saleDate}. Change the date or switch to "Other (External)".</p>
                  )}
                </div>

                {salePatientId && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Encounter</label>
                    <select
                      value={saleSelectedEncounterId}
                      onChange={e => {
                        setSaleSelectedEncounterId(e.target.value);
                        const enc = allEncounters.find(en => String(en.id) === String(e.target.value));
                        setSaleChiefComplaint(enc?.chief_complaint || "");
                      }}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400"
                    >
                      <option value="">Select encounter…</option>
                      {salePatientEncounters.map(e => (
                        <option key={e.id} value={e.id}>
                          #{e.id}{e.encounter_date ? ` — ${e.encounter_date.split("T")[0]}` : ""}{e.chief_complaint ? ` — ${e.chief_complaint}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Chief Complaint</label>
                  <input value={saleChiefComplaint} onChange={e => setSaleChiefComplaint(e.target.value)}
                    placeholder="Auto-filled from encounter or enter manually…"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400"
                  />
                </div>
              </>
            )}

            {/* Other / External */}
            {salePatientType === "other" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Patient Name <span className="text-red-500">*</span></label>
                  <input value={saleOtherName} onChange={e => setSaleOtherName(e.target.value)}
                    placeholder="Enter patient name…"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Chief Complaint</label>
                  <input value={saleChiefComplaint} onChange={e => setSaleChiefComplaint(e.target.value)}
                    placeholder="Enter chief complaint…"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400"
                  />
                </div>
              </>
            )}

            {/* Payment */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Mode</label>
                <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400"
                >
                  {["Cash", "Card", "UPI", "Insurance", "Credit"].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Status</label>
                <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400"
                >
                  {["Paid", "Partial", "Pending"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Discount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Discount (%)</label>
              <input type="number" min="0" max="100" value={discountPercent} onChange={e => setDiscountPercent(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400"
              />
            </div>

            {/* ── Add Medicines ── */}
            <div className="border-t border-gray-100 pt-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Add Medicines</p>
            </div>

            <MedicineSearchDropdown
              medicineOptions={medicineOptions}
              value={sale.medicine_name}
              onChange={name => { setSale({ ...BLANK_SALE, medicine_name: name }); setBatches([]); }}
            />

            {/* Batch selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Batch <span className="text-red-500">*</span>
              </label>
              {batchLoading ? (
                <div className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-slate-400 bg-gray-50">
                  Loading batches...
                </div>
              ) : (
                <select
                  value={sale.batch_id}
                  onChange={e => setSale(p => ({ ...p, batch_id: e.target.value }))}
                  disabled={!sale.medicine_name || batches.length === 0}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 disabled:bg-gray-50 disabled:text-slate-400"
                >
                  {batches.length === 0
                    ? <option value="">— No batches available —</option>
                    : batches.map(b => (
                      <option key={b.batch_no} value={b.batch_no}>
                        {b.batch_no} · Exp: {fmtDate(b.expiry_date)} · Stock: {b.available_quantity} units
                      </option>
                    ))
                  }
                </select>
              )}
            </div>

            {/* Pricing info for selected batch */}
            {selectedBatchRecord && (
              <div className="px-3 py-2.5 rounded-lg text-xs border bg-blue-50 border-blue-200 text-blue-700 space-y-1">
                <div className="flex gap-4 flex-wrap">
                  {selectedBatchRecord.pack_size && Number(selectedBatchRecord.pack_size) > 1 && (
                    <span>Units/strip: <strong>{selectedBatchRecord.pack_size}</strong></span>
                  )}
                  <span>Sale price/unit: <strong>Rs.{Number(unitPrice).toFixed(2)}</strong></span>
                  <span className={`font-semibold ${netAvail === 0 ? "text-red-600" : netAvail <= 10 ? "text-amber-600" : "text-teal-700"}`}>
                    Available: {netAvail} units
                  </span>
                </div>
              </div>
            )}

            {/* Quantity to sell */}
            <div>
              <Input
                label={
                  <>
                    Quantity to Sell (units) <span className="text-red-500">*</span>
                    {selectedBatchRecord?.pack_size && Number(selectedBatchRecord.pack_size) > 1 && (
                      <span className="ml-2 font-normal text-slate-400 text-xs">
                        (1 strip = {selectedBatchRecord.pack_size} units)
                      </span>
                    )}
                  </>
                }
                type="number"
                value={sale.sell_qty}
                onChange={v => setSale(p => ({ ...p, sell_qty: v === "" ? "" : String(Math.floor(Number(v))) }))}
                placeholder="0"
                step="1"
              />
            </div>

            {/* Line total preview */}
            {saleTotal && (
              <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-sm text-emerald-700 font-medium">Line Total</span>
                <span className="text-lg font-bold text-emerald-700">Rs.{Number(saleTotal).toLocaleString()}</span>
              </div>
            )}

            <Btn onClick={handleAddSaleItem}><Icons.Plus /> Add Medicine</Btn>

            {/* Cart items */}
            {salesList.map(s => (
              <div key={s.id} className="flex justify-between items-center border border-gray-200 rounded-xl px-4 py-2.5 text-sm">
                <span>
                  <span className="font-medium text-teal-700">{s.medicine_name}</span>
                  {` — ${s.sell_qty} units`}
                  <span className="text-slate-500 text-xs ml-1">(Rs.{Number(s.salePrice).toFixed(2)}/unit)</span>
                  <span className="ml-2 text-emerald-600 font-semibold">
                    Rs.{(Number(s.sell_qty) * Number(s.salePrice)).toFixed(2)}
                  </span>
                </span>
                <button onClick={() => setSalesList(p => p.filter(x => x.id !== s.id))} className="text-slate-400 hover:text-red-500">
                  <Icons.Trash />
                </button>
              </div>
            ))}

            {/* Grand total summary */}
            {salesList.length > 0 && (
              <div className="space-y-2 px-4 py-4 bg-teal-50 border border-teal-200 rounded-xl">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span><span>Rs.{grandSubtotal.toFixed(2)}</span>
                </div>
                {discountAmt > 0 && (
                  <div className="flex justify-between text-sm text-amber-600">
                    <span>Discount ({discountPercent}%)</span><span>- Rs.{discountAmt.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-teal-700 border-t border-teal-200 pt-2">
                  <span>Grand Total</span><span>Rs.{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <Btn variant="secondary" onClick={() => { setShowSales(false); resetSaleDrawer(); }}>Cancel</Btn>
            <Btn onClick={handleSaleSubmit} disabled={salesList.length === 0 || isSaleSubmitting}>
              <Icons.Check /> {isSaleSubmitting ? "Saving..." : `Confirm Sale (${salesList.length})`}
            </Btn>
          </div>
        </div>
      </RightDrawer>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default PharmacySales;