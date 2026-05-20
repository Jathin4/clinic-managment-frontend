import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Icons from '../components/Icons';
import { Badge, Btn, Toast, PageHeader, DataTable, TR, TD } from '../components/UI';

const AttendancePage = () => {
    const { showLoading, hideLoading } = useApp();

    const todayStr = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };




    const [selectedDate, setSelectedDate] = useState(todayStr());
    const [users, setUsers] = useState([]);
    const [attendance, setAttendance] = useState([]); // records from attendance_read_by_clinic
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [checkingIn, setCheckingIn] = useState({}); // { [user_id]: true/false }
    const [toast, setToast] = useState({ message: "", type: "" });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
    const userData = sessionStorage.getItem("user");
    const userObj = userData ? JSON.parse(userData) : {};
    const clinicId = userObj?.clinic_id;


    const showToast = (msg, type = "success") => {
        setToast({ message: msg, type });
        setTimeout(() => setToast({ message: "", type: "" }), 3000);
    };

    // ── Fetch users list ──────────────────────────────────────────
    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/users_read_by_clinic/?clinic_id=${clinicId}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to load users");
            setUsers(data.users || []);
        } catch (error) {
            console.error("Error fetching users:", error);
            showToast("Failed to load users", "error");
        }
    };

    // ── Fetch attendance for selected date ────────────────────────
    const fetchAttendance = async (date) => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/attendance_read_by_clinic?clinic_id=${clinicId}&date=${date}`
            );
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to load attendance");
            console.log("RAW attendance from API:", data.attendance);
            setAttendance(data.attendance || []);
        } catch (error) {
            console.error("Error fetching attendance:", error);
            showToast("Failed to load attendance", "error");
        }
    };

    // ── Initial load ──────────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            showLoading("Loading attendance...", "attendance");
            await Promise.all([fetchUsers(), fetchAttendance(selectedDate)]);
            setIsLoading(false);
            hideLoading();
        };
        load();
    }, []);

    // ── Re-fetch attendance when date changes ─────────────────────
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            await fetchAttendance(selectedDate);
            setIsLoading(false);
        };
        load();
    }, [selectedDate]);

    // ── Helper: find attendance record for a user ─────────────────
    const getAttendanceRecord = (userId) =>
        attendance.find((a) => Number(a.user_id) === Number(userId)) || null;

    // ── Format time from timestamp ────────────────────────────────
    const formatTime = (timestamp) => {
        if (!timestamp) return "";
        const normalized = timestamp.endsWith("Z") || timestamp.includes("+")
            ? timestamp
            : timestamp + "Z";
        const d = new Date(normalized);
        if (isNaN(d.getTime())) return timestamp;
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
    };

    // ── Check-in handler ──────────────────────────────────────────
    const handleCheckIn = async (userId, status = "present") => {
        setCheckingIn((prev) => ({ ...prev, [userId]: true }));
        try {
            const response = await fetch(`${API_BASE_URL}/attendance_check_in`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: userId,
                    clinic_id: clinicId,
                    confidence: 1.0,
                    status,              // ← send "present" or "absent"
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed");
            showToast(status === "present" ? "Marked present" : "Marked absent", status === "present" ? "success" : "error");
            await fetchAttendance(selectedDate);
        } catch (error) {
            showToast(error.message || "Failed", "error");
        } finally {
            setCheckingIn((prev) => ({ ...prev, [userId]: false }));
        }
    };

    // ── Filter users by search ────────────────────────────────────
    const filteredUsers = users.filter((u) => {
        const query = search.trim().toLowerCase();
        if (!query) return true;
        return [u.full_name, u.phone, u.role].some((v) =>
            v?.toLowerCase().includes(query)
        );
    });

    // ── Summary counts ────────────────────────────────────────────
    const presentCount = attendance.filter(a => a.status === "present").length;
    const absentCount = attendance.filter(a => a.status === "absent").length;

    const isToday = selectedDate === todayStr();

    const roleColor = (r) =>
    ({
        Admin: "bg-purple-50 text-purple-700 border-purple-100",
        Doctor: "bg-blue-50 text-blue-700 border-blue-100",
        Receptionist: "bg-amber-50 text-amber-700 border-amber-100",
        Pharmacist: "bg-green-50 text-green-700 border-green-100",
        Diagnosist: "bg-cyan-50 text-cyan-700 border-cyan-100",
        Staff: "bg-orange-50 text-orange-700 border-orange-100",
    }[r] || "bg-gray-100 text-gray-600");

    return (
        <div className="bg-slate-50 min-h-screen">
            <PageHeader
                title="Attendance"
                subtitle="Track and manage daily staff attendance"
                actions={
                    <div className="flex items-center gap-3">
                        {/* Date Picker */}
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                            <Icons.Calendar className="text-teal-600 w-4 h-4 shrink-0" />
                            <input
                                type="date"
                                value={selectedDate}
                                max={todayStr()}
                                onChange={(e) => {
                                    setSelectedDate(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="text-sm text-slate-700 font-medium bg-transparent outline-none cursor-pointer"
                            />
                        </div>
                    </div>
                }
            />

            {/* ── Summary KPI cards ── */}
            <div className="px-6 pb-4 grid grid-cols-3 gap-4 max-w-lg">
                <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
                    <p className="text-sm text-slate-500 font-medium">Total</p>
                    <p className="text-2xl font-bold text-slate-700">{users.length}</p>
                </div>
                <div className="bg-white rounded-xl border border-green-100 px-4 py-3 shadow-sm">
                    <p className="text-sm text-green-600 font-medium">Present</p>
                    <p className="text-2xl font-bold text-green-600">{presentCount}</p>
                </div>
                <div className="bg-white rounded-xl border border-red-100 px-4 py-3 shadow-sm">
                    <p className="text-sm text-red-500 font-medium">Absent</p>
                    <p className="text-2xl font-bold text-red-500">{absentCount}</p>
                </div>
            </div>

            {/* ── Table ── */}
            <DataTable
                title="Staff Attendance"
                subtitle={`Attendance for ${new Date(selectedDate + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`}
                search={search}
                onSearch={(v) => { setSearch(v); setCurrentPage(1); }}
                searchPlaceholder="Search by name, phone, role…"
                columns={["Employee Name", "Phone", "Role", "Status", "Attendance"]}
                rows={
                    isLoading
                        ? [
                            <TR key="loading">
                                <td colSpan={5} className="text-center py-8 text-slate-400">
                                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-teal-700 mr-2 align-middle" />
                                    Loading attendance...
                                </td>
                            </TR>,
                        ]
                        : filteredUsers.length === 0
                            ? [
                                <TR key="empty">
                                    <td colSpan={5} className="text-center py-8 text-slate-400">
                                        No users found
                                    </td>
                                </TR>,
                            ]
                            : filteredUsers
                                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                                .map((u) => {
                                    const record = getAttendanceRecord(u.id);
                                    const isPresent = record?.status === "present";   // ← replaces isCheckedIn
                                    const isAbsent = record?.status === "absent";
                                    const isLoadingThis = !!checkingIn[u.id];

                                    return (
                                        <TR key={u.id}>
                                            {/* Name */}
                                            <TD>
                                                <span className="font-semibold text-slate-700">{u.full_name}</span>
                                            </TD>

                                            {/* Phone */}
                                            <TD>{u.phone || "—"}</TD>

                                            {/* Role */}
                                            <TD>
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${roleColor(u.role)}`}>
                                                    {u.role}
                                                </span>
                                            </TD>

                                            {/* Status */}
                                            <TD>
                                                <Badge status={u.is_active ? "Active" : "Inactive"} />
                                            </TD>

                                            {/* Attendance */}
                                            <TD>
                                              
                                                {isPresent ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            Checked In
                                                        </span>
                                                        <span className="text-xs text-slate-500 font-medium">{formatTime(record.check_in_time)}</span>
                                                    </div>
                                                ) : isAbsent && record ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-500 border border-red-100">
                                                        Absent
                                                    </span>
                                                ) : isToday ? (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleCheckIn(u.id, "present")}
                                                            disabled={isLoadingThis}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors disabled:opacity-60"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                                            </svg>
                                                            Present
                                                        </button>
                                                        <button
                                                            onClick={() => handleCheckIn(u.id, "absent")}
                                                            disabled={isLoadingThis}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 transition-colors disabled:opacity-60"
                                                        >
                                                            Absent
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-400 border border-gray-200">
                                                        Not Marked
                                                    </span>
                                                )}
                                            </TD>
                                        </TR>
                                    );
                                })
                }
                currentPage={currentPage}
                totalPages={Math.ceil(filteredUsers.length / pageSize)}
                onPageChange={setCurrentPage}
                totalItems={filteredUsers.length}
                pageSize={pageSize}
                onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />

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

export default AttendancePage;