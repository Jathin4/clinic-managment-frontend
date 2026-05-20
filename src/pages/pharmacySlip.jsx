// pharmacySlip.jsx — Inventory Sale Receipt (Batch No. Removed)

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
.bill-table th.r{text-align:right}
.bill-table td{padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#334155;vertical-align:middle}
.bill-table td.r{text-align:right;font-weight:600}
.bill-table tr:last-child td{border-bottom:none}
.pill{display:inline-block;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:600;background:#f0fdf9;color:#0E6C68;border:1px solid #b2dfdb}
.exp-warn{background:#fef2f2;color:#dc2626;border-color:#fecaca}
.totals{margin:0 24px 20px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden}
.totals-row{display:flex;justify-content:space-between;align-items:center;padding:9px 16px;font-size:13px;border-bottom:1px solid #f1f5f9}
.totals-row:last-child{border-bottom:none}
.totals-row.grand{background:#0E6C68;color:#fff;font-size:15px;font-weight:800}
.totals-row span:first-child{color:#64748b}
.totals-row.grand span{color:#fff}
.totals-row span:last-child{font-weight:700}
.pay-section{margin:0 24px 20px;display:flex;align-items:center;gap:10px}
.pay-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:999px;font-size:12px;font-weight:700}
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

// Number to words (Indian system)
const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

const toWords = (n) => {
  n = Math.round(n);
  if (n === 0) return 'Zero';
  if (n < 0) return 'Minus ' + toWords(-n);
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' ' + ones[n%10] : '');
  if (n < 1000) return ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' ' + toWords(n%100) : '');
  if (n < 100000) return toWords(Math.floor(n/1000)) + ' Thousand' + (n%1000 ? ' ' + toWords(n%1000) : '');
  if (n < 10000000) return toWords(Math.floor(n/100000)) + ' Lakh' + (n%100000 ? ' ' + toWords(n%100000) : '');
  return toWords(Math.floor(n/10000000)) + ' Crore' + (n%10000000 ? ' ' + toWords(n%10000000) : '');
};

const fmtDate = v => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d) ? v : d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
};

const mc = (label, value) => `<div class="mc"><span>${label}</span><strong>${value}</strong></div>`;
const fi = (label, value) => `<div class="fi"><span>${label}</span><strong>${value}</strong></div>`;

// Normalise function - Batch removed
const normalise = (raw) => {
  if (Array.isArray(raw.items)) {
    return {
      invoiceNo:   raw.sale_invoice_number || raw.invoice_number || '—',
      patientName: raw.patient_name || '—',
      complaint:   raw.chief_complaint || '—',
      date:        raw.date || new Date().toISOString(),
      items: raw.items.map((s, i) => ({
        no:        i + 1,
        name:      s.medicine_name || '—',
        dosage:    s.dosage || '—',
        expiry:    s.expiry_date || '',
        qty:       Number(s.sell_qty || s.quantity || 0),
        unit:      s.qty_unit || '',
        unitPrice: Number(s.salePrice || s.sale_price || 0),
        total:     Number(s.sell_qty || s.quantity || 0) * Number(s.salePrice || s.sale_price || 0),
      })),
    };
  }
  // Single transaction fallback
  return {
    invoiceNo:   raw.sale_invoice_number || `TXN-${raw.transaction_id || '—'}`,
    patientName: raw.patient_name || '—',
    complaint:   raw.chief_complaint || '—',
    date:        raw.transaction_date || raw.created_at || new Date().toISOString(),
    items: [{
      no:        1,
      name:      raw.medicine_name || raw.category_name || '—',
      dosage:    raw.dosage || '—',
      expiry:    raw.expiry_date || '',
      qty:       Number(raw.quantity || 0),
      unit:      '',
      unitPrice: Number(raw.sale_price || 0),
      total:     Number(raw.quantity || 0) * Number(raw.sale_price || 0),
    }],
  };
};

const buildAndPrint = (raw) => {
  const session = JSON.parse(sessionStorage.getItem('user'));
  const clinicName = session?.clinic_name || 'Clinic Management';
  const sd = normalise(raw);
  const grandTotal = sd.items.reduce((s, i) => s + i.total, 0);
  const amtWords = toWords(Math.round(grandTotal)) + ' Rupees Only';
  const now = new Date().toLocaleDateString('en-IN', {
    day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit',
  });

  const itemRows = sd.items.map(item => `
    <tr>
      <td style="color:#94a3b8">${String(item.no).padStart(2,'0')}</td>
      <td>
        <div style="font-weight:600;color:#0f172a">${item.name}</div>
        ${item.dosage && item.dosage !== '—' ? `<div style="font-size:11px;color:#94a3b8;margin-top:2px">${item.dosage}</div>` : ''}
      </td>
      <td>
        <span class="pill ${item.expiry && new Date(item.expiry) < new Date() ? 'exp-warn' : ''}">
          ${fmtDate(item.expiry)}
        </span>
      </td>
      <td class="r">${item.qty}${item.unit ? ' ' + item.unit : ''}</td>
      <td class="r">₹${item.unitPrice.toLocaleString('en-IN')}</td>
      <td class="r">₹${item.total.toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Sale Receipt — ${sd.invoiceNo}</title>
  <style>${SLIP_CSS}</style>
</head>
<body>
<div class="a4">
  <div class="hdr">
    <div class="hdr-left">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="background:rgba(255,255,255,.15);border-radius:50%;padding:8px;flex-shrink:0">
        <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
      </svg>
      <div>
        <h1>${clinicName.toUpperCase()}</h1>
        <p>Medicine Sale Receipt · Generated: ${now}</p>
      </div>
    </div>
    <div class="hdr-right">
      <div class="inv">${sd.invoiceNo}</div>
      <div class="lbl">Sale Invoice #</div>
    </div>
  </div>

  <div class="meta">
    ${mc('Sale Date', fmtDate(sd.date))}
    ${mc('Items', String(sd.items.length))}
    ${mc('Status', 'Dispensed')}
    ${mc('Type', 'Medicine Sale')}
  </div>

  <div class="patient-section">
    ${fi('Patient', sd.patientName)}
    ${fi('Chief Complaint', sd.complaint)}
  </div>

  <div class="bill-section">
    <div class="section-title">Medicines Dispensed</div>
    <table class="bill-table">
      <thead>
        <tr>
          <th style="width:36px">#</th>
          <th>Medicine</th>
          <th>Expiry</th>
          <th class="r">Qty</th>
          <th class="r">Unit Price</th>
          <th class="r">Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
  </div>

  <div class="totals">
    <div class="totals-row">
      <span>Items</span>
      <span>${sd.items.length} medicine(s)</span>
    </div>
    <div class="totals-row grand">
      <span>Grand Total</span>
      <span>₹${grandTotal.toLocaleString('en-IN')}</span>
    </div>
  </div>

  <div class="words-row">Amount in words: <span>${amtWords}</span></div>

  <div class="pay-section">
    <span style="font-size:11px;color:#64748b;font-weight:600">Medicines Dispensed By:</span>
    <span class="pay-badge" style="background:#f0fdf9;color:#0E6C68;border:1px solid #b2dfdb">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      ${clinicName}
    </span>
  </div>

  <div class="bottom-row">
    <div class="notes-box">
      <div class="lbl">Notes / Remarks</div>
      <div class="note-line"></div>
      <div class="note-line"></div>
      <div class="note-line"></div>
    </div>
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-lbl">Pharmacist / Authorized Signature</div>
    </div>
  </div>

  <div class="ftr">
    <span>Thank you for choosing ${clinicName} · Please retain this receipt for your records</span>
    <strong>This is a computer-generated receipt</strong>
  </div>
</div>
<script>window.onload = () => window.print(); window.onafterprint = () => window.close();</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) { alert('Please allow popups to print the receipt.'); return; }
  win.document.write(html);
  win.document.close();
};

export const triggerPrint = (saleData) => buildAndPrint(saleData);

const pharmacySlip = ({ transaction }) => (
  <button onClick={() => buildAndPrint(transaction)}>
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polyline points="6 9 6 2 18 2 18 9" strokeLinecap="round" strokeLinejoin="round"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8" rx="1" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </button>
);

export default pharmacySlip;