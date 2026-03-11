import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  MOCK_CLINICS, MOCK_USERS, MOCK_PATIENTS, MOCK_APPOINTMENTS,
  MOCK_ENCOUNTERS, MOCK_DIAGNOSES, MOCK_PRESCRIPTIONS, MOCK_BILLS,
  MOCK_PAYMENTS, MOCK_MEDICINES, MOCK_AUDIT_LOGS,
  REVENUE_DATA, DOCTOR_APPOINTMENTS, PAYMENT_MODES, PATIENT_GROWTH,
  ptName, doctorName
} from '../data/mockData';
import Icons from '../components/Icons';
import { Badge, StatCard, Modal, Btn, Input, Select, Toast, PageHeader, DataTable, TR, TD } from '../components/UI';
import { LineChart, BarChart, DonutChart, AreaChart } from '../components/Charts';

const PaymentsPage = () => {
  const [pays, setPays] = useState(MOCK_PAYMENTS);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const blank = { bill_id:"", payment_mode:"Cash", transaction_reference:"", amount_paid:"" };
  const [form, setForm] = useState(blank);
  const f = v => pays.filter(p => {
    const bill=MOCK_BILLS.find(b=>b.id===p.bill_id);
    const pat=bill?MOCK_PATIENTS.find(pt=>pt.id===bill.patient_id):null;
    return (pat?ptName(pat):"").toLowerCase().includes(v.toLowerCase()) || p.payment_mode.toLowerCase().includes(v.toLowerCase()) || p.bill_id.toLowerCase().includes(v.toLowerCase());
  });
  const handleAdd = () => {
    setPays(p=>[...p,{...form,id:`PAY00${p.length+1}`,amount_paid:Number(form.amount_paid),payment_date:"2025-03-04 10:00"}]);
    setShowModal(false); setForm(blank);
  };
  const modeStyle = m => ({Cash:"bg-green-50 text-green-700",Card:"bg-blue-50 text-blue-700",UPI:"bg-purple-50 text-purple-700"}[m]||"bg-gray-100");
  return (
    <div>
      <PageHeader title="Payments" subtitle="Payment records and history" actions={<Btn onClick={()=>setShowModal(true)}><Icons.Plus/>Record Payment</Btn>}/>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Collected" value={`₹${pays.reduce((s,p)=>s+p.amount_paid,0).toLocaleString()}`} change="+8%" icon={Icons.DollarSign} bgColor="#DCFCE7"/>
        <StatCard title="Cash Payments"   value={`₹${pays.filter(p=>p.payment_mode==="Cash").reduce((s,p)=>s+p.amount_paid,0).toLocaleString()}`}  change="" icon={Icons.Check} bgColor="#F0FDF4"/>
        <StatCard title="Digital Payments"value={`₹${pays.filter(p=>p.payment_mode!=="Cash").reduce((s,p)=>s+p.amount_paid,0).toLocaleString()}`} change="" icon={Icons.Payment} bgColor="#EDE9FE"/>
      </div>
      <DataTable
        title="Payment History" subtitle={`${pays.length} transactions`}
        search={search} onSearch={setSearch} searchPlaceholder="Search patient, mode, bill…"
        actions={<Btn variant="secondary"><Icons.Download/>Export</Btn>}
        columns={["Payment ID","Bill","Patient","Payment Mode","Transaction Ref","Amount Paid","Payment Date"]}
        rows={f(search).map(p=>{
          const bill=MOCK_BILLS.find(b=>b.id===p.bill_id);
          const pat=bill?MOCK_PATIENTS.find(pt=>pt.id===bill.patient_id):null;
          return (
            <TR key={p.id}>
              <TD mono bold>{p.id}</TD>
              <TD mono>{p.bill_id}</TD>
              <TD>{pat?ptName(pat):"—"}</TD>
              <TD><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${modeStyle(p.payment_mode)}`}>{p.payment_mode}</span></TD>
              <TD mono muted>{p.transaction_reference}</TD>
              <TD bold>₹{p.amount_paid.toLocaleString()}</TD>
              <TD>{p.payment_date}</TD>
            </TR>
          );
        })}
      />
      {showModal && (
        <Modal title="Record Payment" onClose={()=>setShowModal(false)}>
          <div className="space-y-4">
            <Select label="Bill / Invoice" value={form.bill_id} onChange={v=>setForm({...form,bill_id:v})} options={MOCK_BILLS.filter(b=>b.status!=="Paid").map(b=>({value:b.id,label:`${b.invoice_number} — ₹${b.total_amount}`}))}/>
            <Input label="Amount Paid (₹)" type="number" value={form.amount_paid} onChange={v=>setForm({...form,amount_paid:v})} placeholder="Enter amount"/>
            <Select label="Payment Mode" value={form.payment_mode} onChange={v=>setForm({...form,payment_mode:v})} options={["Cash","Card","UPI"]}/>
            <Input label="Transaction Reference" value={form.transaction_reference} onChange={v=>setForm({...form,transaction_reference:v})} placeholder="UPI / card reference (optional)"/>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Btn variant="secondary" onClick={()=>setShowModal(false)}>Cancel</Btn>
            <Btn onClick={handleAdd} disabled={!form.bill_id||!form.amount_paid}><Icons.Check/>Record Payment</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};



export default PaymentsPage;
