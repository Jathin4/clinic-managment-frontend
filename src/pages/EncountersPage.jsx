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

const EncountersPage = () => {
  const [encs, setEncs] = useState(MOCK_ENCOUNTERS);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [viewEnc, setViewEnc] = useState(null);
  const blank = { patient_id:"", doctor_id:"", appointment_id:"", chief_complaint:"", notes:"", follow_up_date:"", clinic_id:"C001" };
  const [form, setForm] = useState(blank);
  const f = v => encs.filter(e => {
    const pn = ptName(MOCK_PATIENTS.find(p=>p.id===e.patient_id)||{first_name:"",last_name:""});
    return pn.toLowerCase().includes(v.toLowerCase()) || e.chief_complaint.toLowerCase().includes(v.toLowerCase());
  });
  const handleAdd = () => {
    const n=encs.length+1;
    setEncs(p=>[...p,{...form,id:`ENC00${n}`,visit_date:"2025-03-04 10:00",created_at:"2025-03-04"}]);
    setShowModal(false); setForm(blank);
  };
  if (viewEnc) {
    const dxs = MOCK_DIAGNOSES.filter(d=>d.encounter_id===viewEnc.id);
    const rxs = MOCK_PRESCRIPTIONS.filter(r=>r.encounter_id===viewEnc.id);
    const pat = MOCK_PATIENTS.find(p=>p.id===viewEnc.patient_id);
    return (
      <div>
        <button onClick={()=>setViewEnc(null)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-teal-700 mb-4 transition-colors"><Icons.ChevronLeft/>Back to Encounters</button>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-lg font-bold text-slate-800">{pat?ptName(pat):"—"}</div>
              <div className="text-sm text-slate-500">{pat?.uhid} • {viewEnc.visit_date} • {doctorName(viewEnc.doctor_id)}</div>
            </div>
            <Btn variant="secondary"><Icons.Download/>Print Summary</Btn>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Chief Complaint</div>
              <div className="text-sm font-medium text-slate-700">{viewEnc.chief_complaint}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Follow-up Date</div>
              <div className="text-sm font-medium text-slate-700">{viewEnc.follow_up_date||"—"}</div>
            </div>
            <div className="col-span-2 bg-gray-50 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Clinical Notes</div>
              <div className="text-sm text-slate-600">{viewEnc.notes}</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DataTable title={`Diagnoses (${dxs.length})`} columns={["ICD Code","Description"]}
            rows={dxs.map(d=><TR key={d.id}><TD mono bold>{d.icd_code}</TD><TD>{d.description}</TD></TR>)}
            empty="No diagnoses recorded"
          />
          <DataTable title={`Prescriptions (${rxs.length})`} columns={["Medicine","Dosage","Frequency","Duration","Instructions"]}
            rows={rxs.map(r=><TR key={r.id}><TD bold>{r.medicine_name}</TD><TD>{r.dosage}</TD><TD>{r.frequency}</TD><TD>{r.duration}</TD><TD muted>{r.instructions}</TD></TR>)}
            empty="No prescriptions"
          />
        </div>
      </div>
    );
  }
  return (
    <div>
      <PageHeader title="Encounters" subtitle="Clinical encounter records" actions={<Btn onClick={()=>setShowModal(true)}><Icons.Plus/>New Encounter</Btn>}/>
      <DataTable
        title="Encounter List" subtitle={`${encs.length} encounters`}
        search={search} onSearch={setSearch} searchPlaceholder="Search patient, complaint…"
        columns={["Encounter ID","Patient","Doctor","Visit Date","Chief Complaint","Follow-up","Actions"]}
        rows={f(search).map(e=>{
          const pat=MOCK_PATIENTS.find(p=>p.id===e.patient_id);
          return (
            <TR key={e.id}>
              <TD mono bold>{e.id}</TD>
              <TD bold>{pat?ptName(pat):"—"}</TD>
              <TD>{doctorName(e.doctor_id)}</TD>
              <TD>{e.visit_date}</TD>
              <TD>{e.chief_complaint}</TD>
              <TD>{e.follow_up_date||"—"}</TD>
              <TD>
                <div className="flex gap-1">
                  <button onClick={()=>setViewEnc(e)} className="p-1.5 hover:bg-teal-50 hover:text-teal-700 rounded-lg transition-colors text-slate-400"><Icons.Eye/></button>
                  <button className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-slate-400"><Icons.Edit/></button>
                </div>
              </TD>
            </TR>
          );
        })}
      />
      {showModal && (
        <Modal title="New Encounter" onClose={()=>setShowModal(false)} wide>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Patient" value={form.patient_id} onChange={v=>setForm({...form,patient_id:v})} options={MOCK_PATIENTS.map(p=>({value:p.id,label:ptName(p)}))}/>
            <Select label="Doctor"  value={form.doctor_id}  onChange={v=>setForm({...form,doctor_id:v})}  options={MOCK_USERS.filter(u=>u.role==="Doctor").map(u=>({value:u.id,label:u.full_name}))}/>
            <Input label="Chief Complaint" value={form.chief_complaint} onChange={v=>setForm({...form,chief_complaint:v})} placeholder="Primary reason for visit"/>
            <Input label="Follow-up Date" type="date" value={form.follow_up_date} onChange={v=>setForm({...form,follow_up_date:v})}/>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Clinical Notes</label>
              <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={4} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 resize-none" placeholder="Detailed clinical observations, examination findings…"/>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Btn variant="secondary" onClick={()=>setShowModal(false)}>Cancel</Btn>
            <Btn onClick={handleAdd} disabled={!form.patient_id||!form.chief_complaint}><Icons.Check/>Save Encounter</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};



export default EncountersPage;
