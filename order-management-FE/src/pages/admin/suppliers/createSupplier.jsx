import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { createNewSupplier } from "../../../store/Supplier/suppliersThunk";
import Arrow from "../../../assets/svg/arrow-left.svg";

// Yup validation schema
const supplierSchema = Yup.object().shape({
  company: Yup.string().trim().required("Company is required"),
  nifNumber: Yup.string()
    .trim()
    .matches(/^[0-9]+$/, "Invalid NIF Number")
    .required("NIF Number is required"),
  erpNumber: Yup.string()
    .trim()
    .matches(/^[0-9]+$/, "Invalid ERP Number")
    .required("ERP Number is required"),
  contactPerson: Yup.string().trim().required("Contact Person is required"),
  contactNumber: Yup.string()
    .trim()
    .matches(/^\d{9,15}$/, "Contact Number should be 9–15 digits")
    .required("Contact Number is required"),
  // address: Yup.string().required("Address is required"),
  address: Yup.string()
    .trim()
    .min(20, "Address should be at least 20 characters")
    .max(50, "Address should be at max 50 characters"),
});

const CreateSupplier = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    company: "",
    nifNumber: "",
    erpNumber: "",
    contactPerson: "",
    contactNumber: "",
    address: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = async (e) => {
    const { name, value } = e.target;
    if (name === "nifNumber" && /[^0-9]/.test(value)) return;
    if (name === "erpNumber" && /[^0-9]/.test(value)) return;
    if (name === "contactNumber" && /[^0-9]/.test(value)) return;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    try {
      // Validate only the changed field
      await supplierSchema.validateAt(name, { ...formData, [name]: value });

      // Clear error if validation passes
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    } catch (err) {
      // Set error if validation fails
      setErrors((prev) => ({
        ...prev,
        [name]: err.message,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await supplierSchema.validate(formData, { abortEarly: false });

      const formattedData = {
        company_name: formData.company,
        NIF_number: formData.nifNumber,
        ERP_number: formData.erpNumber,
        contact_person: formData.contactPerson,
        contact_number: formData.contactNumber,
        address: formData.address,
      };

      const form = new FormData();
      Object.entries(formattedData).forEach(([key, value]) =>
        form.append(key, value)
      );

      await dispatch(createNewSupplier(form)).unwrap();
      navigate("/admin/suppliers");
    } catch (err) {
      if (err.inner) {
        const formErrors = {};
        err.inner.forEach((validationError) => {
          formErrors[validationError.path] = validationError.message;
        });
        setErrors(formErrors);
      }
    }
  };

  return (
    <div className="boxShadow p-6">
      <h2 className="flex sm:hidden text-2xl font-bold text-[#212121] leading-9 mb-3">
        <img
          onClick={() => navigate(-1)}
          src={Arrow}
          alt="Arrow"
          className="cursor-pointer"
        />
        &nbsp;Create Supplier
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="formField-label">Company</label>
          <input
            type="text"
            name="company"
            placeholder="Enter company name"
            value={formData.company}
            onChange={handleChange}
            className="formField-inputBox"
          />
          {errors.company && (
            <p className="text-red-500 text-sm mt-1">{errors.company}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
          <div>
            <label className="formField-label">NIF Number</label>
            <input
              type="text"
              name="nifNumber"
              value={formData.nifNumber}
              onChange={handleChange}
              placeholder="Enter NIF number"
              className="formField-inputBox"
            />
            {errors.nifNumber && (
              <p className="text-red-500 text-sm mt-1">{errors.nifNumber}</p>
            )}
          </div>

          <div>
            <label className="formField-label">ERP Number</label>
            <input
              type="text"
              name="erpNumber"
              value={formData.erpNumber}
              onChange={handleChange}
              placeholder="Enter ERP number"
              className="formField-inputBox"
            />
            {errors.erpNumber && (
              <p className="text-red-500 text-sm mt-1">{errors.erpNumber}</p>
            )}
          </div>

          <div>
            <label className="formField-label">Contact Person</label>
            <input
              type="text"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              placeholder="Enter name"
              className="formField-inputBox"
            />
            {errors.contactPerson && (
              <p className="text-red-500 text-sm mt-1">
                {errors.contactPerson}
              </p>
            )}
          </div>

          <div>
            <label className="formField-label">Contact Number</label>
            <input
              type="text"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              placeholder="Enter number"
              className="formField-inputBox"
            />
            {errors.contactNumber && (
              <p className="text-red-500 text-sm mt-1">
                {errors.contactNumber}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="formField-label">Address</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Flat No. Apartment Name, Area Name, State Name, Country Name - 123 456"
            rows={4}
            className="formField-textField outline-none"
          />
          {errors.address && (
            <p className="text-red-500 text-sm mt-1">{errors.address}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-between md:justify-end gap-5 mt-5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="formField-btn"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="formField-btn text-white bg-[#3D3D3D]"
          >
            Create Supplier
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateSupplier;
