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
import { Badge, StatCard, Modal, Btn, Input, Select, Toast, PageHeader, DataTable, TR, TD, Pagination } from '../components/UI';
import { LineChart, BarChart, DonutChart, AreaChart } from '../components/Charts';

const AppointmentsPage = () => {
  const [apts, setApts] = useState(MOCK_APPOINTMENTS);
  const [view, setView] = useState("table");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const blank = { patient_id:"", doctor_id:"", appointment_date:"", slot_time:"", notes:"" };
  const [form, setForm] = useState(blank);
  const showToast = msg=>{ setToast(msg); setTimeout(()=>setToast(null),3000); };
  const handleAdd = () => {
    const n = apts.length+1;
    setApts(p=>[...p,{...form, id:`APT00${n}`, clinic_id:"C001", status:"Booked", token_number:apts.filter(a=>a.appointment_date===form.appointment_date).length+1, created_at:"2025-03-04"}]);
    setShowModal(false); setForm(blank);
    showToast("Appointment booked");
  };
  const updateStatus = (id,status) => setApts(a=>a.map(x=>x.id===id?{...x,status}:x));
  const f = v => apts.filter(a => {
    const pn = ptName(MOCK_PATIENTS.find(p=>p.id===a.patient_id)||{first_name:"",last_name:""});
    const dn = doctorName(a.doctor_id);
    return pn.toLowerCase().includes(v.toLowerCase()) || dn.toLowerCase().includes(v.toLowerCase()) || a.status.toLowerCase().includes(v.toLowerCase());
  });
  const statusColor = s => ({Booked:"#3b82f6",CheckedIn:"#8b5cf6",Completed:"#10b981",Cancelled:"#ef4444"}[s]||"#0E6C68");
  return (
    <div>
      <PageHeader title="Appointments" subtitle="Manage appointment slots" actions={
        <div className="flex items-center gap-2">
          <div className="flex bg-white border border-gray-200 rounded-xl p-1">
            {["table","calendar"].map(v=>(
              <button key={v} onClick={()=>setView(v)} className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${view===v?"text-white":"text-slate-500"}`} style={view===v?{background:"#0E6C68"}:{}}>{v}</button>
            ))}
          </div>
          <Btn onClick={()=>setShowModal(true)}><Icons.Plus/>Book Appointment</Btn>
        </div>
      }/>
      {view==="table" ? (
        <>
        <DataTable
          title="Appointment List" subtitle={`${apts.length} total appointments`}
          search={search} onSearch={v=>{setSearch(v);setCurrentPage(1);}} searchPlaceholder="Search patient, doctor, status…"
          columns={["Token","Patient","Doctor","Date","Time","Notes","Status","Actions"]}
          rows={f(search).slice((currentPage-1)*pageSize,currentPage*pageSize).map(a=>{
            const pat = MOCK_PATIENTS.find(p=>p.id===a.patient_id);
            return (
              <TR key={a.id}>
                <TD>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{background:statusColor(a.status)}}>
                    {a.token_number}
                  </div>
                </TD>
                <TD bold>{pat ? ptName(pat) : "—"}</TD>
                <TD>{doctorName(a.doctor_id)}</TD>
                <TD>{a.appointment_date}</TD>
                <TD>{a.slot_time}</TD>
                <TD muted>{a.notes}</TD>
                <TD><Badge status={a.status}/></TD>
                <TD>
                  <div className="flex gap-1">
                    {a.status==="Booked"    && <Btn size="sm" onClick={()=>updateStatus(a.id,"CheckedIn")}>Check In</Btn>}
                    {a.status==="CheckedIn" && <Btn size="sm" onClick={()=>updateStatus(a.id,"Completed")}>Complete</Btn>}
                    {(a.status==="Booked"||a.status==="CheckedIn") && <Btn size="sm" variant="secondary" onClick={()=>updateStatus(a.id,"Cancelled")}>Cancel</Btn>}
                  </div>
                </TD>
              </TR>
            );
          })}
        />
        <Pagination currentPage={currentPage} totalPages={Math.ceil(f(search).length/pageSize)} onPageChange={setCurrentPage} totalItems={f(search).length} pageSize={pageSize} onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}/>
      </>
      ) : (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-lg font-bold text-slate-800 mb-4">March 2025</div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>(
              <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({length:35},(_,i)=>{
              const day=i-5;
              const date=day>0&&day<=31?`2025-03-${String(day).padStart(2,"0")}`:null;
              const dayApts=date?apts.filter(a=>a.appointment_date===date):[];
              return (
                <div key={i} className={`min-h-16 p-1.5 rounded-xl border transition-all ${day===4?"bg-teal-50 border-teal-200":"border-transparent hover:bg-gray-50"} ${day<1||day>31?"opacity-20":""}`}>
                  {day>0&&day<=31&&(
                    <>
                      <div className={`text-xs font-semibold mb-1 ${day===4?"text-teal-700":"text-slate-500"}`}>{day}</div>
                      {dayApts.slice(0,2).map(a=>{
                        const pat=MOCK_PATIENTS.find(p=>p.id===a.patient_id);
                        return <div key={a.id} className="text-white px-1.5 py-0.5 rounded-md mb-0.5 truncate" style={{backgroundColor:statusColor(a.status),fontSize:"9px"}}>{a.slot_time} {pat?.first_name||""}</div>;
                      })}
                      {dayApts.length>2&&<div className="text-xs text-teal-600 font-medium">+{dayApts.length-2} more</div>}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {showModal && (
        <Modal title="Book Appointment" onClose={()=>setShowModal(false)} wide>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Patient" value={form.patient_id} onChange={v=>setForm({...form,patient_id:v})} options={MOCK_PATIENTS.map(p=>({value:p.id,label:ptName(p)}))}/>
            <Select label="Doctor"  value={form.doctor_id}  onChange={v=>setForm({...form,doctor_id:v})}  options={MOCK_USERS.filter(u=>u.role==="Doctor").map(u=>({value:u.id,label:u.full_name}))}/>
            <Input label="Appointment Date" type="date" value={form.appointment_date} onChange={v=>setForm({...form,appointment_date:v})}/>
            <Input label="Slot Time"        type="time" value={form.slot_time}        onChange={v=>setForm({...form,slot_time:v})}/>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
              <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 resize-none" placeholder="Reason for visit…"/>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Btn variant="secondary" onClick={()=>setShowModal(false)}>Cancel</Btn>
            <Btn onClick={handleAdd} disabled={!form.patient_id||!form.doctor_id||!form.appointment_date}><Icons.Check/>Book Appointment</Btn>
          </div>
        </Modal>
      )}
      {toast && <Toast message={toast} onClose={()=>setToast(null)}/>}
    </div>
  );
};



export default AppointmentsPage;
