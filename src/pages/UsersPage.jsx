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

const UsersPage = () => {
  const [users, setUsers] = useState(MOCK_USERS);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const blank = { full_name:"", email:"", phone:"", role:"Receptionist", clinic_id:"C001", is_active:true };
  const [form, setForm] = useState(blank);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const f = v => users.filter(u => u.full_name.toLowerCase().includes(v.toLowerCase()) || u.email.toLowerCase().includes(v.toLowerCase()) || u.role.toLowerCase().includes(v.toLowerCase()));
  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(null),3000); };
  const handleAdd = () => {
    setUsers(p=>[...p,{...form, id:`U00${p.length+1}`, last_login:"—", created_at:"2025-03-04"}]);
    setShowModal(false); setForm(blank);
    showToast("User added successfully");
  };
  const roleColor = r => ({Admin:"bg-purple-50 text-purple-700 border-purple-100", Doctor:"bg-blue-50 text-blue-700 border-blue-100", Receptionist:"bg-amber-50 text-amber-700 border-amber-100"}[r]||"bg-gray-100 text-gray-600");
  return (
    <div>
      <PageHeader title="Users & Staff" subtitle="Manage roles and access" actions={<Btn onClick={()=>setShowModal(true)}><Icons.Plus/>Add User</Btn>}/>
      <DataTable
        title="User List" subtitle={`${users.length} users across all clinics`}
        search={search} onSearch={v=>{setSearch(v);setCurrentPage(1);}} searchPlaceholder="Search by name, email, role…"
        actions={<Btn variant="secondary"><Icons.Download/>Export</Btn>}
        columns={["Staff Member","Email","Phone","Role","Clinic","Last Login","Status","Actions"]}
        rows={f(search).slice((currentPage-1)*pageSize,currentPage*pageSize).map(u=>{
          const clinic = MOCK_CLINICS.find(c=>c.id===u.clinic_id);
          return (
            <TR key={u.id}>
              <TD>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{background:"linear-gradient(135deg,#0E6C68,#14A3A0)"}}>
                    {u.full_name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                  </div>
                  <span className="font-semibold text-slate-700">{u.full_name}</span>
                </div>
              </TD>
              <TD>{u.email}</TD>
              <TD>{u.phone}</TD>
              <TD><span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${roleColor(u.role)}`}>{u.role}</span></TD>
              <TD>{clinic?.name||"—"}</TD>
              <TD muted>{u.last_login}</TD>
              <TD><Badge status={u.is_active?"Active":"Inactive"}/></TD>
              <TD>
                <div className="flex gap-1">
                  <button className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-slate-400"><Icons.Edit/></button>
                  <button onClick={()=>{setUsers(p=>p.filter(x=>x.id!==u.id));showToast("User removed");}} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-slate-400"><Icons.Trash/></button>
                </div>
              </TD>
            </TR>
          );
        })}
      currentPage={currentPage} totalPages={Math.ceil(f(search).length/pageSize)} onPageChange={setCurrentPage} totalItems={f(search).length} pageSize={pageSize} onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
      />
      {showModal && (
        <Modal title="Add New User" onClose={()=>setShowModal(false)} wide>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" value={form.full_name} onChange={v=>setForm({...form,full_name:v})} placeholder="Dr. / Staff name"/>
            <Input label="Email" type="email" value={form.email} onChange={v=>setForm({...form,email:v})} placeholder="email@clinic.com"/>
            <Input label="Phone" value={form.phone} onChange={v=>setForm({...form,phone:v})} placeholder="10-digit number"/>
            <Select label="Role" value={form.role} onChange={v=>setForm({...form,role:v})} options={["Admin","Doctor","Receptionist"]}/>
            <Select label="Clinic" value={form.clinic_id} onChange={v=>setForm({...form,clinic_id:v})} options={MOCK_CLINICS.map(c=>({value:c.id,label:c.name}))}/>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Btn variant="secondary" onClick={()=>setShowModal(false)}>Cancel</Btn>
            <Btn onClick={handleAdd} disabled={!form.full_name||!form.email}><Icons.Check/>Add User</Btn>
          </div>
        </Modal>
      )}
      {toast && <Toast message={toast} onClose={()=>setToast(null)}/>}
    </div>
  );
};



export default UsersPage;
