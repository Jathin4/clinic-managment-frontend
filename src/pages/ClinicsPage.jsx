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
import { Badge, StatCard, RightDrawer, Btn, Input, Select, Toast, PageHeader } from '../components/UI';

const ClinicsPage = () => {
  const [clinics, setClinics] = useState(MOCK_CLINICS);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [step, setStep] = useState(0);
  const blank = { name:"", gst_number:"", phone:"", email:"", address:"", city:"", state:"", pincode:"", subscription_plan:"Starter", is_active:true };
  const [form, setForm] = useState(blank);
  
  const filteredClinics = clinics.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.city.toLowerCase().includes(search.toLowerCase())
  );
  
  const showToast = (msg, type = "success") => { 
    setToast({ message: msg, type }); 
    setTimeout(() => setToast(null), 3000); 
  };
  
  const handleAdd = () => {
    if (!form.name) {
      showToast("Clinic name is required", "error");
      return;
    }
    setClinics(p=>[...p,{...form, id:`C00${p.length+1}`, created_at:"2025-03-04"}]);
    setShowModal(false); 
    setForm(blank);
    setStep(0);
    showToast("Clinic added successfully");
  };

  const handleNext = () => {
    if (step === 0 && !form.name) {
      showToast("Please enter clinic name", "error");
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => setStep(Math.max(0, step - 1));

  const handleClose = () => {
    setShowModal(false);
    setForm(blank);
    setStep(0);
  };

  return (
    <div>
      <PageHeader 
        title="Clinics" 
        subtitle="Manage clinic locations & infrastructure" 
        actions={<Btn onClick={() => setShowModal(true)}><Icons.Plus/>Add New Clinic</Btn>}
      />
      
      {/* Search Bar */}
      <div className="mb-6 flex items-center gap-3">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icons.Search /></div>
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search by name, city…"
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Clinic Cards Grid */}
      {filteredClinics.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <Icons.Clinic />
          <p className="text-slate-600 mt-4">No clinics found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredClinics.map((c, i) => (
            <div 
              key={c.id} 
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-teal-200 transition-all duration-300 opacity-0 animate-fade-in"
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'forwards' }}
            >
              {/* Header with icon and title */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-teal-50 border border-teal-100 shadow-sm text-teal-700">
                    <Icons.Building />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 text-lg leading-tight">{c.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-100">
                        {c.subscription_plan}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-teal-600 uppercase tracking-widest">
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500" /> Verified
                      </span>
                    </div>
                  </div>
                </div>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-all border border-transparent hover:border-gray-200">
                  <Icons.Trash />
                </button>
              </div>

              {/* Clinic Details */}
              <div className="space-y-3 mb-5 pb-5 border-b border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="pt-0.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                  </div>
                  <div className="text-sm text-gray-700 leading-relaxed">
                    <div className="font-medium">{c.address}</div>
                    <div className="text-xs text-gray-500">{c.city}, {c.state} {c.pincode}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="pt-0.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                    </svg>
                  </div>
                  <div className="text-sm text-gray-700">{c.phone}</div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="pt-0.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 5L2 6"/>
                    </svg>
                  </div>
                  <div className="text-sm text-gray-700">{c.email}</div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="pt-0.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                      <path d="M3 20l10.5-9.5L21 4M21 4l-5 5M21 4l5 5"/>
                    </svg>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-700 font-medium">{c.gst_number}</span>
                    <div className="text-xs text-gray-500">GST Number</div>
                  </div>
                </div>
              </div>

              {/* Status and Actions */}
              <div className="flex items-center justify-between">
                <Badge status={c.is_active ? "Active" : "Inactive"} />
                <div className="flex gap-2">
                  <button className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors border border-transparent hover:border-blue-100">
                    <Icons.Edit />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors border border-transparent hover:border-red-100">
                    <Icons.Trash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Clinic Drawer from Right */}
      <RightDrawer 
        title="Register New Clinic" 
        open={showModal}
        onClose={handleClose}
      >
        <div className="h-full flex flex-col">
          {/* Header with subtitle */}
          <div className="px-8 py-6 bg-gradient-to-r from-teal-50 to-blue-50 border-b border-teal-100">
            <p className="text-sm text-gray-600">Fill in the details to get your clinic up and running</p>
          </div>

          {/* Progress Bar */}
         

          {/* Content Area - Scrollable */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {step === 0 && (
              <div className="space-y-5 animate-fade-in">
                {/* Step Header */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-teal-100">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                    <Icons.Building />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Essential Details</p>
                    <p className="text-sm text-gray-500 mt-0.5">Basic information about your clinic</p>
                  </div>
                </div>

                <Input 
                  label="Clinic Name" 
                  value={form.name} 
                  onChange={v => setForm({...form, name: v})} 
                  placeholder="e.g. Apollo Clinic"
                  required
                />
                <Input 
                  label="GST Number" 
                  value={form.gst_number} 
                  onChange={v => setForm({...form, gst_number: v})} 
                  placeholder="29AABCC1234F1Z5"
                />
                <Select 
                  label="Subscription Plan" 
                  value={form.subscription_plan} 
                  onChange={v => setForm({...form, subscription_plan: v})} 
                  options={[{label:"⭐ Starter", value:"Starter"}, {label:"⭐⭐ Pro", value:"Pro"}, {label:"⭐⭐⭐ Enterprise", value:"Enterprise"}]}
                />
                <Input 
                  label="Address" 
                  value={form.address} 
                  onChange={v => setForm({...form, address: v})} 
                  placeholder="Street address"
                />
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5 animate-fade-in">
                {/* Step Header */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-blue-100">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Icons.Calendar />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Contact & Location</p>
                    <p className="text-sm text-gray-500 mt-0.5">How to reach your clinic</p>
                  </div>
                </div>

                <Input 
                  label="Phone Number" 
                  value={form.phone} 
                  onChange={v => setForm({...form, phone: v})} 
                  placeholder="Phone number"
                />
                <Input 
                  label="Email Address" 
                  type="email" 
                  value={form.email} 
                  onChange={v => setForm({...form, email: v})} 
                  placeholder="email@clinic.com"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="City" 
                    value={form.city} 
                    onChange={v => setForm({...form, city: v})} 
                    placeholder="City"
                  />
                  <Input 
                    label="State" 
                    value={form.state} 
                    onChange={v => setForm({...form, state: v})} 
                    placeholder="State"
                  />
                </div>
                <Input 
                  label="Pincode" 
                  value={form.pincode} 
                  onChange={v => setForm({...form, pincode: v})} 
                  placeholder="6-digit pincode"
                />

                {/* Info Box */}
                <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex gap-3">
                  <div className="text-amber-700 text-lg flex-shrink-0">🔒</div>
                  <div>
                    <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">Security Check</p>
                    <p className="text-sm text-amber-800 mt-1">Ensure all data matches your official facility records for faster verification.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <div className="text-xs text-gray-500 font-medium">
              Step {step + 1} of 2
            </div>
            <div className="flex gap-3">
              <Btn 
                variant="secondary" 
                onClick={step === 0 ? handleClose : handleBack}
                className="flex items-center gap-2"
              >
                {step === 0 ? "Cancel" : <><Icons.ChevronLeft /> Back</>}
              </Btn>
              <Btn 
                onClick={step === 0 ? handleNext : handleAdd}
                disabled={step === 0 && !form.name}
                className="flex items-center gap-2"
              >
                {step === 0 ? <>Next <Icons.ChevronRight /></> : <>✓ Register Clinic</>}
              </Btn>
            </div>
          </div>
        </div>
      </RightDrawer>

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ClinicsPage;
