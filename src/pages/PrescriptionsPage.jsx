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

const PrescriptionsPage = () => {
  const [rxs, setRxs] = useState(MOCK_PRESCRIPTIONS);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const blank = { encounter_id:"", medicine_name:"", dosage:"", frequency:"OD", duration:"", instructions:"" };
  const [form, setForm] = useState(blank);
  const f = v => rxs.filter(r => r.medicine_name.toLowerCase().includes(v.toLowerCase()) || r.encounter_id.toLowerCase().includes(v.toLowerCase()));
  const handleAdd = () => { setRxs(p=>[...p,{...form,id:`RX00${p.length+1}`}]); setShowModal(false); setForm(blank); };
  return (
    <div>
      <PageHeader title="Prescriptions" subtitle="Medicine prescription records" actions={<Btn onClick={()=>setShowModal(true)}><Icons.Plus/>Add Prescription</Btn>}/>
      <DataTable
        title="Prescription List" subtitle={`${rxs.length} prescriptions`}
        search={search} onSearch={setSearch} searchPlaceholder="Search medicine, encounter…"
        actions={<Btn variant="secondary"><Icons.Download/>Export</Btn>}
        columns={["Rx ID","Encounter","Patient","Medicine","Dosage","Frequency","Duration","Instructions"]}
        rows={f(search).map(r=>{
          const enc=MOCK_ENCOUNTERS.find(e=>e.id===r.encounter_id);
          const pat=enc?MOCK_PATIENTS.find(p=>p.id===enc.patient_id):null;
          return (
            <TR key={r.id}>
              <TD mono bold>{r.id}</TD>
              <TD mono>{r.encounter_id}</TD>
              <TD>{pat?ptName(pat):"—"}</TD>
              <TD bold>{r.medicine_name}</TD>
              <TD>{r.dosage}</TD>
              <TD><span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-teal-50 text-teal-700">{r.frequency}</span></TD>
              <TD>{r.duration}</TD>
              <TD muted>{r.instructions}</TD>
            </TR>
          );
        })}
      />
      {showModal && (
        <Modal title="Add Prescription" onClose={()=>setShowModal(false)} wide>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Encounter" value={form.encounter_id} onChange={v=>setForm({...form,encounter_id:v})} options={MOCK_ENCOUNTERS.map(e=>({value:e.id,label:`${e.id} — ${e.chief_complaint}`}))}/>
            <Input label="Medicine Name" value={form.medicine_name} onChange={v=>setForm({...form,medicine_name:v})} placeholder="e.g. Paracetamol 500mg"/>
            <Input label="Dosage" value={form.dosage} onChange={v=>setForm({...form,dosage:v})} placeholder="e.g. 1 tablet"/>
            <Select label="Frequency" value={form.frequency} onChange={v=>setForm({...form,frequency:v})} options={["OD","BID","TID","QID","SOS","HS"]}/>
            <Input label="Duration" value={form.duration} onChange={v=>setForm({...form,duration:v})} placeholder="e.g. 5 days"/>
            <Input label="Instructions" value={form.instructions} onChange={v=>setForm({...form,instructions:v})} placeholder="e.g. After food"/>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Btn variant="secondary" onClick={()=>setShowModal(false)}>Cancel</Btn>
            <Btn onClick={handleAdd} disabled={!form.encounter_id||!form.medicine_name}><Icons.Check/>Add Prescription</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};



export default PrescriptionsPage;
