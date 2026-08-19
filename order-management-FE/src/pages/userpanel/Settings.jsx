import { useEffect, useMemo, useRef, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import UserImage from "../../assets/image/user_img.png";
import EditIcon from "../../assets/svg/editIcon.svg";
import EyeOffIcon from "../../assets/svg/EyeOff.svg";
import EyeIcon from "../../assets/svg/eyeon.svg";
import { updateSetting } from "../../Api/setting";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserDetailSetting } from "../../store/Setting/settingThunk";
import toast from "react-hot-toast";
import PageLoader from "../../components/commen/PageLoader";

const formFields = [
  { name: "first_name", label: "First Name", type: "text" },
  { name: "last_name", label: "Last Name", type: "text" },
  { name: "email", label: "Email", type: "email", disabled: true },
  { name: "phone_number", label: "Contact Number", type: "text" },
  { name: "company", label: "Company", type: "text", disabled: true },
  { name: "department", label: "Department", type: "text", disabled: true },
  { name: "center_cost", label: "Center Cost", type: "text", disabled: true },
];

const passwordFields = [
  { name: "currentPassword", label: "Current Password", key: "current" },
  {
    name: "newPassword",
    label: "New Password",
    key: "new",
  },
  { name: "confirmPassword", label: "Confirm Password", key: "confirm" },
];

const validationSchema = Yup.object().shape({
  first_name: Yup.string()
    .trim()
    .required("First Name is required")
    .max(15, "First name should be at most 15 characters"),
  last_name: Yup.string()
    .trim()
    .required("Last Name is required")
    .max(15, "Last name should be at most 15 characters"),
  phone_number: Yup.string()
    .trim()
    .required("Contact Number is required")
    .matches(/^[0-9]+$/, "Must be only digits")
    .min(10, "Must be at least 10 digits"),
  company: Yup.string(),
  department: Yup.string(),
  center_cost: Yup.string(),
  address: Yup.string()
    .trim()
    .min(20, "Address should be at least 20 characters")
    .max(50, "Address should be at max 50 characters"),
  role: Yup.string(),
  currentPassword: Yup.string().test(
    "password-update",
    "Required if changing password",
    function (value) {
      const { newPassword, confirmPassword } = this.parent;
      if (newPassword || confirmPassword) {
        return (
          !!value ||
          this.createError({ message: "Current Password is required" })
        );
      }
      return true;
    }
  ),
  newPassword: Yup.string()
    .matches(/^\S*$/, "No spaces are allowed")
    .test(
      "password-update",
      "Must be different from current password",
      function (value) {
        const { currentPassword, confirmPassword } = this.parent;
        if (currentPassword || confirmPassword) {
          return (
            (!!value && value !== currentPassword) ||
            this.createError({
              message: "New password must be different from current password",
            })
          );
        }
        return true;
      }
    )
    .min(6, "Password must be at least 6 characters"),
  confirmPassword: Yup.string()
    .matches(/^\S*$/, "No spaces are allowed")
    .test("passwords-match", "Passwords must match", function (value) {
      const { newPassword } = this.parent;
      if (newPassword) {
        return (
          value === newPassword ||
          this.createError({ message: "Passwords must match" })
        );
      }
      return true;
    }),
});

