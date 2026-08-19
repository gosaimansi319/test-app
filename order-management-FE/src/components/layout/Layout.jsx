import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { adminRoutes, userRoutes } from "../../routes/sidebarRoutes";
import { useAuth } from "../../context/AuthContext";
import Arrow from "../../assets/svg/arrow-left.svg";
import Logo from "../../assets/svg/dashboardLogo.svg";
import SeacrhIcon from "../../assets/svg/search-Icon.svg";
import BellIcon from "../../assets/svg/bellIcon.svg";
import Hamburger from "../../assets/svg/hamburger.svg";
import LogOut from "../../assets/svg/logout.svg";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserDetailSetting } from "../../store/Setting/settingThunk";
import {
  fetchAdminNotifications,
  fetchNotificationsCount,
  fetchUserNotifications,
  notificationsReadAll,
} from "../../store/Notifications/notificationThunk";
import NotificationPopup from "../commen/NotificationPopUp";
import userLogo from "../../assets/image/logo_user.jpg";
import toast from "react-hot-toast";

const leftAllowed = [
  "/user/order-details",
  "/user/view-order",
  "/user/update-order",
  "/admin/update-order",
  "/admin/view-order",
  "/admin/order-history",
  "/admin/order-details",
  "/admin/users/createusers",
  "/admin/users/view-updateusers",
  "/admin/products/createproduct",
  "/admin/products/view-updateproduct",
  "/admin/suppliers/createSuppliers",
];

const SidebarItem = ({ label, icon, active, onClick }) => (
  <a
    onClick={onClick}
    className={`relative flex items-center gap-4 px-5 py-3 rounded-r-full cursor-pointer
      before:content-[''] before:absolute before:top-0 before:left-0 before:h-full before:w-full 
      before:rounded-r-full before:transition-opacity before:duration-300
      ${
        active
          ? "before:opacity-100 before:bg-[#E7E7E7] text-[#212121] font-normal"
          : "before:opacity-0 before:bg-[#E7E7E7] text-[#212121] hover:before:opacity-100"
      }`}
  >
    <img src={icon} alt="icon" className="relative z-10" />
    <span className="text-base leading-[26px] relative z-10">{label}</span>
  </a>
);

