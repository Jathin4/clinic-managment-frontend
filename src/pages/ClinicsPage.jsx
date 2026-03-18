import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Icons from '../components/Icons';
import { Badge, StatCard, RightDrawer, Btn, Input, Select, Toast, PageHeader, DataTable, TR, TD } from '../components/UI';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const ClinicsPage = () => {
  const { showLoading, hideLoading } = useApp();
  const [clinics, setClinics] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const blank = { name:"", gst_number:"", phone:"", email:"", address:"", city:"", state:"", pincode:"", subscription_plan:"Starter" };
  const [form, setForm] = useState(blank);

  const showToast = (msg, type = "success") => { 
    setToast({ message: msg, type }); 
    setTimeout(() => setToast(null), 3000); 
  };

  const validateStep0 = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Required";          // ✅ fixed: clinic_name → name
     // GST can be optional, so message changed to "None"
    if (!form.address.trim()) e.address = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep1 = () => {
    const e = {};
    if (!form.email.trim())      e.email   = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    if (!form.phone.trim())      e.phone   = "Required";
    else if (!/^\d{10}$/.test(form.phone)) e.phone = "Must be 10 digits";
    if (!form.pincode.trim())     e.pincode = "Required";
    else if (!/^\d{6}$/.test(form.pincode)) e.pincode = "Must be 6 digits";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  
  const Required = () => <span className="text-red-500">*</span>;


  const setField = (key, val) => { setForm(p => ({ ...p, [key]: val })); setErrors(p => ({ ...p, [key]: undefined })); };

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      setIsLoading(true);
      showLoading("Loading clinics...", "clinics");
      const response = await fetch(`${API_BASE_URL}/clinicsread`);
      if (!response.ok) throw new Error('Failed to fetch clinics');
      const data = await response.json();
      setClinics(data || []);
    } catch (error) {
      console.error('Error fetching clinics:', error);
      showToast('Failed to load clinics', 'error');
    } finally {
      setIsLoading(false);
      hideLoading();
    }
  };
  
  const handleAdd = async () => {
    if (!validateStep1()) return;  // ✅ added: validates email, phone, pincode before API call

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
    if (!validateStep0()) return;  // ✅ added: validates step 0 before proceeding
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

  const Err = ({ f }) => errors[f] ? <p className="text-red-500 text-xs mt-1">{errors[f]}</p> : null;

  return (
    <div className="bg-slate-50 min-h-screen">
      <PageHeader 
        title="Clinics" 
        subtitle="Manage clinic locations & infrastructure" 
        actions={<Btn onClick={() => setShowModal(true)}><Icons.Plus/>Add New Clinic</Btn>}
      />
      
      <DataTable
        title="Clinic Directory"
        subtitle={`${clinics.length} clinics registered`}
        search={search}
        onSearch={v => { setSearch(v); setCurrentPage(1); }}
        searchPlaceholder="Search by name, city…"
        actions={<Btn variant="secondary"><Icons.Download />Export</Btn>}
        columns={["Clinic Name", "Contact", "Location", "GST Number", "Plan", "Status", "Actions"]}
        rows={
          isLoading
            ? [<TR key="loading"><td colSpan={7} className="text-center py-8 text-slate-400">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-teal-700 mr-2 align-middle"></div>
                Loading...
              </td></TR>]
            : filteredClinics.length === 0
              ? [<TR key="empty"><td colSpan={7} className="text-center py-8 text-slate-400">No clinics found</td></TR>]
              : filteredClinics.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(c => (
                <TR key={c.id}>
                  <TD>
                    <div className="font-semibold text-slate-800">{c.name}</div>
                  </TD>
                  <TD>
                    <div className="flex flex-col gap-0.5">
                      {c.phone && <span className="flex items-center gap-1.5 text-slate-600 text-xs">📞 {c.phone}</span>}
                      {c.email && <span className="flex items-center gap-1.5 text-slate-400 text-xs">✉ {c.email}</span>}
                    </div>
                  </TD>
                  <TD>
                    <div className="text-sm text-slate-700">{c.city}{c.state ? `, ${c.state}` : ""}</div>
                    {c.pincode && <div className="text-xs text-slate-400">{c.pincode}</div>}
                  </TD>
                  <TD mono>{c.gst_number || "—"}</TD>
                  <TD>
                    <span className="px-2 py-0.5 rounded-md text-xs font-bold border bg-blue-50 text-blue-700 border-blue-200">
                      {c.subscription_plan || "—"}
                    </span>
                  </TD>
                  <TD><Badge status={c.is_active ? "Active" : "Inactive"} /></TD>
                  <TD>
                    <div className="flex gap-1">
                      <button onClick={() => { setForm({...blank, ...c}); setShowModal(true); }} className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-slate-400"><Icons.Edit /></button>
                      <button onClick={() => handleDelete(c.id)} disabled={isSubmitting} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-slate-400 disabled:opacity-50"><Icons.Trash /></button>
                    </div>
                  </TD>
                </TR>
              ))
        }
        currentPage={currentPage} totalPages={Math.ceil(filteredClinics.length/pageSize)} onPageChange={setCurrentPage} totalItems={filteredClinics.length} pageSize={pageSize} onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
      />

      <RightDrawer 
        title="Register New Clinic" 
        open={showModal}
        onClose={handleClose}
      >
        <div className="h-full flex flex-col">
          <div className="px-8 py-6 bg-gradient-to-r from-teal-50 to-blue-50 border-b border-teal-100">
            <p className="text-sm text-gray-600">Fill in the details to get your clinic up and running</p>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6">
            {step === 0 && (
              <div className="space-y-5 animate-fade-in">
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
                  label={<>Clinic Name <Required /></>} 
                  value={form.name} 
                  onChange={v => setForm({...form, name: v})} 
                  placeholder="e.g. Apollo Clinic"
                  required
                />
                <Err f="name" />
                <Input 
                  label="GST Number" 
                  value={form.gst_number} 
                  onChange={v => setForm({...form, gst_number: v})} 
                  placeholder="29AABCC1234F1Z5"
                />
                <Err f="gst_number" />
                <Select 
                  label="Subscription Plan" 
                  value={form.subscription_plan} 
                  onChange={v => setForm({...form, subscription_plan: v})} 
                  options={[{label:"Starter", value:"Starter"}, {label:"Pro", value:"Pro"}, {label:"Enterprise", value:"Enterprise"}]}
                />
                <Input 
                  label={<>Address <Required /></>} 
                  value={form.address} 
                  onChange={v => setForm({...form, address: v})} 
                  placeholder="Street address"
                />
                <Err f="address" />
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-blue-100">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Icons.Calendar />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Contact & Location</p>
                    <p className="text-sm text-gray-500 mt-0.5">How to reach your clinic</p>
                  </div>
                </div>

                <div>
                  <Input label={<>Phone <Required /></>} value={form.phone} onChange={v => setField("phone", v.replace(/[^0-9]/g, "").slice(0,10))} placeholder="10-digit number" />
                  <Err f="phone" />
                </div>

                <div>
                  <Input label={<>Email <Required /></>} type="email" value={form.email} onChange={v => setField("email", v)} placeholder="email@example.com" />
                  <Err f="email" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label={<>City <Required /></>} 
                    value={form.city} 
                    onChange={v => setForm({...form, city: v})} 
                    placeholder="City"
                  />
                  <Input label = {<>State <Required /></>} value={form.state} onChange={v => setForm({...form, state: v})} placeholder="State"
                  />
                </div>

                <div>
                  <Input label={<>Pincode <Required /></>} value={form.pincode} onChange={v => setField("pincode", v.replace(/[^0-9]/g, "").slice(0,6))} placeholder="6-digit pincode" />
                  <Err f="pincode" />
                </div>

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