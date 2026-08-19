import "./App.css";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import LoginPage from "./pages/auth/Login";
import RegisterPage from "./pages/auth/Register";
import ForgetPassword from "./pages/auth/ForgotPassword";
import { AdminRoute, UserRoute, PublicRoute } from "./routes/ProtectedRoute";
import OrderList from "./pages/userpanel/OrderList/OrderList";
import CreateOrderUser from "./pages/userpanel/CreateOrder/CreateOrder";
import AuthInit from "./components/AuthInit";
import ResetPassword from "./pages/auth/ResetPassword";
import Dashboard from "./pages/admin/dashboard/Dashboard";
import Layout from "./components/layout/Layout";
import Setting from "./pages/admin/Setting";
import OrdersList from "./pages/admin/Orders/OrdersList";
import ProductList from "./pages/admin/Products/ProductList";
import CreateProduct from "./pages/admin/Products/CreateProduct";
import RolesandPermissionsList from "./pages/admin/Roles&Permissions/RolesandPermissionsList";
import Suppliers from "./pages/admin/suppliers/Suppliers";
import CreateSupplier from "./pages/admin/suppliers/createSupplier";
import UsersList from "./pages/admin/users/UsersList";
import CreateUsers from "./pages/admin/users/CreateUsers";
import ViweUpdateUsers from "./pages/admin/users/ViweUpdateUsers";
import CreateOrder from "./pages/admin/CreateOrder/CreateOrder";
import OrderDetails from "./pages/admin/Orders/OrderDetails/OrderDetails";
import OrderHistory from "./pages/admin/Orders/OrderHistory/OrderHistory";
import UserOrderDetails from "./pages/userpanel/OrderList/OrderDetails/OrderDetails";
import Notifications from "./pages/common/Notifications/Notifications";
import ViewUpdateProduct from "./pages/admin/Products/ViewUpdateProduct";
import { AuthProvider } from "./context/AuthContext";
import UserSettings from "./pages/userpanel/Settings";
import UpdateOrder from "./pages/admin/Orders/UpdateOrder/UpdateOrder";
import OrderView from "./pages/admin/Orders/OrderDetails/OrderView";
import UpdateUserOrder from "./pages/userpanel/OrderList/UpdateOrder/UpdateUserOrder"

function App() {
  return (
    <>
      <Router>
        <AuthProvider>
          <AuthInit />
          <Routes>
            {/* Public Routes - accessible without login */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forget-password" element={<ForgetPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              {/* Add other public routes here */}
            </Route>

            {/* Protected Routes - for any authenticated user */}
            <Route path="/user" element={<UserRoute />}>
              <Route element={<Layout />}>
                <Route path="orderlist" element={<OrderList />} />
                <Route path="create-order" element={<CreateOrderUser />} />
                <Route path="update-order/:orderId" element={<UpdateUserOrder />} />
                <Route path="view-order/:orderId" element={<OrderView />} />
                <Route
                  path="order-details/:orderId"
                  element={<UserOrderDetails />}
                />
                <Route path="notifications" element={<Notifications />} />3
                <Route path="setting" element={<UserSettings />} />
              </Route>
            </Route>

            {/* Admin Routes - only for admin users */}
            <Route path="/admin" element={<AdminRoute />}>
              <Route element={<Layout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="Orders" element={<OrdersList />} />
                <Route path="create-order" element={<CreateOrder />} />
                <Route path="update-order/:orderId" element={<UpdateOrder />} />
                <Route path="view-order/:orderId" element={<OrderView />} />
                <Route
                  path="order-details/:orderId"
                  element={<OrderDetails />}
                />
                <Route path="order-history" element={<OrderHistory />} />
                <Route path="products" element={<ProductList />} />
                <Route
                  path="products/view-updateproduct/:id"
                  element={<ViewUpdateProduct />}
                />
                <Route path="users" element={<UsersList />} />
                <Route path="sign-up" element={<RegisterPage />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="users/createusers" element={<CreateUsers />} />
                <Route
                  path="users/view-updateusers"
                  element={<ViweUpdateUsers />}
                />
                <Route
                  path="products/createproduct"
                  element={<CreateProduct />}
                />
                <Route
                  path="roles-permissions"
                  element={<RolesandPermissionsList />}
                />
                <Route path="setting" element={<Setting />} />
                <Route path="suppliers" element={<Suppliers />} />
                <Route
                  path="suppliers/createSuppliers"
                  element={<CreateSupplier />}
                />
              </Route>
            </Route>

            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </AuthProvider>
      </Router>
    </>
  );
}

export default App;
