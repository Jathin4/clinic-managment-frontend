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
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const DiagnosesPage = () => {
  const [diags, setDiags] = useState(MOCK_DIAGNOSES);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const blank = { encounter_id:"", icd_code:"", description:"" };
  const [form, setForm] = useState(blank);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const f = v => diags.filter(d => d.icd_code.toLowerCase().includes(v.toLowerCase()) || d.description.toLowerCase().includes(v.toLowerCase()) || d.encounter_id.toLowerCase().includes(v.toLowerCase()));
  const handleAdd = () => {
    setDiags(p=>[...p,{...form,id:`DX00${p.length+1}`}]);
    setShowModal(false); setForm(blank);
  };
  return (
    <div>
      <PageHeader title="Diagnoses" subtitle="ICD-10 diagnosis records" actions={<Btn onClick={()=>setShowModal(true)}><Icons.Plus/>Add Diagnosis</Btn>}/>
      <DataTable
        title="Diagnosis List" subtitle={`${diags.length} diagnoses recorded`}
        search={search} onSearch={v=>{setSearch(v);setCurrentPage(1);}} searchPlaceholder="Search ICD code, description…"
        actions={<Btn variant="secondary"><Icons.Download/>Export</Btn>}
        columns={["Diagnosis ID","Encounter","ICD Code","Description","Patient","Doctor"]}
        rows={f(search).slice((currentPage-1)*pageSize,currentPage*pageSize).map(d=>{
          const enc=MOCK_ENCOUNTERS.find(e=>e.id===d.encounter_id);
          const pat=enc?MOCK_PATIENTS.find(p=>p.id===enc.patient_id):null;
          return (
            <TR key={d.id}>
              <TD mono bold>{d.id}</TD>
              <TD mono>{d.encounter_id}</TD>
              <TD><span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">{d.icd_code}</span></TD>
              <TD>{d.description}</TD>
              <TD>{pat?ptName(pat):"—"}</TD>
              <TD>{enc?doctorName(enc.doctor_id):"—"}</TD>
            </TR>
          );
        })}
      currentPage={currentPage} totalPages={Math.ceil(f(search).length/pageSize)} onPageChange={setCurrentPage} totalItems={f(search).length} pageSize={pageSize} onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
      />
      {showModal && (
        <Modal title="Add Diagnosis" onClose={()=>setShowModal(false)}>
          <div className="space-y-4">
            <Select label="Encounter" value={form.encounter_id} onChange={v=>setForm({...form,encounter_id:v})} options={MOCK_ENCOUNTERS.map(e=>({value:e.id,label:`${e.id} — ${e.chief_complaint}`}))}/>
            <Input label="ICD-10 Code" value={form.icd_code} onChange={v=>setForm({...form,icd_code:v})} placeholder="e.g. A09, I10, E11.9"/>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
              <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 resize-none" placeholder="Full diagnosis description…"/>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Btn variant="secondary" onClick={()=>setShowModal(false)}>Cancel</Btn>
            <Btn onClick={handleAdd} disabled={!form.encounter_id||!form.icd_code}><Icons.Check/>Add Diagnosis</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};



export default DiagnosesPage;
