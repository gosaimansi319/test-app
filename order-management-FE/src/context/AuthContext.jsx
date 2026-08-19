import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token");
        const storedUser =
          localStorage.getItem("user") || sessionStorage.getItem("user");

        if (token && storedUser) {
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (userData, token, remember) => {
    return new Promise((resolve) => {
      const storage = remember ? localStorage : sessionStorage;

      // Store token and user in selected storage
      storage.setItem("token", token);
      storage.setItem("user", JSON.stringify(userData));

      // Set axios headers
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Update state
      setUser(userData);

      // Resolve after slight delay
      setTimeout(() => {
        resolve();
      }, 50);
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
    navigate("/login");
  };

  const isAdmin = () => {
    return (
      user && (user.role_id.name === "admin" || user.role_id.name === "manager")
    );
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAdmin,
        loading,
        // Add this method to help with direct navigation
        redirectToUserHome: () => {
          if (user) {
            if (user.role_id.name === "admin") {
              navigate("/admin/dashboard");
            } else if (user.role_id.name === "manager") {
              navigate("/admin/dashboard");
            } else {
              navigate("/user/orderlist");
            }
          }
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
