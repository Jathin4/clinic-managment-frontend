import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

import Icons from '../components/Icons';
import { Badge, RightDrawer, Btn, Input, Select, Toast, PageHeader, DataTable, TR, TD } from '../components/UI';

const UsersPage = () => {

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "" });
  const [editingUser, setEditingUser] = useState(null);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const blank = { 
    full_name:"", 
    email:"", 
    phone:"", 
    role:"Receptionist", 
    date_of_birth:"",
    blood_group:"",
    specialization:"",
    qualifications: [],
    clinic_id:"1", 
    is_active:true 
  };
  const [form, setForm] = useState(blank);
  const [qualificationForm, setQualificationForm] = useState({ qualification_name: "", institute_name: "" });

  /* ---------------- PAGINATION ---------------- */

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ---------------- UTILITY FUNCTIONS -------- */

  // Calculate age from DOB
  const calculateAge = (dob) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return null;
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Email validation
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Phone validation
  const isValidPhone = (phone) => /^\d{10}$/.test(phone);

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!form.full_name || form.full_name.trim() === "") {
      newErrors.full_name = "Full name is required";
    }

    if (!form.email || form.email.trim() === "") {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(form.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!form.phone || form.phone.trim() === "") {
      newErrors.phone = "Phone is required";
    } else if (!isValidPhone(form.phone)) {
      newErrors.phone = "Phone must be exactly 10 digits";
    }

    if (!form.date_of_birth) {
      newErrors.date_of_birth = "Date of Birth is required";
    } else {
      const dobDate = new Date(form.date_of_birth);
      const today = new Date();
      if (dobDate > today) {
        newErrors.date_of_birth = "Date of Birth cannot be in the future";
      }
    }

    if (!form.role) {
      newErrors.role = "Role is required";
    }

    // For Doctor role, at least one qualification is required
    if (form.role === "Doctor" && (!form.qualifications || form.qualifications.length === 0)) {
      newErrors.qualifications = "At least one qualification is required for Doctor role";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ---------------- PAGINATION ---------------- */

  /* ---------------- TOAST ---------------- */

  const showToast = (msg, type = "success") => {
    setToast({ message: msg, type });

    setTimeout(() => {
      setToast({ message: "", type: "" });
    }, 3000);
  };

  /* ---------------- FETCH USERS ---------------- */

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {

    try {

      setIsLoading(true);

      const clinicId = 1;

      const response = await fetch(
        `${API_BASE_URL}/users_read_by_clinic/?clinic_id=${clinicId}`
      );

      const data = await response.json();

      if (response.status === 400) {
        showToast(data.error || "Bad Request", "warning");
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to save user");
      }

      setUsers(data.users || []);

    } catch (error) {

      console.error("Error fetching users:", error);
      showToast("Failed to load users");

    } finally {

      setIsLoading(false);

    }
  };

  /* ---------------- SEARCH FILTER ---------------- */

  const filteredUsers = users.filter((user) => {

    const query = search.toLowerCase().trim();

    return (
      user.full_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.phone?.toLowerCase().includes(query) ||
      user.role?.toLowerCase().includes(query) ||
      (user.is_active ? "active" : "inactive").includes(query)
    );
  });

  /* ---------------- EDIT USER ---------------- */

  const handleEdit = (user) => {
    setEditingUser(user);
    setForm({
      id: user.id,
      full_name: user.full_name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "Receptionist",
      date_of_birth: user.date_of_birth || "",
      blood_group: user.blood_group || "",
      specialization: user.specialization || "",
      qualifications: user.qualifications || [],
      clinic_id: user.clinic_id || 1,
      is_active: user.is_active ?? true
    });
    setStep(0);
    setErrors({});
    setShowModal(true);
  };

  /* ---------------- ADD / UPDATE USER ---------------- */

  const handleNext = () => {
    if (step === 0) {
      // Validate step 0
      const step0Errors = {};
      if (!form.full_name || form.full_name.trim() === "") {
        step0Errors.full_name = "Full name is required";
      }
      if (!form.email || form.email.trim() === "") {
        step0Errors.email = "Email is required";
      } else if (!isValidEmail(form.email)) {
        step0Errors.email = "Invalid email format";
      }
      if (!form.phone || form.phone.trim() === "") {
        step0Errors.phone = "Phone is required";
      } else if (!isValidPhone(form.phone)) {
        step0Errors.phone = "Phone must be exactly 10 digits";
      }
      setErrors(step0Errors);
      if (Object.keys(step0Errors).length > 0) return;
    }
    if (step === 1) {
      // Validate step 1
      const step1Errors = {};
      if (!form.date_of_birth) {
        step1Errors.date_of_birth = "Date of Birth is required";
      } else {
        const dobDate = new Date(form.date_of_birth);
        const today = new Date();
        if (dobDate > today) {
          step1Errors.date_of_birth = "Date of Birth cannot be in the future";
        }
      }
      if (!form.role) {
        step1Errors.role = "Role is required";
      }
      setErrors(step1Errors);
      if (Object.keys(step1Errors).length > 0) return;
      
      // Don't proceed to step 2 if role is not Doctor
      if (form.role !== "Doctor") return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(Math.max(0, step - 1));
    setErrors({});
  };

  const handleClose = () => {
    setShowModal(false);
    setForm(blank);
    setStep(0);
    setEditingUser(null);
    setErrors({});
    setQualificationForm({ qualification_name: "", institute_name: "" });
  };

  const handleAddQualification = () => {
    if (!qualificationForm.qualification_name || !qualificationForm.institute_name) {
      showToast("Please fill in all qualification fields", "warning");
      return;
    }
    setForm({
      ...form,
      qualifications: [...form.qualifications, { ...qualificationForm, id: Date.now() }]
    });
    setQualificationForm({ qualification_name: "", institute_name: "" });
  };

  const handleRemoveQualification = (id) => {
    setForm({
      ...form,
      qualifications: form.qualifications.filter(q => q.id !== id)
    });
  };

  const handleAdd = async () => {
    // Auto-add qualification if fields are filled but not added yet
    if (form.role === "Doctor" && qualificationForm.qualification_name && qualificationForm.institute_name) {
      const updatedForm = {
        ...form,
        qualifications: [...form.qualifications, { ...qualificationForm, id: Date.now() }]
      };
      setForm(updatedForm);
      
      // Validate with updated form
      const newErrors = {};
      // ... validation logic
      if (!updatedForm.full_name || updatedForm.full_name.trim() === "") {
        newErrors.full_name = "Full name is required";
      }
      if (!updatedForm.email || updatedForm.email.trim() === "") {
        newErrors.email = "Email is required";
      } else if (!isValidEmail(updatedForm.email)) {
        newErrors.email = "Invalid email format";
      }
      if (!updatedForm.phone || updatedForm.phone.trim() === "") {
        newErrors.phone = "Phone is required";
      } else if (!isValidPhone(updatedForm.phone)) {
        newErrors.phone = "Phone must be exactly 10 digits";
      }
      if (!updatedForm.date_of_birth) {
        newErrors.date_of_birth = "Date of Birth is required";
      } else {
        const dobDate = new Date(updatedForm.date_of_birth);
        const today = new Date();
        if (dobDate > today) {
          newErrors.date_of_birth = "Date of Birth cannot be in the future";
        }
      }
      if (!updatedForm.role) {
        newErrors.role = "Role is required";
      }
      if (updatedForm.role === "Doctor" && (!updatedForm.qualifications || updatedForm.qualifications.length === 0)) {
        newErrors.qualifications = "At least one qualification is required for Doctor role";
      }

      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) {
        showToast("Please fix the errors before submitting", "error");
        return;
      }
      
      // Proceed with submission
      return submitUser(updatedForm);
    }

    if (!validateForm()) {
      showToast("Please fix the errors before submitting", "error");
      return;
    }

    return submitUser(form);
  };

  const submitUser = async (formData) => {
    try {
      setIsSubmitting(true);

      // Prepare qualifications array with both fields
      const qualificationsData = formData.qualifications.map(qual => ({
        qualification_name: qual.qualification_name || "",
        institute_name: qual.institute_name || ""
      }));

      const payload = {
        id: editingUser ? editingUser.id : null,
        clinic_id: 1,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        date_of_birth: formData.date_of_birth,
        blood_group: formData.blood_group,
        specialization: formData.specialization,
        qualifications: qualificationsData,
        password_hash: editingUser ? "" : "",
        role: formData.role,
        is_active: true,
        user: "admin"
      };

      const response = await fetch(`${API_BASE_URL}/users_create_update/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save user");
      }

      showToast(
        editingUser ? "User updated successfully" : "User added successfully",
        "success"
      );

      handleClose();
      fetchUsers();

    } catch (error) {
      console.error("Add user error:", error);
      showToast(error.message || "Something went wrong", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------------- DELETE USER ---------------- */

  const handleDeleteClick = async (userId) => {

    const confirmDelete = window.confirm("Are you sure you want to deactivate this user?");
    if (!confirmDelete) return;

    try {

      const requestBody = {
        user_id: userId,
        clinic_id: 1,
        user: "admin"
      };

      const response = await fetch(`${API_BASE_URL}/users_soft_delete_by_clinic/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
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

  /* ---------------- ROLE COLOR ---------------- */

  const roleColor = r => ({
    Admin:"bg-purple-50 text-purple-700 border-purple-100",
    Doctor:"bg-blue-50 text-blue-700 border-blue-100",
    Receptionist:"bg-amber-50 text-amber-700 border-amber-100"
  }[r] || "bg-gray-100 text-gray-600");

  /* ---------------- UI ---------------- */

  return (

    <div className="bg-slate-50 min-h-screen">

      <PageHeader
        title="Users & Staff"
        subtitle="Manage roles and access"
        actions={
          <Btn
            onClick={() => {
              setEditingUser(null);
              setForm(blank);
              setShowModal(true);
            }}
          >
            <Icons.Plus/> Add User
          </Btn>
        }
      />

      <DataTable

        title="User List"
        subtitle={`${users.length} users across all clinics`}

        search={search}

        onSearch={(v)=>{
          setSearch(v);
          setCurrentPage(1);
        }}

        searchPlaceholder="Search by name, email, role…"

        actions={<Btn variant="secondary"><Icons.Download/>Export</Btn>}

        columns={[
          "Full Name",
          "Email",
          "Phone",
          "Role",
          "Status",
          "Last Login",
          "Actions"
        ]}

        rows={
          isLoading
            ? [
                <TR key="loading">
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-teal-700 mr-2 align-middle"></div>
                    Loading users...
                  </td>
                </TR>
              ]
            : filteredUsers.length === 0
              ? [
                  <TR key="empty">
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No users found
                    </td>
                  </TR>
                ]
              : filteredUsers
                  .slice((currentPage-1)*pageSize,currentPage*pageSize)
                  .map(u=>(
                    <TR key={u.id}>

                      <TD>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{background:"linear-gradient(135deg,#0E6C68,#14A3A0)"}}
                          >
                            {u.full_name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                          </div>

                          <span className="font-semibold text-slate-700">
                            {u.full_name}
                          </span>
                        </div>
                      </TD>

                      <TD>{u.email}</TD>

                      <TD>{u.phone}</TD>

                      <TD>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${roleColor(u.role)}`}>
                          {u.role}
                        </span>
                      </TD>

                      <TD>
                        <Badge status={u.is_active ? "Active" : "Inactive"} />
                      </TD>

                      <TD muted>{u.last_login}</TD>

                      <TD>
                        <div className="flex gap-1">

                          <button
                            onClick={() => handleEdit(u)}
                            className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-slate-400"
                          >
                            <Icons.Edit/>
                          </button>

                          <button
                            onClick={() => handleDeleteClick(u.id)}
                            className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-slate-400"
                          >
                            <Icons.Trash/>
                          </button>

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

        onPageSizeChange={(size)=>{
          setPageSize(size);
          setCurrentPage(1);
        }}

      />

      {showModal && (
        <RightDrawer 
          title={editingUser ? "Edit User" : "Register New User"} 
          open={showModal}
          onClose={handleClose}
        >
          <div className="h-full flex flex-col">
            {/* Header with subtitle */}
            <div className="px-8 py-6 bg-gradient-to-r from-teal-50 to-blue-50 border-b border-teal-100">
              <p className="text-sm text-gray-600">
                {step === 0 && "Enter personal contact information"}
                {step === 1 && form.role === "Doctor" && "Add professional details and personal information"}
                {step === 1 && form.role !== "Doctor" && "Review and submit your information"}
                {step === 2 && form.role === "Doctor" && "Add qualifications and certifications"}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="px-8 py-4 border-b border-gray-200 flex gap-2">
              {form.role === "Doctor" 
                ? [0, 1, 2].map(s => (
                    <div 
                      key={s}
                      className={`flex-1 h-1.5 rounded-full transition-all ${s <= step ? 'bg-teal-600' : 'bg-gray-200'}`}
                    />
                  ))
                : [0, 1].map(s => (
                    <div 
                      key={s}
                      className={`flex-1 h-1.5 rounded-full transition-all ${s <= step ? 'bg-teal-600' : 'bg-gray-200'}`}
                    />
                  ))
              }
            </div>

            {/* Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {step === 0 && (
                <div className="space-y-5 animate-fade-in">
                  {/* Step Header */}
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-teal-100">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                      <Icons.User />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Personal Information</p>
                      <p className="text-sm text-gray-500 mt-0.5">Basic contact information</p>
                    </div>
                  </div>

                  <div>
                    <Input
                      label="Full Name"
                      value={form.full_name}
                      onChange={(v) => {
                        const onlyLetters = v.replace(/[^a-zA-Z\s]/g, "");
                        setForm({ ...form, full_name: onlyLetters });
                        if (errors.full_name) setErrors({ ...errors, full_name: "" });
                      }}
                      placeholder="e.g. John Doe"
                      required
                    />
                    {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
                  </div>

                  <div>
                    <Input
                      label="Email Address"
                      type="email"
                      value={form.email}
                      onChange={(v) => {
                        setForm({ ...form, email: v });
                        if (errors.email) setErrors({ ...errors, email: "" });
                      }}
                      placeholder="email@clinic.com"
                      required
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <Input
                      label="Phone Number"
                      value={form.phone}
                      onChange={(v) => {
                        let numbersOnly = v.replace(/[^0-9]/g, "");
                        // Limit to exactly 10 digits
                        numbersOnly = numbersOnly.slice(0, 10);
                        setForm({ ...form, phone: numbersOnly });
                        if (errors.phone) setErrors({ ...errors, phone: "" });
                      }}
                      placeholder="10-digit phone number"
                      maxLength="10"
                      required
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5 animate-fade-in">
                  {/* Step Header */}
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-blue-100">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <Icons.Briefcase />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Professional Details</p>
                      <p className="text-sm text-gray-500 mt-0.5">Role and professional information</p>
                    </div>
                  </div>

                  <div>
                    <Input
                      label="Date of Birth"
                      type="date"
                      value={form.date_of_birth}
                      onChange={(v) => {
                        setForm({ ...form, date_of_birth: v });
                        if (errors.date_of_birth) setErrors({ ...errors, date_of_birth: "" });
                      }}
                      required
                    />
                    {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth}</p>}
                    {form.date_of_birth && (
                      <p className="text-xs text-gray-500 mt-1">Age: {calculateAge(form.date_of_birth)} years</p>
                    )}
                  </div>

                  <div>
                    <Select
                      label="Role"
                      value={form.role}
                      onChange={(v) => {
                        setForm({ ...form, role: v });
                        if (errors.role) setErrors({ ...errors, role: "" });
                      }}
                      options={[
                        { label: "Admin", value: "Admin" },
                        { label: "Doctor", value: "Doctor" },
                        { label: "Receptionist", value: "Receptionist" }
                      ]}
                    />
                    {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
                  </div>

                  <div>
                    <Select
                      label="Blood Group"
                      value={form.blood_group}
                      onChange={(v) => setForm({ ...form, blood_group: v })}
                      options={[
                        { label: "O+", value: "O+" },
                        { label: "O-", value: "O-" },
                        { label: "A+", value: "A+" },
                        { label: "A-", value: "A-" },
                        { label: "B+", value: "B+" },
                        { label: "B-", value: "B-" },
                        { label: "AB+", value: "AB+" },
                        { label: "AB-", value: "AB-" }
                      ]}
                    />
                  </div>

                  <div>
                    <Input
                      label="Specialization"
                      value={form.specialization}
                      onChange={(v) => setForm({ ...form, specialization: v })}
                      placeholder="e.g. Cardiology, General Practice"
                    />
                  </div>
                </div>
              )}

              {step === 2 && form.role === "Doctor" && (
                <div className="space-y-5 animate-fade-in">
                  {/* Step Header */}
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-purple-100">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                      <Icons.BookOpen />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Qualifications</p>
                      <p className="text-sm text-gray-500 mt-0.5">Add certifications and educational qualifications</p>
                    </div>
                  </div>

                  {/* Add Qualification Form */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Add New Qualification</p>
                    <div className="space-y-3">
                      <Input
                        label="Qualification Name"
                        value={qualificationForm.qualification_name}
                        onChange={(v) => setQualificationForm({ ...qualificationForm, qualification_name: v })}
                        placeholder="e.g. MBBS, MD, BDS"
                      />
                      <Input
                        label="Institute Name"
                        value={qualificationForm.institute_name}
                        onChange={(v) => setQualificationForm({ ...qualificationForm, institute_name: v })}
                        placeholder="e.g. Delhi Medical University"
                      />
                      <Btn 
                        onClick={handleAddQualification}
                        className="w-full"
                      >
                        <Icons.Plus /> Add Qualification
                      </Btn>
                    </div>
                  </div>

                  {/* Qualifications List */}
                  {form.qualifications.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-700">Qualifications Added</p>
                      {form.qualifications.map((qual) => (
                        <div key={qual.id} className="flex items-start justify-between p-3 bg-teal-50 rounded-lg border border-teal-200">
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-teal-900">{qual.qualification_name}</p>
                            <p className="text-xs text-teal-700">{qual.institute}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveQualification(qual.id)}
                            className="text-teal-600 hover:text-teal-800 p-1.5 hover:bg-teal-100 rounded-lg transition-colors"
                          >
                            <Icons.Trash />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {errors.qualifications && (
                    <p className="text-red-500 text-xs mt-2">{errors.qualifications}</p>
                  )}
                </div>
              )}
              
              {step === 2 && form.role !== "Doctor" && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <p className="text-gray-500 text-sm">Qualifications section is only for Doctor role.</p>
                      <p className="text-gray-400 text-xs mt-2 mb-4">Click 'Submit' to complete the registration.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer - Buttons */}
            <div className="px-8 py-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
              <Btn
                variant="ghost"
                onClick={handleBack}
                disabled={step === 0 || isSubmitting}
              >
                ‹ Back
              </Btn>

              <div className="flex gap-2">
                <Btn
                  variant="secondary"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Btn>

                {form.role === "Doctor" 
                  ? (step < 2 ? (
                      <Btn onClick={handleNext} disabled={isSubmitting}>
                        Next ›
                      </Btn>
                    ) : (
                      <Btn onClick={handleAdd} disabled={isSubmitting}>
                        <Icons.Check />
                        {isSubmitting ? "Saving..." : editingUser ? "Update User" : "Add User"}
                      </Btn>
                    ))
                  : (step < 1 ? (
                      <Btn onClick={handleNext} disabled={isSubmitting}>
                        Next ›
                      </Btn>
                    ) : (
                      <Btn onClick={handleAdd} disabled={isSubmitting}>
                        <Icons.Check />
                        {isSubmitting ? "Saving..." : editingUser ? "Update User" : "Add User"}
                      </Btn>
                    ))
                }
              </div>
            </div>
          </div>
        </RightDrawer>
      )}

      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: "", type: "" })}
        />
      )}

    </div>
  );
};

export default UsersPage;