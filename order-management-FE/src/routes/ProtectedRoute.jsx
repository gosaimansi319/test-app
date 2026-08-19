import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const UserRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <Outlet />;
};

export const AdminRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/dashboard" />;
  }

  // Direct role check for clearer logic
  if (user.role_id.name === "admin" || user.role_id.name === "manager") {
    return <Outlet />;
  }

  return <Navigate to="/dashboard" />;
};

export const PublicRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  if (user) {
    if (user.role_id.name === "admin" || user.role_id.name === "manager") {
      return <Navigate to="/admin/dashboard" />;
    }
    return <Navigate to="/user/orderlist" />;
  }

  return <Outlet />;
};
