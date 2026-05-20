import { useState, useEffect, useRef } from 'react';
import Icons from '../components/Icons';
import { RightDrawer, Btn, Input, Select, Toast, PageHeader, DataTable, TR, TD } from '../components/UI';
import { useApp } from '../context/AppContext';

// ── Helpers ───────────────────────────────────────────────────────────────────
const API = process.env.REACT_APP_API_BASE_URL;
const fmtDate = d => d ? d.split("T")[0].split("-").reverse().join("/") : "—";
const todayStr = () => new Date().toISOString().split("T")[0];
const isExpired = d => d && new Date(d).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
const isFuture = d => { const iso = d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null; return iso ? iso > todayStr() : false; };

const CATEGORIES = ["Tablet", "Capsule", "Syrup", "Injection", "Tonic", "Ointment", "Drops", "Powder", "Cream", "Inhaler", "Patch", "Suppository"];

// Only these categories ask the user to enter units per strip.
// All others have units_per_strip = 1 (1 box = N strips, each strip = 1 unit).
const HAS_UNITS_PER_STRIP = ["Tablet", "Capsule", "Injection"];

const IN_COLS = ["Medicine", "Batch No.", "Supplier", "Net Stock", "Purchase ₹/box", "Sale ₹/unit", "Expiry", "Date", "Actions"];

const BLANK = {
  category_name: "",
  medicine_name: "",
  batch_no: "",
  expiry_date: "",
  remarks: "",
  transaction_date: todayStr(),
  supplier_name: "",
  invoice_no: "",
  invoice_date: "",
  mfg_date: "",
  location: "",
  purchase_price: "",   // per box (what user enters)
  sale_price: "",       // per box (what user enters)
  free_qty: 0,
  discount_percent: 0,

  // Hierarchy — applies to ALL categories
  // boxes_qty       = number of boxes purchased
  // strips_per_box  = strips/units inside each box
  // units_per_strip = tablets/capsules per strip (only for Tablet/Capsule/Injection; 1 otherwise)
  boxes_qty: "",
  strips_per_box: "",
  units_per_strip: "",
};

const getClinicId = () => {
  try { const u = sessionStorage.getItem("user"); return u ? JSON.parse(u)?.clinic_id : null; } catch { return null; }
};
const getUser = () => {
  try { const u = sessionStorage.getItem("user"); if (!u) return "admin"; const p = JSON.parse(u); return p?.username || p?.name || p?.email || "admin"; } catch { return "admin"; }
};

// ── Sub-components ────────────────────────────────────────────────────────────
const MedicineNameDropdown = ({ allMedicineNames = [], value, onChange }) => {
  const [search, setSearch] = useState(value || "");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { setSearch(value || ""); }, [value]);
  const filtered = search
    ? allMedicineNames.filter(n => n.toLowerCase().includes(search.toLowerCase()))
    : allMedicineNames;
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
        placeholder="Type or search medicine name…"
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

const WarnBox = ({ msg }) => (
  <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border bg-amber-50 border-amber-200 text-amber-700">{msg}</div>
);
const ErrBox = ({ msg }) => (
  <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border bg-red-50 border-red-200 text-red-700">{msg}</div>
);
const Req = () => <span className="text-red-500">*</span>;
const Divider = ({ label }) => (
  <div className="border-t border-gray-100 pt-3">
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">{label}</p>
  </div>
);

// ── Stat icons ────────────────────────────────────────────────────────────────
const IconGrid = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0E6C68" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>;
const IconWarning = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
const IconClock = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
const IconTrendUp = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;

// ── Quantity computation ──────────────────────────────────────────────────────
/**
 * Unified for ALL categories:
 *
 *   boxes_qty       = number of boxes purchased                (user input, all categories)
 *   strips_per_box  = strips/units inside each box             (user input, all categories)
 *   units_per_strip = tablets per strip                        (user input: Tablet/Capsule/Injection only)
 *                   = 1                                        (auto for all other categories)
 *
 * Derived:
 *   totalStrips     = boxes × strips_per_box
 *   totalUnits      = totalStrips × units_per_strip
 *
 * Stored in API:
 *   quantity            = totalStrips   (invoice-matching unit)
 *   effective_quantity  = totalUnits    (base units for stock tracking)
 *   pack_size           = units_per_strip
 *
 * Prices (user enters per box):
 *   purchase_price stored = purchase_price_per_box ÷ strips_per_box   (per strip)
 *   sale_price stored     = sale_price_per_box ÷ strips_per_box        (per strip)
 *   unit_sale_price       = sale_price_per_box ÷ totalUnits_per_box    (per unit, used when selling)
 *                         = sale_price_per_box ÷ (strips_per_box × units_per_strip)
 */
