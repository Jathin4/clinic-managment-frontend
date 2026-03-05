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

const BillingPage = () => {
  const [bills, setBills] = useState(MOCK_BILLS);
  const [search, setSearch] = useState("");
  const [viewBill, setViewBill] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const blank = { patient_id:"", encounter_id:"", subtotal:0, gst_amount:0, discount:0, clinic_id:"C001" };
  const [form, setForm] = useState(blank);
  const f = v => bills.filter(b => {
    const pat=MOCK_PATIENTS.find(p=>p.id===b.patient_id);
    return (pat?ptName(pat):"").toLowerCase().includes(v.toLowerCase()) || b.invoice_number.toLowerCase().includes(v.toLowerCase()) || b.status.toLowerCase().includes(v.toLowerCase());
  });
  const totalPaid    = bills.filter(b=>b.status==="Paid").reduce((s,b)=>s+b.total_amount,0);
  const totalPending = bills.filter(b=>b.status!=="Paid").reduce((s,b)=>s+b.total_amount,0);
  const handleAdd = () => {
    const n=bills.length+1;
    const total = Number(form.subtotal)+Number(form.gst_amount)-Number(form.discount);
    setBills(p=>[...p,{...form,id:`B00${n}`,invoice_number:`INV-2025-00${n}`,total_amount:total,status:"Unpaid",created_at:"2025-03-04"}]);
    setShowModal(false); setForm(blank);
  };
  return (
    <div>
      <PageHeader title="Bills & Invoices" subtitle="Manage billing" actions={<Btn onClick={()=>setShowModal(true)}><Icons.Plus/>New Invoice</Btn>}/>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Invoices"   value={bills.length}                        change="+5 this week"    icon={Icons.Bill}/>
        <StatCard title="Collected"        value={`₹${totalPaid.toLocaleString()}`}    change="+12%"            icon={Icons.Check}         bgColor="#DCFCE7"/>
        <StatCard title="Pending"          value={`₹${totalPending.toLocaleString()}`} change="3 invoices"     icon={Icons.Clock}         bgColor="#FEF3C7" positive={false}/>
        <StatCard title="Partial"          value={bills.filter(b=>b.status==="Partial").length} change="1 invoice" icon={Icons.AlertTriangle} bgColor="#FEE2E2" positive={false}/>
      </div>
      <DataTable
        title="Invoice List" subtitle={`${bills.length} invoices`}
        search={search} onSearch={setSearch} searchPlaceholder="Search patient, invoice #, status…"
        actions={<Btn variant="secondary"><Icons.Download/>Export CSV</Btn>}
        columns={["Invoice #","Patient","Encounter","Date","Subtotal","GST","Discount","Total","Status","Actions"]}
        rows={f(search).map(b=>{
          const pat=MOCK_PATIENTS.find(p=>p.id===b.patient_id);
          return (
            <TR key={b.id}>
              <TD mono bold style={{color:"#0E6C68"}}>{b.invoice_number}</TD>
              <TD bold>{pat?ptName(pat):"—"}</TD>
              <TD mono>{b.encounter_id||"—"}</TD>
              <TD>{b.created_at}</TD>
              <TD>₹{b.subtotal.toLocaleString()}</TD>
              <TD>₹{b.gst_amount}</TD>
              <TD>₹{b.discount}</TD>
              <TD bold>₹{b.total_amount.toLocaleString()}</TD>
              <TD><Badge status={b.status}/></TD>
              <TD>
                <div className="flex gap-1">
                  <button onClick={()=>setViewBill(b)} className="p-1.5 hover:bg-teal-50 hover:text-teal-700 rounded-lg transition-colors text-slate-400"><Icons.Eye/></button>
                  <button className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-slate-400"><Icons.Download/></button>
                </div>
              </TD>
            </TR>
          );
        })}
      />
      {viewBill && (
        <Modal title={`Invoice — ${viewBill.invoice_number}`} onClose={()=>setViewBill(null)} wide>
          <div className="space-y-4">
            <div className="flex justify-between">
              <div>
                <div className="font-bold text-slate-800">{ptName(MOCK_PATIENTS.find(p=>p.id===viewBill.patient_id)||{first_name:"",last_name:""})}</div>
                <div className="text-sm text-slate-400">Date: {viewBill.created_at} • Enc: {viewBill.encounter_id||"—"}</div>
              </div>
              <Badge status={viewBill.status}/>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              {[["Subtotal",viewBill.subtotal],["GST Amount",viewBill.gst_amount],["Discount",-viewBill.discount]].map(([l,v])=>(
                <div key={l} className="flex justify-between text-sm">
                  <span className="text-slate-500">{l}</span>
                  <span className={v<0?"text-green-600 font-medium":"text-slate-700"}>₹{Math.abs(v)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2">
                <span className="text-slate-800">Total Amount</span>
                <span style={{color:"#0E6C68"}}>₹{viewBill.total_amount.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Btn variant="secondary"><Icons.Download/>Download PDF</Btn>
              {viewBill.status!=="Paid"&&<Btn><Icons.Payment/>Record Payment</Btn>}
            </div>
          </div>
        </Modal>
      )}
      {showModal && (
        <Modal title="New Invoice" onClose={()=>setShowModal(false)} wide>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Patient"    value={form.patient_id}   onChange={v=>setForm({...form,patient_id:v})}   options={MOCK_PATIENTS.map(p=>({value:p.id,label:ptName(p)}))}/>
            <Select label="Encounter"  value={form.encounter_id} onChange={v=>setForm({...form,encounter_id:v})} options={[{value:"",label:"None"},...MOCK_ENCOUNTERS.map(e=>({value:e.id,label:`${e.id} — ${e.chief_complaint}`}))]}/>
            <Input label="Subtotal (₹)"   type="number" value={form.subtotal}   onChange={v=>setForm({...form,subtotal:v})}/>
            <Input label="GST Amount (₹)" type="number" value={form.gst_amount} onChange={v=>setForm({...form,gst_amount:v})}/>
            <Input label="Discount (₹)"   type="number" value={form.discount}   onChange={v=>setForm({...form,discount:v})}/>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Btn variant="secondary" onClick={()=>setShowModal(false)}>Cancel</Btn>
            <Btn onClick={handleAdd} disabled={!form.patient_id}><Icons.Check/>Create Invoice</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};



export default BillingPage;
