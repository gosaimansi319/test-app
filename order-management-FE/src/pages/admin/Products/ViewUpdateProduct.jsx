import { useEffect, useRef, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import Upload from "../../../assets/svg/uploadIcon.svg";
import * as Yup from "yup";
import { updateProduct, getProductById } from "../../../Api/product";
import { useDispatch, useSelector } from "react-redux";
import {
  createSector,
  fetchProducts,
  fetchSectors,
} from "../../../store/Product/productsThunk";
import toast from "react-hot-toast";
import Arrow from "../../../assets/svg/arrow-left.svg";
import { useNavigate, useParams } from "react-router-dom";
import { fetchSuppliers } from "../../../store/Supplier/suppliersThunk";
import Edit from "../../../assets/svg/editIcon.svg";
import Delete from "../../../assets/svg/delete-icon.svg";
import CreateSupplierModal from "../../../components/commen/CreateSupplierModal";
import Select from "react-select";
import { AlertDialog } from "../../../components/commen/AlertDialog";
import PageLoader from "../../../components/commen/PageLoader";

// Validation schema using Yup
const ProductSchema = Yup.object().shape({
  product_name: Yup.string().trim().required("Name is required"),
  brand_name: Yup.string().trim().required("Brand Name is required"),
  UN: Yup.string()
    .trim()
    .required("UN Number is required")
    .test(
      "not-only-digits",
      "UN cannot be a number",
      (value) => !/^\d+$/.test(value || "")
    ),
  // .matches(/^\d{4}$/, "UN Number must be exactly 4 digits"),
  ERP_number: Yup.string()
    .trim()
    .required("ERP Number is required")
    .matches(/^\d+$/, "ERP Number must be valid number"),
  sector: Yup.string().trim().required("Sector is required"),
  description: Yup.string()
    .trim()
    .required("Description is required")
    .min(10, "Description should be at least 10 characters")
    .max(200, "Description should not exceed 500 characters"),
  file: Yup.mixed()
  .required("Product image is required")
  .test("file-exists", "Product image is required", value => {
    return value instanceof File || (value && value.length > 0);
  }),
});

const ViewUpdateProduct = () => {
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAddingNewSector, setIsAddingNewSector] = useState(false);
  const [newSectorName, setNewSectorName] = useState("");
  const [customSectors, setCustomSectors] = useState([]);
  const [deletableCustomSectors, setDeletableCustomSectors] = useState([]);
  const [fileError, setFileError] = useState("");
  const [sectorError, setSectorError] = useState("");
  const [loading, setLoading] = useState(false);

  // States for supplier table
  const [supplierRows, setSupplierRows] = useState([]);
  const [supplierList, setSupplierList] = useState([]);
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [tempPrice, setTempPrice] = useState("");

  const navigate = useNavigate();
  const { id } = useParams();
  const fileInputRef = useRef(null);
  const newSectorInputRef = useRef(null);
  const dispatch = useDispatch();
  const sectorData = useSelector((state) => state.products.sectors);
  const [createSuppliermodalOpen, setCreateSuppliermodalModalOpen] =
    useState(false);
  const [openAlertDialog, setOpenAlertDialog] = useState(false);
  const [rowToCancel, setRowToCancel] = useState(null);

  const [initialValues, setInitialValues] = useState({
    product_name: "",
    brand_name: "",
    UN: "",
    ERP_number: "",
    sector: "",
    description: "",
    file: null,
  });

  // Fetch suppliers
  useEffect(() => {
    dispatch(fetchSuppliers())
      .then((res) => {
        if (res.payload) {
          setSupplierList(res.payload.suppliers);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }, [dispatch]);

  // Fetch sectors
  useEffect(() => {
    dispatch(fetchSectors());
  }, [dispatch]);

  // Fetch product data
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        const response = await getProductById(id);

        if (response.status === "success" && response.data) {
          const productData = response.data;

          // Set initial form values
          setInitialValues({
            product_name: productData.product_name || "",
            brand_name: productData.brand_name || "",
            UN: productData.UN || "",
            ERP_number: productData.ERP_number || "",
            sector: productData.sector || "",
            description: productData.description || "",
            file: productData.file,
          });

          // Set existing image
          if (productData.file) {
            setExistingImageUrl(productData.file);
            setPreviewUrl(productData.file);
          }

          // Set supplier rows from the API response
          if (productData.suppliers && productData.suppliers.length > 0) {
            const supplierRowsData = productData.suppliers.map(
              (supplier, index) => ({
                id: supplier.supplier_id || index + 1,
                supplier_id: supplier.supplier_id || "",
                company_name: supplier.company_name || "",
                price: supplier.price || 0,
                previous_price: supplier.previous_price || null,
                changed_date: supplier.changed_date || null,
                isEditing: false,
              })
            );
            setSupplierRows(supplierRowsData);
          } else {
            setSupplierRows([]);
          }
        } else {
          toast.error("Failed to fetch product data");
          navigate("/admin/products");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Error fetching product data");
        navigate("/admin/products");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProductData();
    }
  }, [id, navigate]);

  useEffect(() => {
    if (isAddingNewSector && newSectorInputRef.current) {
      newSectorInputRef.current.focus();
    }
  }, [isAddingNewSector]);

  const handleOpenAlertDialog = () => setOpenAlertDialog(!openAlertDialog);

  // Supplier table functions
  const handleSupplierChange = (rowId, supplierId) => {
    const selectedSupplier = supplierList.find((s) => s._id === supplierId);

    setSupplierRows((prevRows) =>
      prevRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              company_name: selectedSupplier?.company_name || "",
              supplier_id: supplierId,
            }
          : row
      )
    );

    handleStartEditPrice(supplierId, 0);
  };

  const handleStartEditPrice = (supplierId, currentPrice) => {
    setEditingPriceId(supplierId);
    setTempPrice(currentPrice.toString());
  };

  const handleSavePrice = (supplierId) => {
    const newPrice = parseFloat(tempPrice);

    if (isNaN(newPrice) || newPrice < 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setSupplierRows((prevRows) =>
      prevRows.map((row) =>
        row.supplier_id === supplierId
          ? {
              ...row,
              previous_price: row.price, // Store current price as previous
              price: newPrice,
              changed_date: new Date().toISOString(), // Set current date
            }
          : row
      )
    );
    setEditingPriceId(null);
    setTempPrice("");
    // toast.success("Price updated successfully");
  };

  const handleCancelEditPrice = (rowValue) => {
    setRowToCancel(rowValue);
    setOpenAlertDialog(true);
  };

  const confirmCancelEdit = () => {
    if (rowToCancel) {
      if (rowToCancel.price === 0) {
        setSupplierRows((prev) =>
          prev.filter((row) => row.id !== rowToCancel.id)
        );
      } else {
        setEditingPriceId(null);
        setTempPrice("");
      }
    }

    setOpenAlertDialog(false);
    setRowToCancel(null);
  };

  const addSupplierRow = () => {
    const newRow = {
      id: Date.now(),
      supplier_id: "",
      company_name: "",
      price: 0,
      previous_price: null,
      changed_date: null,
      isEditing: false,
    };

    let isEmptyPrev =
      supplierRows.filter((s) => s.company_name === "").length === 0;

    if (isEmptyPrev) {
      setSupplierRows([...supplierRows, newRow]);
      setEditingPriceId("");
    } else {
      toast.error("Please fill above supplier information");
    }

    // handleStartEditPrice(
    //   row.supplier_id,
    //   row.price
    // )
  };

  const removeSupplierRow = (rowId) => {
    setSupplierRows(supplierRows.filter((row) => row.id !== rowId));
  };
  // Validate supplier data before submitting
  const validateSupplierData = () => {
    const validSuppliers = supplierRows.filter(
      (row) => row.supplier_id && row.price > 0
    );

    //  if (!initialValues.UN.trim()) {
    //   newErrors.UN = "UN is required";
    // } else if (/^\d+$/.test(formData.UN.trim())) {
    //   newErrors.UN = "UN cannot be a number";
    // }

    if (validSuppliers.length === 0) {
      toast.error("Please add at least one supplier with price");
      return false;
    }

    // Check for duplicate suppliers
    const supplierIds = validSuppliers.map((row) => row.supplier_id);
    const uniqueSupplierIds = [...new Set(supplierIds)];

    if (supplierIds.length !== uniqueSupplierIds.length) {
      toast.error("Duplicate suppliers are not allowed");
      return false;
    }

    return true;
  };

  // Format supplier data for API
  const formatSupplierData = () => {
    return supplierRows
      .filter((row) => row.supplier_id && row.price > 0)
      .map((row) => ({
        company_name: row.company_name,
        price: parseFloat(row.price) || 0,
      }));
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    if (!validateSupplierData()) {
      setSubmitting(false);
      return;
    }

    const formData = new FormData();

    formData.append("product_name", values.product_name);
    formData.append("brand_name", values.brand_name);
    formData.append("UN", values.UN);
    formData.append("ERP_number", values.ERP_number);
    formData.append("sector", values.sector);
    formData.append("description", values.description);

    // Format and append supplier data
    const supplierData = formatSupplierData();
    formData.append("suppliers", JSON.stringify(supplierData));

    // Only append new file if one was selected
    if (profileImage) {
      formData.append("file", profileImage);
    }

    try {
      const response = await updateProduct(id, formData);

      if (response.status === "success") {
        toast.success("Product updated successfully");
        dispatch(fetchProducts());
        // navigate("/admin/products");
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      // toast.error("Error updating product");
      console.error("Update Product Error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFile = (file, setFieldValue) => {
    setFileError("");

    if (!file) {
      setFileError("Please select a file");
      setProfileImage(null);
      setPreviewUrl(existingImageUrl);
      setInitialValues({ ...initialValues, file: existingImageUrl });
      setFieldValue("file", null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setFileError("Please upload only image files");
      setProfileImage(null);
      setPreviewUrl(existingImageUrl);
      setInitialValues({ ...initialValues, file: existingImageUrl });
      setFieldValue("file", null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError("File size should not exceed 5MB");
      setProfileImage(null);
      setPreviewUrl(existingImageUrl);
      setInitialValues({ ...initialValues, file: existingImageUrl });
      setFieldValue("file", null);
      return;
    }

    setProfileImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setInitialValues({ ...initialValues, file: URL.createObjectURL(file) });
    setFieldValue("file", file);
  };

  const handleFileChange = (event, setFieldValue) => {
    const file = event.target.files[0];
    const maxSizeInBytes = 2 * 1024 * 1024; // 2MB

    if (file?.size > maxSizeInBytes) {
      toast.error("Image size should be less than 2MB");
      event.target.value = null;
      return;
    }
    handleFile(file, setFieldValue);
  };

  const handleRemoveImage = (setFieldValue) => {
    setProfileImage(null);
    setPreviewUrl(null);
    setExistingImageUrl(null);
    setFieldValue("file", null);
  };

  // Sector management functions (same as create component)
  const handleAddNewSector = () => {
    setIsAddingNewSector(true);
    setSectorError("");
  };

  const handleNewSectorChange = (e) => {
    setNewSectorName(e.target.value);
    setSectorError("");
  };

  const handleNewSectorKeyDown = (e, setFieldValue) => {
    if (e.key === "Enter" && newSectorName.trim()) {
      e.preventDefault();
      addNewSector(setFieldValue);
    } else if (e.key === "Escape") {
      cancelAddNewSector();
    }
  };

  const isSectorExists = (sectorName) => {
    const allSectors = [...sectorData, ...customSectors];
    return allSectors.some(
      (sector) =>
        sector &&
        sector.sector_name &&
        sector.sector_name.toLowerCase() === sectorName.toLowerCase()
    );
  };

  const addNewSector = (setFieldValue) => {
    if (newSectorName.trim()) {
      const sectorName = newSectorName.trim();

      if (isSectorExists(sectorName)) {
        setSectorError(`Sector "${sectorName}" already exists`);
        return;
      }

      const newSector = { sector_name: sectorName };

      dispatch(createSector(newSector));

      setCustomSectors([...customSectors, newSector]);
      setDeletableCustomSectors([...deletableCustomSectors, sectorName]);

      setFieldValue("sector", sectorName);

      setNewSectorName("");
      setIsAddingNewSector(false);
      setSectorError("");

      toast.success(`Sector "${sectorName}" added successfully`);
    }
  };

  const handleDeleteSector = (sectorName, setFieldValue, values) => {
    const updatedSectors = customSectors.filter(
      (sector) => sector.sector_name !== sectorName
    );

    setCustomSectors(updatedSectors);

    const updatedDeletable = deletableCustomSectors.filter(
      (name) => name !== sectorName
    );
    setDeletableCustomSectors(updatedDeletable);

    if (setFieldValue && sectorName === values.sector) {
      setFieldValue("sector", "");
    }

    toast.success(`Sector "${sectorName}" deleted successfully`);
  };

  const isDeletableCustomSector = (sectorName) => {
    return deletableCustomSectors.includes(sectorName);
  };

  const cancelAddNewSector = () => {
    setNewSectorName("");
    setIsAddingNewSector(false);
    setSectorError("");
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "N/A";
    }
  };

  if (loading) {
    return (
      <PageLoader />
    );
  }

  return (
    <div className="w-full mx-auto boxShadow">
      <h2 className="flex sm:hidden text-2xl font-bold text-[#212121] leading-9 mb-3">
        <img
          onClick={() => navigate(-1)}
          src={Arrow}
          alt="Arrow"
          className="cursor-pointer"
        />
        &nbsp;Update Product
      </h2>

      <Formik
        initialValues={initialValues}
        validationSchema={ProductSchema}
        onSubmit={handleSubmit}
        enableReinitialize={true}
      >
        {({ isSubmitting, setFieldValue, values, errors, touched }) => (
          <Form className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="formField-label">Name</label>
                <Field
                  type="text"
                  name="product_name"
                  placeholder="Ex. Laptop, Keyboard"
                  className={`formField-inputBox ${
                    errors.product_name && touched.product_name
                      ? "border-red-500"
                      : "border-gray-300"
                  } rounded-md focus:outline-none`}
                />
                <ErrorMessage
                  name="product_name"
                  component="div"
                  className="mt-1 text-xs text-red-500"
                />
              </div>

              <div>
                <label className="formField-label">Brand</label>
                <Field
                  type="text"
                  name="brand_name"
                  placeholder="Enter brand name"
                  className={`formField-inputBox ${
                    errors.brand_name && touched.brand_name
                      ? "border-red-500"
                      : "border-gray-300"
                  } rounded-md focus:outline-none`}
                />
                <ErrorMessage
                  name="brand_name"
                  component="div"
                  className="mt-1 text-xs text-red-500"
                />
              </div>

              <div>
                <label className="formField-label">UN</label>
                <Field
                  type="text"
                  name="UN"
                  placeholder="Enter UN"
                  className={`formField-inputBox ${
                    errors.UN && touched.UN
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                <ErrorMessage
                  name="UN"
                  component="div"
                  className="mt-1 text-xs text-red-500"
                />
              </div>

              <div>
                <label className="formField-label">ERP Number</label>
                <Field
                  type="text"
                  name="ERP_number"
                  placeholder="Enter ERP number"
                  className={`formField-inputBox ${
                    errors.ERP_number && touched.ERP_number
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                <ErrorMessage
                  name="ERP_number"
                  component="div"
                  className="mt-1 text-xs text-red-500"
                />
              </div>

              <div>
                <label className="formField-label">Sector</label>
                <div className="space-y-2">
                  {!isAddingNewSector ? (
                    <div className="relative">
                      <div className="relative">
                        <Field
                          as="select"
                          name="sector"
                          onChange={(e) => {
                            if (e.target.value === "__add_new__") {
                              setIsAddingNewSector(true);
                              return;
                            }
                            setFieldValue("sector", e.target.value);
                          }}
                          className={`formField-select ${
                            errors.sector && touched.sector
                              ? "border-red-500"
                              : "border-gray-300"
                          } rounded-md appearance-none focus:outline-none`}
                        >
                          <option value="">Select options</option>
                          {[...sectorData, ...customSectors]
                            ?.filter((sector) => sector && sector.sector_name)
                            ?.map((sector, index) => (
                              <option key={index} value={sector?.sector_name}>
                                {sector?.sector_name}
                              </option>
                            ))}
                          <option value="__add_new__">+ Add New Sector</option>
                        </Field>

                        {isDeletableCustomSector(values.sector) && (
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteSector(
                                values.sector,
                                setFieldValue,
                                values
                              )
                            }
                            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-red-500 hover:text-red-700"
                            title="Delete this sector"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <svg
                          className="w-5 h-5 text-gray-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <ErrorMessage
                        name="sector"
                        component="div"
                        className="mt-1 text-xs text-red-500"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          ref={newSectorInputRef}
                          type="text"
                          value={newSectorName}
                          onChange={handleNewSectorChange}
                          onKeyDown={(e) =>
                            handleNewSectorKeyDown(e, setFieldValue)
                          }
                          placeholder="Enter new sector name"
                          className={`flex-grow formField-inputBox ${
                            sectorError ? "border-red-500" : "border-gray-300"
                          } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300`}
                        />
                        <button
                          type="button"
                          onClick={() => addNewSector(setFieldValue)}
                          className="px-3 py-2 text-white bg-gray-800 rounded-md"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={cancelAddNewSector}
                          className="px-3 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                      {sectorError && (
                        <div className="text-xs text-red-500">
                          {sectorError}
                        </div>
                      )}
                    </div>
                  )}

                  {!isAddingNewSector && (
                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={handleAddNewSector}
                        className="text-sm text-gray-700 underline focus:outline-none"
                      >
                        + Add New Sector
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="formField-label">Attachments</label>
                <div
                  className={`min-h-[80px] border rounded-[10px] border-dashed mt-[10px] py-5 px-3 transition-colors duration-200 ${
                    isDragging
                      ? "border-blue-400 bg-blue-50"
                      : fileError
                      ? "border-red-500 bg-red-50"
                      : "border-[#B0B0B0]"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files[0];
                    handleFile(file, setFieldValue);
                  }}
                >
                  {!previewUrl ? (
                    <div className="flex flex-wrap items-center gap-2.5 justify-center">
                      <span className="text-sm font-normal text-[#212121] leading-6 flex items-center gap-2.5">
                        <span className="h-10 w-10 bg-[#F6F6F6] flex justify-center items-center rounded-[10px]">
                          <img src={Upload} alt="upload" />
                        </span>
                        Drop product image here, or
                      </span>
                      <label className="cursor-pointer text-sm text-[#282828] underline hover:text-blue-800">
                        Browse
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={(e) => handleFileChange(e, setFieldValue)}
                          className="hidden"
                          accept="image/jpeg,image/jpg,image/png"
                        />
                      </label>
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
                        onClick={() => handleRemoveImage(setFieldValue)}
                        className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-opacity-80"
                        title="Remove image"
                      >
                        &times;
                      </button>
                    </div>
                  )}
                </div>
                {fileError && (
                  <div className="mt-1 text-xs text-red-500">{fileError}</div>
                )}
                <ErrorMessage
                  name="file"
                  component="div"
                  className="mt-1 text-xs text-red-500"
                />
              </div>

              <div>
                <label className="formField-label">Description</label>
                <Field
                  as="textarea"
                  name="description"
                  rows={5}
                  className={`formField-textField ${
                    errors.description && touched.description
                      ? "border-red-500"
                      : "border-gray-300"
                  } rounded-md focus:outline-none`}
                />
                <ErrorMessage
                  name="description"
                  component="div"
                  className="mt-1 text-xs 0"
                />
              </div>
            </div>

            {/* Supplier Table Section */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Supplier Information</h3>
              </div>

              <div className="overflow-x-auto border border-gray-300 rounded-lg">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-r border-gray-300">
                        Company Name
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-r border-gray-300">
                        Current Price
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-r border-gray-300">
                        Previous Price
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-r border-gray-300">
                        Changed Date
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {supplierRows.length > 0 ? (
                      supplierRows.map((row) => (
                        <tr
                          key={row.supplier_id || row.id}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 border-r border-gray-300">
                            {row.company_name ? (
                              <span className="text-sm text-gray-900">
                                {row.company_name}
                              </span>
                            ) : (
                              <Select
                                className="w-full"
                                value={supplierList
                                  ?.filter(
                                    (supplier) =>
                                      row.supplier_id === supplier._id ||
                                      !supplierRows.some(
                                        (r) =>
                                          r.supplier_id === supplier._id &&
                                          r.id !== row.id
                                      )
                                  )
                                  .map((supplier) => ({
                                    label: supplier.company_name,
                                    value: supplier._id,
                                  }))
                                  .find(
                                    (option) => option.value === row.supplier_id
                                  )}
                                onChange={(selected) =>
                                  handleSupplierChange(
                                    row.id,
                                    selected?.value || ""
                                  )
                                }
                                options={supplierList
                                  ?.filter(
                                    (supplier) =>
                                      row.supplier_id === supplier._id ||
                                      !supplierRows.some(
                                        (r) =>
                                          r.supplier_id === supplier._id &&
                                          r.id !== row.id
                                      )
                                  )
                                  .map((supplier) => ({
                                    label: supplier.company_name,
                                    value: supplier._id,
                                  }))}
                                placeholder="Select Supplier"
                                menuPlacement="top"
                                isClearable
                                isSearchable
                                styles={{
                                  control: (base, state) => ({
                                    ...base,
                                    borderColor: state.isFocused
                                      ? "#ccc"
                                      : base.borderColor,
                                    boxShadow: "none",
                                    "&:hover": {
                                      borderColor: "#999",
                                    },
                                  }),
                                  menuPortal: (base) => ({
                                    ...base,
                                    zIndex: 9999,
                                  }),
                                  menu: (provided) => ({
                                    ...provided,
                                    maxHeight: 200,
                                    overflowY: "auto",
                                  }),
                                }}
                                menuPortalTarget={document.body}
                              />
                            )}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-300">
                            {editingPriceId === row.supplier_id ||
                            editingPriceId === row.id ? (
                              <input
                                type="number"
                                step="1"
                                min="0"
                                value={tempPrice}
                                onChange={(e) => setTempPrice(e.target.value)}
                                className="no-arrow w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter price"
                              />
                            ) : (
                              <span className="text-sm text-gray-900">
                                {row.price
                                  ? `€ ${parseFloat(row.price).toFixed(2)}`
                                  : "€0.00"}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-300">
                            <span className="text-sm text-gray-900">
                              {row.previous_price
                                ? `€ ${parseFloat(row.previous_price).toFixed(
                                    2
                                  )}`
                                : "N/A"}
                            </span>
                          </td>
                          <td className="px-4 py-3 border-r border-gray-300">
                            <span className="text-sm text-gray-900">
                              {formatDate(row.changed_date)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              {editingPriceId === row.supplier_id ||
                              editingPriceId === row.id ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSavePrice(row.supplier_id || row.id)
                                    }
                                    disabled={
                                      editingPriceId === row.id
                                        ? !tempPrice ||
                                          parseFloat(tempPrice) <= 0
                                        : parseFloat(tempPrice) ===
                                          parseFloat(row.price)
                                    }
                                    className={`px-2 py-1 text-xs rounded ${
                                      editingPriceId === row.id
                                        ? !tempPrice ||
                                          parseFloat(tempPrice) <= 0
                                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                          : "bg-green-500 text-white hover:bg-green-600"
                                        : parseFloat(tempPrice) ===
                                          parseFloat(row.price)
                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        : "bg-green-500 text-white hover:bg-green-600"
                                    }`}
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCancelEditPrice(row)}
                                    className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleStartEditPrice(
                                        row.supplier_id,
                                        row.price
                                      )
                                    }
                                  >
                                    <img src={Edit} alt="" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeSupplierRow(row.id)}
                                  >
                                    <img src={Delete} alt="" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-4 py-8 text-center text-gray-500"
                        >
                          No suppliers found
                        </td>
                      </tr>
                    )}

                    {/* Add New Supplier Row */}
                    <tr>
                      <td colSpan="5" className="px-4 py-3 flex justify-evenly">
                        <button
                          type="button"
                          onClick={addSupplierRow}
                          className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                          <span>Add Supplier</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCreateSuppliermodalModalOpen(true)}
                          className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                          <span>Create Supplier</span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-between md:justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate("/admin/products")}
                className="flex-1 lg:flex-none px-4 lg:px-6 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 lg:flex-none px-4 lg:px-6 py-2 text-white bg-gray-800 rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                {isSubmitting ? "Updating..." : "Update Product"}
              </button>
            </div>
          </Form>
        )}
      </Formik>
      <AlertDialog
        open={openAlertDialog}
        handleOpen={handleOpenAlertDialog}
        handleConfirmCancel={confirmCancelEdit}
      />
      <CreateSupplierModal
        open={createSuppliermodalOpen}
        onClose={() => setCreateSuppliermodalModalOpen(false)}
        setSupplierList={setSupplierList}
      />
    </div>
  );
};

export default ViewUpdateProduct;