const computeQty = (form, category) => {
  const boxes  = parseInt(form.boxes_qty)     || 0;
  const strips = parseInt(form.strips_per_box) || 0;

  // For categories without a strip hierarchy, units_per_strip is always 1
  const unitsRaw    = HAS_UNITS_PER_STRIP.includes(category) ? parseInt(form.units_per_strip) : 1;
  const units       = unitsRaw > 0 ? unitsRaw : 1;

  const totalStrips = boxes * strips;
  const totalUnits  = totalStrips * units;

  return {
    quantity: totalStrips,           // strips (invoice unit)
    effective_quantity: totalUnits,  // base units (stock tracking)
    pack_size: units,                // units per strip
    boxes,
    strips,
    units,
    totalStrips,
    totalUnits,
  };
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const InventoryPage = () => {
  const { showLoading, hideLoading } = useApp();

  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form, setForm] = useState(BLANK);

  const userObj = { clinic_id: getClinicId() };
  const currentUser = getUser();
  const showToast = (msg, type = "success") => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000); };
  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Does the selected category show units_per_strip input?
  const showUnitsPerStrip = HAS_UNITS_PER_STRIP.includes(form.category_name);

  useEffect(() => { fetchInventory(); }, []);
  useEffect(() => { setCurrentPage(1); }, [search]);

  const allMedicineNames = [...new Set(
    inventory.filter(i => !i.is_deleted && !i.deleted && i.medicine_name).map(i => i.medicine_name)
  )].sort((a, b) => a.localeCompare(b));

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      showLoading("Loading inventory...", "inventory");
      const res = await fetch(`${API}/inventory_transactions_read?clinic_id=${userObj.clinic_id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setInventory(Array.isArray(data) ? data : []);
    } catch { showToast("Failed to load inventory", "error"); }
    finally { setIsLoading(false); hideLoading(); }
  };

  // ── Net stock scoped to medicine + batch ──────────────────────────────────
  const getNetStock = (medicineName, batchNo, packSize, excludeId = null) => {
  const nm = (medicineName || "").toLowerCase();
  const bn = (batchNo || "").toLowerCase();
  const ps = packSize ? String(packSize) : null;

  const inRecs = active.filter(i =>
    i.transaction_type === "IN" &&
    (i.medicine_name || "").toLowerCase() === nm &&
    (i.batch_no || "").toLowerCase() === bn &&
    (ps === null || String(i.pack_size) === ps) &&   // ← add this
    !isExpired(i.expiry_date) &&
    i.transaction_id !== excludeId
  );
    if (!inRecs.length) return 0;

    const totalIn = inRecs.reduce((s, i) => {
      if (i.effective_quantity) return s + Number(i.effective_quantity);
      const ps = i.pack_size ? parseInt(i.pack_size) : 1;
      return s + Number(i.quantity) * ps;
    }, 0);

    const totalOut = active.filter(i =>
      i.transaction_type === "OUT" &&
      (i.medicine_name || "").toLowerCase() === nm &&
      (i.batch_no || "").toLowerCase() === bn
    ).reduce((s, i) => s + Number(i.quantity), 0);

    return Math.max(0, totalIn - totalOut);
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const handleEdit = item => {
    setEditingItem(item);
    setForm({
      ...BLANK,
      ...item,
      category_name:    item.category_name || "",
      transaction_date: item.transaction_date?.split("T")[0] || "",
      expiry_date:      item.expiry_date?.split("T")[0] || "",
      invoice_date:     item.invoice_date?.split("T")[0] || "",
      mfg_date:         item.mfg_date?.split("T")[0] || "",
      // Reconstruct box hierarchy from stored fields
      // boxes_qty and strips_per_box are now stored in the API payload so we can read them back
      boxes_qty:        item.boxes_qty     ?? "",
      strips_per_box:   item.strips_per_box ?? "",
      units_per_strip:  item.pack_size     ?? "",
      // purchase_price and sale_price are stored per-strip in DB;
      // to show them back as per-box we multiply by strips_per_box
      purchase_price: item.strips_per_box && item.purchase_price
        ? (Number(item.purchase_price) * Number(item.strips_per_box)).toFixed(2)
        : (item.purchase_price ?? ""),
      sale_price: item.strips_per_box && item.sale_price
        ? (Number(item.sale_price) * Number(item.strips_per_box)).toFixed(2)
        : (item.sale_price ?? ""),
      free_qty:         item.free_qty ?? 0,
      discount_percent: item.discount_percent ?? 0,
    });
    setShowModal(true);
  };

  const handleClose = () => { setShowModal(false); setEditingItem(null); setForm(BLANK); };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.category_name)        { showToast("Select a category", "error"); return; }
    if (!form.medicine_name.trim()) { showToast("Enter medicine name", "error"); return; }
    if (!form.batch_no.trim())      { showToast("Enter batch number", "error"); return; }

    const computed = computeQty(form, form.category_name);

    if (!form.boxes_qty || computed.boxes <= 0)  { showToast("Enter number of boxes", "error"); return; }
    if (!form.strips_per_box || computed.strips <= 0) { showToast("Enter strips per box", "error"); return; }
    if (showUnitsPerStrip && (!form.units_per_strip || computed.units <= 0)) {
      showToast(`Enter units per strip for ${form.category_name}`, "error"); return;
    }

    if (!form.expiry_date)  { showToast("Select expiry date", "error"); return; }
    if (!editingItem && isExpired(form.expiry_date)) { showToast("Cannot add expired medicine", "error"); return; }
    if (!form.purchase_price || Number(form.purchase_price) <= 0) { showToast("Enter a valid purchase price (> 0)", "error"); return; }
    if (form.sale_price === "" || Number(form.sale_price) < 0)    { showToast("Enter valid sale price", "error"); return; }
    if (Number(form.sale_price) < Number(form.purchase_price)) {
      if (!window.confirm(`Sale price (${form.sale_price}) is lower than purchase price (${form.purchase_price}). This records a loss. Continue?`)) return;
    }
    if (!form.transaction_date) { showToast("Select transaction date", "error"); return; }
    if (isFuture(form.transaction_date)) { showToast("Transaction date cannot be in the future", "error"); return; }

    // Prices entered per box → normalise to per-strip and per-unit for storage
    const purchasePricePerBox = parseFloat(form.purchase_price);
    const salePricePerBox     = parseFloat(form.sale_price);

    // per-strip values (strips_per_box guaranteed > 0 here)
    const purchasePricePerStrip = purchasePricePerBox / computed.strips;
    const salePricePerStrip     = salePricePerBox     / computed.strips;

    // per-unit sale price (what PharmacySales will charge per tablet/bottle/etc.)
    // units_per_strip >= 1 always (defaults to 1 for non-strip categories)
    const unitSalePrice = salePricePerBox / (computed.strips * computed.units);

    try {
      const res = await fetch(`${API}/inventory_create_update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_id:     editingItem?.transaction_id || 0,
          clinic_id:          userObj.clinic_id,
          created_by:         currentUser,
          category_name:      form.category_name,
          medicine_name:      form.medicine_name,
          transaction_type:   "IN",
          batch_no:           form.batch_no,
          expiry_date:        form.expiry_date?.split("T")[0] || null,

          // Stock quantities
          quantity:           computed.quantity,            // total strips
          effective_quantity: computed.effective_quantity,  // total base units
          pack_size:          computed.pack_size,           // units per strip

          // Box breakdown (stored so edit can reconstruct the form)
          boxes_qty:          computed.boxes,
          strips_per_box:     computed.strips,

          // Prices (normalised to per-strip / per-unit for DB)
          purchase_price:     purchasePricePerStrip,
          sale_price:         salePricePerStrip,
          unit_sale_price:    unitSalePrice,

          remarks:            form.remarks || null,
          transaction_date:   editingItem
            ? (editingItem.transaction_date?.split("T")[0] || null)
            : (form.transaction_date?.split("T")[0] || null),
          supplier_name:      form.supplier_name  || null,
          invoice_no:         form.invoice_no     || null,
          invoice_date:       form.invoice_date   || null,
          mfg_date:           form.mfg_date       || null,
          free_qty:           parseFloat(form.free_qty)         || 0,
          discount_percent:   parseFloat(form.discount_percent) || 0,
          location:           form.location || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(editingItem ? "Inventory updated" : "Inventory added");
      handleClose();
      fetchInventory();
    } catch (e) { showToast(e.message || "Operation failed", "error"); }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async id => {
    if (!window.confirm("Delete this inventory record?")) return;
    try {
      const res = await fetch(`${API}/inventory_transactions_soft_delete/`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction_id: id, modified_by: currentUser }),
      });
      if (!res.ok) throw new Error();
      showToast("Inventory deleted");
      fetchInventory();
    } catch { showToast("Failed to delete inventory", "error"); }
  };

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = inventory.filter(i => {
    if (i.is_deleted || i.deleted) return false;
    if (i.transaction_type !== "IN") return false;
    const s = search.toLowerCase();
    return (
      [i.category_name, i.medicine_name, i.batch_no, i.supplier_name, i.invoice_no, i.location, i.remarks]
        .some(v => v?.toLowerCase().includes(s)) ||
      [i.quantity, i.purchase_price, i.sale_price].some(v => v?.toString().includes(s)) ||
      fmtDate(i.expiry_date).includes(s) ||
      fmtDate(i.transaction_date).includes(s) ||
      i.transaction_id?.toString().includes(s)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const active  = inventory.filter(i => !i.is_deleted && !i.deleted);
  const inRecs  = active.filter(i => i.transaction_type === "IN");
  const uniqueMeds = new Set(inRecs.map(i => i.medicine_name).filter(Boolean)).size;

 const uniqueBatches = [...new Set(
  inRecs.map(i => `${i.medicine_name}||${i.batch_no}||${i.pack_size ?? 1}`).filter(Boolean)
)];
  const lowCritical = uniqueBatches.filter(key => {
    const [med, batch, ps] = key.split("||");
return getNetStock(med, batch, ps) <= 5;
  }).length;

  const in3Mo = new Date(); in3Mo.setMonth(in3Mo.getMonth() + 3);
  const expiringSoon = inRecs.filter(i =>
    i.expiry_date && new Date(i.expiry_date) <= in3Mo && new Date(i.expiry_date) >= new Date()
  ).length;

  const stockValue = uniqueBatches.reduce((total, key) => {
    const [med, batch, ps] = key.split("||");
const net = getNetStock(med, batch, ps);
    const rec = inRecs
      .filter(i => i.medicine_name === med && i.batch_no === batch)
      .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))[0];
    const price = Number(rec?.unit_sale_price || 0);
    return total + net * price;
  }, 0);

  // ── Expiry colour ─────────────────────────────────────────────────────────
  const expiryColor = d => {
    if (!d) return null;
    const days = Math.floor((new Date(d) - new Date().setHours(0, 0, 0, 0)) / 86400000);
    return days < 0
      ? { dot: "bg-red-500",   badge: "bg-red-50 text-red-700 border border-red-200" }
      : days <= 90
        ? { dot: "bg-amber-400", badge: "bg-amber-50 text-amber-700 border border-amber-200" }
        : { dot: "bg-green-500", badge: "bg-green-50 text-green-700 border border-green-200" };
  };

  // ── Live form preview ─────────────────────────────────────────────────────
  const stockLeft = (form.medicine_name && form.batch_no)
   ? getNetStock(form.medicine_name, form.batch_no, form.units_per_strip || null, editingItem?.transaction_id || null)
    : null;

  const isSaveBlocked = !editingItem && (isExpired(form.expiry_date) || isFuture(form.transaction_date));

  const formComputed  = computeQty(form, form.category_name);
  const purchasePerBox = parseFloat(form.purchase_price) || 0;
  const salePerBox     = parseFloat(form.sale_price) || 0;
  const showBreakdown  = formComputed.boxes > 0 && formComputed.strips > 0;

  // ── Label helpers for dynamic UI copy ────────────────────────────────────
  const stripLabel = cat => {
    if (["Syrup", "Tonic"].includes(cat)) return "Bottles / box";
    if (["Ointment", "Cream"].includes(cat)) return "Tubes / box";
    if (cat === "Inhaler") return "Inhalers / box";
    if (cat === "Drops") return "Drops / box";
    if (["Powder"].includes(cat)) return "Packets / box";
    if (cat === "Patch") return "Patches / box";
    if (cat === "Suppository") return "Units / box";
    return "Strips / box";
  };

  // ── Row renderer ──────────────────────────────────────────────────────────
  const renderRow = item => {
    const ec  = expiryColor(item.expiry_date);
    const net = getNetStock(item.medicine_name, item.batch_no, item.pack_size);
    const stockCls = net === 0
      ? "text-red-600 font-bold"
      : net <= 5
        ? "text-red-500 font-semibold"
        : net <= 20
          ? "text-amber-600 font-semibold"
          : "text-teal-700 font-semibold";

    // Show purchase price per box (reverse the normalisation)
    const purchasePerBoxDisplay = item.purchase_price && item.strips_per_box
      ? (Number(item.purchase_price) * Number(item.strips_per_box)).toFixed(2)
      : item.purchase_price ?? "—";

    return (
      <TR key={item.transaction_id}>
        <TD>
          <span className="font-medium text-slate-800">{item.medicine_name || "—"}</span>
          {item.pack_size && item.pack_size > 1 && (
            <span className="ml-1 text-xs text-slate-400">({item.pack_size} units/strip)</span>
          )}
        </TD>
        <TD muted>{item.batch_no || "—"}</TD>
        <TD muted>{item.supplier_name || "—"}</TD>
        <td className={`px-5 py-3.5 text-sm ${stockCls}`}>
          {net}
          <span className="text-xs font-normal text-slate-400 ml-1">units</span>
        </td>
        <TD>Rs.{purchasePerBoxDisplay}</TD>
        <TD>Rs.{item.unit_sale_price ? Number(item.unit_sale_price).toFixed(2) : "—"}</TD>
        <td className="px-5 py-3.5 text-sm">
          {item.expiry_date && ec
            ? <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${ec.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${ec.dot}`} />{fmtDate(item.expiry_date)}
            </span>
            : "—"}
        </td>
        <TD muted>{fmtDate(item.transaction_date)}</TD>
        <TD>
          <div className="flex gap-1">
            <button onClick={() => handleEdit(item)} className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-400"><Icons.Edit /></button>
            <button onClick={() => handleDelete(item.transaction_id)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg text-slate-400"><Icons.Trash /></button>
          </div>
        </TD>
      </TR>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Purchase stock management — Sales are tracked in Pharmacy Sales"
        actions={
          <Btn onClick={() => { setEditingItem(null); setForm(BLANK); setShowModal(true); }}>
            <Icons.Plus /> Add Medicine
          </Btn>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { bg: "bg-teal-50",    icon: <IconGrid />,    trendColor: "text-emerald-600", trend: "Items tracked",  value: uniqueMeds,                              label: "Total Medicines" },
          { bg: "bg-amber-50",   icon: <IconWarning />, trendColor: "text-red-500",     trend: "Need reorder",  value: lowCritical,                              label: "Low / Critical" },
          { bg: "bg-red-50",     icon: <IconClock />,   trendColor: "text-red-500",     trend: "Within 3 months", value: expiringSoon,                           label: "Expiring Soon" },
          { bg: "bg-emerald-50", icon: <IconTrendUp />, trendColor: "text-emerald-600", trend: "Stock value",   value: `Rs.${stockValue.toLocaleString()}`,       label: "Stock Value" },
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

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-6 text-gray-500">Loading inventory...</div>
      ) : (
        <DataTable
          title="Purchase Stock"
          subtitle={`${filtered.length} purchase records`}
          search={search} onSearch={setSearch}
          searchPlaceholder="Search by medicine, batch, supplier, location..."
          columns={IN_COLS}
          rows={paginated.map(renderRow)}
          currentPage={page} totalPages={totalPages} onPageChange={setCurrentPage}
          totalItems={filtered.length} pageSize={pageSize}
          onPageSizeChange={n => { setPageSize(n); setCurrentPage(1); }}
          pageSizeOptions={[10, 20, 50]}
        />
      )}

      {/* Add / Edit Drawer */}
      <RightDrawer
        title={editingItem ? "Edit Purchase Record" : "Add New Stock"}
        open={showModal}
        onClose={handleClose}
      >
        <div className="h-full flex flex-col">
          <div className="px-8 py-4 bg-gradient-to-r from-teal-50 to-blue-50 border-b border-teal-100">
            <p className="text-sm text-gray-600">Record an inbound stock purchase with full purchase details</p>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">

            {/* ── Medicine Details ── */}
            <Divider label="Medicine Details" />

            <Select
              label={<>Category <Req /></>}
              value={form.category_name}
              onChange={v => setForm(p => ({
                ...p,
                category_name: v,
                boxes_qty: "",
                strips_per_box: "",
                units_per_strip: "",
              }))}
              options={CATEGORIES}
              placeholder="Select Category"
            />

            <MedicineNameDropdown
              allMedicineNames={allMedicineNames}
              value={form.medicine_name}
              onChange={v => setField("medicine_name", v)}
            />

            <Input
              label={<>Batch No. <Req /></>}
              value={form.batch_no}
              onChange={v => setField("batch_no", v)}
              placeholder="e.g. B2025-01"
            />

            {/* Current batch stock indicator */}
            {form.medicine_name && form.batch_no && stockLeft !== null && (
              <div className={`px-3 py-2 rounded-lg text-xs font-medium border ${
                stockLeft === 0 ? "bg-red-50 border-red-200 text-red-700"
                : stockLeft < 20 ? "bg-amber-50 border-amber-200 text-amber-700"
                : "bg-teal-50 border-teal-200 text-teal-700"
              }`}>
                Current stock for batch <strong>{form.batch_no}</strong>: <strong>{stockLeft}</strong> units
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Expiry Date <Req /></label>
                {editingItem
                  ? <div className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-slate-500">{fmtDate(form.expiry_date) || "—"}</div>
                  : <>
                    <Input type="date" value={form.expiry_date} onChange={v => setField("expiry_date", v)} />
                    {form.expiry_date && isExpired(form.expiry_date) && <ErrBox msg="Medicine already expired — cannot be added." />}
                  </>}
              </div>
              <Input label="Mfg. Date" type="date" value={form.mfg_date} onChange={v => setField("mfg_date", v)} />
            </div>

            {/* ── Quantity Section ── */}
            <Divider label="Quantity" />

            {/* Boxes field — same for all categories */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  label={<>No. of Boxes <Req /></>}
                  type="number"
                  value={form.boxes_qty}
                  onChange={v => setField("boxes_qty", v === "" ? "" : String(Math.floor(Number(v))))}
                  placeholder="e.g. 5"
                  step="1" min="1"
                />
                <p className="text-xs text-slate-400 mt-1">Total boxes purchased</p>
              </div>
              <div>
                <Input
                  label={<>{stripLabel(form.category_name) || "Strips / box"} <Req /></>}
                  type="number"
                  value={form.strips_per_box}
                  onChange={v => setField("strips_per_box", v === "" ? "" : String(Math.floor(Number(v))))}
                  placeholder="e.g. 10"
                  step="1" min="1"
                />
                <p className="text-xs text-slate-400 mt-1">
                  {HAS_UNITS_PER_STRIP.includes(form.category_name) ? "Strips inside each box" : "Units inside each box"}
                </p>
              </div>
            </div>

            {/* Units per strip — only for Tablet / Capsule / Injection */}
            {showUnitsPerStrip && (
              <div>
                <Input
                  label={<>
                    Units / Strip <Req />
                    <span className="ml-1 text-xs font-normal text-slate-400">
                      ({form.category_name === "Injection" ? "vials per strip" : "tablets per strip"})
                    </span>
                  </>}
                  type="number"
                  value={form.units_per_strip}
                  onChange={v => setField("units_per_strip", v === "" ? "" : String(Math.floor(Number(v))))}
                  placeholder="e.g. 10"
                  step="1" min="1"
                />
                <p className="text-xs text-slate-400 mt-1">
                  {form.category_name === "Injection" ? "Vials" : "Tablets / capsules"} per strip
                </p>
              </div>
            )}

            {/* Live stock breakdown */}
            {showBreakdown && (
              <div className="px-4 py-3 rounded-xl text-sm border bg-blue-50 border-blue-200 text-blue-800">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-base">📦</span>
                  <span className="font-semibold">Stock Breakdown</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-blue-700">
                  <span><strong>{formComputed.boxes}</strong> boxes</span>
                  <span>×</span>
                  <span><strong>{formComputed.strips}</strong> {HAS_UNITS_PER_STRIP.includes(form.category_name) ? "strips/box" : "units/box"}</span>
                  {showUnitsPerStrip && formComputed.units > 1 && (
                    <>
                      <span>×</span>
                      <span><strong>{formComputed.units}</strong> units/strip</span>
                    </>
                  )}
                </div>
                <div className="mt-2 pt-2 border-t border-blue-200 flex gap-6">
                  {showUnitsPerStrip && (
                    <div>
                      <span className="text-blue-500">Total Strips: </span>
                      <strong>{formComputed.totalStrips}</strong>
                    </div>
                  )}
                  <div>
                    <span className="text-blue-500">Total Units: </span>
                    <strong>{formComputed.totalUnits}</strong>
                  </div>
                </div>
              </div>
            )}

            <Input
              label={`Free Qty (${HAS_UNITS_PER_STRIP.includes(form.category_name) ? "strips" : "units"})`}
              type="number"
              value={form.free_qty}
              onChange={v => setField("free_qty", v)}
              placeholder="0"
            />

            {/* ── Pricing ── */}
            <Divider label="Pricing (enter per box)" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  label={<>Purchase Price / box <Req /></>}
                  type="number"
                  value={form.purchase_price}
                  onChange={v => setField("purchase_price", v)}
                  placeholder="0.00"
                />
                {/* Show per-unit breakdown live */}
                {purchasePerBox > 0 && showBreakdown && (
                  <div className="mt-1.5 text-xs text-slate-500 space-y-0.5">
                    <p>Per strip: <strong>Rs.{(purchasePerBox / formComputed.strips).toFixed(2)}</strong></p>
                    {formComputed.units > 1 && (
                      <p>Per unit: <strong>Rs.{(purchasePerBox / formComputed.totalUnits / formComputed.boxes * formComputed.boxes).toFixed(3)}</strong></p>
                    )}
                  </div>
                )}
                {form.purchase_price !== "" && Number(form.purchase_price) === 0 && (
                  <WarnBox msg="Purchase price cannot be zero." />
                )}
              </div>
              <div>
                <Input
                  label={<>Sale Price / box <Req /></>}
                  type="number"
                  value={form.sale_price}
                  onChange={v => setField("sale_price", v)}
                  placeholder="0.00"
                />
                {/* Show per-unit breakdown live */}
                {salePerBox > 0 && showBreakdown && (
                  <div className="mt-1.5 text-xs text-slate-500 space-y-0.5">
                    <p>Per strip: <strong>Rs.{(salePerBox / formComputed.strips).toFixed(2)}</strong></p>
                    <p>Per unit: <strong className="text-teal-700">Rs.{(salePerBox / (formComputed.strips * formComputed.units)).toFixed(3)}</strong>
                      <span className="text-slate-400 ml-1">(charged to customer)</span>
                    </p>
                  </div>
                )}
                {form.sale_price !== "" && form.purchase_price !== "" &&
                  Number(form.sale_price) > 0 && Number(form.sale_price) < Number(form.purchase_price) && (
                  <WarnBox msg="Sale price is lower than purchase price." />
                )}
              </div>
            </div>

            <Input
              label="Discount (%)"
              type="number" min="0" max="100"
              value={form.discount_percent}
              onChange={v => setField("discount_percent", v)}
              placeholder="0"
            />

            {/* ── Purchase Details ── */}
            <Divider label="Purchase Details" />

            <div className="grid grid-cols-2 gap-4">
              <Input label="Supplier Name" value={form.supplier_name} onChange={v => setField("supplier_name", v)} placeholder="Supplier / Distributor" />
              <Input label="Invoice No." value={form.invoice_no} onChange={v => setField("invoice_no", v)} placeholder="e.g. INV-2025-001" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Invoice Date</label>
                <Input type="date" value={form.invoice_date} onChange={v => setField("invoice_date", v)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Transaction Date <Req /></label>
                {editingItem
                  ? <div className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-slate-500">{fmtDate(form.transaction_date) || "—"}</div>
                  : <>
                    <Input type="date" value={form.transaction_date} onChange={v => setField("transaction_date", v)} max={todayStr()} />
                    {form.transaction_date && isFuture(form.transaction_date) && <ErrBox msg="Transaction date cannot be in the future." />}
                  </>}
              </div>
            </div>

            <Input label="Storage Location" value={form.location} onChange={v => setField("location", v)} placeholder="e.g. Shelf A3, Cold Storage" />
            <Input label="Remarks" value={form.remarks} onChange={v => setField("remarks", v)} placeholder="Optional notes" />

          </div>

          <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <Btn variant="secondary" onClick={handleClose}>Cancel</Btn>
            <Btn onClick={handleSave} disabled={isSaveBlocked}>
              <Icons.Check /> {editingItem ? "Update Record" : "Add to Stock"}
            </Btn>
          </div>
        </div>
      </RightDrawer>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default InventoryPage;