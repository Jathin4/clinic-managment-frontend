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

const ClinicsPage = () => {
  const [clinics, setClinics] = useState(MOCK_CLINICS);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const blank = { name:"", gst_number:"", phone:"", email:"", address:"", city:"", state:"", pincode:"", subscription_plan:"Starter", is_active:true };
  const [form, setForm] = useState(blank);
  const f = v => clinics.filter(c => c.name.toLowerCase().includes(v.toLowerCase()) || c.city.toLowerCase().includes(v.toLowerCase()));
  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(null),3000); };
  const handleAdd = () => {
    setClinics(p=>[...p,{...form, id:`C00${p.length+1}`, created_at:"2025-03-04"}]);
    setShowModal(false); setForm(blank);
    showToast("Clinic added successfully");
  };
  return (
    <div>
      <PageHeader title="Clinics" subtitle="Manage clinic branches" actions={<Btn onClick={()=>setShowModal(true)}><Icons.Plus/>Add Clinic</Btn>}/>
      <DataTable
        title="Clinic List" subtitle={`${clinics.length} clinics registered`}
        search={search} onSearch={setSearch} searchPlaceholder="Search by name, city…"
        actions={<Btn variant="secondary"><Icons.Download/>Export</Btn>}
        columns={["Clinic Name","GST Number","Phone","Email","City","Subscription Plan","Status","Actions"]}
        rows={f(search).map(c=>(
          <TR key={c.id}>
            <TD><div className="font-semibold text-slate-800">{c.name}</div><div className="text-xs text-slate-400">{c.address}</div></TD>
            <TD mono>{c.gst_number}</TD>
            <TD>{c.phone}</TD>
            <TD>{c.email}</TD>
            <TD>{c.city}, {c.state} — {c.pincode}</TD>
            <TD><span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-100">{c.subscription_plan}</span></TD>
            <TD><Badge status={c.is_active?"Active":"Inactive"}/></TD>
            <TD>
              <div className="flex gap-1">
                <button className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-slate-400"><Icons.Edit/></button>
                <button className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-slate-400"><Icons.Trash/></button>
              </div>
            </TD>
          </TR>
        ))}
      />
      {showModal && (
        <Modal title="Add New Clinic" onClose={()=>setShowModal(false)} wide>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Clinic Name" value={form.name} onChange={v=>setForm({...form,name:v})} placeholder="e.g. Apollo Clinic"/>
            <Input label="GST Number" value={form.gst_number} onChange={v=>setForm({...form,gst_number:v})} placeholder="29AABCC1234F1Z5"/>
            <Input label="Phone" value={form.phone} onChange={v=>setForm({...form,phone:v})} placeholder="Phone number"/>
            <Input label="Email" type="email" value={form.email} onChange={v=>setForm({...form,email:v})} placeholder="email@clinic.com"/>
            <div className="col-span-2"><Input label="Address" value={form.address} onChange={v=>setForm({...form,address:v})} placeholder="Street address"/></div>
            <Input label="City" value={form.city} onChange={v=>setForm({...form,city:v})} placeholder="City"/>
            <Input label="State" value={form.state} onChange={v=>setForm({...form,state:v})} placeholder="State"/>
            <Input label="Pincode" value={form.pincode} onChange={v=>setForm({...form,pincode:v})} placeholder="6-digit pincode"/>
            <Select label="Subscription Plan" value={form.subscription_plan} onChange={v=>setForm({...form,subscription_plan:v})} options={["Starter","Pro","Enterprise"]}/>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Btn variant="secondary" onClick={()=>setShowModal(false)}>Cancel</Btn>
            <Btn onClick={handleAdd} disabled={!form.name}><Icons.Check/>Add Clinic</Btn>
          </div>
        </Modal>
      )}
      {toast && <Toast message={toast} onClose={()=>setToast(null)}/>}
    </div>
  );
};



export default ClinicsPage;
