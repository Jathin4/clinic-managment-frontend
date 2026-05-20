import { useState, useEffect } from 'react';
import Icons from '../components/Icons';
import { RightDrawer, Btn, Toast, PageHeader, DataTable, TR, TD } from '../components/UI';
import { useApp } from '../context/AppContext';


const API_BASE = process.env.REACT_APP_API_BASE_URL;

const BLANK = {
    expense_category: "",
    description: "",
    amount: "",
    expense_date: "",
    payment_mode: "",
};

const PAYMENT_MODES = ["Cash", "Card", "UPI", "Bank Transfer", "Cheque"];

const EXPENSE_CATEGORIES = [
    "Rent",
    "Salaries",
    "Utilities",
    "Medical Supplies",
    "Equipment",
    "Maintenance",
    "Marketing",
    "Insurance",
    "Taxes",
    "Other",
];

const modeBadge = m => ({
    Cash:            "bg-green-50 text-green-700 border-green-100",
    Card:            "bg-blue-50 text-blue-700 border-blue-100",
    UPI:             "bg-purple-50 text-purple-700 border-purple-100",
    "Bank Transfer": "bg-orange-50 text-orange-700 border-orange-100",
    Cheque:          "bg-gray-50 text-gray-700 border-gray-200",
}[m] || "bg-gray-50 text-gray-600 border-gray-200");

const categoryBadge = c => ({
    Rent:              "bg-red-50 text-red-700 border-red-100",
    Salaries:          "bg-blue-50 text-blue-700 border-blue-100",
    Utilities:         "bg-yellow-50 text-yellow-700 border-yellow-100",
    "Medical Supplies":"bg-teal-50 text-teal-700 border-teal-100",
    Equipment:         "bg-indigo-50 text-indigo-700 border-indigo-100",
    Maintenance:       "bg-orange-50 text-orange-700 border-orange-100",
    Marketing:         "bg-pink-50 text-pink-700 border-pink-100",
    Insurance:         "bg-cyan-50 text-cyan-700 border-cyan-100",
    Taxes:             "bg-rose-50 text-rose-700 border-rose-100",
    Other:             "bg-gray-50 text-gray-600 border-gray-200",
}[c] || "bg-gray-50 text-gray-600 border-gray-200");

