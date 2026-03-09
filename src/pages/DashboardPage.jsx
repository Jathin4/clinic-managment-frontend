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

const DashboardPage = () => {
  const { setPage } = useApp();
  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Welcome back, Dr. Rajesh Agarwal  •  March 4, 2025" actions={
        <Btn onClick={() => setPage("appointments")}><Icons.Plus />New Appointment</Btn>
      }/>
      <div className="grid grid-cols-5 gap-4 mb-6">
        <StatCard title="Total Patients"    value="1,842" change="+12%"  icon={Icons.Patient}      bgColor="#DBEAFE" />
        <StatCard title="Today's Apts"      value="24"    change="+3"    icon={Icons.Calendar}    bgColor="#FFEDD5" />
        {/* <StatCard title="Active Rx"         value="312"   change="+8%"   icon={Icons.Prescription} bgColor="#FEF3C7" /> */}
        <StatCard title="Today's Revenue"   value="₹48,200" change="+5.2%" icon={Icons.DollarSign} bgColor="#D1FAE5" />
        <StatCard title="Monthly Revenue"   value="₹2.1L" change="+18%"  icon={Icons.TrendUp}     bgColor="#F3E8FF" />
        <StatCard title="Pending Payments"  value="₹34,500" change="-3 bills" icon={Icons.AlertTriangle} bgColor="#FFE4E6" positive={false} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        
        {/* <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div><div className="font-bold text-slate-800">Revenue Trend</div><div className="text-xs text-slate-400">Last 7 months</div></div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-teal-700 inline-block rounded"></span>Revenue</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-teal-400 inline-block rounded"></span>Expenses</span>
            </div>
          </div>
          <LineChart data={REVENUE_DATA} height={200}/>
        </div> */}
        {/* <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="font-bold text-slate-800 mb-1">Payment Modes</div>
          <div className="text-xs text-slate-400 mb-4">Current month</div>
          <div className="flex flex-col items-center gap-4">
            <DonutChart data={PAYMENT_MODES} size={160}/>
            <div className="w-full space-y-2">
              {PAYMENT_MODES.map(m => (
                <div key={m.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{backgroundColor:m.color}}></span>{m.name}</span>
                  <span className="font-semibold text-slate-700">{m.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div> */}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="font-bold text-slate-800 mb-1">Appointments per Doctor</div>
          <div className="text-xs text-slate-400 mb-4">This month</div>
          <BarChart data={DOCTOR_APPOINTMENTS} height={200}/>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="font-bold text-slate-800 mb-1">Payment Modes</div>
          <div className="text-xs text-slate-400 mb-4">Current month</div>
          <div className="flex flex-col items-center gap-4">
            <DonutChart data={PAYMENT_MODES} size={160}/>
            <div className="w-full space-y-2">
              {PAYMENT_MODES.map(m => (
                <div key={m.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{backgroundColor:m.color}}></span>{m.name}</span>
                  <span className="font-semibold text-slate-700">{m.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="font-bold text-slate-800 mb-1">Patient Growth</div>
          <div className="text-xs text-slate-400 mb-4">New registrations per month</div>
          <AreaChart data={PATIENT_GROWTH} height={180}/>
        </div> */}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>Today's Appointments
          </div>
          {MOCK_APPOINTMENTS.filter(a=>a.appointment_date==="2025-03-04").map(a=>(
            <div key={a.id} className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 text-xs font-bold">{a.token_number}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-700 truncate">{ptName(MOCK_PATIENTS.find(p=>p.id===a.patient_id))}</div>
                <div className="text-xs text-slate-400">{a.slot_time} • {doctorName(a.doctor_id)}</div>
              </div>
              <Badge status={a.status}/>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="font-bold text-slate-800 mb-4">Recent Payments</div>
          {MOCK_PAYMENTS.map(pay=>{
            const bill = MOCK_BILLS.find(b=>b.id===pay.bill_id);
            const pat  = bill ? MOCK_PATIENTS.find(p=>p.id===bill.patient_id) : null;
            return (
              <div key={pay.id} className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-slate-700">{pat ? ptName(pat) : "—"}</div>
                  <div className="text-xs text-slate-400">{pay.payment_mode} • {pay.payment_date.split(" ")[0]}</div>
                </div>
                <span className="text-sm font-bold text-blue-600">₹{pay.amount_paid.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Icons.AlertTriangle/>Low Stock Alerts</div>
          {MOCK_MEDICINES.filter(m=>m.status==="Critical"||m.status==="Low").map(m=>(
            <div key={m.id} className="flex items-center justify-between mb-3">
              <div><div className="text-sm font-medium text-slate-700">{m.name}</div><div className="text-xs text-slate-400">Batch: {m.batch}</div></div>
              <div className="text-right"><Badge status={m.status}/><div className="text-xs text-slate-400 mt-1">{m.stock} left</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};



export default DashboardPage;
