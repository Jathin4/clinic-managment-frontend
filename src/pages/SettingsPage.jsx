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

const SettingsPage = () => (
  <div>
    <PageHeader title="Settings" subtitle="Clinic configuration and preferences"/>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {[
        { title:"Clinic Profile",     desc:"Update clinic name, address, contact, and logo",           icon:Icons.Building },
        { title:"User Management",    desc:"Manage staff accounts and role permissions",                icon:Icons.Users    },
        { title:"Billing Config",     desc:"Tax rates, invoice numbering, and payment methods",        icon:Icons.Bill     },
        { title:"Notifications",      desc:"Configure email, SMS, and push notifications",             icon:Icons.Bell     },
        { title:"Security",           desc:"Password policy, 2FA, and session management",             icon:Icons.Settings },
        { title:"Integrations",       desc:"Connect labs, pharmacy, and third-party systems",          icon:Icons.Activity },
      ].map(s=>(
        <div key={s.title} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{background:"#DFF7F6"}}><s.icon/></div>
          <div className="font-semibold text-slate-700 mb-1 group-hover:text-teal-700 transition-colors">{s.title}</div>
          <div className="text-sm text-slate-400">{s.desc}</div>
        </div>
      ))}
    </div>
  </div>
);



export default SettingsPage;