const Layout = () => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userData = useSelector((state) => state?.settings?.setting?.data);

  const { notificationCount, notifications } = useSelector(
    (state) => state?.notifications
  );

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [pageTitle, setPageTitle] = useState("");
  const [notifShowPopup, setNotifShowPopup] = useState(false);
  const [globalSearchquery, setGlobalSearchQuery] = useState("");

  const isAdmin =
    user?.role_id?.name === "admin" || user?.role_id?.name === "manager";
  const routes = isAdmin ? adminRoutes : userRoutes;

  const matchRoute = (pattern, path) => {
    if (!pattern.includes(":")) return pattern === path;

    const patternSegments = pattern.split("/");
    const pathSegments = path.split("/");

    if (patternSegments.length !== pathSegments.length) return false;

    return patternSegments.every(
      (seg, i) => seg.startsWith(":") || seg === pathSegments[i]
    );
  };

  useEffect(() => {
    const currentRoute = routes.find((route) =>
      matchRoute(route.path, location.pathname)
    );
    setPageTitle(currentRoute?.navtitle || "Dashboard");
    setGlobalSearchQuery("");
  }, [location.pathname, routes]);

  useEffect(() => {
    dispatch(fetchUserDetailSetting());
    dispatch(fetchNotificationsCount());
    if (user?.role_id?.name === "user") {
      dispatch(fetchUserNotifications());
    } else {
      dispatch(fetchAdminNotifications());
    }
  }, [dispatch, user]);

  const handleNavigation = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const showLeftIcon = leftAllowed.some((path) =>
    location.pathname.includes(path)
  );

  const handleShowNotif = () => {
    setNotifShowPopup((prev) => !prev);
    dispatch(notificationsReadAll());
  };

  const notifPopupRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        notifPopupRef.current &&
        !notifPopupRef.current.contains(event.target)
      ) {
        setNotifShowPopup(false);
      }
    }

    if (notifShowPopup) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notifShowPopup]);

  const handleGlobalSearch = () => {
    const match = routes.find(
      (route) =>
        route?.label?.toLowerCase() === globalSearchquery?.trim()?.toLowerCase()
    );

    if (match) {
      navigate(match.path);
    } else {
      toast.error("Page not found. Please enter a valid page name.");
    }
  };

  return (
    <div className="relative flex w-screen lg:h-screen lg:p-5">
      {/* Sidebar */}
      <aside
        className={`rounded-tr-0 rounded-br-0 rounded-tl-[10px] rounded-bl-[10px] md:rounded-[20px] overflow-hidden lg:h-[calc(100vh-40px)] fixed ${
          sidebarOpen ? "m-0 md:m-3 md:ml-0" : "m-0"
        } z-50 boxShadow top-0 bottom-0 fixed lg:static
          max-w-[300px] md:w-[300px] h-full transition-transform duration-200 ease-in-out
          ${
            sidebarOpen ? "translate-x-0 left-0" : "-translate-x-full"
          } lg:translate-x-0 flex flex-col gap-10 p-0`}
      >
        <div className="flex items-center p-5 pb-0 justify-center">
          <img src={Logo} alt="Logo" className="object-contain w-20 h-20" />
        </div>
        <div className="flex-1 flex flex-col pr-5 gap-2.5 overflow-y-auto custom-scrollbar">
          {routes
            .filter((route) => route.label)
            .map(({ label, path, icon }) => {
              const isActive =
                location.pathname === path ||
                (path === "/admin/products" &&
                  location.pathname.startsWith("/admin/products/")) ||
                (path === "/admin/suppliers" &&
                  location.pathname.startsWith("/admin/suppliers/")) ||
                (path === "/admin/users" &&
                  location.pathname.startsWith("/admin/users/"));

              return (
                <SidebarItem
                  key={label}
                  label={label}
                  path={path}
                  icon={icon}
                  active={isActive}
                  onClick={() => handleNavigation(path)}
                />
              );
            })}
        </div>
        <div className="mt-auto p-5 pt-0">
          <div className="p-3 lg:p-5 flex items-center justify-between gap-2 bg-[#F6F6F6] rounded-[10px]">
            <div className="flex items-center gap-1.5 lg:gap-2.5">
              <div className="h-[45px] w-[45px] rounded-full overflow-hidden border border-[#D8F4F5] block shrink-0 grow-0 basis-[45px]">
                <img
                  src={userData?.image || userLogo}
                  alt="Avatar"
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="flex flex-col">
                <p className="text-[#212121] font-base leading-5 lg:leading-6 font-normal text-sm text-nowrap">
                  {userData?.first_name}
                </p>
                <span className="text-[#6D6D6D] font-normal text-sm capitalize leading-5 lg:leading-6">
                  {userData?.role_id?.name}
                </span>
              </div>
            </div>
            <span className="w-5 h-5 cursor-pointer" onClick={handleLogout}>
              <img
                src={LogOut}
                alt="LogOut"
                className="object-cover w-full h-full"
              />
            </span>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black opacity-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="w-full lg:w-[calc(100%-320px)] lg:h-[calc(100vh-40px)] lg:pl-0 ml-auto lg:p-0">
        {/* Top Navbar */}
        <div className="p-5 pb-0 bg-[#f6f6f6] lg:p-0 sticky top-0 lg:top-5 lg:right-5 z-20 ">
          <div className="h-[72px] boxShadow overflow-visible relative px-5 py-[15px] flex items-center justify-between gap-2 rounded-[20px]  lg:w-full">
            <h3 className="hidden lg:flex items-center text-[28px] leading-[42px] font-medium text-[#212121]">
              {showLeftIcon && (
                <img
                  onClick={() => navigate(-1)}
                  src={Arrow}
                  alt="Arrow"
                  className="cursor-pointer"
                />
              )}
              &nbsp;
              {pageTitle}
            </h3>
            <div className="block w-10 h-10 lg:hidden">
              <img src={Logo} alt="Logo" className="w-full h-full" />
            </div>
            <div className="flex items-center gap-5 ">
              <div
                className={`border border-[#D1D1D1] bg-white rounded-[10px] px-2.5 py-2 gap-2.5 items-center min-w-[300px] w-full flex cursor-pointer left-0 right-0 lg:left-auto lg:right-auto top-full lg:top-auto absolute lg:static ${
                  showSearch ? "flex lg:flex" : "hidden lg:flex"
                }`}
              >
                <input
                  type="text"
                  placeholder="Search page..."
                  value={globalSearchquery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  className="outline-none relative"
                />
                <img
                  src={SeacrhIcon}
                  alt="SearchIcon"
                  onClick={handleGlobalSearch}
                  className="absolute right-[124px]"
                />
              </div>
              <div
                className="relative hidden lg:block cursor-pointer"
                onClick={() => handleShowNotif()}
              >
                <img
                  src={BellIcon}
                  alt="BellIcon"
                  className="h-[20px] w-[24px] object-cover"
                />
                <span className="absolute top-[-7px] right-[-5px] py-[3px] px-[5px] bg-white border border-[#282828] h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-normal">
                  {notificationCount}
                </span>
                {notifShowPopup && (
                  <div ref={notifPopupRef}>
                    <NotificationPopup
                      notifications={notifications}
                      isAdmin={isAdmin}
                      onClose={() => setNotifShowPopup(false)}
                    />
                  </div>
                )}
              </div>
              <div className="h-[35px] w-[35px] rounded-full overflow-hidden border border-[#D8F4F5] hidden lg:block shrink-0 grow-0 basis-[35px]">
                <img
                  src={userData?.image || userLogo}
                  alt="Avatar"
                  className="object-cover w-full h-full"
                />
              </div>
              <div
                className="block lg:hidden cursor-pointer"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <img src={Hamburger} alt="hamburgerMenu" />
              </div>
            </div>
          </div>
        </div>

        {/* Outlet/Main Content */}
        <main className="lg:flex-1 ml-0 lg:mt-5 p-5 lg:p-0 lg:h-[calc(100vh-132px)] lg:overflow-hidden rounded-[20px]">
          <div className="relative custom-scrollbar lg:h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
