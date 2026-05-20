import { useState } from 'react';

// PrintSlip.jsx — Billing Slip
// ✅ Usage: <PrintSlip bill={b} patientName="..." />
// Also exports: triggerPrint(bill, patientName, clinicName) for programmatic use

const SLIP_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:#f8fafc;color:#1e293b;display:flex;justify-content:center;padding:20px}
.a4{width:794px;min-height:1123px;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,.15);display:flex;flex-direction:column}
.hdr{background:#0E6C68;color:#fff;padding:14px 24px;display:flex;align-items:center;justify-content:space-between}
.hdr-left{display:flex;align-items:center;gap:12px}
.hdr-left h1{font-size:18px;font-weight:800;letter-spacing:.02em}
.hdr-left p{font-size:9px;opacity:.75;margin-top:2px}
.hdr-right{text-align:right}
.hdr-right .inv{font-size:20px;font-weight:800;letter-spacing:.05em;font-family:monospace}
.hdr-right .lbl{font-size:8px;opacity:.7;text-transform:uppercase;letter-spacing:.1em;margin-top:2px}
.meta{background:#f0fdf9;border-bottom:1px solid #b2dfdb;display:grid;grid-template-columns:repeat(4,1fr)}
.mc{padding:8px 16px;border-right:1px solid #b2dfdb}
.mc:last-child{border-right:none}
.mc span{display:block;font-size:8px;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;margin-bottom:2px}
.mc strong{font-size:12px;font-weight:700;color:#0E6C68}
.patient-section{padding:16px 24px;border-bottom:1px dashed #e2e8f0;display:grid;grid-template-columns:1fr 1fr;gap:8px 40px}
.fi span{display:block;font-size:8px;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;margin-bottom:2px}
.fi strong{font-size:13px;font-weight:600;color:#111}
.bill-section{padding:20px 24px;flex:1}
.section-title{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#0E6C68;border-bottom:2px solid #0E6C68;padding-bottom:6px;margin-bottom:12px}
.bill-table{width:100%;border-collapse:collapse;font-size:13px}
.bill-table th{text-align:left;padding:8px 12px;font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;background:#f8fafc;border-bottom:1px solid #e2e8f0}
.bill-table th:last-child{text-align:right}
.bill-table td{padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#334155;vertical-align:middle}
.bill-table td:last-child{text-align:right;font-weight:600}
.bill-table tr:last-child td{border-bottom:none}
.totals{margin:0 24px 20px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden}
.totals-row{display:flex;justify-content:space-between;align-items:center;padding:9px 16px;font-size:13px;border-bottom:1px solid #f1f5f9}
.totals-row:last-child{border-bottom:none}
.totals-row.grand{background:#0E6C68;color:#fff;font-size:15px;font-weight:800}
.totals-row span:first-child{color:#64748b}
.totals-row.grand span{color:#fff}
.totals-row span:last-child{font-weight:700}
.pay-section{margin:0 24px 20px;display:flex;align-items:center;gap:10px}
.pay-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:999px;font-size:12px;font-weight:700;}
.bottom-row{margin:0 24px 20px;display:flex;justify-content:space-between;align-items:flex-end;gap:24px}
.notes-box{flex:1;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px}
.notes-box .lbl{font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;margin-bottom:8px}
.note-line{border-bottom:1px solid #e2e8f0;height:22px;margin-bottom:4px}
.sig-box{text-align:center;min-width:180px}
.sig-line{border-bottom:2px solid #334155;height:50px;width:180px}
.sig-lbl{font-size:8.5px;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-top:4px}
.ftr{background:#0E6C68;color:#fff;padding:8px 24px;display:flex;justify-content:space-between;font-size:9px;margin-top:auto}
.ftr strong{font-weight:700}
.words-row{margin:0 24px 16px;padding:8px 14px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;font-size:11px;color:#92400e}
.words-row span{font-weight:700}
@media print{
  @page{margin:0;size:A4 portrait}
  html,body{margin:0;padding:0;background:white;width:100%;height:100%}
  body{display:block;padding:0}
  .a4{box-shadow:none;width:100%;min-height:100vh;margin:0}
}
`;

// ─── Number to words (Indian system) ─────────────────────────────────────────
const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const toWords = (n) => {
  n = Math.round(n);
  if (n === 0) return 'Zero';
  if (n < 0) return 'Minus ' + toWords(-n);
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + toWords(n % 100) : '');
  if (n < 100000) return toWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + toWords(n % 1000) : '');
  if (n < 10000000) return toWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + toWords(n % 100000) : '');
  return toWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + toWords(n % 10000000) : '');
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = v => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d) ? v : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const mc = (label, value) => `<div class="mc"><span>${label}</span><strong>${value}</strong></div>`;
const fi = (label, value) => `<div class="fi"><span>${label}</span><strong>${value}</strong></div>`;

// ─── Core print logic — shared by button click AND programmatic trigger ────────
const buildAndPrint = (bill, patientName, items = []) => {
  const session = JSON.parse(sessionStorage.getItem('user'));
  const clinicName = session?.clinic_name || 'Clinic Management';
  const now = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const billDate = fmtDate(bill?.created_date || bill?.created_at || bill?.date || bill?.sale_date);
  const invoiceNo = bill?.invoice_number || bill?.sale_invoice_no || bill?.sale_invoice_number || '—';
  const subtotal = Number(bill?.subtotal || 0);
  const gstAmt = Number(bill?.gst_amount || 0);
  const discAmt = Number(bill?.discount || bill?.discount_amount || 0);
  const totalAmt = Number(bill?.total_amount || 0);
  const gstPct = bill?.gst_percent != null ? `${bill.gst_percent}%` : '';
  const discPct = (bill?.discount_percent || bill?.discount_percent) != null ? `${bill.discount_percent || bill.discount_percent}%` : '';
  const payMode = bill?.payment_mode || 'Cash';
  const complaint = bill?.chief_complaint || '—';
  const ptId = bill?.patient_id || '—';
  const amtWords = toWords(totalAmt) + ' Rupees Only';

  const isPharmacy = invoiceNo.startsWith('SALEC') || invoiceNo.startsWith('SALEN');
  const isInventory = invoiceNo.startsWith('TXN');
  const isDCF = !isPharmacy && !isInventory && (
    invoiceNo.startsWith('INV') ||
    bill?.doctor_name ||
    bill?.slot_time ||
    complaint.toLowerCase().includes('consultation')
  );

  const payBadgeStyle =
    payMode === 'Cash' ? 'background:#dcfce7;color:#16a34a;border:1px solid #bbf7d0' :
      payMode === 'Card' ? 'background:#dbeafe;color:#1d4ed8;border:1px solid #bfdbfe' :
        payMode === 'UPI' ? 'background:#ede9fe;color:#6d28d9;border:1px solid #ddd6fe' :
          'background:#f1f5f9;color:#475569;border:1px solid #e2e8f0';

  let headerIcon = `
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="background:rgba(255,255,255,.15);border-radius:50%;padding:8px;flex-shrink:0">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>`;

  if (isPharmacy || isInventory) {
    headerIcon = `
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="background:rgba(255,255,255,.15);border-radius:50%;padding:8px;flex-shrink:0">
        <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
      </svg>`;
  }

  const typeLabel = isPharmacy ? 'Medicine Sale Receipt' : isDCF ? 'Doctor Fee Receipt' : isInventory ? 'Inventory Receipt' : 'Tax Invoice';
  const invLabel = isPharmacy ? 'Sale Invoice #' : isDCF ? 'Receipt Number' : 'Invoice Number';

  const tableHeader = (isPharmacy || isInventory) ? `
    <tr>
      <th style="width:40px">#</th>
      <th>Item Description</th>
      <th>Expiry</th>
      <th style="text-align:right">Qty</th>
      <th style="text-align:right">Unit Price</th>
      <th style="text-align:right">Total</th>
    </tr>` : `
    <tr>
      <th style="width:40px">#</th>
      <th>Description</th>
      <th style="text-align:right">Amount (₹)</th>
    </tr>`;

  const itemRows = (items && items.length > 0) ? items.map((item, i) => `
    <tr>
      <td style="color:#94a3b8">${String(i + 1).padStart(2, '0')}</td>
      <td>
        <div style="font-weight:600;color:#0f172a">${item.medicine_name || item.name || '—'}</div>
        ${item.dosage && item.dosage !== '—' ? `<div style="font-size:11px;color:#94a3b8;margin-top:2px">${item.dosage}</div>` : ''}
      </td>
      ${(isPharmacy || isInventory) ? `
      <td>
        <span class="pill ${item.expiry_date && new Date(item.expiry_date) < new Date() ? 'exp-warn' : ''}">
          ${fmtDate(item.expiry_date || item.expiry)}
        </span>
      </td>
      <td style="text-align:right">${item.quantity || item.sell_qty || 0}</td>
      <td style="text-align:right">₹${Number(item.sale_price || item.salePrice || 0).toLocaleString('en-IN')}</td>
      ` : ''}
      <td style="text-align:right">₹${Number(item.total_amount || item.total || 0).toLocaleString('en-IN')}</td>
    </tr>
  `).join('') : `
    <tr>
      <td style="color:#94a3b8">01</td>
      <td>
        <div style="font-weight:600;color:#0f172a">${isPharmacy ? 'Pharmacy Items' : isDCF ? 'Doctor Consultation' : 'Consultation / Medical Services'}</div>
        ${complaint !== '—' ? `<div style="font-size:11px;color:#94a3b8;margin-top:2px">${complaint}</div>` : ''}
      </td>
      ${(isPharmacy || isInventory) ? `<td>—</td><td style="text-align:right">—</td><td style="text-align:right">—</td>` : ''}
      <td style="text-align:right">₹${subtotal.toLocaleString('en-IN')}</td>
    </tr>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${typeLabel} — ${invoiceNo}</title>
  <style>${SLIP_CSS}</style>
</head>
<body>
<div class="a4">

  <!-- Header -->
  <div class="hdr">
    <div class="hdr-left">
      ${headerIcon}
      <div>
        <h1>${clinicName.toUpperCase()}</h1>
        <p>${typeLabel} · Generated: ${now}</p>
      </div>
    </div>
    <div class="hdr-right">
      <div class="inv">${invoiceNo}</div>
      <div class="lbl">${invLabel}</div>
    </div>
  </div>

  <!-- Meta strip -->
  <div class="meta">
    ${mc('Patient ID', ptId)}
    ${mc(isPharmacy ? 'Sale Date' : 'Bill Date', billDate)}
    ${mc('Payment Mode', payMode)}
    ${mc('Status', 'Paid')}
  </div>

  <!-- Patient Info -->
  <div class="patient-section">
    ${fi(isPharmacy ? 'Patient' : 'Bill To (Patient)', patientName || '—')}
    ${isDCF ? fi('Doctor', bill?.doctor_name || '—') : fi('Chief Complaint', complaint)}
  </div>

  ${isDCF ? `
  <!-- DCF Extra Meta -->
  <div class="meta" style="border-top:1px dashed #b2dfdb; border-bottom:1px dashed #b2dfdb; background:#f0fdfa">
    ${mc('Visit Time', bill?.slot_time || '—')}
    ${mc('Consultation Type', 'Regular')}
    ${mc('Reference', '—')}
    ${mc('Department', 'General')}
  </div>
  ` : ''}

  <!-- Bill Table -->
  <div class="bill-section">
    <div class="section-title">${(isPharmacy || isInventory) ? 'Medicines Dispensed' : 'Billing Details'}</div>
    <table class="bill-table">
      <thead>${tableHeader}</thead>
      <tbody>${itemRows}</tbody>
    </table>
  </div>

  <!-- Totals -->
  <div class="totals">
    <div class="totals-row">
      <span>Subtotal</span>
      <span>₹${subtotal.toLocaleString('en-IN')}</span>
    </div>
    <div class="totals-row">
      <span>GST ${gstPct ? `(${gstPct})` : ''}</span>
      <span style="color:${gstAmt > 0 ? '#b45309' : '#94a3b8'}">
        ${gstAmt > 0 ? `+ ₹${gstAmt.toLocaleString('en-IN')}` : '₹0'}
      </span>
    </div>
    <div class="totals-row">
      <span>Discount ${discPct ? `(${discPct})` : ''}</span>
      <span style="color:${discAmt > 0 ? '#16a34a' : '#94a3b8'}">
        ${discAmt > 0 ? `- ₹${discAmt.toLocaleString('en-IN')}` : '₹0'}
      </span>
    </div>
    <div class="totals-row grand">
      <span>Total Amount</span>
      <span>₹${totalAmt.toLocaleString('en-IN')}</span>
    </div>
  </div>

  <!-- Amount in words -->
  <div class="words-row">
    Amount in words: <span>${amtWords}</span>
  </div>

  <!-- Payment Mode -->
  <div class="pay-section">
    <span style="font-size:11px;color:#64748b;font-weight:600">${isPharmacy ? 'Medicines Dispensed By:' : 'Payment Received Via:'}</span>
    <span class="pay-badge" style="${payBadgeStyle}">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      ${(isPharmacy || isInventory) ? clinicName : payMode}
    </span>
  </div>

  <!-- Notes & Signature -->
  <div class="bottom-row">
    <div class="notes-box">
      <div class="lbl">Notes / Remarks</div>
      <div class="note-line"></div>
      <div class="note-line"></div>
      <div class="note-line"></div>
    </div>
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-lbl">${(isPharmacy || isInventory) ? 'Pharmacist / Authorized Signature' : 'Authorized Signature & Stamp'}</div>
    </div>
  </div>

  <!-- Footer -->
  <div class="ftr">
    <span>Thank you for choosing ${clinicName} · Please retain this ${isPharmacy ? 'receipt' : 'invoice'} for your records</span>
    <strong>This is a computer-generated ${isPharmacy ? 'receipt' : 'invoice'}</strong>
  </div>

</div>
<script>window.onload = () => window.print(); window.onafterprint = () => window.close();</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) { alert('Please allow popups to print the slip.'); return; }
  win.document.write(html);
  win.document.close();
};

// ─── Named export — call this from BillingPage after invoice creation ─────────
export const triggerPrint = (bill, patientName, items = []) => buildAndPrint(bill, patientName, items);

const PrintSlip = ({ bill, patientName, items = [] }) => {
  const [loading, setLoading] = useState(false);
  const handlePrint = async () => {
    if (items && items.length > 0) {
      buildAndPrint(bill, patientName, items);
      return;
    }

    const invoiceNo = bill?.invoice_number || '—';
    const isPharmacy = invoiceNo.startsWith('SALEC') || invoiceNo.startsWith('SALEN');

    if (isPharmacy) {
      setLoading(true);
      try {
        const API = process.env.REACT_APP_API_BASE_URL;
        const clinicId = bill.clinic_id;

        // 1. Get all sales to find sale_id
        const salesRes = await fetch(`${API}/pharmacy_sales_read?clinic_id=${clinicId}`);
        const sales = await salesRes.json();
        const sale = sales.find(s => s.sale_invoice_no === invoiceNo);

        if (sale) {
          // 2. Get sale items
          const itemsRes = await fetch(`${API}/pharmacy_sale_items_read?sale_id=${sale.sale_id}&clinic_id=${clinicId}`);
          const fetchedItems = await itemsRes.json();
          buildAndPrint(bill, patientName, Array.isArray(fetchedItems) ? fetchedItems : []);
        } else {
          buildAndPrint(bill, patientName);
        }
      } catch (e) {
        console.error("Print fetch failed", e);
        buildAndPrint(bill, patientName);
      } finally {
        setLoading(false);
      }
    } else {
      buildAndPrint(bill, patientName);
    }
  };

  return (
    <button onClick={handlePrint} disabled={loading} className={loading ? "animate-pulse" : ""}>
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <polyline points="6 9 6 2 18 2 18 9" strokeLinecap="round" strokeLinejoin="round" />
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" rx="1"
          strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
};

export default PrintSlip;
