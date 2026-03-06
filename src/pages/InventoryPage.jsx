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

const InventoryPage = () => {
  const [meds, setMeds] = useState(MOCK_MEDICINES);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const blank = { name:"", batch:"", stock:"", expiry:"", price:"", category:"" };
  const [form, setForm] = useState(blank);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const f = v => meds.filter(m => m.name.toLowerCase().includes(v.toLowerCase()) || m.category.toLowerCase().includes(v.toLowerCase()) || m.batch.toLowerCase().includes(v.toLowerCase()));
  const stockColor = s => ({Good:"#0E6C68",Low:"#f59e0b",Critical:"#ef4444",Expiring:"#f97316"}[s]||"#94a3b8");
  const handleAdd = () => {
    const st = parseInt(form.stock)<10?"Critical":parseInt(form.stock)<20?"Low":"Good";
    setMeds(p=>[...p,{...form,id:`M00${p.length+1}`,status:st}]);
    setShowModal(false); setForm(blank);
  };
  return (
    <div>
      <PageHeader title="Inventory" subtitle="Medicine stock management" actions={<Btn onClick={()=>setShowModal(true)}><Icons.Plus/>Add Medicine</Btn>}/>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Medicines" value={meds.length}                                                  change="Items tracked"    icon={Icons.Pill}/>
        <StatCard title="Low / Critical"  value={meds.filter(m=>m.status==="Low"||m.status==="Critical").length} change="Need reorder"  icon={Icons.AlertTriangle} bgColor="#FEF3C7" positive={false}/>
        <StatCard title="Expiring Soon"   value={meds.filter(m=>m.status==="Expiring").length}                  change="Within 3 months" icon={Icons.Clock}         bgColor="#FEE2E2" positive={false}/>
        <StatCard title="Daily Sales"     value="₹2,450"                                                        change="+15%"            icon={Icons.TrendUp}       bgColor="#DCFCE7"/>
      </div>
      <DataTable
        title="Medicine Inventory" subtitle={`${meds.length} medicines tracked`}
        search={search} onSearch={v=>{setSearch(v);setCurrentPage(1);}} searchPlaceholder="Search name, category, batch…"
        actions={<Btn variant="secondary"><Icons.Download/>Export</Btn>}
        columns={["Medicine Name","Category","Batch No.","Stock Level","Expiry","Price / Unit","Status","Actions"]}
        rows={f(search).slice((currentPage-1)*pageSize,currentPage*pageSize).map(m=>(
          <TR key={m.id}>
            <TD>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:"#DFF7F6"}}><Icons.Pill/></div>
                <span className="font-semibold text-slate-700">{m.name}</span>
              </div>
            </TD>
            <TD>{m.category}</TD>
            <TD mono>{m.batch}</TD>
            <TD>
              <div className="flex items-center gap-2.5">
                <div className="flex-1 max-w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{width:`${Math.min((m.stock/500)*100,100)}%`,backgroundColor:stockColor(m.status)}}></div>
                </div>
                <span className="text-sm font-semibold text-slate-700 w-8">{m.stock}</span>
              </div>
            </TD>
            <TD>{m.expiry}</TD>
            <TD bold>₹{m.price}</TD>
            <TD><Badge status={m.status}/></TD>
            <TD>
              <div className="flex gap-1">
                <button className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-slate-400"><Icons.Edit/></button>
                <button className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-slate-400"><Icons.Trash/></button>
              </div>
            </TD>
          </TR>
        ))}
      />
      <Pagination currentPage={currentPage} totalPages={Math.ceil(f(search).length/pageSize)} onPageChange={setCurrentPage} totalItems={f(search).length} pageSize={pageSize} onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}/>
      {showModal && (
        <Modal title="Add Medicine" onClose={()=>setShowModal(false)} wide>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Medicine Name" value={form.name}     onChange={v=>setForm({...form,name:v})}     placeholder="e.g. Paracetamol 500mg"/>
            <Input label="Category"      value={form.category} onChange={v=>setForm({...form,category:v})} placeholder="e.g. Analgesic"/>
            <Input label="Batch Number"  value={form.batch}    onChange={v=>setForm({...form,batch:v})}    placeholder="e.g. B2025-01"/>
            <Input label="Stock Qty"     type="number" value={form.stock} onChange={v=>setForm({...form,stock:v})}/>
            <Input label="Expiry (YYYY-MM)" value={form.expiry} onChange={v=>setForm({...form,expiry:v})} placeholder="2026-12"/>
            <Input label="Price / Unit (₹)" type="number" value={form.price} onChange={v=>setForm({...form,price:v})}/>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Btn variant="secondary" onClick={()=>setShowModal(false)}>Cancel</Btn>
            <Btn onClick={handleAdd} disabled={!form.name}><Icons.Check/>Add Medicine</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};



export default InventoryPage;