export default function UserSettings() {
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState();
  const [passwordVisibility, setPasswordVisibility] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef();

  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.roles);
  const userData = useSelector((state) => state.settings.setting);
  useEffect(() => {
    dispatch(fetchUserDetailSetting());
  }, [dispatch]);

  useEffect(() => {
    if (userData?.data?.image) {
      setImagePreview(`${userData.data.image}`);
    }
  }, [userData]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      const maxSizeInBytes = 2 * 1024 * 1024; // 2MB

      if (file.size > maxSizeInBytes) {
        toast.error("Image size should be less than 2MB");
        e.target.value = null;
        return;
      }

      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const togglePasswordVisibility = (field) => {
    setPasswordVisibility((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();

      const profileFields = [
        "first_name",
        "last_name",
        "email",
        "phone_number",
        "role",
        "address",
      ];

      profileFields.forEach((key) => {
        if (values[key]) {
          formData.append(key, values[key]);
        }
      });

      if (
        values.currentPassword.trim() &&
        values.newPassword.trim() &&
        values.confirmPassword.trim()
      ) {
        formData.append("current_password", values.currentPassword);
        formData.append("new_password", values.newPassword);
        formData.append("confirm_password", values.confirmPassword);
      }

      if (profileImage) {
        formData.append("image", profileImage);
      }

      const response = await updateSetting(formData);
      if (response.code === "ERR_BAD_REQUEST") {
        toast.error(response.response.data.message);
      } else {
        toast.success(response.data.message);
      }

      dispatch(fetchUserDetailSetting());

      resetForm({
        values: {
          ...values,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        },
      });

      setProfileImage(null);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile!");
    } finally {
      setIsSubmitting(false);
      setSubmitting(false);
    }
  };

  const initialValues = useMemo(
    () => ({
      first_name: userData?.data?.first_name || "",
      last_name: userData?.data?.last_name || "",
      email: userData?.data?.email || "",
      phone_number: userData?.data?.phone_number || "",
      company: userData?.data?.company || "",
      department: userData?.data?.department || "",
      center_cost: userData?.data?.center_cost || "",
      role: userData?.data?.role_id?.name || "",
      address: userData?.data?.address || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }),
    [userData]
  );

  return (
    <>
      {loading ? (
      <PageLoader />
      ) : (
        <div className="flex flex-col gap-6 mx-auto">
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize={true}
          >
            {({ resetForm }) => (
              <Form className="space-y-6" autoComplete="off">
                {/* Top Section */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {/* Profile Card */}
                  <div className="flex-1 bg-white boxShadow order-1">
                    <h3 className="block sm:hidden text-2xl font-bold text-[#212121] leading-9 mb-4">
                      Settings
                    </h3>
                    <h2 className="formField-headTitle text-base sm:text-xl md:text-2xl">
                      Profile
                    </h2>
                    <div className="flex flex-col items-center mt-10">
                      <div className="relative w-[150px] h-[150px]">
                        <img
                          src={imagePreview}
                          alt="Profile"
                          className="object-cover w-full h-full rounded-[20px]"
                        />
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/jpeg,image/jpg,image/png"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </div>
                      <p className="text-base font-medium leading-[26px] text-[#212121] mt-2.5">
                        {userData?.data?.first_name} {userData?.data?.last_name}
                      </p>
                      <button
                        type="button"
                        className="flex items-center gap-1 mt-2.5"
                        onClick={() => fileInputRef.current.click()}
                      >
                        <img src={EditIcon} alt="Edit" />
                        <span className="text-sm font-medium text-[#212121] leading-6">
                          Edit Profile
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Change Password */}
                  <div className="flex-1 boxShadow order-3 lg:order-2">
                    <h2 className="formField-headTitle text-base sm:text-xl md:text-2xl">
                      Change Password
                    </h2>
                    <div className="flex flex-col gap-5 mt-5">
                      {passwordFields.map(({ name, label, key }) => (
                        <div key={name} className="formFiled">
                          <label className="formField-label">{label}</label>
                          <div className="relative">
                            <Field
                              type={
                                passwordVisibility[key] ? "text" : "password"
                              }
                              name={name}
                              placeholder={`Enter your ${label.toLowerCase()}`}
                              className="formField-inputBox"
                              autoComplete="off"
                            />
                            <button
                              type="button"
                              className="absolute right-0 top-[30px] transform -translate-y-1/2 flex items-center pr-3"
                              onClick={() => togglePasswordVisibility(key)}
                            >
                              {passwordVisibility[key] ? (
                                <img src={EyeIcon} alt="Show password" />
                              ) : (
                                <img src={EyeOffIcon} alt="Hide password" />
                              )}
                            </button>
                          </div>
                          <ErrorMessage
                            name={name}
                            component="div"
                            className="formField-validation"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="flex-1 col-span-1 md:col-span-2 p-5 bg-white rounded-[20px] shadow-md order-2 md:order-3">
                    <h2 className="formField-headTitle text-base sm:text-xl md:text-2xl">
                      Personal Information
                    </h2>
                    <div className="mt-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        {formFields.map(({ name, label, type, disabled }) => (
                          <div key={name}>
                            <label className="formField-label">{label}</label>
                            <Field
                              name={name}
                              type={type}
                              disabled={disabled}
                              className={`formField-inputBox ${
                                disabled ? "bg-gray-100" : ""
                              }`}
                            />
                            <ErrorMessage
                              name={name}
                              component="div"
                              className="text-sm text-red-500"
                            />
                          </div>
                        ))}
                        <div>
                          <label className="formField-label">Role</label>
                          <Field
                            name="role"
                            disabled
                            className="formField-inputBox bg-gray-100"
                          ></Field>
                          <ErrorMessage
                            name="role"
                            component="div"
                            className="text-sm text-red-500"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="formField-label">Address</label>
                          <Field
                            as="textarea"
                            name="address"
                            rows={3}
                            className="formField-inputBox"
                          />
                          <ErrorMessage
                            name="address"
                            component="div"
                            className="text-sm text-red-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between gap-4 pt-5 pr-5 md:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();

                      // Reset image preview to initial
                      if (userData?.data?.image) {
                        setImagePreview(`${userData.data.image}`);
                      } else {
                        setImagePreview(UserImage);
                      }

                      // Clear the file input so selecting the same file triggers onChange
                      if (fileInputRef.current) {
                        fileInputRef.current.value = null;
                      }

                      // Clear selected file from state
                      setProfileImage(null);
                    }}
                    className="formField-btn"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="formField-btn bg-[#3D3D3D] text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save"}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      )}
    </>
  );
}
