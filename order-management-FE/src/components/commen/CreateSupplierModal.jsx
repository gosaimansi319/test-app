import { useState } from "react";
import * as Yup from "yup";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Typography,
} from "@material-tailwind/react";
import {
  createNewSupplier,
  fetchSuppliers,
} from "../../store/Supplier/suppliersThunk";
import { useDispatch } from "react-redux";
import { Loader } from "./Loader";

const supplierSchema = Yup.object().shape({
  company: Yup.string().trim().required("Company is required"),
  nifNumber: Yup.string()
    .trim()
    .matches(/^[A-Za-z0-9]+$/, "Invalid NIF Number")
    .required("NIF Number is required"),
  erpNumber: Yup.string()
    .trim()
    .matches(/^[A-Za-z0-9]+$/, "Invalid ERP Number")
    .required("ERP Number is required"),
  contactPerson: Yup.string().trim().required("Contact Person is required"),
  contactNumber: Yup.string()
    .trim()
    .matches(/^\d{9,15}$/, "Contact Number should be 9–15 digits")
    .required("Contact Number is required"),
  address: Yup.string()
    .trim()
    .min(20, "Address should be at least 20 characters")
    .max(50, "Address should be at max 50 characters"),
});

const CreateSupplierModal = ({ open, onClose, setSupplierList }) => {
  const [formData, setFormData] = useState({
    company: "",
    nifNumber: "",
    erpNumber: "",
    contactPerson: "",
    contactNumber: "",
    address: "",
  });
  const [errors, setErrors] = useState({});
  const [deleteLoad, setDeleteLoad] = useState(false);
  const dispatch = useDispatch();

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
      await supplierSchema.validateAt(name, { ...formData, [name]: value });

      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    } catch (err) {
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
      setDeleteLoad(true);
      await dispatch(createNewSupplier(form))
        .unwrap()
        .then(() =>
          dispatch(fetchSuppliers()).then((res) =>
            setSupplierList(res.payload.suppliers)
          )
        )
        .then(() =>
          setFormData({
            company: "",
            nifNumber: "",
            erpNumber: "",
            contactPerson: "",
            contactNumber: "",
            address: "",
          })
        )
        .then(() => setDeleteLoad(false));
      setErrors({});

      onClose();
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

  const resetForm = () => {
    setFormData({
      company: "",
      nifNumber: "",
      erpNumber: "",
      contactPerson: "",
      contactNumber: "",
      address: "",
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      handler={handleClose}
      size="sm"
      className="max-w-full w-full md:max-w-[36rem]"
    >
      <DialogHeader>
        <Typography variant="h4" color="blue-gray">
          Create New Supplier
        </Typography>
      </DialogHeader>

      <DialogBody divider className="max-h-[70vh] overflow-y-auto px-2 md:px-4">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="formField-label">Company</label>
              <input
                value={formData.company}
                onChange={handleChange}
                className="formField-inputBox"
                placeholder="Enter company name"
                name="company"
              />
              {errors.company && (
                <p className="text-sm text-red-500 mt-1">{errors.company}</p>
              )}
            </div>

            <div>
              <label className="formField-label">Address</label>
              <textarea
                value={formData.address}
                onChange={handleChange}
                rows="2"
                name="address"
                className="formField-inputBox"
                placeholder="Enter address here"
              ></textarea>
              {errors.address && (
                <p className="text-sm text-red-500 mt-1">{errors.address}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="formField-label">NIF Number</label>
              <input
                value={formData.nifNumber}
                onChange={handleChange}
                className="formField-inputBox"
                placeholder="Enter NIF number"
                name="nifNumber"
              />
              {errors.nifNumber && (
                <p className="text-sm text-red-500 mt-1">{errors.nifNumber}</p>
              )}
            </div>

            <div>
              <label className="formField-label">ERP Number</label>
              <input
                className="formField-inputBox"
                name="erpNumber"
                placeholder="Enter ERP number"
                value={formData.erpNumber}
                onChange={handleChange}
              />
              {errors.erpNumber && (
                <p className="text-sm text-red-500 mt-1">{errors.erpNumber}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="formField-label">Contact Person</label>
              <input
                className="formField-inputBox"
                name="contactPerson"
                placeholder="Enter name"
                value={formData.contactPerson}
                onChange={handleChange}
              />
              {errors.contactPerson && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.contactPerson}
                </p>
              )}
            </div>

            <div>
              <label className="formField-label">Contact Number</label>
              <input
                className="formField-inputBox"
                name="contactNumber"
                placeholder="Enter number"
                value={formData.contactNumber}
                onChange={handleChange}
              />
              {errors.contactNumber && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.contactNumber}
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogBody>

      <DialogFooter className="flex gap-4">
        <button className="formField-btn" onClick={handleClose}>
          Cancel
        </button>
        <button
          className="formField-btn bg-[#3D3D3D] text-[#FFFFFF]"
          onClick={handleSubmit}
        >
          {deleteLoad ? (
            <div className="py-1">
              <Loader />
            </div>
          ) : (
            "Create Supplier"
          )}
        </button>
      </DialogFooter>
    </Dialog>
  );
};
export default CreateSupplierModal;
