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

const ReportsPage = () => {
  const [tab, setTab] = useState("revenue");
  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Comprehensive clinic insights" actions={
        <div className="flex gap-2">
          <Btn variant="secondary"><Icons.Download/>Export CSV</Btn>
          <Btn variant="secondary"><Icons.Download/>Export PDF</Btn>
        </div>
      }/>
      <div className="flex gap-2 mb-6 bg-white rounded-xl p-1 border border-gray-100 w-fit shadow-sm">
        {[["revenue","Revenue"],["doctors","Doctor Performance"],["patients","Patient Growth"],["medicines","Medicine Sales"],["audit","Audit Log"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${tab===id?"text-white shadow-sm":"text-slate-500 hover:text-slate-700"}`} style={tab===id?{background:"#0E6C68"}:{}}>{label}</button>
        ))}
      </div>
      {tab==="revenue" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <StatCard title="Total Revenue"    value="₹10.95L" change="+18% YoY" icon={Icons.DollarSign} bgColor="#DCFCE7"/>
            <StatCard title="Avg Monthly"      value="₹1.56L"  change="+12%"     icon={Icons.TrendUp}/>
            <StatCard title="Collection Rate"  value="87.3%"   change="+2.1%"    icon={Icons.Check} bgColor="#DFF7F6"/>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="font-bold text-slate-800 mb-4">Revenue vs Expenses (6 months)</div>
            <LineChart data={REVENUE_DATA} height={250}/>
          </div>
          <DataTable title="Monthly Revenue Breakdown" columns={["Month","Revenue","Expenses","Profit","Margin"]}
            rows={REVENUE_DATA.map(d=>(
              <TR key={d.month}>
                <TD bold>{d.month}</TD>
                <TD><span className="text-emerald-600 font-semibold">₹{d.revenue.toLocaleString()}</span></TD>
                <TD><span className="text-red-500">₹{d.expenses.toLocaleString()}</span></TD>
                <TD bold>₹{(d.revenue-d.expenses).toLocaleString()}</TD>
                <TD><span className="text-teal-600 font-semibold">{Math.round(((d.revenue-d.expenses)/d.revenue)*100)}%</span></TD>
              </TR>
            ))}
          />
        </div>
      )}
      {tab==="doctors" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="font-bold text-slate-800 mb-4">Appointments per Doctor</div>
            <BarChart data={DOCTOR_APPOINTMENTS} height={240}/>
          </div>
          <DataTable title="Doctor Performance" columns={["Doctor","Role","Total Apts","Completed","Completion Rate","Avg Rating"]}
            rows={DOCTOR_APPOINTMENTS.map(d=>(
              <TR key={d.doctor}>
                <TD bold>{d.doctor}</TD>
                <TD><span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">Doctor</span></TD>
                <TD>{d.appointments}</TD>
                <TD><span className="text-emerald-600 font-semibold">{d.completed}</span></TD>
                <TD>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 max-w-20 h-1.5 bg-gray-100 rounded-full">
                      <div className="h-full rounded-full" style={{width:`${Math.round((d.completed/d.appointments)*100)}%`,background:"#0E6C68"}}></div>
                    </div>
                    <span className="font-medium text-sm">{Math.round((d.completed/d.appointments)*100)}%</span>
                  </div>
                </TD>
                <TD><span className="text-amber-500 font-bold">★ {(4+Math.random()*0.9).toFixed(1)}</span></TD>
              </TR>
            ))}
          />
        </div>
      )}
      {tab==="patients" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <StatCard title="Total Patients"    value="1,842" change="+12% YoY" icon={Icons.Patient}/>
            <StatCard title="New This Month"    value="95"    change="+22.5%"   icon={Icons.TrendUp} bgColor="#DCFCE7"/>
            <StatCard title="Retention Rate"    value="78%"   change="+4%"      icon={Icons.Check}   bgColor="#DFF7F6"/>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="font-bold text-slate-800 mb-4">Patient Registration Growth</div>
            <AreaChart data={PATIENT_GROWTH} height={250}/>
          </div>
          <DataTable title="Patient Registration Log" columns={["UHID","Name","Gender","Blood Group","Doctor","Registered"]}
            rows={MOCK_PATIENTS.map(p=>(
              <TR key={p.id}>
                <TD mono bold>{p.uhid}</TD>
                <TD bold>{ptName(p)}</TD>
                <TD>{p.gender}</TD>
                <TD><span className="px-2 py-0.5 rounded-md text-xs font-bold bg-green-50 text-green-700 border border-green-100">{p.blood_group}</span></TD>
                <TD>{doctorName(p.doctor_id)}</TD>
                <TD muted>{p.created_at}</TD>
              </TR>
            ))}
          />
        </div>
      )}
      {tab==="medicines" && (
        <DataTable title="Medicine Sales Report" columns={["Medicine","Category","Units Sold","Revenue","Stock Left","Status"]}
          rows={MOCK_MEDICINES.map(m=>{
            const sold=Math.floor(Math.random()*200+50);
            return (
              <TR key={m.id}>
                <TD bold>{m.name}</TD><TD>{m.category}</TD>
                <TD bold>{sold}</TD>
                <TD><span className="text-emerald-600 font-semibold">₹{(sold*m.price).toLocaleString()}</span></TD>
                <TD>{m.stock}</TD><TD><Badge status={m.status}/></TD>
              </TR>
            );
          })}
        />
      )}
      {tab==="audit" && (
        <DataTable title="Audit Log" subtitle="System activity trail" columns={["Log ID","User","Action","Entity","Entity ID","Timestamp"]}
          rows={MOCK_AUDIT_LOGS.map(l=>{
            const user=MOCK_USERS.find(u=>u.id===l.user_id);
            return (
              <TR key={l.id}>
                <TD mono bold>{l.id}</TD>
                <TD>{user?.full_name||"—"}</TD>
                <TD><span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-100">{l.action}</span></TD>
                <TD>{l.entity_name}</TD>
                <TD mono muted>{l.entity_id}</TD>
                <TD muted>{l.timestamp}</TD>
              </TR>
            );
          })}
        />
      )}
    </div>
  );
};



export default ReportsPage;
