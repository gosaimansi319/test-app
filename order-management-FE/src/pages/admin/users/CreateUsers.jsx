import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createNewUser } from "../../../store/User/usersThunk";
import { fetchRoles } from "../../../store/Roles/rolesThunk";
import EyeOffIcon from "../../../assets/svg/EyeOff.svg";
import EyeIcon from "../../../assets/svg/eyeon.svg";
import Arrow from "../../../assets/svg/arrow-left.svg";
import * as Yup from "yup";
import Upload from "../../../assets/svg/uploadIcon.svg";
import {
  fetchCenterCostByDept,
  fetchCompanies,
  fetchDepartments,
} from "../../../store/Company/companyThunk";
import Select from "react-select";

const CreateUser = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.users);

  const MAX_FILE_SIZE = 2 * 1024 * 1024;

  const UserSchema = Yup.object().shape({
    first_name: Yup.string()
      .trim()
      .required("First name is required")
      .max(15, "First name should be at most 15 characters"),
    last_name: Yup.string()
      .trim()
      .required("Last name is required")
      .max(15, "Last name should be at most 15 characters"),
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
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
    company: Yup.string().required("Company is required"),
    department: Yup.string().required("Department is required"),
    center_cost: Yup.string().required("Center cost is required"),
    address: Yup.string()
      .trim()
      .min(20, "Address should be at least 20 characters")
      .max(50, "Address should be at max 50 characters"),
    status: Yup.string()
      .required("Status is required")
      .oneOf(["active", "inactive"], "Status is required"),
    role_id: Yup.string().required("Role is required"),
    image: Yup.mixed()
      .required("User image is required")
      .test("fileType", "Unsupported File Format", (value) => {
        return (
          !value ||
          (value &&
            ["image/jpeg", "image/png", "image/jpg"].includes(value.type))
        );
      }),
  });

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

  const [statusOptions] = useState(["active", "inactive"]);
  const { departments, companies, centerCost } = useSelector(
    (state) => state.companies
  );
  const [showndepartments, setShownDepartments] = useState([]);
  const [shownCenterCost, setShownCenterCost] = useState([]);

  useEffect(() => {
    dispatch(fetchRoles());
    dispatch(fetchCompanies());
    dispatch(fetchDepartments());
  }, [dispatch]);

  useEffect(() => {
    if (centerCost && centerCost.length > 0) {
      setShownCenterCost(centerCost);
    }
  }, [centerCost]);
  const roles = useSelector((state) => state.roles.roles);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    const newValue = value;
    // Update form data
    setFormData((prevData) => ({
      ...prevData,
      [name]: newValue,
      ...(name === "company" && {
        department: "",
        center_cost: "",
      }),
      ...(name === "department" && {
        center_cost: "",
      }),
    }));

    // Handle interlinked dropdowns
    if (name === "company") {
      const filtered = departments?.filter(
        (dept) => dept?.company_id?.name === newValue
      );
      setShownDepartments(filtered);
      setShownCenterCost([]);
    }

    if (name === "department") {
      try {
        const filteredDept = departments.find((dept) => dept.name === value);
        dispatch(fetchCenterCostByDept(filteredDept._id));
        // const res = await fetch(`/api/center-costs/${value}`);
        // const data = await res.json();
        // setCenterCosts(data); // assuming it returns an array like ["Cost A", "Cost B"]
      } catch (err) {
        console.error("Error fetching center costs:", err);
      }
    }

    // Yup validation
    try {
      await UserSchema.validateAt(name, {
        ...formData,
        [name]: newValue,
      });

      setFormErrors((prevErrors) => {
        const updatedErrors = { ...prevErrors };
        delete updatedErrors[name];
        return updatedErrors;
      });
    } catch (err) {
      setFormErrors((prevErrors) => ({
        ...prevErrors,
        [name]: err.message,
      }));
    }
  };

  const validateImageFile = (file) => {
    if (!file) return true;

    // Check file type
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      setFormErrors((prev) => ({
        ...prev,
        image: "Unsupported File Format",
      }));
      return false;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setFormErrors((prev) => ({
        ...prev,
        image: "File size must be less than 2MB",
      }));
      return false;
    }

    // Clear error if file is valid
    setFormErrors((prev) => {
      const updatedErrors = { ...prev };
      delete updatedErrors.image;
      return updatedErrors;
    });

    return true;
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    const maxSizeInBytes = 2 * 1024 * 1024; // 2MB
    if (file?.size > maxSizeInBytes) {
      toast.error("Image size should be less than 2MB");
      e.target.value = null;
      return;
    }

    if (file && file.type.startsWith("image/")) {
      setFormData((prev) => ({ ...prev, image: file }));
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      e.target.value = null;
    }
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      if (validateImageFile(file)) {
        setFormData((prev) => ({ ...prev, image: file }));
        setPreviewUrl(URL.createObjectURL(file));
      }
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

      await dispatch(createNewUser(submitData)).unwrap();
      toast.success("User created successfully");
      navigate("/admin/users");
    } catch (error) {
      if (error.name === "ValidationError") {
        const errors = {};
        error.inner.forEach((err) => {
          errors[err.path] = err.message;
        });
        setFormErrors(errors);
      } else {
        toast.error(error || "Failed to create user");
        console.error("Error creating user:", error);
      }
    }
  };
  const handleCancel = () => {
    navigate("/admin/users");
  };

  const toOptions = (arr) =>
    arr.map((item) => ({ value: item.name, label: item.name }));

  const roleOptions = roles.map((role) => ({
    value: role._id,
    label: role.name.charAt(0).toUpperCase() + role.name.slice(1),
  }));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="flex sm:hidden text-2xl font-bold text-[#212121] leading-9 mb-3">
        <img
          onClick={() => navigate(-1)}
          src={Arrow}
          alt="Arrow"
          className="cursor-pointer"
        />
        &nbsp;Create User
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-4">Personal Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <p className="text-red-500 text-sm">
                  {formErrors.phone_number}
                </p>
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
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <img src={EyeIcon} alt="Show password" />
                  ) : (
                    <img src={EyeOffIcon} alt="Hide password" />
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
              <Select
                name="company"
                isClearable
                value={
                  formData.company
                    ? { value: formData.company, label: formData.company }
                    : null
                }
                onChange={(selectedOption) =>
                  handleChange({
                    target: {
                      name: "company",
                      value: selectedOption ? selectedOption.value : "",
                    },
                  })
                }
                options={toOptions(companies)}
                placeholder="Select company..."
                classNamePrefix="formField-select"
                className="pt-3"
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: "#F6F6F6",
                    borderColor: "#ccc",
                    minHeight: "38px",
                    boxShadow: "none",
                  }),
                }}
              />
              {formErrors.company && (
                <p className="text-red-500 text-sm">{formErrors.company}</p>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="formField-label">Department</label>
              <Select
                name="department"
                isClearable
                isDisabled={showndepartments.length < 1}
                value={
                  formData.department
                    ? { value: formData.department, label: formData.department }
                    : null
                }
                onChange={(selectedOption) =>
                  handleChange({
                    target: {
                      name: "department",
                      value: selectedOption ? selectedOption.value : "",
                    },
                  })
                }
                options={toOptions(showndepartments)}
                placeholder="Select department..."
                classNamePrefix="formField-select"
                className="pt-3"
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: "#F6F6F6",
                    borderColor: "#ccc",
                    minHeight: "38px",
                    boxShadow: "none",
                  }),
                }}
              />
              {formErrors.department && (
                <p className="text-red-500 text-sm">{formErrors.department}</p>
              )}
            </div>

            {/* Center Cost */}
            <div>
              <label className="formField-label">Center Cost</label>
              <Select
                name="center_cost"
                isClearable
                isDisabled={shownCenterCost.length < 1}
                value={
                  formData.center_cost
                    ? { value: formData.center_cost, label: formData.center_cost }
                    : null
                }
                onChange={(selectedOption) =>
                  handleChange({
                    target: {
                      name: "center_cost",
                      value: selectedOption ? selectedOption.value : "",
                    },
                  })
                }
                options={toOptions(shownCenterCost)}
                placeholder="Select center cost..."
                classNamePrefix="formField-select"
                className="pt-3"
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: "#F6F6F6",
                    borderColor: "#ccc",
                    minHeight: "38px",
                    boxShadow: "none",
                  }),
                }}
              />
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
              <Select
                name="role_id"
                value={roleOptions.find((option) => option.value === formData.role_id) || null}
                onChange={(selectedOption) => {
                  setFormData((prev) => ({
                    ...prev,
                    role_id: selectedOption ? selectedOption.value : '',
                  }));
                }}
                options={roleOptions}
                placeholder="Select Role"
                classNamePrefix="react-select"
              />
              {formErrors.role_id && (
                <p className="text-red-500 text-sm">{formErrors.role_id}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 items-start w-full gap-5 mt-5">
            {/* Address */}
            <div>
              <label className="formField-label">Address</label>
              <textarea
                name="address"
                placeholder="Flat No, Apartment Name, Area Name, State Name, Country Name - 123 456"
                value={formData.address}
                onChange={handleChange}
                rows="3"
                className="formField-textField"
              ></textarea>
              {formErrors.address && (
                <p className="text-red-500 text-sm">{formErrors.address}</p>
              )}
            </div>
            {/* Profile Image */}
            <div>
              <label className="formField-label">Add Profile Image</label>
              <div
                className="border border-dashed border-[#B0B0B0] rounded-lg py-5 px-3 text-center mt-2.5 min-h-[80px]"
                onDrop={handleImageDrop}
                onDragOver={handleDragOver}
              >
                {!previewUrl ? (
                  <div className=" flex gap-2.5 items-center justify-center">
                    <span className="h-10 w-10 bg-[#F6F6F6] flex justify-center items-center rounded-[10px]">
                      <img src={Upload} alt="upload" />
                    </span>
                    <div className="flex items-center gap-2.5">
                      <p className="text-sm font-normal text-[#212121] leading-6 flex items-center gap-2.5">
                        Drop image here, or
                      </p>
                      <label className="text-sm font-normal text-[#212121] leading-6 underline">
                        Browse
                        <input
                          type="file"
                          className="hidden"
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="relative mt-4 w-40 h-40 border rounded-md overflow-hidden">
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
                )}
              </div>
              {formErrors.image && (
                <p className="text-red-500 text-sm mt-2">{formErrors.image}</p>
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-center md:justify-end space-x-4 mt-8 ">
          <button
            type="button"
            onClick={handleCancel}
            className="formField-btn"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="formField-btn activebtn text-nowrap"
          >
            {loading ? "Creating..." : "Create User"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateUser;
