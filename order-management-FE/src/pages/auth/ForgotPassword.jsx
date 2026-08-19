import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import LogoImage from "../../assets/image/Logo.png";
import { forgetPassword } from "../../Api/auth";
import toast from "react-hot-toast";
import { Loader } from "../../components/commen/Loader";

const ForgetPassword = () => {
  const [loading, setLoading] = useState(false);
  const formik = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email("Invalid email address")
        .required("Email is required"),
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        setLoading(true);
        const response = await forgetPassword(values.email);
        if (response.status_code === 200) {
          setLoading(false);
          toast.success("Password reset link sent!");
          resetForm();
        } else if (response.status === 404) {
          setLoading(false);
          toast.error("Email not found!");
        } else {
          setLoading(false);
          toast.error("Something went wrong.");
        }
      } catch (err) {
        console.error("Forgot password error:", err);
        toast.error(
          err.response?.data?.message ||
            "Failed to send reset link. Try again later."
        );
      } finally {
        setLoading(false);
      }
    },
  });
  return (
    <div className="w-full max-w-[1230px] m-auto h-screen flex items-center p-[15px]">
      <div className="bg-white w-full p-5 sm:p-10 min-h-[calc(100vh-164px)] lg:min-h-0 flex flex-col justify-start lg:grid  grid-cols-1 lg:grid-cols-2 items-center lg:justify-center gap-10 rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
        {/* Left - Logo */}
        <div className="flex justify-center w-full ">
          <img
            src={LogoImage}
            alt="We Buy Logo"
            className="h-[80px] lg:h-[250px] w-auto object-contain"
          />
        </div>

        {/* Right - Form */}
        <div className="w-full py-0 xl:py-[150px] sm:px-5">
          <h2 className="text-center lg:text-start text-[28px] text-[#212121] font-bold leading-[42px]">
            Forgot Password
          </h2>
          <p className="text-center lg:text-start text-base font-normal leading-[26px] text-[#212121] mt-2.5">
            Please enter the email address associated with your account and we
            will email you a link to reset your password.
          </p>

          <form onSubmit={formik.handleSubmit} className="mt-5 md:mt-10">
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
              {formik.touched.email && formik.errors.email ? (
                <p className="formField-validation">
                  {formik.errors.email}
                </p>
              ) : null}
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
                  "Submit"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgetPassword;
