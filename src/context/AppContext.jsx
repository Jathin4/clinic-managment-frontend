import { createContext, useContext, useState, useMemo, useCallback } from "react";
import { getUserPermissions } from "../components/permissions";

const AppContext = createContext(null);

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {

  const [pageState, setPageState] = useState(
    localStorage.getItem("page") || "dashboard"
  );

  const [pageParams, setPageParams]       = useState({});
  const setPage = (newPage, params = {}) => {
    localStorage.setItem("page", newPage);
    setPageState(newPage);
    setPageParams(params || {});
  };

  const [authPage, setAuthPage]           = useState("login");
  const [isLoggedIn, setIsLoggedIn]       = useState(false);
  const [user, setUser]                   = useState(null);
  const [collapsed, setCollapsed]         = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [isLoading, setIsLoading]         = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [loadingType, setLoadingType]     = useState("default");

  const showLoading = (message = "Loading...", type = "default") => {
    setLoadingMessage(message);
    setLoadingType(type);
    setIsLoading(true);
  };

  const hideLoading = () => setIsLoading(false);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setPage("dashboard");
    setAuthPage("login");
    localStorage.removeItem("page");
    sessionStorage.removeItem("user");
  };

  // ── Permissions ────────────────────────────────────────────
  const userPermissions = useMemo(
    () => getUserPermissions(user?.role ?? ""),
    [user?.role]
  );

  // Stable function — never undefined, safe to call anywhere
  const can = useCallback(
    (permission) => userPermissions.includes(permission),
    [userPermissions]
  );

  return (
    <AppContext.Provider value={{
      page: pageState, setPage, pageParams, setPageParams,
      authPage, setAuthPage,
      isLoggedIn, setIsLoggedIn,
      user, setUser,
      collapsed, setCollapsed,
      mobileSidebar, setMobileSidebar,
      handleLogout,
      isLoading, setIsLoading,
      loadingMessage, loadingType,
      showLoading, hideLoading,
      userPermissions,
      can,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;