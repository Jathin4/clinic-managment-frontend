import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Icons from '../components/Icons';
import { Badge, StatCard, RightDrawer, Btn, Input, Select, Toast, PageHeader } from '../components/UI';

const API_BASE_URL = 'http://127.0.0.1:5020';

const ClinicsPage = () => {
  const [clinics, setClinics] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const blank = { name:"", gst_number:"", phone:"", email:"", address:"", city:"", state:"", pincode:"", subscription_plan:"Starter" };
  const [form, setForm] = useState(blank);

  const showToast = (msg, type = "success") => { 
    setToast({ message: msg, type }); 
    setTimeout(() => setToast(null), 3000); 
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/clinicsread`);
      if (!response.ok) throw new Error('Failed to fetch clinics');
      const data = await response.json();
      setClinics(data || []);
    } catch (error) {
      console.error('Error fetching clinics:', error);
      showToast('Failed to load clinics', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAdd = async () => {
    if (!form.name) {
      showToast("Clinic name is required", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...form,
        id: form.id || null,
        created_by: "admin"
      };

      const response = await fetch(`${API_BASE_URL}/clinic_create_update/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create clinic');
      }

      showToast('Clinic added successfully', 'success');
      setShowModal(false);
      setForm(blank);
      setStep(0);
      await fetchClinics();
    } catch (error) {
      console.error('Error adding clinic:', error);
      showToast(error.message || 'Failed to add clinic', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (clinicId) => {
    if (!window.confirm('Are you sure you want to delete this clinic?')) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`${API_BASE_URL}/clinic_delete/`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: clinicId,
          modified_by: "admin"
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete clinic');
      }

      showToast('Clinic deleted successfully', 'success');
      await fetchClinics();
    } catch (error) {
      console.error('Error deleting clinic:', error);
      showToast(error.message || 'Failed to delete clinic', 'error');
    } finally {
      setIsSubmitting(false);
    }
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

  const filteredClinics = clinics.filter(clinic =>
    clinic.name?.toLowerCase().includes(search.toLowerCase()) ||
    clinic.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-slate-50 min-h-screen">
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
      {isLoading ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-md">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-700"></div>
          <p className="text-slate-600 mt-4">Loading clinics...</p>
        </div>
      ) : filteredClinics.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-md">
          <Icons.Clinic />
          <p className="text-slate-600 mt-4">No clinics found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredClinics.map((c, i) => (
            <div 
              key={c.id} 
              className="bg-white rounded-xl border border-gray-200 p-4 shadow-md hover:shadow-xl hover:border-teal-400 transition-all duration-300 opacity-0 animate-fade-in"
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'forwards' }}
            >
              {/* Header with icon and title */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-teal-100 to-teal-50 border border-teal-200 shadow-sm text-teal-700 flex-shrink-0">
                    <Icons.Building />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm leading-tight truncate hover:text-teal-700 transition-colors">{c.name}</h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {c.is_active && (
                        <span className="inline-flex items-center gap-1 text-[9px] px-2 py-1 rounded-full font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 uppercase tracking-wider shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(c.id)} 
                  disabled={isSubmitting}
                  className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all border border-transparent hover:border-red-200 disabled:opacity-50">
                  <Icons.Trash />
                </button>
              </div>

              {/* Clinic Details */}
              <div className="space-y-2.5 mb-4 pb-4 border-b border-gray-100">
                {c.address && (
                  <div className="flex items-start gap-2.5 group hover:bg-teal-50 p-2 -mx-2 rounded-lg transition-colors">
                    <div className="pt-0.5 flex-shrink-0 w-5 h-5 rounded-lg flex items-center justify-center bg-teal-100 group-hover:bg-teal-200 transition-colors">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-teal-700">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                    </div>
                    <div className="text-xs text-gray-700 leading-tight min-w-0 flex-1">
                      <div className="font-semibold truncate text-gray-800">{c.address}</div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">{c.city}, {c.state} {c.pincode}</div>
                    </div>
                  </div>
                )}

                {c.phone && (
                  <div className="flex items-start gap-2.5 group hover:bg-blue-50 p-2 -mx-2 rounded-lg transition-colors">
                    <div className="pt-0.5 flex-shrink-0 w-5 h-5 rounded-lg flex items-center justify-center bg-blue-100 group-hover:bg-blue-200 transition-colors">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-700">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                      </svg>
                    </div>
                    <div className="text-xs text-gray-700 truncate font-medium">{c.phone}</div>
                  </div>
                )}

                {c.email && (
                  <div className="flex items-start gap-2.5 group hover:bg-amber-50 p-2 -mx-2 rounded-lg transition-colors">
                    <div className="pt-0.5 flex-shrink-0 w-5 h-5 rounded-lg flex items-center justify-center bg-amber-100 group-hover:bg-amber-200 transition-colors">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-amber-700">
                        <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 5L2 6"/>
                      </svg>
                    </div>
                    <div className="text-xs text-gray-700 truncate font-medium">{c.email}</div>
                  </div>
                )}

                {c.gst_number && (
                  <div className="flex items-start gap-2.5 group hover:bg-purple-50 p-2 -mx-2 rounded-lg transition-colors">
                    <div className="pt-0.5 flex-shrink-0 w-5 h-5 rounded-lg flex items-center justify-center bg-purple-100 group-hover:bg-purple-200 transition-colors">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-purple-700">
                        <path d="M9 11a4 4 0 100-8 4 4 0 000 8zM20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                      </svg>
                    </div>
                    <div className="text-xs text-gray-700 min-w-0 flex-1">
                      <div className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">GST</div>
                      <div className="font-mono text-xs text-gray-800 truncate">{c.gst_number}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Status and Actions */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">
                  <Badge status={c.is_active ? "Active" : "Inactive"} />
                </div>
                <div className="flex gap-1">
                  <button className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all border border-transparent hover:border-blue-200 hover:shadow-sm">
                    <Icons.Edit />
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all border border-transparent hover:border-red-200 hover:shadow-sm">
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
                disabled={(step === 0 && !form.name) || isSubmitting}
                className="flex items-center gap-2"
              >
                {isSubmitting ? '...' : step === 0 ? <>Next <Icons.ChevronRight /></> : <>✓ Register Clinic</>}
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
