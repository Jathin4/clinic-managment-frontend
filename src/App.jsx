import { useApp } from "./context/AppContext";
import Sidebar from "./components/Sidebar";
import TopNav  from "./components/TopNav";

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
import PaymentsPage      from "./pages/PaymentsPage";
import InventoryPage     from "./pages/InventoryPage";
import ReportsPage       from "./pages/ReportsPage";
import SettingsPage      from "./pages/SettingsPage";
import LoginPage         from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import EmployeeProfilePage from "./pages/EmployeeProfilePage";

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
  payments:      <PaymentsPage />,
  inventory:     <InventoryPage />,
  reports:       <ReportsPage />,
  settings:      <SettingsPage />,
  "my-profile":  <EmployeeProfilePage />,
};

function App() {
  const { page, authPage, isLoggedIn, setIsLoggedIn, setUser, setAuthPage } = useApp();

  // ── Auth flow ──────────────────────────────────────────────
  if (!isLoggedIn) {
    if (authPage === "forgot") {
      return <ForgotPasswordPage onBack={() => setAuthPage("login")} />;
    }
    return (
      <LoginPage
        onLogin={(userData) => { setUser(userData); setIsLoggedIn(true); }}
        onForgot={() => setAuthPage("forgot")}
      />
    );
  }

  // ── Main layout ────────────────────────────────────────────
  return (
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
  );
}

export default App;
