import React, { useState, useEffect, useCallback, useRef } from "react";

// ─────────────────────────────────────────────
// API Config
// ─────────────────────────────────────────────
const API_BASE = process.env.REACT_APP_API_BASE_URL;

const getClinicId = (() => {
  let cached = null;
  return () => {
    if (cached) return cached;
    try {
      const u = sessionStorage.getItem("user");
      cached = u ? JSON.parse(u)?.clinic_id : null;
      return cached;
    } catch { return null; }
  };
})();

const getToken = () => localStorage.getItem("token") || "";

async function apiFetch(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = {
    Authorization: `Bearer ${getToken()}`,
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };
  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `API error: ${res.status}`);
  }
  return res.json();
}

const ORDER_STATUSES  = ["Created", "Sample Collected", "Processing", "Report Uploaded", "Completed", "Cancelled"];
const TEST_CATEGORIES = ["Blood Test", "Urine Test", "X-Ray", "Scan", "MRI", "CT Scan", "Health Package"];
const GENDERS         = ["Male", "Female", "Other"];

// ─────────────────────────────────────────────
// Toast System
// ─────────────────────────────────────────────
let _setToasts = null;

function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  _setToasts = setToasts;

  return (
    <div style={{
      position: "fixed", top: 20, right: 20, zIndex: 9999,
      display: "flex", flexDirection: "column", gap: 10, minWidth: 300
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: "12px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          background: t.type === "success" ? "#d1fae5"
                    : t.type === "error"   ? "#fee2e2"
                    : "#fef3c7",
          color:      t.type === "success" ? "#065f46"
                    : t.type === "error"   ? "#991b1b"
                    : "#92400e",
          borderLeft: `4px solid ${
            t.type === "success" ? "#10b981"
          : t.type === "error"   ? "#ef4444"
          : "#f59e0b"}`
        }}>
          <span>
            {t.type === "success" ? "✅ " : t.type === "error" ? "❌ " : "⚠️ "}
            {t.message}
          </span>
          <button
            onClick={() => _setToasts(p => p.filter(x => x.id !== t.id))}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, marginLeft: 12 }}
          >×</button>
        </div>
      ))}
    </div>
  );
}

function toast(message, type = "success") {
  if (!_setToasts) return;
  const id = Date.now() + Math.random();
  _setToasts(p => [...p, { id, message, type }]);
  setTimeout(() => _setToasts(p => p.filter(x => x.id !== id)), 4000);
}

// ─────────────────────────────────────────────
// Status Badge
// ─────────────────────────────────────────────
const STATUS_STYLES = {
  "Created":          { background: "#e0e7ff", color: "#3730a3" },
  "Sample Collected": { background: "#fef3c7", color: "#92400e" },
  "Processing":       { background: "#dbeafe", color: "#1e40af" },
  "Report Uploaded":  { background: "#d1fae5", color: "#065f46" },
  "Completed":        { background: "#d1fae5", color: "#065f46" },
  "Cancelled":        { background: "#fee2e2", color: "#991b1b" },
  "Active":           { background: "#d1fae5", color: "#065f46" },
  "Inactive":         { background: "#f3f4f6", color: "#6b7280" },
  "Final":            { background: "#d1fae5", color: "#065f46" },
  "Preliminary":      { background: "#fef3c7", color: "#92400e" },
  "DCC":              { background: "#e0e7ff", color: "#3730a3" },
  "DCN":              { background: "#fce7f3", color: "#9d174d" },
};

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || { background: "#f3f4f6", color: "#374151" };
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 12, fontSize: 12,
      fontWeight: 600, display: "inline-block", ...style
    }}>{status}</span>
  );
}

// ─────────────────────────────────────────────
// Shared UI Components
// ─────────────────────────────────────────────
function Modal({ title, onClose, children, maxWidth = 600 }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{
        background: "#fff", borderRadius: 12, padding: 28, width: "100%",
        maxWidth, maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.18)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>{title}</h3>
          <button onClick={onClose} style={{
            background: "none", border: "none", fontSize: 22,
            cursor: "pointer", color: "#94a3b8", lineHeight: 1
          }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 5 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "8px 11px", border: "1px solid #e2e8f0",
  borderRadius: 7, fontSize: 14, color: "#1e293b", background: "#f8fafc",
  boxSizing: "border-box", outline: "none",
};

function Input(props) { return <input style={inputStyle} {...props} />; }
function Select({ children, ...props }) {
  return <select style={inputStyle} {...props}>{children}</select>;
}

function ModalFooter({ onClose, onSave, saving }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
      <button onClick={onClose} style={{
        padding: "8px 20px", border: "1px solid #e2e8f0", borderRadius: 7,
        background: "#fff", color: "#64748b", fontSize: 14, cursor: "pointer", fontWeight: 600
      }}>Cancel</button>
      <button onClick={onSave} disabled={saving} style={{
        padding: "8px 22px", border: "none", borderRadius: 7,
        background: saving ? "#93c5fd" : "#0E6C68", color: "#fff",
        fontSize: 14, cursor: saving ? "not-allowed" : "pointer", fontWeight: 600
      }}>{saving ? "Saving..." : "Save"}</button>
    </div>
  );
}

