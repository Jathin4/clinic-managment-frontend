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

const PatientsPage = () => {
  const [patients, setPatients] = useState(MOCK_PATIENTS);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [viewPatient, setViewPatient] = useState(null);
  const [toast, setToast] = useState(null);
  const blank = { first_name:"", last_name:"", gender:"Male", dob:"", phone:"", email:"", address:"", blood_group:"O+", doctor_id:"U001", clinic_id:"C001" };
  const [form, setForm] = useState(blank);
  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),3000); };
  const f = v => patients.filter(p =>
    ptName(p).toLowerCase().includes(v.toLowerCase()) ||
    p.uhid.toLowerCase().includes(v.toLowerCase()) ||
    p.phone.includes(v) ||
    p.blood_group.toLowerCase().includes(v.toLowerCase())
  );
  const handleAdd = () => {
    const n = patients.length+1;
    setPatients(p=>[...p,{...form, id:`P00${n}`, uhid:`HF-2025-00${n}`, is_deleted:false, created_at:"2025-03-04"}]);
    setShowModal(false); setForm(blank);
    showToast("Patient registered successfully");
  };
  if (viewPatient) return <PatientProfile patient={viewPatient} onBack={()=>setViewPatient(null)}/>;
  return (
    <div>
      <PageHeader title="Patients" subtitle="Manage patient records" actions={<Btn onClick={()=>setShowModal(true)}><Icons.Plus/>Add Patient</Btn>}/>
      <DataTable
        title="Patient List" subtitle={`${patients.length} patients registered`}
        search={search} onSearch={setSearch} searchPlaceholder="Search by UHID, name, phone…"
        actions={<Btn variant="secondary"><Icons.Download/>Export</Btn>}
        columns={["UHID","Patient Name","Gender","Contact","Blood Group","Registered","Actions"]}
        rows={f(search).map(p=>(
          <TR key={p.id}>
            <TD mono bold>{p.uhid}</TD>
            <TD>
              <div className="font-semibold text-slate-800">{ptName(p)}</div>
            </TD>
            <TD>{p.gender}</TD>
            <TD>
              <div className="flex flex-col gap-0.5">
                <span className="flex items-center gap-1.5 text-slate-600"><span className="text-slate-400">📞</span>{p.phone}</span>
                {p.email && <span className="flex items-center gap-1.5 text-slate-400 text-xs"><span>✉</span>{p.email}</span>}
              </div>
            </TD>
            <TD>
              <span className="px-2 py-0.5 rounded-md text-xs font-bold border" style={{background:"#f0fdf4",color:"#166534",borderColor:"#bbf7d0"}}>{p.blood_group}</span>
            </TD>
            <TD muted>{p.created_at}</TD>
            <TD>
              <div className="flex gap-1">
                <button onClick={()=>setViewPatient(p)} className="p-1.5 hover:bg-teal-50 hover:text-teal-700 rounded-lg transition-colors text-slate-400"><Icons.Eye/></button>
                <button className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-slate-400"><Icons.Edit/></button>
                <button onClick={()=>{setPatients(p=>p.filter(x=>x.id!==p.id));showToast("Patient deleted","error");}} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-slate-400"><Icons.Trash/></button>
              </div>
            </TD>
          </TR>
        ))}
      />
      {showModal && (
        <Modal title="Register New Patient" onClose={()=>setShowModal(false)} wide>
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" value={form.first_name} onChange={v=>setForm({...form,first_name:v})} placeholder="First name" required/>
            <Input label="Last Name"  value={form.last_name}  onChange={v=>setForm({...form,last_name:v})}  placeholder="Last name"/>
            <Select label="Gender" value={form.gender} onChange={v=>setForm({...form,gender:v})} options={["Male","Female","Other"]}/>
            <Input label="Date of Birth" type="date" value={form.dob} onChange={v=>setForm({...form,dob:v})}/>
            <Input label="Phone" value={form.phone} onChange={v=>setForm({...form,phone:v})} placeholder="10-digit number"/>
            <Input label="Email" type="email" value={form.email} onChange={v=>setForm({...form,email:v})} placeholder="email@example.com"/>
            <Select label="Blood Group" value={form.blood_group} onChange={v=>setForm({...form,blood_group:v})} options={["A+","A-","B+","B-","O+","O-","AB+","AB-"]}/>
            <Select label="Assigned Doctor" value={form.doctor_id} onChange={v=>setForm({...form,doctor_id:v})} options={MOCK_USERS.filter(u=>u.role==="Doctor").map(u=>({value:u.id,label:u.full_name}))}/>
            <div className="col-span-2"><Input label="Address" value={form.address} onChange={v=>setForm({...form,address:v})} placeholder="Full address"/></div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Btn variant="secondary" onClick={()=>setShowModal(false)}>Cancel</Btn>
            <Btn onClick={handleAdd} disabled={!form.first_name}><Icons.Check/>Register Patient</Btn>
          </div>
        </Modal>
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
    </div>
  );
};

// Patient Profile (unchanged but updated field names)
const PatientProfile = ({ patient, onBack }) => {
  const [tab, setTab] = useState("overview");
  const tabs = ["overview","appointments","encounters","bills","payments"];
  const patApts = MOCK_APPOINTMENTS.filter(a=>a.patient_id===patient.id);
  const patBills = MOCK_BILLS.filter(b=>b.patient_id===patient.id);
  const patEncs = MOCK_ENCOUNTERS.filter(e=>e.patient_id===patient.id);
  const patPays = patBills.flatMap(b=>MOCK_PAYMENTS.filter(p=>p.bill_id===b.id));
  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-teal-700 mb-4 transition-colors"><Icons.ChevronLeft/>Back to Patients</button>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold" style={{background:"linear-gradient(135deg,#0E6C68,#14A3A0)"}}>
            {patient.first_name[0]}{patient.last_name?.[0]||""}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-slate-800">{ptName(patient)}</h2>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
            </div>
            <div className="text-sm text-slate-500 mb-3">{patient.uhid} • {patient.gender} • DOB: {patient.dob}</div>
            <div className="flex flex-wrap gap-4 text-sm">
              {[["Phone",patient.phone],["Email",patient.email],["Blood Group",patient.blood_group],["Doctor",doctorName(patient.doctor_id)]].map(([l,v])=>(
                <div key={l}><span className="text-slate-400">{l}: </span><span className="font-medium text-slate-700">{v}</span></div>
              ))}
            </div>
          </div>
          <Btn><Icons.Edit/>Edit</Btn>
        </div>
      </div>
      <div className="flex gap-1 mb-4 bg-white rounded-xl p-1 border border-gray-100 w-fit shadow-sm">
        {tabs.map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all ${tab===t?"text-white shadow-sm":"text-slate-500 hover:text-slate-700"}`} style={tab===t?{background:"#0E6C68"}:{}}>{t}</button>
        ))}
      </div>
      {tab==="overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="font-bold text-slate-800 mb-4">Personal Information</div>
            {[["UHID",patient.uhid],["Full Name",ptName(patient)],["Gender",patient.gender],["Date of Birth",patient.dob],["Phone",patient.phone],["Email",patient.email],["Address",patient.address],["Blood Group",patient.blood_group],["Assigned Doctor",doctorName(patient.doctor_id)]].map(([l,v])=>(
              <div key={l} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-slate-500">{l}</span>
                <span className="text-sm font-medium text-slate-700">{v}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="font-bold text-slate-800 mb-4">Medical History Timeline</div>
            {[{date:patient.created_at,event:"Registration",note:"Patient registered in system"},{date:"2025-02-01",event:"Encounter",note:"Routine consultation"},{date:"2024-12-10",event:"Prescription",note:"Medicines prescribed"},{date:"2024-10-05",event:"Lab Test",note:"CBC & Lipid Profile"}].map((e,i)=>(
              <div key={i} className="flex gap-3 mb-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full mt-1.5" style={{background:"#0E6C68"}}></div>
                  {i<3&&<div className="w-0.5 h-8 bg-gray-200 mt-1"></div>}
                </div>
                <div><div className="text-sm font-semibold text-slate-700">{e.event}</div><div className="text-xs text-slate-400">{e.date}</div><div className="text-sm text-slate-500 mt-0.5">{e.note}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab==="appointments" && (
        <DataTable title={`Appointments (${patApts.length})`} columns={["Date","Time","Doctor","Token","Notes","Status"]}
          rows={patApts.map(a=>(
            <TR key={a.id}>
              <TD>{a.appointment_date}</TD><TD>{a.slot_time}</TD><TD>{doctorName(a.doctor_id)}</TD>
              <TD bold>#{a.token_number}</TD><TD muted>{a.notes}</TD><TD><Badge status={a.status}/></TD>
            </TR>
          ))} empty="No appointments found"
        />
      )}
      {tab==="encounters" && (
        <DataTable title={`Encounters (${patEncs.length})`} columns={["Date","Doctor","Chief Complaint","Notes","Follow-up"]}
          rows={patEncs.map(e=>(
            <TR key={e.id}>
              <TD>{e.visit_date}</TD><TD>{doctorName(e.doctor_id)}</TD>
              <TD bold>{e.chief_complaint}</TD><TD muted>{e.notes}</TD><TD>{e.follow_up_date}</TD>
            </TR>
          ))} empty="No encounters found"
        />
      )}
      {tab==="bills" && (
        <DataTable title={`Bills (${patBills.length})`} columns={["Invoice #","Date","Subtotal","GST","Discount","Total","Status"]}
          rows={patBills.map(b=>(
            <TR key={b.id}>
              <TD mono bold>{b.invoice_number}</TD><TD>{b.created_at}</TD>
              <TD>₹{b.subtotal}</TD><TD>₹{b.gst_amount}</TD><TD>₹{b.discount}</TD>
              <TD bold>₹{b.total_amount.toLocaleString()}</TD><TD><Badge status={b.status}/></TD>
            </TR>
          ))} empty="No bills found"
        />
      )}
      {tab==="payments" && (
        <DataTable title={`Payments (${patPays.length})`} columns={["Payment ID","Bill","Mode","Reference","Amount","Date"]}
          rows={patPays.map(p=>(
            <TR key={p.id}>
              <TD mono>{p.id}</TD><TD mono>{p.bill_id}</TD>
              <TD><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${p.payment_mode==="Cash"?"bg-green-50 text-green-700":p.payment_mode==="Card"?"bg-blue-50 text-blue-700":"bg-purple-50 text-purple-700"}`}>{p.payment_mode}</span></TD>
              <TD muted>{p.transaction_reference}</TD>
              <TD bold>₹{p.amount_paid.toLocaleString()}</TD><TD>{p.payment_date}</TD>
            </TR>
          ))} empty="No payments found"
        />
      )}
    </div>
  );
};



export default PatientsPage;
