import { useState, useEffect } from 'react';
import Icons from '../components/Icons';
import { RightDrawer, Btn, Input, Select, Toast, PageHeader, DataTable, TR, TD } from '../components/UI';
import { useApp } from '../context/AppContext';
 
const InventoryPage = () => {
  const { showLoading, hideLoading } = useApp();
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [errors, setErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
 
  const baseUrl = process.env.REACT_APP_API_BASE_URL;
  const blank = { category_name: "", transaction_type: "", batch_no: "", expiry_date: "", quantity: "", purchase_price: "", sale_price: "", remarks: "", transaction_date: "" };
  const [form, setForm] = useState(blank);
 
  const Required = () => <span className="text-red-500">*</span>;
  const showToast = (msg, type = "success") => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000); };
  const setField = (key, val) => { setForm(p => ({ ...p, [key]: val })); setErrors(p => ({ ...p, [key]: undefined })); };
 
  const validate = () => {
    const e = {};
    if (!form.category_name.trim())   e.category_name   = "Required";
    if (!form.transaction_type)       e.transaction_type = "Required";
    if (!form.quantity)               e.quantity        = "Required";
    if (!form.purchase_price)         e.purchase_price  = "Required";
    if (!form.sale_price)             e.sale_price      = "Required";
    if (!form.transaction_date)       e.transaction_date = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
 
  useEffect(() => { fetchInventory(); }, []);
  useEffect(() => { setCurrentPage(1); }, [search]);
 
  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      showLoading("Loading inventory...", "inventory");
      const res = await fetch(`${baseUrl}/inventory_transactions_read?clinic_id=1`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setInventory(Array.isArray(data) ? data : []);
    } catch { showToast("Failed to load inventory", "error"); }
    finally { setIsLoading(false); hideLoading(); }
  };
 
  const handleEdit = item => {
    setEditingItem(item);
    setForm({ category_name: item.category_name||"", transaction_type: item.transaction_type||"", batch_no: item.batch_no||"", expiry_date: item.expiry_date||"", quantity: item.quantity||"", purchase_price: item.purchase_price||"", sale_price: item.sale_price||"", remarks: item.remarks||"", transaction_date: item.transaction_date ? item.transaction_date.split("T")[0] : "" });
    setErrors({});
    setShowModal(true);
  };
 
  const handleClose = () => { setShowModal(false); setEditingItem(null); setForm(blank); setErrors({}); };
 
  const handleSave = async () => {
    if (!validate()) return;
    try {
      const res = await fetch(`${baseUrl}/inventory_create_update`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction_id: editingItem?.transaction_id || 0, clinic_id: 1, created_by: "admin", ...form, quantity: parseFloat(form.quantity), purchase_price: parseFloat(form.purchase_price), sale_price: parseFloat(form.sale_price) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(editingItem ? "Inventory updated" : "Inventory added");
      handleClose(); fetchInventory();
    } catch (e) { showToast(e.message || "Operation failed", "error"); }
  };
 
  const handleDelete = async transaction_id => {
    if (!window.confirm("Delete this inventory record?")) return;
    try {
      const res = await fetch(`${baseUrl}/inventory_transactions_soft_delete/`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transaction_id, modified_by: "admin" }) });
      if (!res.ok) throw new Error();
      showToast("Inventory deleted"); fetchInventory();
    } catch { showToast("Failed to delete inventory", "error"); }
  };
 
  const filtered = inventory.filter(i =>
    i.category_name?.toLowerCase().includes(search.toLowerCase()) ||
    i.transaction_type?.toLowerCase().includes(search.toLowerCase()) ||
    i.batch_no?.toLowerCase().includes(search.toLowerCase()) ||
    i.remarks?.toLowerCase().includes(search.toLowerCase()) ||
    i.transaction_date?.toLowerCase().includes(search.toLowerCase()) ||
    i.expiry_date?.toLowerCase().includes(search.toLowerCase()) ||
    (i.quantity !== undefined && i.quantity.toString().includes(search)) ||
    (i.purchase_price !== undefined && i.purchase_price.toString().includes(search)) ||
    (i.sale_price !== undefined && i.sale_price.toString().includes(search))
  );
 
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
 
  // Stat calculations
  const uniqueMedicines = new Set(inventory.map(i => i.category_name)).size;
  const lowCritical = inventory.filter(i => Number(i.quantity) <= 5).length;
  const in3Months = new Date(); in3Months.setMonth(in3Months.getMonth() + 3);
  const expiringSoon = inventory.filter(i => { if (!i.expiry_date) return false; const d = new Date(i.expiry_date); return d <= in3Months && d >= new Date(); }).length;
  const dailySales = inventory.filter(i => i.transaction_type === "OUT").reduce((s, i) => s + (Number(i.sale_price) * Number(i.quantity) || 0), 0);
 
  const TrendUp = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
  const TrendDown = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>;
 
  const stats = [
    { bg: "bg-teal-50", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0E6C68" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>, trend: <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><TrendUp />Items tracked</span>, value: uniqueMedicines, label: "Total Medicines" },
    { bg: "bg-amber-50", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, trend: <span className="flex items-center gap-1 text-xs font-semibold text-red-500"><TrendDown />Need reorder</span>, value: lowCritical, label: "Low / Critical" },
    { bg: "bg-red-50", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, trend: <span className="flex items-center gap-1 text-xs font-semibold text-red-500"><TrendDown />Within 3 months</span>, value: expiringSoon, label: "Expiring Soon" },
    { bg: "bg-emerald-50", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>, trend: <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><TrendUp />+15%</span>, value: `₹${dailySales.toLocaleString()}`, label: "Daily Sales" },
  ];
 
  const typeColor = t => ({ IN: "bg-green-50 text-green-700 border-green-100", OUT: "bg-red-50 text-red-700 border-red-100", ADJUST: "bg-blue-50 text-blue-700 border-blue-100" }[t] || "bg-gray-100 text-gray-600");
  const Err = ({ f }) => errors[f] ? <p className="text-red-500 text-xs mt-1">{errors[f]}</p> : null;
 
  return (
    <div>
      <PageHeader title="Inventory" subtitle="Medicine stock management" actions={
        <Btn onClick={() => { setEditingItem(null); setForm(blank); setErrors({}); setShowModal(true); }}><Icons.Plus /> Add Medicine</Btn>
      } />
 
      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${s.bg}`}>{s.icon}</div>
              {s.trend}
            </div>
            <div className="text-2xl font-bold text-slate-800 mb-1">{s.value}</div>
            <div className="text-sm text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>
 
      {isLoading ? <div className="text-center py-6 text-gray-500">Loading inventory...</div> : (
        <DataTable
          title="Inventory Transactions"
          subtitle={`${filtered.length} transactions recorded`}
          search={search} onSearch={setSearch} searchPlaceholder="Search by category, batch, type…"
          actions={<Btn variant="secondary"><Icons.Download />Export</Btn>}
          columns={["Category", "Type", "Batch No.", "Quantity", "Purchase Price", "Sale Price", "Expiry", "Transaction Date", "Remarks", "Actions"]}
          rows={paginated.map(item => (
            <TR key={item.transaction_id}>
              <TD><span className="font-semibold text-slate-700">{item.category_name || "—"}</span></TD>
              <TD>{item.transaction_type ? <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${typeColor(item.transaction_type)}`}>{item.transaction_type}</span> : "—"}</TD>
              <TD>{item.batch_no || "—"}</TD>
              <TD>{item.quantity ?? "—"}</TD>
              <TD>₹{item.purchase_price ?? "—"}</TD>
              <TD>₹{item.sale_price ?? "—"}</TD>
              <TD muted>{item.expiry_date || "—"}</TD>
              <TD muted>{item.transaction_date ? item.transaction_date.split("T")[0] : "—"}</TD>
              <TD>{item.remarks || "—"}</TD>
              <TD>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(item)} className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-slate-400"><Icons.Edit /></button>
                  <button onClick={() => handleDelete(item.transaction_id)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-slate-400"><Icons.Trash /></button>
                </div>
              </TD>
            </TR>
          ))}
          currentPage={page} totalPages={totalPages} onPageChange={setCurrentPage}
          totalItems={filtered.length} pageSize={pageSize}
          onPageSizeChange={n => { setPageSize(n); setCurrentPage(1); }} pageSizeOptions={[10, 20, 50]}
        />
      )}
 
      <RightDrawer title={editingItem ? "Edit Transaction" : "Add New Transaction"} open={showModal} onClose={handleClose}>
        <div className="h-full flex flex-col">
          <div className="px-8 py-4 bg-gradient-to-r from-teal-50 to-blue-50 border-b border-teal-100">
            <p className="text-sm text-gray-600">Fill in the details to record an inventory transaction</p>
          </div>
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-teal-100">
                <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600"><Icons.Pill /></div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Transaction Details</p>
                  <p className="text-xs text-gray-400 mt-0.5">Stock in, out or adjustment</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><Input label= {<>Category Name <Required /></>} value={form.category_name} onChange={v => setField("category_name", v)} placeholder="e.g. Syrup, Tablet" /><Err f="category_name" /></div>
                <div><Select label= {<>Transaction Type <Required /></>} value={form.transaction_type} onChange={v => setField("transaction_type", v)} options={["IN", "OUT", "ADJUST"]} /><Err f="transaction_type" /></div>
                <div><Input label= {<>Batch No. <Required /></>} value={form.batch_no} onChange={v => setField("batch_no", v)} placeholder="e.g. B2025-01" /><Err f="batch_no" /></div>
                <div><Input label= {<>Quantity <Required /></>} type="number" value={form.quantity} onChange={v => setField("quantity", v)} placeholder="0" /><Err f="quantity" /></div>
                <div><Input label="Expiry Date" type="date" value={form.expiry_date} onChange={v => setField("expiry_date", v)} /></div>
                <div><Input label= {<>Purchase Price <Required /></>} type="number" value={form.purchase_price} onChange={v => setField("purchase_price", v)} placeholder="0.00" /><Err f="purchase_price" /></div>
                <div><Input label= {<>Sale Price <Required /></>} type="number" value={form.sale_price} onChange={v => setField("sale_price", v)} placeholder="0.00" /><Err f="sale_price" /></div>
                <div className="col-span-2"><Input label= {<>Transaction Date <Required /></>} type="date" value={form.transaction_date} onChange={v => setField("transaction_date", v)} /><Err f="transaction_date" /></div>
                <div className="col-span-2"><Input label="Remarks" value={form.remarks} onChange={v => setField("remarks", v)} placeholder="Optional notes" /></div>
              </div>
            </div>
          </div>
          <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
            <Btn variant="secondary" onClick={handleClose}>Cancel</Btn>
            <Btn onClick={handleSave}><Icons.Check /> {editingItem ? "Update Transaction" : "Add Transaction"}</Btn>
          </div>
        </div>
      </RightDrawer>
 
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
 
export default InventoryPage;
 
 