import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


const AuthInit = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if at root or login page
    if (!loading && user && ["/", "/login"].includes(location?.pathname)) {
      if (user?.role_id?.name === "admin" || user?.role_id?.name === "manager") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/user/orderlist", { replace: true });
      }
    }
  }, [user, loading, location?.pathname, navigate]);

  return null;
};

export default AuthInit;