import { useState } from "react";
import LogoImage from "../../assets/image/Logo.png";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../Api/auth";
import { toast } from "react-hot-toast";
import { Loader } from "../../components/commen/Loader";
import EyeIcon from "../../assets/svg/eyeon.svg";
import EyeOffIcon from "../../assets/svg/EyeOff.svg";
import { useAuth } from "../../context/AuthContext";

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
      remember: false,
    },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email").required("Email is required"),
      password: Yup.string()
        .min(6, "Minimum 6 characters")
        .required("Password is required"),
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const response = await loginUser(values.email, values.password);

        if (response.status_code == 200) {
          setLoading(false);
          const { user, token } = response.data;
          await login(user, token, values.remember);
          if (user.role_id.name === "admin") {
            navigate("/admin/dashboard", { replace: true });
          } else if (user.role_id.name === "manager") {
            navigate("/admin/dashboard", { replace: true });
          } else {
            navigate("/user/orderlist", { replace: true });
          }
          toast.success("Login successful!");
        } else if (response.status == 401) {
          setLoading(false);
          toast.error("Invalid credentials");
        } else {
          setLoading(false);
          toast.error(response.response.data.message);
        }
      } catch (err) {
        console.error("Login error:", err);
        toast.error(
          err.response?.data?.message ||
            "Login failed. Please check your credentials."
        );
      } finally {
        setLoading(false);
      }
    },
  });



  return (
    <>
      <div className="w-full max-w-[1230px] m-auto h-screen flex items-center p-[15px]">
        <div className="bg-white w-full p-5 sm:p-10 min-h-[calc(100vh-164px)] lg:min-h-0 flex flex-col justify-start lg:grid grid-cols-1 lg:grid-cols-2 items-center lg:justify-center gap-10 rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
          {/* Left - Logo */}
          <div className="flex justify-center w-full ">
            <img
              src={LogoImage}
              alt="We Buy Logo"
              className="h-[80px] lg:h-[250px] w-auto object-contain"
            />
          </div>

          {/* Right - Login Form */}
          <div className="w-full py-0 xl:py-[82px] lg:px-5">
            <h2 className="text-center lg:text-start text-[28px] text-[#212121] font-bold leading-[42px]">
              Login
            </h2>
            <p className="text-center lg:text-start text-base font-normal leading-[26px] text-[#212121] mt-2.5">
              Welcome to devtech!!
            </p>

            <form onSubmit={formik.handleSubmit} className="mt-5 md:mt-10 ">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="text-base font-normal leading-[26px] text-[#212121]"
                >
                  Email Id
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email id"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.email}
                  className={`mt-2.5 w-full border px-2.5 py-[7px] text-black rounded-[10px] shadow-sm focus:outline-none ${
                    formik.touched.email && formik.errors.email
                      ? "border-red-500 focus:ring-red-500"
                      : "border border-[#D1D1D1] focus:ring-black"
                  }`}
                />
                {formik.touched.email && formik.errors.email && (
                  <p className="formField-validation">{formik.errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="mt-5 md:mt-10">
                <label
                  htmlFor="password"
                  className="text-base font-normal leading-[26px] text-[#212121]"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.password}
                    className={`mt-2.5 w-full border px-2.5 py-[7px] text-black rounded-[10px] shadow-sm focus:outline-none ${
                      formik.touched.email && formik.errors.email
                        ? "border-red-500 focus:ring-red-500"
                        : "border border-[#D1D1D1] focus:ring-black"
                    }`}
                  />
                  <span
                    className="absolute top-[30px] transform -translate-y-1/2 flex items-center text-gray-500 cursor-pointer right-3"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <img src={EyeIcon} alt="eye" />
                    ) : (
                      <img src={EyeOffIcon} alt="eye" />
                    )}
                  </span>
                </div>
                {formik.touched.password && formik.errors.password && (
                  <p className="formField-validation">
                    {formik.errors.password}
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between mt-5 text-sm text-gray-600 ">
                <label className="flex items-center">
                  <input
                    id="checkbox"
                    type="checkbox"
                    name="remember"
                    checked={formik.values.remember}
                    onChange={formik.handleChange}
                    className="rounded mr-2.5 h-4 w-4 text-start"
                  />
                  <span className="text-base font-normal leading-[26px] text-[#143038]">
                    Remember me
                  </span>
                </label>
                <span
                  onClick={() => navigate("/forget-password")}
                  className="font-medium text-[#282828] underline cursor-pointer"
                >
                  Forgot Password?
                </span>
              </div>

              <div className="mt-10">
                <button
                  type="submit"
                  className="w-full bg-[#3D3D3D] text-white font-medium py-[7px] rounded-[10px]"
                >
                  {loading ? (
                    <div className="outline-none btnLoading">
                      <Loader />
                    </div>
                  ) : (
                    "Login"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default LoginPage;
