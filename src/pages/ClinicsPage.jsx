import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Icons from '../components/Icons';
import { Badge, RightDrawer, Btn, Input, Select, Toast, PageHeader, DataTable, TR, TD } from '../components/UI';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const blank = { name: "", gst_number: "", phone: "", email: "", Address: "", city: "", state: "", pincode: "", subscription_plan: "Select" };

// Strip any leading whitespace from value
const noLeadingSpace = val => val.replace(/^\s+/, "");

// Block spacebar when field is empty
const blockSpaceIfEmpty = e => { if (e.key === " " && !e.target.value.trim()) e.preventDefault(); };

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
    const [form, setForm] = useState(blank);

    const showToast = (msg, type = "success") => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000); };
    const Required = () => <span className="text-red-500">*</span>;
    const Err = ({ f }) => errors[f] ? <p className="text-red-500 text-xs mt-1">{errors[f]}</p> : null;
    const setField = (key, val) => { setForm(p => ({ ...p, [key]: val })); setErrors(p => ({ ...p, [key]: undefined })); };
    const setTextF = (key, val) => setField(key, noLeadingSpace(val));

    const validateStep0 = () => {
        const e = {};
        if (!form.name.trim()) e.name = "Required";
        if (!form.Address.trim()) e.Address = "Required";
        setErrors(e);
        return !Object.keys(e).length;
    };

    const validateStep1 = () => {
        const e = {};
        if (!form.email.trim()) e.email = "Required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
        else if (clinics.some(c => c.email?.toLowerCase() === form.email.toLowerCase() && c.id !== form.id)) e.email = "Email already used";

        if (!form.phone.trim()) e.phone = "Required";
        else if (!/^\d{10}$/.test(form.phone)) e.phone = "Must be 10 digits";
        else if (clinics.some(c => c.phone === form.phone && c.id !== form.id)) e.phone = "Phone already used";

        if (!form.city?.trim()) e.city = "Required";
        if (!form.state?.trim()) e.state = "Required";
        if (!form.pincode.trim()) e.pincode = "Required";
        else if (!/^\d{6}$/.test(form.pincode)) e.pincode = "Must be 6 digits";

        setErrors(e);
        return !Object.keys(e).length;
    };

    useEffect(() => { fetchClinics(); }, []);

    const fetchClinics = async () => {
        try {
            setIsLoading(true);
            showLoading("Loading clinics...", "clinics");
            const res = await fetch(`${API_BASE_URL}/clinicsread`);
            if (!res.ok) throw new Error();
            setClinics(await res.json() || []);
        } catch { showToast('Failed to load clinics', 'error'); }
        finally { setIsLoading(false); hideLoading(); }
    };

    const handleAdd = async () => {
        if (!validateStep1()) return;
        try {
            setIsSubmitting(true);
            const res = await fetch(`${API_BASE_URL}/clinic_create_update/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, id: form.id || null, created_by: "admin" })
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Failed');
            showToast(form.id ? 'Clinic updated successfully' : 'Clinic added successfully');
            setShowModal(false); setForm(blank); setStep(0);
            await fetchClinics();
        } catch (err) { showToast(err.message || 'Failed to add clinic', 'error'); }
        finally { setIsSubmitting(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this clinic?')) return;
        try {
            setIsSubmitting(true);
            const res = await fetch(`${API_BASE_URL}/clinic_delete/`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, modified_by: "admin" })
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Failed');
            showToast('Clinic deleted successfully');
            await fetchClinics();
        } catch (err) { showToast(err.message || 'Failed to delete clinic', 'error'); }
        finally { setIsSubmitting(false); }
    };

    const handleNext = () => { if (validateStep0()) setStep(1); };
    const handleBack = () => setStep(0);
    const handleClose = () => { setShowModal(false); setForm(blank); setStep(0); };

    const filteredClinics = clinics.filter(c => {
        const q = search.trim().toLowerCase();
        return !q || [c.name, c.city, c.state, c.phone, c.email, c.gst_number, c.pincode, c.subscription_plan, c.Address]
            .some(v => v?.toLowerCase().includes(q));
    });

    return (
        <div className="bg-slate-50 min-h-screen">
            <PageHeader
                title="Clinics"
                subtitle="Manage clinic locations & infrastructure"
                actions={<Btn onClick={() => setShowModal(true)}><Icons.Plus />Add New Branch</Btn>}
            />

            <DataTable
                title="Clinic Directory"
                subtitle={`${clinics.length} clinics registered`}
                search={search}
                onSearch={v => { setSearch(v.trimStart()); setCurrentPage(1); }}
                searchPlaceholder="Search by Name, Location…"
                actions={<Btn variant="secondary"><Icons.Download />Export</Btn>}
                columns={["Clinic Name", "Contact", "Location", "GST Number", "Plan", "Status", "Actions"]}
                rows={
                    isLoading
                        ? [<TR key="loading"><td colSpan={7} className="text-center py-8 text-slate-400"><div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-teal-700 mr-2 align-middle" />Loading...</td></TR>]
                        : filteredClinics.length === 0
                            ? [<TR key="empty"><td colSpan={7} className="text-center py-8 text-slate-400">No clinics found</td></TR>]
                            : filteredClinics.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(c => (
                                <TR key={c.id}>
                                    <TD><div className="font-semibold text-slate-800">{c.name}</div></TD>
                                    <TD>
                                        <div className="flex flex-col gap-0.5">
                                            {c.phone && <span className="text-slate-600 text-xs">📞 {c.phone}</span>}
                                            {c.email && <span className="text-slate-400 text-xs">✉ {c.email}</span>}
                                        </div>
                                    </TD>
                                    <TD>
                                        <div className="text-sm text-slate-700">{c.city}{c.state ? `, ${c.state}` : ""}</div>
                                        {c.pincode && <div className="text-xs text-slate-400">{c.pincode}</div>}
                                    </TD>
                                    <TD mono>{c.gst_number || "—"}</TD>
                                    <TD><span className="px-2 py-0.5 rounded-md text-xs font-bold border bg-blue-50 text-blue-700 border-blue-200">{c.subscription_plan || "—"}</span></TD>
                                    <TD><Badge status={c.is_active ? "Active" : "Inactive"} /></TD>
                                    <TD>
                                        <div className="flex gap-1">
                                            <button onClick={() => { setForm({ ...blank, ...c }); setShowModal(true); }} className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-slate-400"><Icons.Edit /></button>
                                            <button onClick={() => handleDelete(c.id)} disabled={isSubmitting} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-slate-400 disabled:opacity-50"><Icons.Trash /></button>
                                        </div>
                                    </TD>
                                </TR>
                            ))
                }
                currentPage={currentPage} totalPages={Math.ceil(filteredClinics.length / pageSize)} onPageChange={setCurrentPage}
                totalItems={filteredClinics.length} pageSize={pageSize} onPageSizeChange={s => { setPageSize(s); setCurrentPage(1); }}
            />

            <RightDrawer title={form.id ? "Update Clinic" : "Register New Branch"} open={showModal} onClose={handleClose}>
                <div className="h-full flex flex-col">
                    <div className="px-8 py-6 bg-gradient-to-r from-teal-50 to-blue-50 border-b border-teal-100">
                        <p className="text-sm text-gray-600">Fill in the details to get your clinic up and running</p>
                    </div>

                    <div className="flex-1 overflow-y-auto px-8 py-6">
                        {step === 0 && (
                            <div className="space-y-5 animate-fade-in">
                                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-teal-100">
                                    <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600"><Icons.Building /></div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Essential Details</p>
                                        <p className="text-sm text-gray-500 mt-0.5">Basic information about your clinic</p>
                                    </div>
                                </div>
                                <div>
                                    <Input label={<>Clinic Name <Required /></>} value={form.name}
                                        onChange={v => setTextF("name", v.slice(0, 150))} onKeyDown={blockSpaceIfEmpty}
                                        placeholder="e.g. Apollo Clinic" maxLength={150} required />
                                    <Err f="name" />
                                </div>
                                <div>
                                    <Input label="GST Number" value={form.gst_number}
                                        onChange={v => setTextF("gst_number", v.slice(0, 20))} onKeyDown={blockSpaceIfEmpty}
                                        placeholder="29AABCC1234F1Z5" maxLength={20} />
                                    <Err f="gst_number" />
                                </div>
                                <Select label="Subscription Plan" value={form.subscription_plan}
                                    onChange={v => setForm({ ...form, subscription_plan: v })}
                                    options={[{ label: "Starter", value: "Starter" }, { label: "Pro", value: "Pro" }, { label: "Enterprise", value: "Enterprise" }]} />
                                <div>
                                    <Input label={<>Address <Required /></>} value={form.Address}
                                        onChange={v => setTextF("Address", v.slice(0, 500))} onKeyDown={blockSpaceIfEmpty}
                                        placeholder="Street Address" maxLength={500} required />
                                    <Err f="Address" />
                                </div>
                            </div>
                        )}

                        {step === 1 && (
                            <div className="space-y-5 animate-fade-in">
                                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-blue-100">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"><Icons.Calendar /></div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Contact & Location</p>
                                        <p className="text-sm text-gray-500 mt-0.5">How to reach your clinic</p>
                                    </div>
                                </div>
                                <div>
                                    <Input label={<>Phone <Required /></>} value={form.phone}
                                        onChange={v => setField("phone", v.replace(/[^0-9]/g, "").slice(0, 10))}
                                        placeholder="10-digit number" maxLength={10} />
                                    <Err f="phone" />
                                </div>
                                <div>
                                    <Input label={<>Email <Required /></>} type="email" value={form.email}
                                        onChange={v => setTextF("email", v.slice(0, 150))} onKeyDown={blockSpaceIfEmpty}
                                        placeholder="email@example.com" maxLength={150} />
                                    <Err f="email" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Input label={<>City <Required /></>} value={form.city}
                                            onChange={v => setTextF("city", v.slice(0, 100))} onKeyDown={blockSpaceIfEmpty}
                                            placeholder="City" maxLength={100} />
                                        <Err f="city" />
                                    </div>
                                    <div>
                                        <Input label={<>State <Required /></>} value={form.state}
                                            onChange={v => setTextF("state", v.slice(0, 100))} onKeyDown={blockSpaceIfEmpty}
                                            placeholder="State" maxLength={100} />
                                        <Err f="state" />
                                    </div>
                                </div>
                                <div>
                                    <Input label={<>Pincode <Required /></>} value={form.pincode}
                                        onChange={v => setField("pincode", v.replace(/[^0-9]/g, "").slice(0, 6))}
                                        placeholder="6-digit pincode" maxLength={6} />
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
                        <div className="text-xs text-gray-500 font-medium">Step {step + 1} of 2</div>
                        <div className="flex gap-3">
                            <Btn variant="secondary" onClick={step === 0 ? handleClose : handleBack}>
                                {step === 0 ? "Cancel" : <><Icons.ChevronLeft /> Back</>}
                            </Btn>
                            <Btn onClick={step === 0 ? handleNext : handleAdd} disabled={(step === 0 && !form.name) || isSubmitting}>
                                {isSubmitting ? '...' : step === 0 ? <>Next <Icons.ChevronRight /></> : <>{form.id ? "✓ Update Clinic" : "✓ Register Clinic"}</>}
                            </Btn>
                        </div>
                    </div>
                </div>
            </RightDrawer>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default ClinicsPage;