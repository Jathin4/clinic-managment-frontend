import { useState, useEffect } from 'react';
import Icons from '../components/Icons';
import { RightDrawer, Btn, Input, Select, Toast, PageHeader, DataTable, TR, TD } from '../components/UI';
 
const InventoryPage = () => {
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
 
  const showToast = (msg, type = "success") => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000); };
 
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
 
  const setField = (key, val) => { setForm(p => ({ ...p, [key]: val })); setErrors(p => ({ ...p, [key]: undefined })); };
 
  useEffect(() => { fetchInventory(); }, []);
  useEffect(() => { setCurrentPage(1); }, [search]);
 
  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${baseUrl}/inventory_transactions_read?clinic_id=1`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setInventory(Array.isArray(data) ? data : []);
    } catch { showToast("Failed to load inventory", "error"); }
    finally { setIsLoading(false); }
  };
 
  const handleEdit = item => {
    setEditingItem(item);
    setForm({
      category_name:    item.category_name    || "",
      transaction_type: item.transaction_type || "",
      batch_no:         item.batch_no         || "",
      expiry_date:      item.expiry_date       || "",
      quantity:         item.quantity          || "",
      purchase_price:   item.purchase_price   || "",
      sale_price:       item.sale_price       || "",
      remarks:          item.remarks          || "",
      transaction_date: item.transaction_date ? item.transaction_date.split("T")[0] : "",
    });
    setErrors({});
    setShowModal(true);
  };
 
  const handleClose = () => {
    setShowModal(false);
    setEditingItem(null);
    setForm(blank);
    setErrors({});
  };
 
  const handleSave = async () => {
    if (!validate()) return;
    try {
      const res = await fetch(`${baseUrl}/inventory_create_update`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_id: editingItem?.transaction_id || 0,
          clinic_id: 1,
          created_by: "admin",
          ...form,
          quantity:       parseFloat(form.quantity),
          purchase_price: parseFloat(form.purchase_price),
          sale_price:     parseFloat(form.sale_price),
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(editingItem ? "Inventory updated" : "Inventory added");
      handleClose();
      fetchInventory();
    } catch (e) { showToast(e.message || "Operation failed", "error"); }
  };
 
  const handleDelete = async transaction_id => {
    if (!window.confirm("Delete this inventory record?")) return;
    try {
      const res = await fetch(`${baseUrl}/inventory_transactions_soft_delete/`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction_id, modified_by: "admin" })
      });
      if (!res.ok) throw new Error();
      showToast("Inventory deleted");
      fetchInventory();
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
 
  const typeColor = t => ({ IN: "bg-green-50 text-green-700 border-green-100", OUT: "bg-red-50 text-red-700 border-red-100", ADJUST: "bg-blue-50 text-blue-700 border-blue-100" }[t] || "bg-gray-100 text-gray-600");
  const Err = ({ f }) => errors[f] ? <p className="text-red-500 text-xs mt-1">{errors[f]}</p> : null;
 
  return (
    <div>
      <PageHeader title="Inventory" subtitle="Manage medicine stock transactions" actions={
        <Btn onClick={() => { setEditingItem(null); setForm(blank); setErrors({}); setShowModal(true); }}>
          <Icons.Plus /> Add Transaction
        </Btn>
      } />
 
      {isLoading ? <div className="text-center py-6 text-gray-500">Loading inventory...</div> : (
        <DataTable
          title="Inventory Transactions"
          subtitle={`${filtered.length} transactions recorded`}
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Search by category, batch, type…"
          actions={<Btn variant="secondary"><Icons.Download />Export</Btn>}
          columns={["Category", "Type", "Batch No.", "Quantity", "Purchase Price", "Sale Price", "Expiry", "Transaction Date", "Remarks", "Actions"]}
          rows={paginated.map(item => (
            <TR key={item.transaction_id}>
              <TD>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: "linear-gradient(135deg,#0E6C68,#14A3A0)" }}>
                    {item.category_name?.[0] || "?"}
                  </div>
                  <span className="font-semibold text-slate-700">{item.category_name || "—"}</span>
                </div>
              </TD>
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
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageSizeChange={n => { setPageSize(n); setCurrentPage(1); }}
          pageSizeOptions={[10, 20, 50]}
        />
      )}
 
      <RightDrawer
        title={editingItem ? "Edit Transaction" : "Add New Transaction"}
        open={showModal}
        onClose={handleClose}
      >
        <div className="h-full flex flex-col">
 
          <div className="px-8 py-4 bg-gradient-to-r from-teal-50 to-blue-50 border-b border-teal-100">
            <p className="text-sm text-gray-600">Fill in the details to record an inventory transaction</p>
          </div>
 
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="space-y-4">
 
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-teal-100">
                <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                  <Icons.Pill />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Transaction Details</p>
                  <p className="text-xs text-gray-400 mt-0.5">Stock in, out or adjustment</p>
                </div>
              </div>
 
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Input label="Category Name *" value={form.category_name} onChange={v => setField("category_name", v)} placeholder="e.g. Syrup, Tablet" />
                  <Err f="category_name" />
                </div>
                <div>
                  <Select label="Transaction Type *" value={form.transaction_type} onChange={v => setField("transaction_type", v)} options={["IN", "OUT", "ADJUST"]} />
                  <Err f="transaction_type" />
                </div>
                <div>
                  <Input label="Batch No." value={form.batch_no} onChange={v => setField("batch_no", v)} placeholder="e.g. B2025-01" />
                </div>
                <div>
                  <Input label="Quantity *" type="number" value={form.quantity} onChange={v => setField("quantity", v)} placeholder="0" />
                  <Err f="quantity" />
                </div>
                <div>
                  <Input label="Expiry Date" type="date" value={form.expiry_date} onChange={v => setField("expiry_date", v)} />
                </div>
                <div>
                  <Input label="Purchase Price *" type="number" value={form.purchase_price} onChange={v => setField("purchase_price", v)} placeholder="0.00" />
                  <Err f="purchase_price" />
                </div>
                <div>
                  <Input label="Sale Price *" type="number" value={form.sale_price} onChange={v => setField("sale_price", v)} placeholder="0.00" />
                  <Err f="sale_price" />
                </div>
                <div className="col-span-2">
                  <Input label="Transaction Date *" type="date" value={form.transaction_date} onChange={v => setField("transaction_date", v)} />
                  <Err f="transaction_date" />
                </div>
                <div className="col-span-2">
                  <Input label="Remarks" value={form.remarks} onChange={v => setField("remarks", v)} placeholder="Optional notes" />
                </div>
              </div>
            </div>
          </div>
 
          <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
            <Btn variant="secondary" onClick={handleClose}>Cancel</Btn>
            <Btn onClick={handleSave}>
              <Icons.Check /> {editingItem ? "Update Transaction" : "Add Transaction"}
            </Btn>
          </div>
 
        </div>
      </RightDrawer>
 
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
 
export default InventoryPage;