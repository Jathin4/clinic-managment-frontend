import { useEffect } from "react";
import { useApp } from "./context/AppContext";
import Sidebar, { SIDEBAR_ITEMS } from "./components/Sidebar";
import TopNav  from "./components/TopNav";
import LoadingOverlay from "./components/LoadingOverlay";

// Pages
import DashboardPage     from "./pages/DashboardPage";
import ClinicsPage       from "./pages/ClinicsPage";
import UsersPage         from "./pages/UsersPage";
import PatientsPage      from "./pages/PatientsPage";
import AppointmentsPage  from "./pages/AppointmentsPage";
import EncountersPage    from "./pages/EncountersPage";
import DiagnosesPage     from "./pages/DiagnosesPage";
import PrescriptionsPage from "./pages/PrescriptionsPage";
import BillingPage       from "./pages/BillingPage";
import ExpensesPage from "./pages/ExpensesPage";
import InventoryPage     from "./pages/InventoryPage";
import PharmacySales from "./pages/PharmacySales";
import ReportsPage       from "./pages/ReportsPage";
import SettingsPage      from "./pages/SettingsPage";
import LoginPage         from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import EmployeeProfilePage from "./pages/EmployeeProfilePage";
import SelfRegisterPage  from "./pages/SelfRegisterPage";
import AttendancePage    from "./pages/Attendancepage";   // ← NEW
import DiagnosticsPage from "./pages/DiagnosticsPage";

function App() {
  const {
    page, setPage, authPage, isLoggedIn, setIsLoggedIn,
    setUser, setAuthPage, user, isLoading, loadingMessage, loadingType,
    can,
  } = useApp();

  // ── Role guard — MUST be before any conditional return ────────────────────
  useEffect(() => {
    if (!isLoggedIn || !user || typeof can !== "function") return;

    const allowedPageIds = new Set([
      "my-profile",
      "dashboard",
      ...SIDEBAR_ITEMS
        .filter(item => can(item.permission))
        .map(item => item.id),
    ]);

    if (!allowedPageIds.has(page)) {
      setPage("dashboard");
    }
  }, [isLoggedIn, user, page, setPage, can]);

  // ── PUBLIC ROUTE — after all hooks ────────────────────────────────────────
  if (window.location.pathname === "/self-register") {
    return <SelfRegisterPage />;
  }

  const PAGE_MAP = {
    dashboard:     <DashboardPage />,
    clinics:       <ClinicsPage />,
    users:         <UsersPage />,
    patients:      <PatientsPage />,
    appointments:  <AppointmentsPage />,
    encounters:    <EncountersPage />,
    diagnoses:     <DiagnosesPage />,
    prescriptions: <PrescriptionsPage />,
    bills:         <BillingPage />,
    expenses: <ExpensesPage />,
    inventory:     <InventoryPage />,
    "pharmacy-sales": <PharmacySales />,
    reports:       <ReportsPage />,
    settings:      <SettingsPage />,
    "my-profile":  <EmployeeProfilePage user={user} />,
    attendance:    <AttendancePage />,   
    diagnostics:     <DiagnosticsPage />            // ← NEW
  };

  // ── Auth flow ──────────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    if (authPage === "forgot") {
      return (
        <>
          <LoadingOverlay isLoading={isLoading} message={loadingMessage} type={loadingType} />
          <ForgotPasswordPage onBack={() => setAuthPage("login")} />
        </>
      );
    }
    return (
      <>
        <LoadingOverlay isLoading={isLoading} message={loadingMessage} type={loadingType} />
        <LoginPage
          onLogin={(userData) => { setUser(userData); setIsLoggedIn(true); }}
          onForgot={() => setAuthPage("forgot")}
        />
      </>
    );
  }

  // ── Main layout ────────────────────────────────────────────────────────────
  return (
    <>
      <LoadingOverlay isLoading={isLoading} message={loadingMessage} type={loadingType} />
      <div
        className="flex h-screen overflow-hidden"
        style={{ background: "#F8FAFA", fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <TopNav />
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
            {PAGE_MAP[page] ?? <DashboardPage />}
          </main>
        </div>
      </div>
    </>
  );
}

export default App;