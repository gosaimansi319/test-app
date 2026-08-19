import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useSearchParams, useNavigate } from "react-router-dom";
import LogoImage from "../../assets/image/Logo.png";
import toast from "react-hot-toast";
import { resetPassword } from "../../Api/auth";
import EyeIcon from "../../assets/svg/eyeon.svg";
import EyeOffIcon from "../../assets/svg/EyeOff.svg";

function ResetPassword() {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const formik = useFormik({
    initialValues: {
      email: "",
      newPassword: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email").required("Email is required"),
      newPassword: Yup.string()
        .min(6, "Minimum 6 characters")
        .required("New password is required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("newPassword")], "Passwords must match")
        .required("Confirm password is required"),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const response = await resetPassword(
          token,
          values.email,
          values.newPassword,
          values.confirmPassword
        );
        if (response.status_code === 200) {
          toast.success("Password has been reset!");
          navigate("/login");
        } else if (response.status === 400) {
          toast.error("Invalid or expired token");
        } else {
          toast.error(response.data.message || "Reset failed.");
        }
      } catch (err) {
        toast.error(
          err.response?.data?.message ||
            "Something went wrong while resetting password."
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="w-full max-w-[1230px] m-auto h-screen flex items-center p-[15px]">
      <div className="bg-white w-full p-5 sm:p-10 min-h-[calc(100vh-164px)] lg:min-h-0 flex flex-col justify-start lg:grid  grid-cols-1 lg:grid-cols-2 items-center lg:justify-center gap-10 rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
        {/* Left - Logo */}
        <div className="flex justify-center w-full">
          <img
            src={LogoImage}
            alt="We Buy Logo"
            className="h-[80px] lg:h-[250px] w-auto object-contain"
          />
        </div>

        {/* Right - Reset Password Form */}
        <div className="w-full py-0 xl:py-[105px] sm:px-5">
          <h2 className="text-center lg:text-start text-[28px] text-[#212121] font-bold leading-[42px]">
            Reset Password
          </h2>
          <p className="text-center lg:text-start text-base font-normal leading-[26px] text-[#212121] mt-2.5">
            Create your new password!
          </p>

          <form onSubmit={formik.handleSubmit} className="mt-5 md:mt-10">
            {/* Email Field */}
            <div className="mb-5">
              <label
                htmlFor="email"
                className="text-base font-normal text-[#212121]"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.email}
                className={`mt-2.5 w-full border px-2.5 py-[7px] text-black rounded-[10px] shadow-sm focus:outline-none ${
                  formik.touched.email && formik.errors.email
                    ? "border-red-500"
                    : "border-[#D1D1D1]"
                }`}
              />
              {formik.touched.email && formik.errors.email && (
                <p className="mt-1 text-sm text-red-500">
                  {formik.errors.email}
                </p>
              )}
            </div>

            {/* New Password Field */}
            <div>
              <label
                htmlFor="newPassword"
                className="text-base font-normal text-[#212121]"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.newPassword}
                  className={`mt-2.5 w-full border px-2.5 py-[7px] text-black rounded-[10px] shadow-sm focus:outline-none ${
                    formik.touched.newPassword && formik.errors.newPassword
                      ? "border-red-500"
                      : "border-[#D1D1D1]"
                  }`}
                />
                <span
                  className="absolute flex items-center text-gray-500 cursor-pointer top-[30px] transform -translate-y-1/2 right-3"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                >
                  {showNewPassword ? (
                    <img src={EyeIcon} alt="eye"/>
                  ) : (
                    <img src={EyeOffIcon} alt="eye"/>
                  )}
                </span>
              </div>
              {formik.touched.newPassword && formik.errors.newPassword && (
                <p className="mt-1 text-sm text-red-500">
                  {formik.errors.newPassword}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="mt-5">
              <label
                htmlFor="confirmPassword"
                className="text-base font-normal text-[#212121]"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.confirmPassword}
                  className={`mt-2.5 w-full border px-2.5 py-[7px] text-black rounded-[10px] shadow-sm focus:outline-none ${
                    formik.touched.confirmPassword &&
                    formik.errors.confirmPassword
                      ? "border-red-500"
                      : "border-[#D1D1D1]"
                  }`}
                />
                <span
                  className="absolute flex items-center text-gray-500 cursor-pointer top-[30px] right-3 transform -translate-y-1/2"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? (
                    <img src={EyeIcon} alt="eye" />
                  ) : (
                    <img src={EyeOffIcon} alt="eye"/>
                  )}
                </span>
              </div>
              {formik.touched.confirmPassword &&
                formik.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">
                    {formik.errors.confirmPassword}
                  </p>
                )}
            </div>

            {/* Submit Button */}
            <div className="mt-10">
              <button
                type="submit"
                className="w-full bg-[#3D3D3D] text-white font-medium py-[7px] rounded-[10px]"
                disabled={formik.isSubmitting}
              >
                {formik.isSubmitting ? "Resetting..." : "Reset"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