function SummaryCard({ label, value, color = "#0E6C68" }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 10, padding: "18px 22px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.07)", flex: 1, minWidth: 140,
      borderTop: `4px solid ${color}`
    }}>
      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#1e293b" }}>{value}</div>
    </div>
  );
}

function Table({ headers, children }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            {headers.map(h => (
              <th key={h} style={{
                padding: "11px 14px", textAlign: "left", fontWeight: 700,
                color: "#475569", borderBottom: "1px solid #e2e8f0",
                whiteSpace: "nowrap", fontSize: 13
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Td({ children, style }) {
  return (
    <td style={{
      padding: "11px 14px", borderBottom: "1px solid #f1f5f9",
      color: "#334155", verticalAlign: "middle", ...style
    }}>{children}</td>
  );
}

function ActionBtn({ label, color = "#0E6C68", onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "4px 11px", fontSize: 12, fontWeight: 600,
      border: `1px solid ${disabled ? "#ccc" : color}`, borderRadius: 6,
      cursor: disabled ? "not-allowed" : "pointer",
      background: "#fff", color: disabled ? "#ccc" : color, marginRight: 5,
    }}>{label}</button>
  );
}

function PrimaryBtn({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "8px 18px", background: disabled ? "#93c5fd" : "#0E6C68", color: "#fff",
      border: "none", borderRadius: 7, fontSize: 14, fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer"
    }}>{children}</button>
  );
}

function LoadingRow({ cols }) {
  return (
    <tr>
      <td colSpan={cols} style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>
        Loading...
      </td>
    </tr>
  );
}

function EmptyRow({ cols, message = "No data found." }) {
  return (
    <tr>
      <td colSpan={cols} style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>
        {message}
      </td>
    </tr>
  );
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div style={{
      background: "#fee2e2", color: "#991b1b", borderRadius: 8,
      padding: "12px 16px", marginBottom: 16, display: "flex",
      justifyContent: "space-between", alignItems: "center", fontSize: 14
    }}>
      <span>⚠️ {message}</span>
      {onRetry && (
        <button onClick={onRetry} style={{
          background: "#991b1b", color: "#fff", border: "none",
          borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 13
        }}>Retry</button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Status Update Modal
// ─────────────────────────────────────────────
function StatusUpdateModal({ order, onClose, onUpdated }) {
  const [status, setSt] = useState(order.v_status || "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!status) { toast("Please select a status", "error"); return; }
    setSaving(true);
    try {
      await apiFetch("/api/diagnostic_orders_status_update", {
        method: "PUT",
        body: JSON.stringify({
          order_id:  order.v_id,
          status,
          clinic_id: getClinicId(),
        }),
      });
      toast("Order status updated successfully");
      onUpdated();
      onClose();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Update Order Status" onClose={onClose} maxWidth={400}>
      <Field label="Invoice">
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0E6C68", marginBottom: 8 }}>
          {order.v_invoice_number}
        </div>
      </Field>
      <Field label="New Status">
        <Select value={status} onChange={e => setSt(e.target.value)}>
          <option value="">Select Status</option>
          {ORDER_STATUSES.map(s => <option key={s}>{s}</option>)}
        </Select>
      </Field>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} />
    </Modal>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Tab 1: Diagnostic Orders
// ═════════════════════════════════════════════════════════════════════════════
function DiagnosticOrders({ patients, doctors, tests, centers, onOrdersChange }) {
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [centerFilter, setCenterFilter] = useState("");
  const [typeFilter, setTypeFilter]     = useState("");
  const [dateFilter, setDateFilter]     = useState("");
  const [showModal, setShowModal]       = useState(false);
  const [statusModal, setStatusModal]   = useState(null);
  const [saving, setSaving]             = useState(false);

  const emptyForm = {
    patient_type: "DCC",
    patient_id: "", doctor_id: "", center_id: "", test_id: "",
    // DCN fields
    walkin_name: "", walkin_phone: "", walkin_age: "", walkin_gender: "Male",
    priority: "Normal", collection_type: "At Clinic",
    payment_status: "Pending", payment_mode: "Cash", amount: "", notes: ""
  };
  const [form, setForm] = useState(emptyForm);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/api/diagnostic_orders_read?clinic_id=${getClinicId()}`);
      const list = Array.isArray(data) ? data : [];
      setOrders(list);
      onOrdersChange?.(list);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [onOrdersChange]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Fix: case-insensitive center filter, date filter using order_date directly
  const filtered = orders.filter(o => {
    const s = search.toLowerCase();
    const matchSearch = !s ||
      (o.v_patient_name  || "").toLowerCase().includes(s) ||
      (o.v_invoice_number|| "").toLowerCase().includes(s) ||
      (o.v_doctor_name   || "").toLowerCase().includes(s);
    const matchStatus = !statusFilter || o.v_status === statusFilter;
    const matchCenter = !centerFilter || (o.v_center_name || "").toLowerCase() === centerFilter.toLowerCase();
    const matchType   = !typeFilter   || o.v_patient_type === typeFilter;
    const matchDate   = !dateFilter   || (o.v_order_date  || "").startsWith(dateFilter);
    return matchSearch && matchStatus && matchCenter && matchType && matchDate;
  });

  const centerNames = [...new Set(orders.map(o => o.v_center_name).filter(Boolean))];

  function getDoctorName(d) {
    if (!d) return "";
    if (d.full_name) return d.full_name;
    if (d.name) return d.name;
    if (d.first_name || d.last_name) return `${d.first_name || ""} ${d.last_name || ""}`.trim();
    return `Doctor ${d.id}`;
  }

  async function handleSave() {
    // Validation
    if (!form.center_id) { toast("Diagnostic Center is required", "error"); return; }
    if (!form.test_id)   { toast("Test is required", "error"); return; }
    if (form.patient_type === "DCC" && !form.patient_id) {
      toast("Patient is required for clinic orders", "error"); return;
    }
    if (form.patient_type === "DCN") {
      if (!form.walkin_name.trim())  { toast("Walk-in patient name is required", "error"); return; }
      if (!form.walkin_phone.trim()) { toast("Walk-in patient phone is required", "error"); return; }
    }
    if (form.amount !== "" && parseFloat(form.amount) < 0) {
      toast("Amount cannot be negative", "error"); return;
    }

    setSaving(true);
    try {
      const res = await apiFetch("/api/diagnostic_orders_create_update", {
        method: "POST",
        body: JSON.stringify({
          order_id:        0,
          clinic_id:       getClinicId(),
          patient_type:    form.patient_type,
          patient_id:      form.patient_type === "DCC" ? parseInt(form.patient_id) : 0,
          doctor_id:       parseInt(form.doctor_id) || 0,
          center_id:       parseInt(form.center_id),
          test_id:         parseInt(form.test_id),
          walkin_name:     form.patient_type === "DCN" ? form.walkin_name  : null,
          walkin_phone:    form.patient_type === "DCN" ? form.walkin_phone : null,
          walkin_age:      form.patient_type === "DCN" ? parseInt(form.walkin_age) || null : null,
          walkin_gender:   form.patient_type === "DCN" ? form.walkin_gender : null,
          priority:        form.priority,
          collection_type: form.collection_type,
          payment_status:  form.payment_status,
          payment_mode:    form.payment_mode,
          amount:          parseFloat(form.amount) || 0,
          notes:           form.notes,
        }),
      });
      toast(`Order created — Invoice: ${res.invoice_number}`);
      await fetchOrders();
      setShowModal(false);
      setForm(emptyForm);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(orderId) {
    if (!window.confirm("Delete this order?")) return;
    try {
      await apiFetch("/api/diagnostic_orders_soft_delete", {
        method: "DELETE",
        body: JSON.stringify({ order_id: orderId, modified_by: getToken() }),
      });
      toast("Order deleted successfully");
      await fetchOrders();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  // Fix: revenue label — no ₹ prefix in value since label already shows currency
  const totalRevenue = orders.reduce((s, o) => s + (parseFloat(o.v_amount) || 0), 0);

  return (
    <div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
        <SummaryCard label="Total Orders"    value={orders.length}                                                                        color="#0E6C68" />
        <SummaryCard label="Clinic (DCC)"    value={orders.filter(o => o.v_patient_type === "DCC").length}                                color="#3730a3" />
        <SummaryCard label="Walk-in (DCN)"   value={orders.filter(o => o.v_patient_type === "DCN").length}                                color="#9d174d" />
        <SummaryCard label="Processing"      value={orders.filter(o => o.v_status === "Processing").length}                               color="#8b5cf6" />
        <SummaryCard label="Reports Ready"   value={orders.filter(o => ["Report Uploaded","Completed"].includes(o.v_status)).length}      color="#10b981" />
        <SummaryCard label="Revenue"         value={`₹${totalRevenue.toLocaleString()}`}                                                  color="#0ea5e9" />
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchOrders} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            style={{ ...inputStyle, maxWidth: 220 }}
            placeholder="Search invoice, patient..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ maxWidth: 130 }}>
            <option value="">All Types</option>
            <option value="DCC">DCC</option>
            <option value="DCN">DCN</option>
          </Select>
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ maxWidth: 165 }}>
            <option value="">All Statuses</option>
            {ORDER_STATUSES.map(s => <option key={s}>{s}</option>)}
          </Select>
          <Select value={centerFilter} onChange={e => setCenterFilter(e.target.value)} style={{ maxWidth: 185 }}>
            <option value="">All Centers</option>
            {centerNames.map(c => <option key={c}>{c}</option>)}
          </Select>
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={{ ...inputStyle, maxWidth: 160 }} />
        </div>
        <PrimaryBtn onClick={() => { setForm(emptyForm); setShowModal(true); }}>+ New Order</PrimaryBtn>
      </div>

      <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
        <Table headers={["Invoice", "Type", "Patient", "Doctor", "Center", "Test", "Amount", "Status", "Date", "Actions"]}>
          {loading ? <LoadingRow cols={10} /> :
           filtered.length === 0 ? <EmptyRow cols={10} message="No orders found." /> :
           filtered.map(o => (
            <tr key={o.v_id}
              onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
              onMouseLeave={e => e.currentTarget.style.background = ""}>
              <Td><span style={{ fontWeight: 700, color: "#0E6C68", fontSize: 12 }}>{o.v_invoice_number}</span></Td>
              <Td><StatusBadge status={o.v_patient_type} /></Td>
              <Td>{o.v_patient_name}</Td>
              <Td style={{ color: "#64748b" }}>{o.v_doctor_name || "—"}</Td>
              <Td>{o.v_center_name}</Td>
              <Td style={{ color: "#64748b" }}>{o.v_test_name}</Td>
              <Td><span style={{ fontWeight: 700 }}>₹{parseFloat(o.v_amount || 0).toLocaleString()}</span></Td>
              <Td><StatusBadge status={o.v_status} /></Td>
              <Td style={{ color: "#94a3b8" }}>{(o.v_order_date || "").split("T")[0]}</Td>
              <Td>
                <ActionBtn label="Status" color="#f59e0b" onClick={() => setStatusModal(o)} />
                <ActionBtn label="Delete" color="#ef4444" onClick={() => handleDelete(o.v_id)} />
              </Td>
            </tr>
          ))}
        </Table>
      </div>

      {/* New Order Modal */}
      {showModal && (
        <Modal title="New Diagnostic Order" onClose={() => setShowModal(false)} maxWidth={700}>
          {/* Patient Type Toggle */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {["DCC", "DCN"].map(type => (
              <button key={type} onClick={() => setForm({ ...form, patient_type: type })} style={{
                flex: 1, padding: "10px", borderRadius: 8, border: "2px solid",
                borderColor: form.patient_type === type ? "#0E6C68" : "#e2e8f0",
                background: form.patient_type === type ? "#0E6C68" : "#fff",
                color: form.patient_type === type ? "#fff" : "#64748b",
                fontWeight: 700, cursor: "pointer", fontSize: 14,
              }}>
                {type === "DCC" ? "🏥 DCC — Clinic Patient" : "🚶 DCN — Walk-in Patient"}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <div>
              {/* DCC: Patient select */}
              {form.patient_type === "DCC" && (
                <Field label="Patient *">
                  <Select value={form.patient_id} onChange={e => setForm({ ...form, patient_id: e.target.value })}>
                    <option value="">Select Patient</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                    ))}
                  </Select>
                </Field>
              )}

              {/* DCN: Walk-in fields */}
              {form.patient_type === "DCN" && (<>
                <Field label="Patient Name *">
                  <Input value={form.walkin_name} onChange={e => setForm({ ...form, walkin_name: e.target.value })} placeholder="Full name" />
                </Field>
                <Field label="Phone *">
                  <Input value={form.walkin_phone} onChange={e => setForm({ ...form, walkin_phone: e.target.value })} placeholder="10-digit mobile" maxLength={10} />
                </Field>
                <Field label="Age">
                  <Input type="number" min={0} max={120} value={form.walkin_age} onChange={e => setForm({ ...form, walkin_age: e.target.value })} placeholder="Age" />
                </Field>
                <Field label="Gender">
                  <Select value={form.walkin_gender} onChange={e => setForm({ ...form, walkin_gender: e.target.value })}>
                    {GENDERS.map(g => <option key={g}>{g}</option>)}
                  </Select>
                </Field>
              </>)}

              <Field label="Doctor">
                <Select value={form.doctor_id} onChange={e => setForm({ ...form, doctor_id: e.target.value })}>
                  <option value="">Select Doctor (optional)</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{getDoctorName(d)}</option>
                  ))}
                </Select>
              </Field>

              <Field label="Diagnostic Center *">
                <Select value={form.center_id} onChange={e => setForm({ ...form, center_id: e.target.value })}>
                  <option value="">Select Center</option>
                  {centers.map(c => <option key={c.v_id} value={c.v_id}>{c.v_name}</option>)}
                </Select>
              </Field>

              <Field label="Test *">
                <Select value={form.test_id} onChange={e => setForm({ ...form, test_id: e.target.value })}>
                  <option value="">Select Test</option>
                  {tests.map(t => (
                    <option key={t.v_id} value={t.v_id}>{t.v_name} {t.v_price ? `— ₹${t.v_price}` : ""}</option>
                  ))}
                </Select>
              </Field>

              <Field label="Priority">
                <Select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  <option>Normal</option>
                  <option>Urgent</option>
                </Select>
              </Field>
            </div>

            <div>
              <Field label="Sample Collection">
                <Select value={form.collection_type} onChange={e => setForm({ ...form, collection_type: e.target.value })}>
                  <option>At Clinic</option>
                  <option>Home Visit</option>
                </Select>
              </Field>
              <Field label="Payment Status">
                <Select value={form.payment_status} onChange={e => setForm({ ...form, payment_status: e.target.value })}>
                  <option>Pending</option>
                  <option>Paid</option>
                  <option>Partial</option>
                </Select>
              </Field>
              <Field label="Payment Mode">
                <Select value={form.payment_mode} onChange={e => setForm({ ...form, payment_mode: e.target.value })}>
                  <option>Cash</option>
                  <option>Card</option>
                  <option>UPI</option>
                  <option>Insurance</option>
                </Select>
              </Field>
              <Field label="Total Amount (₹)">
                <Input
                  type="number" min={0}
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                />
              </Field>
              <Field label="Notes">
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical" }}
                  placeholder="Any instructions..."
                />
              </Field>
            </div>
          </div>
          <ModalFooter onClose={() => setShowModal(false)} onSave={handleSave} saving={saving} />
        </Modal>
      )}

      {statusModal && (
        <StatusUpdateModal
          order={statusModal}
          onClose={() => setStatusModal(null)}
          onUpdated={fetchOrders}
        />
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Tab 2: Test Catalog
// ═════════════════════════════════════════════════════════════════════════════
function TestCatalog({ onTestsChange }) {
  const [tests, setTests]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTest, setEditTest]   = useState(null);
  const [saving, setSaving]       = useState(false);

  const emptyForm = {
    name: "", category: "", sample_type: "", price: "",
    report_time: "", fasting_required: false, instructions: "", status: "Active"
  };
  const [form, setForm] = useState(emptyForm);

  const fetchTests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/api/diagnostic_tests_read?clinic_id=${getClinicId()}`);
      const list = Array.isArray(data) ? data : [];
      setTests(list);
      onTestsChange?.(list);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [onTestsChange]);

  useEffect(() => { fetchTests(); }, [fetchTests]);

  const filtered = tests.filter(t =>
    (!search || (t.v_name || "").toLowerCase().includes(search.toLowerCase())) &&
    (!catFilter || t.v_category === catFilter)
  );

  function openAdd() { setEditTest(null); setForm(emptyForm); setShowModal(true); }
  function openEdit(t) {
    setEditTest(t);
    setForm({
      name: t.v_name, category: t.v_category, sample_type: t.v_sample_type,
      price: t.v_price, report_time: t.v_report_time,
      fasting_required: t.v_fasting_required || false,
      instructions: t.v_instructions || "", status: t.v_status
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { toast("Test name is required", "error"); return; }
    if (form.price !== "" && parseFloat(form.price) < 0) { toast("Price cannot be negative", "error"); return; }
    setSaving(true);
    try {
      await apiFetch("/api/diagnostic_tests_create_update", {
        method: "POST",
        body: JSON.stringify({
          test_id:          editTest ? editTest.v_id : 0,
          clinic_id:        getClinicId(),
          name:             form.name,
          category:         form.category,
          sample_type:      form.sample_type,
          price:            parseFloat(form.price) || 0,
          report_time:      form.report_time,
          fasting_required: form.fasting_required,
          instructions:     form.instructions,
          status:           form.status,
        }),
      });
      toast(editTest ? "Test updated successfully" : "Test added successfully");
      await fetchTests();
      setShowModal(false);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(testId) {
    if (!window.confirm("Delete this test?")) return;
    try {
      await apiFetch("/api/diagnostic_tests_soft_delete", {
        method: "DELETE",
        body: JSON.stringify({ test_id: testId, modified_by: getToken() }),
      });
      toast("Test deleted successfully");
      await fetchTests();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            style={{ ...inputStyle, maxWidth: 220 }}
            placeholder="Search test..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ maxWidth: 165 }}>
            <option value="">All Categories</option>
            {TEST_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </Select>
        </div>
        <PrimaryBtn onClick={openAdd}>+ Add Test</PrimaryBtn>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchTests} />}

      <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
        <Table headers={["Test Name", "Category", "Sample Type", "Price", "Report Time", "Fasting", "Status", "Actions"]}>
          {loading ? <LoadingRow cols={8} /> :
           filtered.length === 0 ? <EmptyRow cols={8} message="No tests found." /> :
           filtered.map(t => (
            <tr key={t.v_id}
              onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
              onMouseLeave={e => e.currentTarget.style.background = ""}>
              <Td><span style={{ fontWeight: 600 }}>{t.v_name}</span></Td>
              <Td style={{ color: "#64748b" }}>{t.v_category}</Td>
              <Td style={{ color: "#64748b" }}>{t.v_sample_type}</Td>
              <Td><span style={{ fontWeight: 700 }}>₹{t.v_price}</span></Td>
              <Td style={{ color: "#64748b" }}>{t.v_report_time}</Td>
              <Td>
                {t.v_fasting_required
                  ? <span style={{ color: "#f59e0b", fontWeight: 700 }}>Yes</span>
                  : <span style={{ color: "#94a3b8" }}>No</span>}
              </Td>
              <Td><StatusBadge status={t.v_status} /></Td>
              <Td>
                <ActionBtn label="Edit"   color="#0E6C68" onClick={() => openEdit(t)} />
                <ActionBtn label="Delete" color="#ef4444" onClick={() => handleDelete(t.v_id)} />
              </Td>
            </tr>
          ))}
        </Table>
      </div>

      {showModal && (
        <Modal
          title={editTest ? "Edit Test" : "Add New Test"}
          onClose={() => { setShowModal(false); setEditTest(null); }}
        >
          <Field label="Test Name *">
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Complete Blood Count" />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Category">
              <Select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="">Select</option>
                {TEST_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Sample Type">
              <Input value={form.sample_type} onChange={e => setForm({ ...form, sample_type: e.target.value })} placeholder="Blood / Urine / N/A" />
            </Field>
            <Field label="Price (₹)">
              <Input type="number" min={0} value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
            </Field>
            <Field label="Report Time">
              <Input value={form.report_time} onChange={e => setForm({ ...form, report_time: e.target.value })} placeholder="e.g. 6 hrs" />
            </Field>
            <Field label="Fasting Required">
              <Select value={form.fasting_required ? "Yes" : "No"} onChange={e => setForm({ ...form, fasting_required: e.target.value === "Yes" })}>
                <option>No</option>
                <option>Yes</option>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option>Active</option>
                <option>Inactive</option>
              </Select>
            </Field>
          </div>
          <Field label="Instructions">
            <textarea
              value={form.instructions}
              onChange={e => setForm({ ...form, instructions: e.target.value })}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
              placeholder="Patient preparation notes..."
            />
          </Field>
          <ModalFooter onClose={() => { setShowModal(false); setEditTest(null); }} onSave={handleSave} saving={saving} />
        </Modal>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Tab 3: Diagnostic Centers
// ═════════════════════════════════════════════════════════════════════════════
function DiagnosticCenters({ centers, fetchCenters, loading: centersLoading }) {
  const [showModal, setShowModal] = useState(false);
  const [editCenter, setEditCenter] = useState(null);
  const [saving, setSaving]         = useState(false);

  const emptyForm = {
    name: "", contact_person: "", phone: "", email: "",
    address: "", gst_number: "", working_hours: "", status: "Active"
  };
  const [form, setForm] = useState(emptyForm);

  function openAdd()  { setEditCenter(null); setForm(emptyForm); setShowModal(true); }
  function openEdit(c) {
    setEditCenter(c);
    setForm({
      name: c.v_name, contact_person: c.v_contact_person, phone: c.v_phone,
      email: c.v_email, address: c.v_address, gst_number: c.v_gst_number,
      working_hours: c.v_working_hours, status: c.v_status
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { toast("Center name is required", "error"); return; }
    setSaving(true);
    try {
      await apiFetch("/api/diagnostic_centers_create_update", {
        method: "POST",
        body: JSON.stringify({
          center_id:      editCenter ? editCenter.v_id : 0,
          clinic_id:      getClinicId(),
          name:           form.name,
          contact_person: form.contact_person,
          phone:          form.phone,
          email:          form.email,
          address:        form.address,
          gst_number:     form.gst_number,
          working_hours:  form.working_hours,
          status:         form.status,
        }),
      });
      toast(editCenter ? "Center updated successfully" : "Center added successfully");
      await fetchCenters();
      setShowModal(false);
      setEditCenter(null);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(center) {
    try {
      await apiFetch("/api/diagnostic_centers_create_update", {
        method: "POST",
        body: JSON.stringify({
          center_id:      center.v_id,
          clinic_id:      getClinicId(),
          name:           center.v_name,
          contact_person: center.v_contact_person,
          phone:          center.v_phone,
          email:          center.v_email,
          address:        center.v_address,
          gst_number:     center.v_gst_number,
          working_hours:  center.v_working_hours,
          status:         center.v_status === "Active" ? "Inactive" : "Active",
        }),
      });
      toast(`Center ${center.v_status === "Active" ? "deactivated" : "activated"} successfully`);
      await fetchCenters();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  async function handleDelete(centerId) {
    if (!window.confirm("Delete this center?")) return;
    try {
      await apiFetch("/api/diagnostic_centers_soft_delete", {
        method: "DELETE",
        body: JSON.stringify({ center_id: centerId, modified_by: getToken() }),
      });
      toast("Center deleted successfully");
      await fetchCenters();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <PrimaryBtn onClick={openAdd}>+ Add Diagnostic Center</PrimaryBtn>
      </div>

      {/* Fix: loading state for centers */}
      {centersLoading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Loading centers...</div>
      ) : centers.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>No centers found.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {centers.map(c => (
            <div key={c.v_id} style={{
              background: "#fff", borderRadius: 12, padding: 22,
              boxShadow: "0 1px 6px rgba(0,0,0,0.08)", borderLeft: "4px solid #0E6C68"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "#1e293b" }}>{c.v_name}</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{c.v_contact_person}</div>
                </div>
                <StatusBadge status={c.v_status} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13, color: "#475569", marginBottom: 14 }}>
                <div>📞 {c.v_phone}</div>
                <div>✉️ {c.v_email}</div>
                <div style={{ gridColumn: "span 2" }}>📍 {c.v_address}</div>
                <div>🕐 {c.v_working_hours}</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <ActionBtn label="Edit" color="#0E6C68" onClick={() => openEdit(c)} />
                <ActionBtn
                  label={c.v_status === "Active" ? "Deactivate" : "Activate"}
                  color={c.v_status === "Active" ? "#ef4444" : "#10b981"}
                  onClick={() => handleToggleStatus(c)}
                />
                <ActionBtn label="Delete" color="#ef4444" onClick={() => handleDelete(c.v_id)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal
          title={editCenter ? "Edit Diagnostic Center" : "Add Diagnostic Center"}
          onClose={() => { setShowModal(false); setEditCenter(null); }}
        >
          <Field label="Center Name *">
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Contact Person">
              <Input value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} maxLength={15} />
            </Field>
            <Field label="Email">
              {/* Fix: type="email" for browser validation */}
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="GST Number">
              <Input value={form.gst_number} onChange={e => setForm({ ...form, gst_number: e.target.value })} />
            </Field>
            <Field label="Working Hours">
              <Input value={form.working_hours} onChange={e => setForm({ ...form, working_hours: e.target.value })} placeholder="e.g. 7am - 9pm" />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option>Active</option>
                <option>Inactive</option>
              </Select>
            </Field>
          </div>
          <Field label="Address">
            <textarea
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </Field>
          <ModalFooter onClose={() => { setShowModal(false); setEditCenter(null); }} onSave={handleSave} saving={saving} />
        </Modal>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Tab 4: Reports
// ═════════════════════════════════════════════════════════════════════════════
function DiagnosticReports({ orders }) {
  const [reports, setReports]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]       = useState(false);
  const fileRef                   = useRef(null);

  const emptyForm = {
    order_id: "", patient_id: "", center_id: "", clinic_id: getClinicId(),
    test_name: "", remarks: "", report_status: "Preliminary", file: null,
  };
  const [form, setForm] = useState(emptyForm);
  const [fileName, setFileName] = useState("");

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/api/diagnostic_reports_read?clinic_id=${getClinicId()}`);
      setReports(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  // Fix: populate patient_id and center_id from orders correctly
  function handleOrderChange(orderId) {
    const order = orders.find(o => String(o.v_id) === String(orderId));
    setForm(f => ({
      ...f,
      order_id:   orderId,
      patient_id: order?.v_patient_id || 0,
      center_id:  order?.v_center_id  || 0,
      test_name:  order?.v_test_name  || "",
    }));
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    // Fix: PDF only validation
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast("Only PDF files are allowed", "error");
      fileRef.current.value = "";
      return;
    }
    // Fix: 10MB size limit
    if (file.size > 10 * 1024 * 1024) {
      toast("File size must be less than 10MB", "error");
      fileRef.current.value = "";
      return;
    }
    setForm(f => ({ ...f, file }));
    setFileName(file.name);
  }

  // Fix: filter cancelled orders from dropdown
  const activeOrders = orders.filter(o => o.v_status !== "Cancelled");

  const filtered = reports.filter(r =>
    !search ||
    (r.v_patient_name  || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.v_invoice_number|| "").toLowerCase().includes(search.toLowerCase())
  );

  async function handleSave() {
    if (!form.order_id)   { toast("Order is required", "error"); return; }
    if (!form.test_name)  { toast("Test name is required", "error"); return; }
    if (!form.file)       { toast("Please select a PDF file", "error"); return; }

    setSaving(true);
    try {
      // Fix: use FormData for file upload, not JSON
      const fd = new FormData();
      fd.append("order_id",      form.order_id);
      fd.append("patient_id",    form.patient_id || 0);
      fd.append("center_id",     form.center_id  || 0);
      fd.append("clinic_id",     getClinicId());
      fd.append("test_name",     form.test_name);
      fd.append("remarks",       form.remarks);
      fd.append("report_status", form.report_status);
      fd.append("file",          form.file);

      await apiFetch("/api/diagnostic_reports_upload", {
        method: "POST",
        body:   fd,
      });

      toast("Report uploaded successfully");
      await fetchReports();
      setShowModal(false);
      setForm(emptyForm);
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(reportId) {
    if (!window.confirm("Delete this report?")) return;
    try {
      await apiFetch("/api/diagnostic_reports_soft_delete", {
        method: "DELETE",
        body: JSON.stringify({ report_id: reportId, modified_by: getToken() }),
      });
      toast("Report deleted successfully");
      await fetchReports();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        <input
          style={{ ...inputStyle, maxWidth: 260 }}
          placeholder="Search patient, invoice..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <PrimaryBtn onClick={() => setShowModal(true)}>⬆ Upload Report</PrimaryBtn>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchReports} />}

      <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
        <Table headers={["Report ID", "Invoice", "Patient", "Type", "Test Name", "Center", "Uploaded", "Status", "Actions"]}>
          {loading ? <LoadingRow cols={9} /> :
           filtered.length === 0 ? <EmptyRow cols={9} message="No reports found." /> :
           filtered.map(r => (
            <tr key={r.v_id}
              onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
              onMouseLeave={e => e.currentTarget.style.background = ""}>
              <Td><span style={{ fontWeight: 700, color: "#0E6C68" }}>RPT-{String(r.v_id).padStart(3, "0")}</span></Td>
              <Td style={{ fontSize: 12, color: "#64748b" }}>{r.v_invoice_number}</Td>
              <Td>{r.v_patient_name}</Td>
              <Td><StatusBadge status={r.v_patient_type} /></Td>
              <Td style={{ color: "#64748b" }}>{r.v_test_name}</Td>
              <Td style={{ color: "#64748b" }}>{r.v_center_name}</Td>
              <Td style={{ color: "#94a3b8" }}>{(r.v_uploaded_at || "").split("T")[0]}</Td>
              <Td><StatusBadge status={r.v_report_status} /></Td>
              <Td>
                {r.v_file_url && (
                  <ActionBtn label="Download" color="#10b981" onClick={() => window.open(`${API_BASE}/${r.v_file_url}`, "_blank")} />
                )}
                <ActionBtn label="Delete" color="#ef4444" onClick={() => handleDelete(r.v_id)} />
              </Td>
            </tr>
          ))}
        </Table>
      </div>

      {showModal && (
        <Modal title="Upload Diagnostic Report" onClose={() => { setShowModal(false); setForm(emptyForm); setFileName(""); }}>
          <Field label="Order *">
            <Select value={form.order_id} onChange={e => handleOrderChange(e.target.value)}>
              <option value="">Select Order</option>
              {/* Fix: only non-cancelled orders */}
              {activeOrders.map(o => (
                <option key={o.v_id} value={o.v_id}>
                  {o.v_invoice_number} — {o.v_patient_name} ({o.v_patient_type})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Test Name *">
            <Input value={form.test_name} onChange={e => setForm({ ...form, test_name: e.target.value })} placeholder="e.g. CBC" />
          </Field>
          <Field label="Report Status">
            <Select value={form.report_status} onChange={e => setForm({ ...form, report_status: e.target.value })}>
              <option>Preliminary</option>
              <option>Final</option>
            </Select>
          </Field>

          {/* Fix: PDF file upload instead of URL text field */}
          <Field label="Report File (PDF only, max 10MB) *">
            <div style={{
              border: "2px dashed #e2e8f0", borderRadius: 8, padding: "16px",
              textAlign: "center", background: "#f8fafc", cursor: "pointer"
            }}
              onClick={() => fileRef.current?.click()}
            >
              {fileName ? (
                <div style={{ color: "#0E6C68", fontWeight: 600 }}>📄 {fileName}</div>
              ) : (
                <div style={{ color: "#94a3b8" }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>📁</div>
                  <div>Click to select PDF file</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>PDF only — max 10MB</div>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,application/pdf"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </div>
          </Field>

          <Field label="Remarks">
            <textarea
              value={form.remarks}
              onChange={e => setForm({ ...form, remarks: e.target.value })}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </Field>
          <ModalFooter
            onClose={() => { setShowModal(false); setForm(emptyForm); setFileName(""); }}
            onSave={handleSave}
            saving={saving}
          />
        </Modal>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Main DiagnosticsPage
// ═════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id: "orders",  label: "Diagnostic Orders" },
  { id: "catalog", label: "Test Catalog"       },
  { id: "centers", label: "Diagnostic Centers" },
  { id: "reports", label: "Reports"            },
];

export default function DiagnosticsPage() {
  const [activeTab, setActiveTab]   = useState("orders");
  const [patients,  setPatients]    = useState([]);
  const [doctors,   setDoctors]     = useState([]);
  const [centers,   setCenters]     = useState([]);
  const [tests,     setTests]       = useState([]);
  const [orders,    setOrders]      = useState([]);  // Fix: shared orders for Reports tab
  const [centersLoading, setCentersLoading] = useState(true);

  const fetchCenters = useCallback(async () => {
    setCentersLoading(true);
    try {
      const data = await apiFetch(`/api/diagnostic_centers_read?clinic_id=${getClinicId()}`);
      setCenters(Array.isArray(data) ? data : []);
    } catch (_) {
      toast("Failed to load diagnostic centers", "error");
    } finally {
      setCentersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCenters();

    apiFetch(`/patient_read?clinic_id=${getClinicId()}`)
      .then(data => setPatients(Array.isArray(data) ? data : []))
      .catch(() => {});

    apiFetch(`/doctorsread`)
      .then(data => setDoctors(Array.isArray(data) ? data : []))
      .catch(() => {});

    apiFetch(`/api/diagnostic_tests_read?clinic_id=${getClinicId()}`)
      .then(data => setTests(Array.isArray(data) ? data : []))
      .catch(() => {});

  }, [fetchCenters]);

  return (
    <>
      <ToastContainer />
      <div style={{
        padding: "24px",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        background: "#f1f5f9",
        minHeight: "100vh"
      }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1e293b" }}>Diagnostic Center</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
            Manage diagnostic orders, test catalog, centers and reports.
          </p>
        </div>

        <div style={{
          display: "flex", gap: 2, background: "#fff", borderRadius: 10,
          padding: 6, marginBottom: 22, width: "fit-content",
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)"
        }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "8px 20px", borderRadius: 7, border: "none", cursor: "pointer",
                fontSize: 14, fontWeight: 600, transition: "all .15s",
                background: activeTab === tab.id ? "#0E6C68" : "transparent",
                color:      activeTab === tab.id ? "#fff"    : "#64748b",
              }}
            >{tab.label}</button>
          ))}
        </div>

        <div>
          {activeTab === "orders" && (
            <DiagnosticOrders
              patients={patients}
              doctors={doctors}
              tests={tests}
              centers={centers}
              onOrdersChange={setOrders}   // Fix: keeps parent orders in sync
            />
          )}
          {activeTab === "catalog" && (
            <TestCatalog onTestsChange={setTests} />
          )}
          {activeTab === "centers" && (
            <DiagnosticCenters
              centers={centers}
              fetchCenters={fetchCenters}
              loading={centersLoading}
            />
          )}
          {activeTab === "reports" && (
            <DiagnosticReports
              orders={orders}   // Fix: always up-to-date from parent
            />
          )}
        </div>
      </div>
    </>
  );
}