const ExpensesPage = () => {
    const { showLoading, hideLoading, user } = useApp();
    const [expenses, setExpenses]         = useState([]);
    const [search, setSearch]             = useState("");
    const [showModal, setShowModal]       = useState(false);
    const [editing, setEditing]           = useState(null);
    const [isLoading, setIsLoading]       = useState(true);
    const [toast, setToast]               = useState(null);
    const [errors, setErrors]             = useState({});
    const [form, setForm]                 = useState(BLANK);
    const [currentPage, setCurrentPage]   = useState(1);
    const [pageSize, setPageSize]         = useState(10);
    const [categoryFilter, setCategoryFilter] = useState("All");

    const sessionUser = user || JSON.parse(sessionStorage.getItem("user") || "{}");
    const clinicId = sessionUser?.clinic_id;

    const showToast = (msg, type = "success") => {
        setToast({ message: msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const Required = () => <span className="text-red-500">*</span>;
    const Err = ({ f }) => errors[f] ? <p className="text-red-500 text-xs mt-1">{errors[f]}</p> : null;
    const setField = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: undefined })); };

    // ── Fetch ────────────────────────────────────────────────

    const fetchExpenses = async () => {
        if (!clinicId) return;
        try {
            setIsLoading(true);
            showLoading("Loading expenses...", "expenses");
            const data = await fetch(`${API_BASE}/expensesread?clinic_id=${clinicId}`).then(r => r.json());
            setExpenses(Array.isArray(data) ? data : []);
        } catch {
            showToast("Failed to load expenses", "error");
        } finally {
            setIsLoading(false);
            hideLoading();
        }
    };

    useEffect(() => { if (clinicId) fetchExpenses(); }, [clinicId]);
    useEffect(() => { setCurrentPage(1); }, [search, categoryFilter]);

    // ── Drawer open/close ────────────────────────────────────

    const openAdd = () => {
        setEditing(null);
        setForm({ ...BLANK, expense_date: new Date().toISOString().split("T")[0] });
        setErrors({});
        setShowModal(true);
    };

    const openEdit = exp => {
        setEditing(exp);
        setForm({
            expense_category: exp.expense_category || "",
            description:      exp.description      || "",
            amount:           exp.amount != null ? String(exp.amount) : "",
            expense_date:     exp.expense_date      ? exp.expense_date.split("T")[0] : "",
            payment_mode:     exp.payment_mode      || "",
        });
        setErrors({});
        setShowModal(true);
    };

    const handleClose = () => {
        setShowModal(false);
        setEditing(null);
        setForm(BLANK);
        setErrors({});
    };

    // ── Save ─────────────────────────────────────────────────

    const handleSave = async () => {
        const e = {};
        if (!form.expense_category)                      e.expense_category = "Required";
        if (!form.amount || Number(form.amount) <= 0)    e.amount           = "Must be greater than 0";
        if (!form.payment_mode)                          e.payment_mode     = "Required";
        if (!form.expense_date)                          e.expense_date     = "Required";
        if (Object.keys(e).length) { setErrors(e); return; }

        try {
            const res = await fetch(`${API_BASE}/expenses_create_update/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id:               editing?.id || null,
                    clinic_id:        clinicId,
                    expense_category: form.expense_category,
                    description:      form.description || null,
                    amount:           parseFloat(form.amount),
                    expense_date:     form.expense_date,
                    payment_mode:     form.payment_mode,
                    created_by:       sessionUser?.full_name || sessionUser?.email || "admin",
                }),
            });
            const data = await res.json();
            if (!res.ok) { showToast(data.error || "Operation failed", "error"); return; }
            showToast(editing ? "Expense updated" : "Expense recorded");
            handleClose();
            fetchExpenses();
        } catch {
            showToast("Server error", "error");
        }
    };

    // ── Delete ───────────────────────────────────────────────

    const handleDelete = async id => {
        if (!window.confirm("Delete this expense?")) return;
        try {
            await fetch(`${API_BASE}/expenses_delete/`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id,
                    modified_by: sessionUser?.full_name || sessionUser?.email || "admin",
                }),
            });
            showToast("Expense deleted");
            fetchExpenses();
        } catch {
            showToast("Failed to delete", "error");
        }
    };

    // ── Filter & paginate ────────────────────────────────────

    const filtered = expenses.filter(exp => {
        const q = search.toLowerCase();
        return (
            (exp.expense_category || "").toLowerCase().includes(q) ||
            (exp.description      || "").toLowerCase().includes(q) ||
            (exp.payment_mode     || "").toLowerCase().includes(q) ||
            String(exp.id || "").includes(q)
        ) && (categoryFilter === "All" || exp.expense_category === categoryFilter);
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginated  = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // ── Summary stats ────────────────────────────────────────

    const totalExpenses  = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const monthlyExpenses = expenses
        .filter(e => {
            if (!e.expense_date) return false;
            const d = new Date(e.expense_date);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((s, e) => s + Number(e.amount || 0), 0);
    const cashExpenses = expenses
        .filter(e => e.payment_mode === "Cash")
        .reduce((s, e) => s + Number(e.amount || 0), 0);

    const formatDate = dt => {
        if (!dt) return "—";
        const d = new Date(dt);
        return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
    };

    // ── Styles ───────────────────────────────────────────────

    const cls = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white";
    const lbl = "block text-sm font-medium text-gray-700 mb-1";

    // ── Render ───────────────────────────────────────────────

    return (
        <div>
            <PageHeader
                title="Expenses"
                subtitle="Clinic expense records and spending history"
                actions={<Btn onClick={openAdd}><Icons.Plus /> Add Expense</Btn>}
            />

            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: "Total Expenses",   value: totalExpenses,   dot: "bg-red-500",   sub: `${expenses.length} records` },
                    { label: "This Month",        value: monthlyExpenses, dot: "bg-orange-500", sub: "Current month" },
                    { label: "Cash Payments",     value: cashExpenses,    dot: "bg-green-500", sub: `${expenses.filter(e => e.payment_mode === "Cash").length} records` },
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

            {/* ── Category Filter Pills ── */}
            {/* <div className="flex flex-wrap gap-2 mb-4">
                {["All", ...EXPENSE_CATEGORIES].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            categoryFilter === cat
                                ? "bg-teal-700 text-white border-teal-700"
                                : "bg-white text-gray-500 border-gray-200 hover:border-teal-400 hover:text-teal-700"
                        }`}
                    >
                        {cat}{cat !== "All" && ` (${expenses.filter(e => e.expense_category === cat).length})`}
                    </button>
                ))}
            </div> */}

            {/* ── Table ── */}
            {isLoading ? (
                <div className="text-center py-6 text-gray-500">Loading expenses...</div>
            ) : (
                <DataTable
                    title="Expense History"
                    subtitle={`${filtered.length} record${filtered.length !== 1 ? "s" : ""}`}
                    search={search}
                    onSearch={setSearch}
                    searchPlaceholder="Search category, description, mode…"
                    actions={<Btn variant="secondary"><Icons.Download /> Export</Btn>}
                    columns={["ID", "Category", "Description", "Mode", "Amount", "Date", "Actions"]}
                    rows={paginated.map(exp => (
                        <TR key={exp.id}>
                            <TD mono bold>{exp.id ? `EXP-${String(exp.id).padStart(4, "0")}` : "—"}</TD>
                            <TD>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${categoryBadge(exp.expense_category)}`}>
                                    {exp.expense_category || "—"}
                                </span>
                            </TD>
                            <TD muted>{exp.description || "—"}</TD>
                            <TD>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${modeBadge(exp.payment_mode)}`}>
                                    {exp.payment_mode || "—"}
                                </span>
                            </TD>
                            <TD bold>₹{Number(exp.amount || 0).toLocaleString("en-IN")}</TD>
                            <TD muted>{formatDate(exp.expense_date)}</TD>
                            <TD>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => openEdit(exp)}
                                        className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-400"
                                    >
                                        <Icons.Edit />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(exp.id)}
                                        className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg text-slate-400"
                                    >
                                        <Icons.Trash />
                                    </button>
                                </div>
                            </TD>
                        </TR>
                    ))}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={filtered.length}
                    pageSize={pageSize}
                    onPageSizeChange={n => { setPageSize(n); setCurrentPage(1); }}
                    pageSizeOptions={[10, 20, 50]}
                />
            )}

            {/* ── Drawer ── */}
            <RightDrawer
                title={editing ? "Edit Expense" : "Add Expense"}
                open={showModal}
                onClose={handleClose}
            >
                <div className="h-full flex flex-col">
                    <div className="px-8 py-4 bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100">
                        <p className="text-sm text-gray-600">
                            {editing ? "Update the expense details below" : "Fill in the details to record a new expense"}
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto px-8 py-4 space-y-4">

                        {/* Category */}
                        <div>
                            <label className={lbl}>Category <Required /></label>
                            <select
                                className={cls}
                                value={form.expense_category}
                                onChange={e => setField("expense_category", e.target.value)}
                            >
                                <option value="" disabled>— Select category —</option>
                                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <Err f="expense_category" />
                        </div>

                        {/* Description */}
                        <div>
                            <label className={lbl}>Description</label>
                            <textarea
                                className={`${cls} resize-none`}
                                rows={3}
                                value={form.description}
                                onChange={e => setField("description", e.target.value)}
                                placeholder="Optional details about this expense…"
                            />
                        </div>

                        {/* Amount */}
                        <div>
                            <label className={lbl}>Amount (₹) <Required /></label>
                            <input
                                type="number"
                                className={cls}
                                value={form.amount}
                                onChange={e => setField("amount", e.target.value)}
                                placeholder="Enter amount"
                                min="0"
                            />
                            <Err f="amount" />
                        </div>

                        {/* Payment Mode */}
                        <div>
                            <label className={lbl}>Payment Mode <Required /></label>
                            <select
                                className={cls}
                                value={form.payment_mode}
                                onChange={e => setField("payment_mode", e.target.value)}
                            >
                                <option value="" disabled>— Select mode —</option>
                                {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <Err f="payment_mode" />
                        </div>

                        {/* Expense Date */}
                        <div>
                            <label className={lbl}>Expense Date <Required /></label>
                            <input
                                type="date"
                                className={cls}
                                value={form.expense_date}
                                onChange={e => setField("expense_date", e.target.value)}
                            />
                            <Err f="expense_date" />
                        </div>

                    </div>

                    <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                        <Btn variant="secondary" onClick={handleClose}>Cancel</Btn>
                        <Btn
                            onClick={handleSave}
                            disabled={
                                !form.expense_category ||
                                !form.amount ||
                                Number(form.amount) <= 0 ||
                                !form.payment_mode ||
                                !form.expense_date
                            }
                        >
                            <Icons.Check />{editing ? "Update Expense" : "Save Expense"}
                        </Btn>
                    </div>
                </div>
            </RightDrawer>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default ExpensesPage;