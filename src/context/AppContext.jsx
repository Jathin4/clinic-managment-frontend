import { createContext, useContext, useState } from "react";

const AppContext = createContext(null);

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [page, setPage]         = useState("dashboard");
  const [authPage, setAuthPage] = useState("login");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [collapsed, setCollapsed]   = useState(false);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setPage("dashboard");
    setAuthPage("login");
  };

  return (
    <AppContext.Provider value={{ page, setPage, authPage, setAuthPage, isLoggedIn, setIsLoggedIn, collapsed, setCollapsed, handleLogout }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
