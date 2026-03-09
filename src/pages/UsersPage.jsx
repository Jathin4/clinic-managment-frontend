import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

import {
  MOCK_CLINICS
} from '../data/mockData';

import Icons from '../components/Icons';
import { Badge, Modal, Btn, Input, Select, Toast, PageHeader, DataTable, TR, TD } from '../components/UI';

const UsersPage = () => {

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
const [toast, setToast] = useState({ message: "", type: "" });
  const [editingUser, setEditingUser] = useState(null);

  const API_BASE_URL = 'http://127.0.0.1:5020';

  const blank = { full_name:"", email:"", phone:"", role:"", clinic_id:"1", is_active:true };
  const [form, setForm] = useState(blank);

  /* ---------------- PAGINATION ---------------- */

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

     if (response.status === 400) {
  showToast(data.error || "Bad Request", "warning");
  return;
}

if (!response.ok) {
  throw new Error(data.error || "Failed to save user");
}

      const data = await response.json();

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
      clinic_id: user.clinic_id || 1,
      is_active: user.is_active ?? true
    });

    setShowModal(true);
  };

  /* ---------------- ADD / UPDATE USER ---------------- */

 const handleAdd = async () => {

  if (!form.full_name || !form.email) {
    showToast("Full name and email are required");
    return;
  }

  try {

    const payload = {
      id: editingUser ? editingUser.id : null,
      clinic_id: 1,
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      password_hash: editingUser ? "" : "123456",
      role: form.role,
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

    setShowModal(false);
    setForm(blank);
    setEditingUser(null);

    fetchUsers();

  } catch (error) {

    console.error("Add user error:", error);

    showToast(error.message || "Something went wrong", "error");

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

    <div>
      

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

      {isLoading ? (

        <div className="text-center py-6 text-gray-500">
          Loading users...
        </div>

      ) : (

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

          rows={filteredUsers
            .slice((currentPage-1)*pageSize,currentPage*pageSize)
            .map(u=>{

              return (

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
              );
            })}

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

      )}

      {showModal && (

        <Modal title={editingUser ? "Edit User" : "Add New User"} onClose={()=>setShowModal(false)} wide>

          <div className="grid grid-cols-2 gap-4">

            <Input
              label="Full Name"
              value={form.full_name}
              onChange={(v)=>{
                const onlyLetters = v.replace(/[^a-zA-Z\s]/g,"");
                setForm({...form,full_name:onlyLetters});
              }}
            />

            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={v=>setForm({...form,email:v})}
            />

            <Input
              label="Phone"
              value={form.phone}
              onChange={(v)=>{
                const numbersOnly = v.replace(/[^0-9]/g,"");
                setForm({...form,phone:numbersOnly});
              }}
            />

            <Select
              label="Role"
              value={form.role}
              onChange={v=>setForm({...form,role:v})}
              options={["Admin","Doctor","Receptionist"]}
            />

          </div>

          <div className="flex justify-end gap-3 mt-6">

            <Btn
              variant="secondary"
              onClick={()=>{
                setShowModal(false);
                setEditingUser(null);
                setForm(blank);
              }}
            >
              Cancel
            </Btn>

            <Btn onClick={handleAdd}>
              <Icons.Check/>
              {editingUser ? "Update User" : "Add User"}
            </Btn>

          </div>

        </Modal>
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