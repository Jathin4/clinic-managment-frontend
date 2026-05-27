import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Icons from '../components/Icons';
import { Badge, RightDrawer, Btn, Input, Select, Toast, PageHeader, DataTable, TR, TD } from '../components/UI';

// Reject value entirely if it starts with a space
const noLeadingSpace = val => (val.startsWith(" ") ? val.trimStart() : val);

const isDoctor = (role) => role === "Doctor" || role === "Admin+Doctor";


const UsersPage = () => {
  const { showLoading, hideLoading } = useApp();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "" });
  const [editingUser, setEditingUser] = useState(null);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});

  // USER = full multi-step flow | STAFF = simplified single-step
  const [registerMode, setRegisterMode] = useState("USER");

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const userData = sessionStorage.getItem("user");
  const userObj = userData ? JSON.parse(userData) : {};


  const [clinicInfo, setClinicInfo] = useState(null);

  useEffect(() => { fetchUsers(); fetchClinic(); }, []);

  const fetchClinic = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/clinicsread?clinic_id=${userObj?.clinic_id}`);
      const data = await response.json();
      if (response.ok) {
        const clinic = Array.isArray(data)
          ? data.find(c => c.id === userObj?.clinic_id)
          : data.clinic || data;
        setClinicInfo(clinic);
      }
    } catch (error) {
      console.error("Error fetching clinic:", error);
    }
  };

  const blank = {
    full_name: "", email: "", phone: "", role: "", date_of_birth: "",
    blood_group: "", specialization: "", qualifications: [], clinic_id: "", is_active: true
  };

  const blankStaff = {
    full_name: "", phone: "", date_of_birth: "", blood_group: "",
    role: "Staff", clinic_id: "", is_active: true
  };

  const [form, setForm] = useState(blank);
  const [staffForm, setStaffForm] = useState(blankStaff);
  const [qualificationForm, setQualificationForm] = useState({ qualification_name: "", institute_name: "" });

  const isDuplicate = (field, value) =>
    users.some(u => u[field]?.toLowerCase() === value?.toLowerCase() && u.id !== editingUser?.id);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const Required = () => <span className="text-red-500">*</span>;
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const calculateAge = (dob) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return null;
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone) => /^\d{10}$/.test(phone);

  const validateForm = () => {
    const newErrors = {};
    if (!form.full_name?.trim()) newErrors.full_name = "Full name is required";
    if (!form.email?.trim()) newErrors.email = "Email is required";
    else if (!isValidEmail(form.email)) newErrors.email = "Invalid email format";
    if (!form.phone?.trim()) newErrors.phone = "Phone is required";
    else if (!isValidPhone(form.phone)) newErrors.phone = "Phone must be exactly 10 digits";
    if (!form.date_of_birth) newErrors.date_of_birth = "Date of Birth is required";
    else if (new Date(form.date_of_birth) > new Date()) newErrors.date_of_birth = "Date of Birth cannot be in the future";
    if (!form.role) newErrors.role = "Role is required";
    if (isDoctor(form.role) && (!form.qualifications || form.qualifications.length === 0))
      newErrors.qualifications = "At least one qualification is required for Doctor role";
    if (isDoctor(form.role) && !form.specialization?.trim())
      newErrors.specialization = "Specialization is required for Doctor role";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStaffForm = () => {
    const newErrors = {};
    if (!staffForm.full_name?.trim()) newErrors.full_name = "Full name is required";
    if (!staffForm.phone?.trim()) newErrors.phone = "Phone is required";
    else if (!isValidPhone(staffForm.phone)) newErrors.phone = "Phone must be exactly 10 digits";
    if (!staffForm.date_of_birth) newErrors.date_of_birth = "Date of Birth is required";
    else if (new Date(staffForm.date_of_birth) > new Date()) newErrors.date_of_birth = "Date of Birth cannot be in the future";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showToast = (msg, type = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };



  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      showLoading("Loading users...", "users");
      const clinicId = userObj?.clinic_id;
      const response = await fetch(`${API_BASE_URL}/users_read_by_clinic/?clinic_id=${clinicId}`);
      const data = await response.json();
      if (response.status === 400) { showToast(data.error || "Bad Request", "warning"); return; }
      if (!response.ok) throw new Error(data.error || "Failed to load users");
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      showToast("Failed to load users");
    } finally {
      setIsLoading(false);
      hideLoading();
    }
  };

  const filteredUsers = users.filter((user) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    const formattedLogin = user.last_login ? (() => {
      const d = new Date(user.last_login);
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    })() : '';
    return [user.full_name, user.email, user.phone, user.role, formattedLogin,
    user.is_active ? "active" : "inactive"]
      .some(v => v?.toLowerCase().includes(query));
  });

  const handleEdit = (user) => {
    setEditingUser(user);
    // Detect if editing a Staff user → open in STAFF mode
    if (user.role === "Staff") {
      setRegisterMode("STAFF");
      setStaffForm({
        id: user.id,
        full_name: user.full_name || "",
        phone: user.phone || "",
        date_of_birth: user.date_of_birth || "",
        blood_group: user.blood_group || "",
        role: "Staff",
        clinic_id: user.clinic_id,
        is_active: user.is_active ?? true
      });
    } else {
      setRegisterMode("USER");
      setForm({
        id: user.id,
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "",
        date_of_birth: user.date_of_birth || "",
        blood_group: user.blood_group || "",
        specialization: user.specialization || "",
        qualifications: (user.qualifications || []).map(q => ({
          id: q.qualification_id || q.id || Date.now() + Math.random(),
          qualification_name: q.qualification_name || "",
          institute_name: q.institute_name || ""
        })),
        clinic_id: user.clinic_id,
        is_active: user.is_active ?? true
      });
    }
    setStep(0); setErrors({}); setShowModal(true);
  };

  const handleNext = () => {
    if (step === 0) {
      const e = {};
      if (!form.full_name?.trim()) e.full_name = "Full name is required";
      if (!form.email?.trim()) e.email = "Email is required";
      else if (!isValidEmail(form.email)) e.email = "Invalid email format";
      else if (isDuplicate("email", form.email)) e.email = "This email is already registered to another user";
      if (!form.phone?.trim()) e.phone = "Phone is required";
      else if (!isValidPhone(form.phone)) e.phone = "Phone must be exactly 10 digits";
      else if (isDuplicate("phone", form.phone)) e.phone = "This phone number is already registered to another user";
      setErrors(e);
      if (Object.keys(e).length > 0) return;
    }
    if (step === 1) {
      const e = {};
      if (!form.date_of_birth) e.date_of_birth = "Date of Birth is required";
      else {
        if (new Date(form.date_of_birth) > new Date()) e.date_of_birth = "Date of Birth cannot be in the future";
        else if (isDoctor(form.role) && calculateAge(form.date_of_birth) <= 24)
          e.date_of_birth = "Doctor must be older than 24 years";
      }
      if (!form.role) e.role = "Role is required";
      setErrors(e);
      if (Object.keys(e).length > 0) return;
      if (form.role !== "Doctor") return;
    }
    setStep(step + 1);
  };

  const handleBack = () => { setStep(Math.max(0, step - 1)); setErrors({}); };

  const handleClose = () => {
    setShowModal(false);
    setForm(blank);
    setStaffForm(blankStaff);
    setStep(0);
    setEditingUser(null);
    setErrors({});
    setRegisterMode("USER");
    setQualificationForm({ qualification_name: "", institute_name: "" });
  };

  const handleModeToggle = (mode) => {
    if (editingUser) return; // Don't allow toggle when editing
    setRegisterMode(mode);
    setStep(0);
    setErrors({});
    setForm(blank);
    setStaffForm(blankStaff);
  };

  const handleAddQualification = () => {
    if (!qualificationForm.qualification_name || !qualificationForm.institute_name) {
      showToast("Please fill in all qualification fields", "warning"); return;
    }
    setForm({ ...form, qualifications: [...form.qualifications, { ...qualificationForm, id: Date.now() }] });
    setQualificationForm({ qualification_name: "", institute_name: "" });
  };

  const handleRemoveQualification = (id) =>
    setForm({ ...form, qualifications: form.qualifications.filter(q => q.id !== id) });

  // ── Submit Staff ──────────────────────────────────────────────
  const handleAddStaff = async () => {
    if (!validateStaffForm()) { showToast("Please fix the errors before submitting", "error"); return; }
    try {
      setIsSubmitting(true);
      const payload = {
        id: editingUser ? editingUser.id : null,
        clinic_id: userObj.clinic_id,
        full_name: staffForm.full_name,
        email: "",
        phone: staffForm.phone,
        date_of_birth: staffForm.date_of_birth ? new Date(staffForm.date_of_birth).toISOString().split('T')[0] : "",
        blood_group: staffForm.blood_group || "",
        specialization: "",
        qualifications: [],
        password_hash: "",
        role: "Staff",
        is_active: true,
        user: "admin"
      };
      const response = await fetch(`${API_BASE_URL}/users_create_update/`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save staff");
      showToast(editingUser ? "Staff updated successfully" : "Staff added successfully", "success");
      handleClose(); fetchUsers();
    } catch (error) {
      console.error("Add staff error:", error);
      showToast(error.message || "Something went wrong", "error");
    } finally { setIsSubmitting(false); }
  };

  // ── Submit User ───────────────────────────────────────────────
  const handleAdd = async () => {
    if (form.role === "Doctor" && qualificationForm.qualification_name && qualificationForm.institute_name) {
      const updatedForm = { ...form, qualifications: [...form.qualifications, { ...qualificationForm, id: Date.now() }] };
      setForm(updatedForm);
      const e = {};
      if (!updatedForm.full_name?.trim()) e.full_name = "Full name is required";
      if (!isValidEmail(updatedForm.email)) e.email = "Invalid email format";
      else if (isDuplicate("email", updatedForm.email)) e.email = "This email is already registered to another user";
      if (!isValidPhone(updatedForm.phone)) e.phone = "Phone must be exactly 10 digits";
      else if (isDuplicate("phone", updatedForm.phone)) e.phone = "This phone number is already registered to another user";
      if (!form.date_of_birth) e.date_of_birth = "Date of Birth is required";
      else if (new Date(form.date_of_birth) > new Date()) e.date_of_birth = "Date of Birth cannot be in the future";
      else if (form.role === "Doctor" && calculateAge(form.date_of_birth) <= 24) e.date_of_birth = "Doctor must be older than 24 years";
      if (!updatedForm.role) e.role = "Role is required";
      if (updatedForm.role === "Doctor" && (!updatedForm.qualifications || updatedForm.qualifications.length === 0))
        e.qualifications = "At least one qualification is required for Doctor role";
      setErrors(e);
      if (Object.keys(e).length > 0) { showToast("Please fix the errors before submitting", "error"); return; }
      return submitUser(updatedForm);
    }
    if (!validateForm()) { showToast("Please fix the errors before submitting", "error"); return; }
    return submitUser(form);
  };

  const submitUser = async (formData) => {
    try {
      setIsSubmitting(true);
      const payload = {
        id: editingUser ? editingUser.id : null,
        clinic_id: userObj.clinic_id,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        date_of_birth: formData.date_of_birth ? new Date(formData.date_of_birth).toISOString().split('T')[0] : "",
        blood_group: formData.blood_group || "",
        specialization: formData.specialization,
        qualifications: formData.qualifications.map(q => ({
          qualification_name: q.qualification_name || "",
          institute_name: q.institute_name || ""
        })),
        password_hash: "",
        role: formData.role,
        is_active: true,
        user: "admin"
      };
      const response = await fetch(`${API_BASE_URL}/users_create_update/`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save user");
      showToast(editingUser ? "User updated successfully" : "User added successfully", "success");
      handleClose(); fetchUsers();
    } catch (error) {
      console.error("Add user error:", error);
      showToast(error.message || "Something went wrong", "error");
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteClick = async (userId) => {
    if (!window.confirm("Are you sure you want to deactivate this user?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/users_soft_delete_by_clinic/`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, clinic_id: userObj.clinic_id, user: "admin" })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Delete failed");
      showToast("User set to Inactive successfully", "success");
      fetchUsers();
    } catch (error) {
      console.error("Delete error:", error);
      showToast("Failed to delete user", "error");
    }
  };

  const roleColor = r => ({
    Admin: "bg-purple-50 text-purple-700 border-purple-100",
    Doctor: "bg-blue-50 text-blue-700 border-blue-100",
    Receptionist: "bg-amber-50 text-amber-700 border-amber-100"
  }[r] || "bg-gray-100 text-gray-600");

  return (
    <div className="bg-slate-50 min-h-screen">
      <PageHeader
        title="Users & Staff"
        subtitle={`${userObj?.clinic_name}${clinicInfo?.city ? ` • ${clinicInfo.city}, ${clinicInfo.state}` : ""}`}


        actions={
          <Btn onClick={() => { setEditingUser(null); setForm(blank); setStaffForm(blankStaff); setRegisterMode("USER"); setShowModal(true); }}>
            <Icons.Plus /> Add User
          </Btn>
        }
      />

      <DataTable
        title="User List"
        subtitle={`${users.length} users across all clinics`}
        search={search}
        onSearch={(v) => { setSearch(noLeadingSpace(v)); setCurrentPage(1); }}
        searchPlaceholder="Search by name, email, role…"
        actions={<Btn variant="secondary"><Icons.Download />Export</Btn>}
        columns={["Full Name", "Email", "Phone", "Role", "Status", "Last Login", "Actions"]}
        rows={
          isLoading
            ? [<TR key="loading"><td colSpan={7} className="text-center py-8 text-slate-400"><div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-teal-700 mr-2 align-middle" />Loading users...</td></TR>]
            : filteredUsers.length === 0
              ? [<TR key="empty"><td colSpan={7} className="text-center py-8 text-slate-400">No users found</td></TR>]
              : filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(u => (
                <TR key={u.id}>
                  <TD><span className="font-semibold text-slate-700">{u.full_name}</span></TD>
                  <TD>{u.email}</TD>
                  <TD>{u.phone}</TD>
                  <TD><span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${roleColor(u.role)}`}>{u.role}</span></TD>
                  <TD><Badge status={u.is_active ? "Active" : "Inactive"} /></TD>
                  <TD muted>{formatDate(u.last_login)}</TD>
                  <TD>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(u)} className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-slate-400"><Icons.Edit /></button>
                      <button onClick={() => handleDeleteClick(u.id)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-slate-400"><Icons.Trash /></button>
                    </div>
                  </TD>
                </TR>
              ))
        }
        currentPage={currentPage}
        totalPages={Math.ceil(filteredUsers.length / pageSize)}
        onPageChange={setCurrentPage}
        totalItems={filteredUsers.length}
        pageSize={pageSize}
        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
      />

      {showModal && (
        <RightDrawer
          title={editingUser ? (registerMode === "STAFF" ? "Edit Staff" : "Edit User") : "Register New User"}
          open={showModal}
          onClose={handleClose}
        >
          <div className="h-full flex flex-col">

            {/* ── Header band with subtitle + USER/STAFF toggle ── */}
            <div className="px-8 py-5 bg-gradient-to-r from-teal-50 to-blue-50 border-b border-teal-100 flex items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                {registerMode === "USER" && step === 0 && "Enter personal contact information"}
                {registerMode === "USER" && step === 1 && isDoctor(form.role) && "Add professional details and personal information"}
                {registerMode === "USER" && step === 1 && !isDoctor(form.role) && "Review and submit your information"}
                {registerMode === "USER" && step === 2 && isDoctor(form.role) && "Add qualifications and certifications"}
                {registerMode === "STAFF" && "Enter staff personal information"}
              </p>

              {/* USER | STAFF pill toggle — hidden when editing */}
              {!editingUser && (
                <div className="flex items-center bg-gray-200 rounded-full p-0.5 shrink-0">
                  <button
                    onClick={() => handleModeToggle("USER")}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${registerMode === "USER"
                      ? "bg-teal-600 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    USER
                  </button>
                  <button
                    onClick={() => handleModeToggle("STAFF")}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${registerMode === "STAFF"
                      ? "bg-teal-600 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    STAFF
                  </button>
                </div>
              )}
            </div>

            {/* ── Step progress bar (USER mode only) ── */}
            {registerMode === "USER" && (
              <div className="px-8 py-4 border-b border-gray-200 flex gap-2">
                {(isDoctor(form.role) ? [0, 1, 2] : [0, 1]).map(s => (
                  <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${s <= step ? 'bg-teal-600' : 'bg-gray-200'}`} />
                ))}
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-8 py-6">

              {/* ════════════════════════════════════════
                  STAFF MODE — single step form
              ════════════════════════════════════════ */}
              {registerMode === "STAFF" && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-teal-100">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600"><Icons.User /></div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Staff Information</p>
                      <p className="text-sm text-gray-500 mt-0.5">Basic personal information</p>
                    </div>
                  </div>

                  {/* Full Name */}
                  <div>
                    <Input
                      label={<>Full Name <Required /></>}
                      value={staffForm.full_name}
                      onChange={(v) => {
                        const clean = noLeadingSpace(v.replace(/[^a-zA-Z\s]/g, "").slice(0, 150));
                        setStaffForm({ ...staffForm, full_name: clean });
                        if (errors.full_name) setErrors({ ...errors, full_name: "" });
                      }}
                      placeholder="e.g. John Doe"
                      required
                    />
                    {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <Input
                      label={<>Phone Number <Required /></>}
                      value={staffForm.phone}
                      onChange={(v) => {
                        setStaffForm({ ...staffForm, phone: v.replace(/[^0-9]/g, "").slice(0, 10) });
                        if (errors.phone) setErrors({ ...errors, phone: "" });
                      }}
                      placeholder="10-digit phone number"
                      required
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <Input
                      label={<>Date of Birth <Required /></>}
                      type="date"
                      value={staffForm.date_of_birth}
                      onChange={(v) => {
                        setStaffForm({ ...staffForm, date_of_birth: v });
                        if (errors.date_of_birth) setErrors({ ...errors, date_of_birth: "" });
                      }}
                      required
                    />
                    {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth}</p>}
                    {staffForm.date_of_birth && <p className="text-xs text-gray-500 mt-1">Age: {calculateAge(staffForm.date_of_birth)} years</p>}
                  </div>

                  {/* Blood Group */}
                  <div>
                    <Select
                      label="Blood Group"
                      value={staffForm.blood_group}
                      onChange={(v) => setStaffForm({ ...staffForm, blood_group: v })}
                      options={[
                        { label: "O+", value: "O+" }, { label: "O-", value: "O-" },
                        { label: "A+", value: "A+" }, { label: "A-", value: "A-" },
                        { label: "B+", value: "B+" }, { label: "B-", value: "B-" },
                        { label: "AB+", value: "AB+" }, { label: "AB-", value: "AB-" }
                      ]}
                    />
                  </div>

                  {/* Role — locked to Staff, displayed like invoice number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                    <div className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 font-mono text-sm tracking-wide select-none cursor-not-allowed">
                      Staff
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Role is fixed for staff registration</p>
                  </div>
                </div>
              )}

              {/* ════════════════════════════════════════
                  USER MODE — existing multi-step flow
              ════════════════════════════════════════ */}
              {registerMode === "USER" && (
                <>
                  {step === 0 && (
                    <div className="space-y-5 animate-fade-in">
                      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-teal-100">
                        <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600"><Icons.User /></div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Personal Information</p>
                          <p className="text-sm text-gray-500 mt-0.5">Basic contact information</p>
                        </div>
                      </div>

                      <div>
                        <Input
                          label={<>Full Name <Required /></>}
                          value={form.full_name}
                          onChange={(v) => {
                            const clean = noLeadingSpace(v.replace(/[^a-zA-Z\s]/g, "").slice(0, 150));
                            setForm({ ...form, full_name: clean });
                            if (errors.full_name) setErrors({ ...errors, full_name: "" });
                          }}
                          placeholder="e.g. John Doe"
                          required
                        />
                        {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
                      </div>

                      <div>
                        <Input
                          label={<>Email <Required /></>}
                          type="email"
                          value={form.email}
                          onChange={(v) => {
                            const clean = v.replace(/\s/g, "").slice(0, 150);
                            setForm({ ...form, email: clean });
                            if (errors.email) setErrors({ ...errors, email: "" });
                          }}
                          placeholder="email@clinic.com"
                          required
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                      </div>

                      <div>
                        <Input
                          label={<>Phone Number <Required /></>}
                          value={form.phone}
                          onChange={(v) => {
                            setForm({ ...form, phone: v.replace(/[^0-9]/g, "").slice(0, 10) });
                            if (errors.phone) setErrors({ ...errors, phone: "" });
                          }}
                          placeholder="10-digit phone number"
                          required
                        />
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="space-y-5 animate-fade-in">
                      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-blue-100">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"><Icons.Briefcase /></div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Professional Details</p>
                          <p className="text-sm text-gray-500 mt-0.5">Role and professional information</p>
                        </div>
                      </div>

                      <div>
                        <Input
                          label={<>Date of Birth <Required /></>}
                          type="date"
                          value={form.date_of_birth}
                          onChange={(v) => { setForm({ ...form, date_of_birth: v }); if (errors.date_of_birth) setErrors({ ...errors, date_of_birth: "" }); }}
                          required
                        />
                        {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth}</p>}
                        {form.date_of_birth && <p className="text-xs text-gray-500 mt-1">Age: {calculateAge(form.date_of_birth)} years</p>}
                      </div>

                      <div>
                        <Select
                          label={<>Role <Required /></>}
                          value={form.role}
                          onChange={(v) => { setForm({ ...form, role: v }); if (errors.role) setErrors({ ...errors, role: "" }); }}
                          options={[
                            { label: "Admin", value: "Admin" },
                            { label: "Doctor", value: "Doctor" },
                            { label: "Pharmacist", value: "Pharmacist" },
                            { label: "Diagnosist", value: "Diagnosist" },
                            { label: "Receptionist", value: "Receptionist" },
                            { label: "Admin + Doctor", value: "Admin+Doctor" },
                            { label: "Admin + Pharmacist", value: "Admin+Pharmacist" },
                            { label: "Receptionist + Pharmacist", value: "Receptionist+Pharmacist" },  // ✅ ADD THIS
                          ]}
                          required
                        />
                        {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
                      </div>

                      <div>
                        <Select
                          label={<>Blood Group <Required /></>}
                          value={form.blood_group}
                          onChange={(v) => setForm({ ...form, blood_group: v })}
                          options={[
                            { label: "O+", value: "O+" }, { label: "O-", value: "O-" },
                            { label: "A+", value: "A+" }, { label: "A-", value: "A-" },
                            { label: "B+", value: "B+" }, { label: "B-", value: "B-" },
                            { label: "AB+", value: "AB+" }, { label: "AB-", value: "AB-" }
                          ]}
                          required
                        />
                      </div>

                      <div>
                        <Input
                          label={<>Specialization {isDoctor(form.role) && <Required />}</>}
                          value={form.specialization}
                          onChange={(v) => {
                            setForm({ ...form, specialization: noLeadingSpace(v.slice(0, 150)) });
                            if (errors.specialization) setErrors({ ...errors, specialization: "" });
                          }}
                          placeholder="e.g. Cardiology, General Practice"
                        />
                        {errors.specialization && <p className="text-red-500 text-xs mt-1">{errors.specialization}</p>}
                      </div>
                    </div>
                  )}

                  {step === 2 && isDoctor(form.role) && (
                    <div className="space-y-5 animate-fade-in">
                      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-purple-100">
                        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600"><Icons.BookOpen /></div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Qualifications</p>
                          <p className="text-sm text-gray-500 mt-0.5">Add certifications and educational qualifications</p>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <p className="text-sm font-semibold text-gray-700 mb-3">Add New Qualification</p>
                        <div className="space-y-3">
                          <Input
                            label={<>Qualification Name <Required /></>}
                            value={qualificationForm.qualification_name}
                            onChange={(v) => setQualificationForm({ ...qualificationForm, qualification_name: noLeadingSpace(v.slice(0, 150)) })}
                            placeholder="e.g. MBBS, MD, BDS"
                          />
                          <Input
                            label={<>Institute Name <Required /></>}
                            value={qualificationForm.institute_name}
                            onChange={(v) => setQualificationForm({ ...qualificationForm, institute_name: noLeadingSpace(v.slice(0, 200)) })}
                            placeholder="e.g. Delhi Medical University"
                          />
                          <Btn onClick={handleAddQualification} className="w-full">
                            <Icons.Plus /> Add Qualification
                          </Btn>
                        </div>
                      </div>

                      {form.qualifications.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-gray-700">Qualifications Added</p>
                          {form.qualifications.map((qual) => (
                            <div key={qual.id} className="flex items-start justify-between p-3 bg-teal-50 rounded-lg border border-teal-200">
                              <div className="flex-1">
                                <p className="font-semibold text-sm text-teal-900">{qual.qualification_name}</p>
                                <p className="text-xs text-teal-700">{qual.institute_name}</p>
                              </div>
                              <button onClick={() => handleRemoveQualification(qual.id)} className="text-teal-600 hover:text-teal-800 p-1.5 hover:bg-teal-100 rounded-lg transition-colors">
                                <Icons.Trash />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {errors.qualifications && <p className="text-red-500 text-xs mt-2">{errors.qualifications}</p>}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Footer buttons ── */}
            <div className="px-8 py-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
              {registerMode === "USER" ? (
                <>
                  <Btn variant="ghost" onClick={handleBack} disabled={step === 0 || isSubmitting}>‹ Back</Btn>
                  <div className="flex gap-2">
                    <Btn variant="secondary" onClick={handleClose} disabled={isSubmitting}>Cancel</Btn>
                    {isDoctor(form.role)
                      ? step < 2
                        ? <Btn onClick={handleNext} disabled={isSubmitting || !form.full_name || !form.email || !form.phone}>Next ›</Btn>
                        : <Btn onClick={handleAdd} disabled={isSubmitting}><Icons.Check />{isSubmitting ? "Saving..." : editingUser ? "Update User" : "Add User"}</Btn>
                      : step < 1
                        ? <Btn onClick={handleNext} disabled={isSubmitting || !form.full_name || !form.email || !form.phone}>Next ›</Btn>
                        : <Btn onClick={handleAdd} disabled={isSubmitting}><Icons.Check />{isSubmitting ? "Saving..." : editingUser ? "Update User" : "Add User"}</Btn>
                    }
                  </div>
                </>
              ) : (
                <>
                  <div />
                  <div className="flex gap-2">
                    <Btn variant="secondary" onClick={handleClose} disabled={isSubmitting}>Cancel</Btn>
                    <Btn onClick={handleAddStaff} disabled={isSubmitting}>
                      <Icons.Check />{isSubmitting ? "Saving..." : editingUser ? "Update Staff" : "Add Staff"}
                    </Btn>
                  </div>
                </>
              )}
            </div>
          </div>
        </RightDrawer>
      )}

      {toast.message && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "" })} />
      )}
    </div>
  );
};

export default UsersPage;