import DashboardIcon from "../assets/svg/dashboard-icon.svg";
import SettingIcon from "../assets/svg/settingicon.svg";
import OrdersIcon from "../assets/svg/OrdersIcon.svg";
import ProductIcon from "../assets/svg/productIcon.svg";
import CreateOrderIcon from "../assets/svg/createOrder.svg";
import RolesPermissionsIcon from "../assets/svg/roles-permissionsicon.svg";
import SuppliersIcon from "../assets/svg/suppliersIcon.svg";
import UsersIcon from "../assets/svg/usersIcon.svg";
import NotificationIcon from "../assets/svg/notificationIcon.svg";
export const userRoutes = [
  {
    path: "/user/orderlist",
    label: "Order List",
    navtitle: "Order List",
    icon: OrdersIcon,
  },
  {
    path: "/user/create-order",
    label: "Create Order",
    navtitle: "Create Order",
    icon: CreateOrderIcon,
  },
  {
    path: "/user/update-order/:orderId",
    navtitle: "Update Order",
  },
  {
    path: "/user/order-details/:orderId",
    navtitle: "Order Details",
  },
  {
    path: "/user/view-order/:orderId",
    navtitle: "View Order",
  },
  {
    path: "/user/notifications",
    label: "Notifications",
    icon: NotificationIcon,
    navtitle: "All Notifications",
  },
  {
    path: "/user/setting",
    label: "Settings",
    icon: SettingIcon,
    navtitle: "Settings",
  },
];
export const adminRoutes = [
  {
    path: "/admin/dashboard",
    label: "Dashboard",
    icon: DashboardIcon,
    navtitle: "Dashboard",
  },
  {
    path: "/admin/orders",
    label: "Orders",
    icon: OrdersIcon,
    navtitle: "Orders",
  },
  {
    path: "/admin/create-order",
    label: "Create Order",
    icon: CreateOrderIcon,
    navtitle: "Create Order",
  },
  {
    path: "/admin/update-order/:orderId",
    navtitle: "Update Order",
  },
  {
    path: "/admin/view-order/:orderId",
    navtitle: "View Order",
  },
  {
    path: "/admin/order-history",
    navtitle: "Order History",
  },
  {
    path: "/admin/order-details/:orderId",
    navtitle: "Order Details",
  },
  {
    path: "/admin/products",
    label: "Products",
    icon: ProductIcon,
    navtitle: "Products",
  },
  {
    path: "/admin/suppliers",
    label: "Suppliers",
    icon: SuppliersIcon,
    navtitle: "Suppliers",
  },
  {
    path: "/admin/users",
    label: "Users",
    icon: UsersIcon,
    navtitle: "Users",
  },
  {
    path: "/admin/sign-up",
    label: "Sign Up User",
    icon: UsersIcon,
    navtitle: "Sign Up User",
  },
  {
    path: "/admin/notifications",
    label: "Notifications",
    icon: NotificationIcon,
    navtitle: "All Notifications",
  },
  {
    path: "/admin/users/createusers",
    navtitle: "Create User",
  },
  {
    path: "/admin/users/view-updateusers",
    navtitle: "User Detail",
  },
  {
    path: "/admin/products/createproduct",
    navtitle: "Create Product",
  },
  {
    path: "/admin/products/view-updateproduct/:id",
    navtitle: "Product Detail",
  },
  {
    path: "/admin/roles-permissions",
    label: "Roles & Permissions",
    icon: RolesPermissionsIcon,
    navtitle: "Roles & Permissions",
  },
  {
    path: "/admin/suppliers/createSuppliers",
    navtitle: "Create Supplier",
  },
  {
    path: "/admin/setting",
    label: "Settings",
    icon: SettingIcon,
    navtitle: "Settings",
  },
];
