import { createContext, useContext, useState } from "react";

const AppContext = createContext(null);

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {

  // Restore saved page
  const [pageState, setPageState] = useState(
    localStorage.getItem("page") || "dashboard"
  );

  const setPage = (newPage) => {
    localStorage.setItem("page", newPage);
    setPageState(newPage);
  };

  const [authPage, setAuthPage] = useState("login");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser]         = useState(null);
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setPage("dashboard");
    setAuthPage("login");

    localStorage.removeItem("page");
    sessionStorage.removeItem("user");
  };

  return (
    <AppContext.Provider value={{ page: pageState, setPage, authPage, setAuthPage, isLoggedIn, setIsLoggedIn, user, setUser, collapsed, setCollapsed, mobileSidebar, setMobileSidebar, handleLogout }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;