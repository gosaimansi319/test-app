import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchUserById, updateUserById } from "../../../store/User/usersThunk";
import { fetchRoles } from "../../../store/Roles/rolesThunk";
import Arrow from "../../../assets/svg/arrow-left.svg";
import {
  fetchCenterCostByDept,
  fetchCompanies,
  fetchDepartments,
} from "../../../store/Company/companyThunk";
import * as Yup from "yup";
import EditIcon from "../../../assets/svg/editIcon.svg";
import EyeOffIcon from "../../../assets/svg/EyeOff.svg";
import EyeIcon from "../../../assets/svg/eyeon.svg";
import userLogo from "../../../assets/image/logo_user.jpg";

const ViweUpdateUsers = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { state } = useLocation();
  const CurrentUserid = state?.id;

  const UserSchema = Yup.object().shape({
    first_name: Yup.string().trim().required("First name is required"),
    last_name: Yup.string().trim().required("Last name is required"),
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
    phone_number: Yup.string()
      .transform((value) => {
        if (!value) return value;
        // Remove '+351' or '00351' prefix and all non-digit characters
        return value.replace(/^(\+351|00351)/, "").replace(/\D/g, "");
      })
      .matches(
        /^\d{9}$/,
        "Phone number must be exactly 9 digits (excluding country code)"
      )
      .required("Phone number is required"),
    company: Yup.string().required("Company is required"),
    department: Yup.string().required("Department is required"),
    center_cost: Yup.string().required("Center cost is required"),
    address: Yup.string()
      .trim()
      .min(20, "Address should be at least 20 characters")
      .max(50, "Address should be at max 50 characters"),
    status: Yup.string()
      .oneOf(["active", "inactive", "pending"], "Invalid status")
      .required("Status is required"),
    role_id: Yup.string().required("Role is required"),
  });

  const currentUser = useSelector((state) => state.users?.selectedUser);
  const { departments, companies, centerCost } = useSelector(
    (state) => state.companies
  );
  const roles = useSelector((state) => state.roles.roles);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    password: "",
    company: "",
    department: "",
    center_cost: "",
    address: "",
    status: "active",
    role_id: "",
    image: [],
  });

  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  // States for filtered dropdowns
  const [showndepartments, setShownDepartments] = useState([]);
  const [shownCenterCosts, setShownCenterCost] = useState([]);

  const [statusOptions] = useState(["active", "inactive"]);

  // Fetch initial data
  useEffect(() => {
    dispatch(fetchRoles());
    dispatch(fetchCompanies());
    dispatch(fetchDepartments());
  }, [dispatch]);

  // Update center costs when they change
  useEffect(() => {
    if (centerCost && centerCost.length > 0) {
      setShownCenterCost(centerCost);
    }
  }, [centerCost]);

  // Set form data when currentUser is loaded
  useEffect(() => {
    if (currentUser) {
      setFormData({
        first_name: currentUser?.first_name || "",
        last_name: currentUser?.last_name || "",
        email: currentUser?.email || "",
        phone_number: currentUser?.phone_number || "",
        password: currentUser?.password || "",
        company: currentUser?.company || "",
        department: currentUser?.department || "",
        center_cost: currentUser?.center_cost || "",
        address: currentUser?.address || "",
        status: currentUser?.status || "active",
        role_id: currentUser?.role_id || "",
        image: currentUser?.image || [],
      });
      setPreviewUrl(currentUser?.image || null);

      // Set up filtered departments and center costs based on current user data
      if (currentUser?.company && departments.length > 0) {
        const filtered = departments.filter(
          (dept) => dept?.company_id?.name === currentUser.company
        );
        setShownDepartments(filtered);
      }

      if (currentUser?.department && departments.length > 0) {
        const filteredDept = departments.find(
          (dept) => dept.name === currentUser.department
        );
        if (filteredDept?._id) {
          dispatch(fetchCenterCostByDept(filteredDept._id));
        }
      }
    }
  }, [currentUser, departments, dispatch]);

  useEffect(() => {
    if (CurrentUserid !== undefined) dispatch(fetchUserById(CurrentUserid));
  }, [CurrentUserid, dispatch]);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    const newValue = value;

    // Update form data with special handling for linked fields
    setFormData((prevData) => ({
      ...prevData,
      [name]: newValue,
      // Reset dependent fields when parent changes
      ...(name === "company" ? { department: "", center_cost: "" } : {}),
      ...(name === "department" ? { center_cost: "" } : {}),
    }));

    // Handle interlinked dropdowns
    if (name === "company") {
      const filtered = departments.filter(
        (dept) => dept?.company_id?.name === value
      );
      setShownDepartments(filtered);
      setShownCenterCost([]);
    }

    if (name === "department") {
      try {
        const filteredDept = departments.find((dept) => dept.name === value);
        if (filteredDept?._id) {
          dispatch(fetchCenterCostByDept(filteredDept._id));
        }
      } catch (err) {
        console.error("Error fetching center costs:", err);
      }
    }

    try {
      // Validate only the changed field using Yup
      await UserSchema.validateAt(name, {
        ...formData,
        [name]: newValue,
      });

      // If valid, remove the error for this field
      setFormErrors((prevErrors) => {
        const updatedErrors = { ...prevErrors };
        delete updatedErrors[name];
        return updatedErrors;
      });
    } catch (err) {
      // If not valid, set the error message for this field
      setFormErrors((prevErrors) => ({
        ...prevErrors,
        [name]: err.message,
      }));
    }
  };

  const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Only image files are allowed.");
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error("Please upload an image smaller than 2MB.");
        return;
      }

      setFormData((prev) => ({ ...prev, image: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Only image files are allowed.");
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error("Please upload an image smaller than 2MB.");
        return;
      }

      setFormData((prev) => ({ ...prev, image: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image: null }));
    setPreviewUrl(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await UserSchema.validate(formData, { abortEarly: false });
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && key !== "image") {
          submitData.append(key, value);
        }
      });

      if (formData.image instanceof File) {
        submitData.append("image", formData.image);
      }

      await dispatch(
        updateUserById({ userId: CurrentUserid, userData: submitData })
      );
      navigate("/admin/users");
    } catch (error) {
      if (error.name === "ValidationError") {
        const errors = {};
        error.inner.forEach((err) => {
          errors[err.path] = err.message;
        });
        setFormErrors(errors);
      } else {
        toast.error(error?.message || "Failed to Save user");
        console.error("Error Saving user:", error);
      }
    }
  };

  const handleOnEditClick = () => {
    alert("view/edit");
  };

  const handleCancel = () => {
    navigate("/admin/users");
  };

  return (
    <div className="boxShadow">
      <h2 className="flex sm:hidden text-2xl font-bold text-[#212121] leading-9 mb-3">
        <img
          onClick={() => navigate(-1)}
          src={Arrow}
          alt="Arrow"
          className="cursor-pointer"
        />
        &nbsp;User Detail
      </h2>
      <h2 className="formField-headTitle text-base sm:text-xl md:text-2xl">
        Personal Information
      </h2>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-5">
        {/* Profile Image */}
        <div className="mb-5 max-w-[150px] w-full mx-auto">
          <div
            className=" rounded-[20px] p-4 text-center flex flex-col items-center justify-center"
            onDrop={handleImageDrop}
            onDragOver={handleDragOver}
          >
            {!previewUrl && (
              <div className="flex flex-col items-center justify-center space-y-2">
                <img
                  src={userLogo}
                  alt="Profile"
                  className="w-28 h-28 rounded-lg"
                />
                <div className="flex items-center gap-1 mt-2.5 cursor-pointer">
                  <img src={EditIcon} alt="Edit" />
                  <label className="text-sm font-medium text-[#212121] leading-6 cursor-pointer">
                    Edit Profile
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
              </div>
            )}

            {previewUrl && (
              <>
                <div
                  className={`relative h-[150px] w-[150px] object-cover  rounded-[20px] overflow-hidden  ${
                    previewUrl
                      ? "border border-[#D8F4F5]"
                      : "border-2 border-black border-dashed"
                  }`}
                >
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="object-cover w-full h-full"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-opacity-80"
                    title="Remove image"
                  >
                    &times;
                  </button>
                </div>
                <div className="flex items-center gap-1 mt-2.5 cursor-pointer">
                  <img src={EditIcon} alt="Edit" />
                  <label className="text-sm font-medium text-[#212121] leading-6 cursor-pointer">
                    Edit Profile
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
              </>
            )}

            <button
              type="button"
              className="flex items-center gap-1 mt-2.5"
              onClick={handleOnEditClick}
            ></button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* First Name */}
          <div>
            <label className="formField-label">First Name</label>
            <input
              type="text"
              name="first_name"
              placeholder="Enter first name"
              value={formData.first_name}
              onChange={handleChange}
              className="formField-inputBox"
            />
            {formErrors.first_name && (
              <p className="text-red-500 text-sm">{formErrors.first_name}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="formField-label">Last Name</label>
            <input
              type="text"
              name="last_name"
              placeholder="Enter last name"
              value={formData.last_name}
              onChange={handleChange}
              className="formField-inputBox"
            />
            {formErrors.last_name && (
              <p className="text-red-500 text-sm">{formErrors.last_name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="formField-label">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter email"
              value={formData.email}
              onChange={handleChange}
              className="formField-inputBox"
              disabled={true}
            />
            {formErrors.email && (
              <p className="text-red-500 text-sm">{formErrors.email}</p>
            )}
          </div>

          {/* Contact Number */}
          <div>
            <label className="formField-label">Contact Number</label>
            <input
              type="text"
              name="phone_number"
              placeholder="Enter contact number"
              value={formData.phone_number}
              onChange={handleChange}
              className="formField-inputBox"
            />
            {formErrors.phone_number && (
              <p className="text-red-500 text-sm">{formErrors.phone_number}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="formField-label">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                className="formField-inputBox pr-10"
                disabled={true}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <img src={EyeIcon} alt="Show password" />
                ) : (
                  <img src={EyeOffIcon} alt="Show password" />
                )}
              </button>
            </div>
            {formErrors.password && (
              <p className="text-red-500 text-sm">{formErrors.password}</p>
            )}
          </div>

          {/* Company */}
          <div>
            <label className="formField-label">Company</label>
            <select
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="formField-inputBox appearance-none"
            >
              <option value="">Select options</option>
              {companies.map((company, index) => (
                <option key={index} value={company.name}>
                  {company.name}
                </option>
              ))}
            </select>
            {formErrors.company && (
              <p className="text-red-500 text-sm">{formErrors.company}</p>
            )}
          </div>

          {/* Department */}
          <div>
            <label className="formField-label">Department</label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="formField-inputBox appearance-none"
              disabled={!formData.company || showndepartments.length < 1}
            >
              <option value="">Select options</option>
              {showndepartments.map((dept, index) => (
                <option key={index} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
            {formErrors.department && (
              <p className="text-red-500 text-sm">{formErrors.department}</p>
            )}
          </div>

          {/* Center Cost */}
          <div>
            <label className="formField-label">Center Cost</label>
            <select
              name="center_cost"
              value={formData.center_cost}
              onChange={handleChange}
              className="formField-inputBox appearance-none"
              disabled={!formData.department || shownCenterCosts.length < 1}
            >
              <option value="">Select options</option>
              {shownCenterCosts.map((center, index) => (
                <option key={index} value={center.name}>
                  {center.name}
                </option>
              ))}
            </select>
            {formErrors.center_cost && (
              <p className="text-red-500 text-sm">{formErrors.center_cost}</p>
            )}
          </div>

          {/* Account Status */}
          <div>
            <label className="formField-label">Account Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="formField-inputBox appearance-none"
            >
              <option value="">Select options</option>
              {statusOptions.map((status, index) => (
                <option key={index} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
            {formErrors.status && (
              <p className="text-red-500 text-sm">{formErrors.status}</p>
            )}
          </div>

          {/* Roles */}
          <div>
            <label className="formField-label">Roles</label>
            <select
              name="role_id"
              value={formData.role_id}
              onChange={handleChange}
              className="formField-inputBox appearance-none"
            >
              <option value="">Select Role</option>
              {roles.map((role) => (
                <option key={role._id} value={role._id}>
                  {role.name}
                </option>
              ))}
            </select>
            {formErrors.role_id && (
              <p className="text-red-500 text-sm">{formErrors.role_id}</p>
            )}
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label className="formField-label">Address</label>
            <textarea
              name="address"
              placeholder="Flat No, Apartment Name, Area Name, State Name, Country Name - 123 456"
              value={formData.address}
              onChange={handleChange}
              rows="3"
              className="formField-inputBox"
            ></textarea>
            {formErrors.address && (
              <p className="text-red-500 text-sm">{formErrors.address}</p>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 mt-8">
          <button
            type="button"
            onClick={handleCancel}
            className="formField-btn"
          >
            Cancel
          </button>
          <button type="submit" className="formField-btn activebtn">
            {"Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ViweUpdateUsers;
