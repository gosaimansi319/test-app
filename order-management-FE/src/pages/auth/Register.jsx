import { useState } from "react";
import LogoImage from "../../assets/image/Logo.png";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../../Api/auth";
import { toast } from "react-hot-toast";
import { Loader } from "../../components/commen/Loader";
import EyeIcon from "../../assets/svg/eyeon.svg";
import EyeOffIcon from "../../assets/svg/EyeOff.svg";
import { useAuth } from "../../context/AuthContext";

function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .min(3, "Name must be at least 3 characters")
        .required("Name is required"),
      email: Yup.string().email("Invalid email").required("Email is required"),
      password: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("Password is required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password"), null], "Passwords must match")
        .required("Confirm password is required"),
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const response = await registerUser(
          values.name,
          values.email,
          values.password
        );

        if (response.status_code === 201) {
          setLoading(false);
          const { user, token } = response.data;
          await login(user, token, false);
          toast.success("Registration successful!");
          navigate("/user/orderlist", { replace: true });
        } else if (response.status_code === 400) {
          setLoading(false);
          toast.error(response.message || "User already exists");
        } else {
          setLoading(false);
          toast.error(response.message || "Registration failed");
        }
      } catch (err) {
        console.error("Registration error:", err);
        setLoading(false);
        toast.error(
          err.response?.data?.message ||
            "Registration failed. Please try again."
        );
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

          {/* Right - Register Form */}
          <div className="w-full py-0 xl:py-[82px] lg:px-5">
            <h2 className="text-center lg:text-start text-[28px] text-[#212121] font-bold leading-[42px]">
              Sign Up
            </h2>
            <p className="text-center lg:text-start text-base font-normal leading-[26px] text-[#212121] mt-2.5">
              Create a new account
            </p>

            {loading && <Loader />}

            <form onSubmit={formik.handleSubmit} className="mt-5 md:mt-10 ">
              {/* Name */}
              <div className="mb-6">
                <label
                  htmlFor="name"
                  className="text-base font-normal leading-[26px] text-[#212121]"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Enter your full name"
                  className="w-full border border-[#E0E0E0] rounded-lg px-4 py-2 mt-2 focus:outline-none focus:border-[#1F2937]"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.name && formik.errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {formik.errors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="mb-6">
                <label
                  htmlFor="email"
                  className="text-base font-normal leading-[26px] text-[#212121]"
                >
                  Email Id
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  className="w-full border border-[#E0E0E0] rounded-lg px-4 py-2 mt-2 focus:outline-none focus:border-[#1F2937]"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.email && formik.errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {formik.errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="mb-6 relative">
                <label
                  htmlFor="password"
                  className="text-base font-normal leading-[26px] text-[#212121]"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    placeholder="Enter password"
                    className="w-full border border-[#E0E0E0] rounded-lg px-4 py-2 mt-2 focus:outline-none focus:border-[#1F2937]"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 mt-1"
                  >
                    {showPassword ? (
                      <img
                        src={EyeOffIcon}
                        alt="Hide"
                        className="w-5 h-5"
                      />
                    ) : (
                      <img
                        src={EyeIcon}
                        alt="Show"
                        className="w-5 h-5"
                      />
                    )}
                  </button>
                </div>
                {formik.touched.password && formik.errors.password && (
                  <p className="text-red-500 text-sm mt-1">
                    {formik.errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="mb-6 relative">
                <label
                  htmlFor="confirmPassword"
                  className="text-base font-normal leading-[26px] text-[#212121]"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Confirm password"
                    className="w-full border border-[#E0E0E0] rounded-lg px-4 py-2 mt-2 focus:outline-none focus:border-[#1F2937]"
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 mt-1"
                  >
                    {showConfirmPassword ? (
                      <img
                        src={EyeOffIcon}
                        alt="Hide"
                        className="w-5 h-5"
                      />
                    ) : (
                      <img
                        src={EyeIcon}
                        alt="Show"
                        className="w-5 h-5"
                      />
                    )}
                  </button>
                </div>
                {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">
                    {formik.errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1F2937] text-white font-semibold py-3 rounded-lg mt-8 hover:bg-[#111827] disabled:opacity-50"
              >
                {loading ? "Creating Account..." : "Sign Up"}
              </button>
            </form>

            <p className="text-center text-base font-normal text-[#212121] mt-6">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-blue-600 hover:underline font-semibold"
              >
                Login here
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default RegisterPage;
