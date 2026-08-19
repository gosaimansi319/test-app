import { useEffect, useRef, useState } from "react";
import Upload from "../../../assets/svg/uploadIcon.svg";
import Arrow from "../../../assets/svg/arrow-left.svg";
import { createProduct } from "../../../Api/product";
import { useDispatch, useSelector } from "react-redux";
import {
  createSector,
  fetchProducts,
  fetchSectors,
} from "../../../store/Product/productsThunk";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { fetchSuppliers } from "../../../store/Supplier/suppliersThunk";
import Delete from "../../../assets/svg/delete-icon.svg";
import CreateSupplierModal from "../../../components/commen/CreateSupplierModal";
import Select from "react-select";

const CreateProduct = () => {
  // Form state
  const [formData, setFormData] = useState({
    product_name: "",
    brand_name: "",
    UN: "",
    ERP_number: "",
    sector: "",
    description: "",
  });

  // File handling state
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Sector management state
  const [isAddingNewSector, setIsAddingNewSector] = useState(false);
  const [newSectorName, setNewSectorName] = useState("");
  const [customSectors, setCustomSectors] = useState([]);
  const [deletableCustomSectors, setDeletableCustomSectors] = useState([]);

  // Error state
  const [errors, setErrors] = useState({});
  const [sectorError, setSectorError] = useState("");
  const [createSuppliermodalOpen, setCreateSuppliermodalModalOpen] =
    useState(false);

  // Supplier state
  const [supplierRows, setSupplierRows] = useState([
    {
      id: 1,
      supplier: "",
      supplierId: "",
      currentPrice: "",
      isEditing: false,
    },
  ]);
  const [supplierList, setSupplierList] = useState([]);

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const newSectorInputRef = useRef(null);
  const dispatch = useDispatch();
  const sectorData = useSelector((state) => state.products.sectors);

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

  useEffect(() => {
    dispatch(fetchSectors());
  }, [dispatch]);

  useEffect(() => {
    if (isAddingNewSector && newSectorInputRef.current) {
      newSectorInputRef.current.focus();
    }
  }, [isAddingNewSector]);

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    // Basic field validation
    if (!formData.product_name.trim()) {
      newErrors.product_name = "Name is required";
    }

    if (!formData.brand_name.trim()) {
      newErrors.brand_name = "Brand Name is required";
    }

    if (!formData.UN.trim()) {
      newErrors.UN = "UN is required";
    } else if (/^\d+$/.test(formData.UN.trim())) {
      newErrors.UN = "UN cannot be a number";
    }

    if (!formData.ERP_number.trim()) {
      newErrors.ERP_number = "ERP Number is required";
    } else if (!/^\d+$/.test(formData.ERP_number.trim())) {
      newErrors.ERP_number = "ERP Number must be valid number";
    }

    if (!formData.sector.trim()) {
      newErrors.sector = "Sector is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description should be at least 10 characters";
    } else if (formData.description.trim().length > 200) {
      newErrors.description = "Description should not exceed 200 characters";
    }

    // File validation
    if (!profileImage) {
      newErrors.file = "Product image is required";
    }

    // Supplier validation
    const validSuppliers = supplierRows.filter(
      (row) => row.supplierId && row.currentPrice
    );

    if (validSuppliers.length === 0) {
      newErrors.suppliers = "Supplier Name and Price are required";
    } else {
      // Check for duplicate suppliers
      const supplierIds = validSuppliers.map((s) => s.supplierId);
      const uniqueIds = [...new Set(supplierIds)];
      if (supplierIds.length !== uniqueIds.length) {
        newErrors.suppliers = "Duplicate suppliers are not allowed";
      }

      // Individual supplier validation
      const supplierErrors = [];
      supplierRows.forEach((row, index) => {
        const rowErrors = {};
        if (!row.supplierId) {
          rowErrors.supplierId = "Supplier is required";
        }
        if (!row.currentPrice) {
          rowErrors.currentPrice = "Current price is required";
        } else if (
          isNaN(row.currentPrice) ||
          parseFloat(row.currentPrice) <= 0
        ) {
          rowErrors.currentPrice = "Price must be greater than 0";
        }
        if (Object.keys(rowErrors).length > 0) {
          supplierErrors[index] = rowErrors;
        }
      });
      if (supplierErrors.length > 0) {
        newErrors.supplierRows = supplierErrors;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // if (name === "UN" && /^\d+$/.test(value)) return;
    if (name === "ERP_number" && !/^\d*$/.test(value)) return;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleFile = (file) => {
    if (!file) {
      setProfileImage(null);
      setPreviewUrl(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setProfileImage(null);
      setPreviewUrl(null);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setProfileImage(null);
      setPreviewUrl(null);
      return;
    }

    setProfileImage(file);
    setPreviewUrl(URL.createObjectURL(file));

    // Clear file error
    if (errors.file) {
      setErrors((prev) => ({
        ...prev,
        file: "",
      }));
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    handleFile(file);
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setPreviewUrl(null);
  };

  // Supplier table functions
  const handleSupplierChange = (rowId, supplierId) => {
    const selectedSupplier = supplierList.find((s) => s._id === supplierId);

    setSupplierRows((prevRows) =>
      prevRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              supplier: selectedSupplier?.company_name || "",
              supplierId: supplierId,
              currentPrice: row.currentPrice || "",
            }
          : row
      )
    );

    // Clear supplier errors
    if (errors.suppliers || errors.supplierRows) {
      setErrors((prev) => ({
        ...prev,
        suppliers: "",
        supplierRows: [],
      }));
    }
  };

  const handlePriceUpdate = (rowId, field, value) => {
    setSupplierRows((prevRows) =>
      prevRows.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row
      )
    );

    // Clear supplier errors
    if (errors.suppliers || errors.supplierRows) {
      setErrors((prev) => ({
        ...prev,
        suppliers: "",
        supplierRows: [],
      }));
    }
  };

  const addSupplierRow = () => {
    const newRow = {
      id: Date.now(),
      supplier: "",
      supplierId: "",
      currentPrice: "",
      isEditing: false,
    };
    let isEmptyPrev =
      supplierRows.filter((s) => s.supplier === "" || s.currentPrice === "")
        .length === 0;

    if (isEmptyPrev) {
      setSupplierRows((prev) => [...prev, newRow]);
    } else {
      toast.error("Please fill above supplier information");
    }
  };

  const removeSupplierRow = (rowId) => {
    if (supplierRows.length > 1) {
      setSupplierRows((prev) => prev.filter((row) => row.id !== rowId));
    }
  };

  // Format supplier data for API
  const formatSupplierData = () => {
    return supplierRows
      .filter((row) => row.supplierId && row.currentPrice)
      .map((row) => ({
        company_name: row.supplier,
        price: parseFloat(row.currentPrice) || 0,
      }));
  };

  const resetForm = () => {
    setFormData({
      product_name: "",
      brand_name: "",
      UN: "",
      ERP_number: "",
      sector: "",
      description: "",
    });
    setProfileImage(null);
    setPreviewUrl(null);
    setErrors({});
    setSupplierRows([
      {
        id: 1,
        supplier: "",
        supplierId: "",
        currentPrice: "",
        isEditing: false,
      },
    ]);
  };

  // sector related functions
  const handleAddNewSector = () => {
    setIsAddingNewSector(true);
    setSectorError("");
  };

  const handleNewSectorChange = (e) => {
    setNewSectorName(e.target.value);
    setSectorError("");
  };

  const handleNewSectorKeyDown = (e) => {
    if (e.key === "Enter" && newSectorName.trim()) {
      e.preventDefault();
      addNewSector();
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

  const addNewSector = () => {
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

      setFormData((prev) => ({
        ...prev,
        sector: sectorName,
      }));

      setNewSectorName("");
      setIsAddingNewSector(false);
      setSectorError("");

      toast.success(`Sector "${sectorName}" added successfully`);
    }
  };

  const handleDeleteSector = (sectorName) => {
    const updatedSectors = customSectors.filter(
      (sector) => sector.sector_name !== sectorName
    );
    setCustomSectors(updatedSectors);

    const updatedDeletable = deletableCustomSectors.filter(
      (name) => name !== sectorName
    );
    setDeletableCustomSectors(updatedDeletable);

    if (sectorName === formData.sector) {
      setFormData((prev) => ({
        ...prev,
        sector: "",
      }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const formDataToSend = new FormData();
    formDataToSend.append("product_name", formData.product_name);
    formDataToSend.append("brand_name", formData.brand_name);
    formDataToSend.append("UN", formData.UN);
    formDataToSend.append("ERP_number", formData.ERP_number);
    formDataToSend.append("sector", formData.sector);
    formDataToSend.append("description", formData.description);

    // Format and append supplier data
    const supplierData = formatSupplierData();
    formDataToSend.append("suppliers", JSON.stringify(supplierData));

    if (profileImage) {
      formDataToSend.append("file", profileImage);
    }

    try {
      const response = await createProduct(formDataToSend);

      if (response.status === "success") {
        toast.success("Product created successfully");
        dispatch(fetchProducts());
        resetForm();
        navigate("/admin/products");
      } else {
        toast.error(response.message || "Something went wrong");
      }
    } catch (error) {
      toast.error("Error creating product");
      console.error("Create Product Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full mx-auto boxShadow">
      <h2 className="flex sm:hidden text-2xl font-bold text-[#212121] leading-9 mb-3">
        <img
          onClick={() => navigate(-1)}
          src={Arrow}
          alt="Arrow"
          className="cursor-pointer"
        />
        &nbsp;Create Product
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="formField-label">Name</label>
            <input
              type="text"
              name="product_name"
              value={formData.product_name}
              onChange={handleInputChange}
              placeholder="Ex. Laptop, Keyboard"
              className="formField-inputBox rounded-md focus:outline-none"
            />
            {errors.product_name && (
              <div className="mt-1 text-xs text-red-500">
                {errors.product_name}
              </div>
            )}
          </div>

          <div>
            <label className="formField-label" >Brand</label>
            <input
              type="text"
              name="brand_name"
              value={formData.brand_name}
              onChange={handleInputChange}
              placeholder="Enter brand name"
              className="formField-inputBox rounded-md focus:outline-none"
            />
            {errors.brand_name && (
              <div className="mt-1 text-xs text-red-500">
                {errors.brand_name}
              </div>
            )}
          </div>

          <div>
            <label className="formField-label">UN</label>
            <input
              type="text"
              name="UN"
              value={formData.UN}
              onChange={handleInputChange}
              placeholder="Enter UN"
              className="formField-inputBox"
            />
            {errors.UN && (
              <div className="mt-1 text-xs text-red-500">{errors.UN}</div>
            )}
          </div>

          <div>
            <label className="formField-label">ERP Number</label>
            <input
              type="text"
              name="ERP_number"
              value={formData.ERP_number}
              onChange={handleInputChange}
              placeholder="Enter ERP number"
              className="formField-inputBox"
            />
            {errors.ERP_number && (
              <div className="mt-1 text-xs text-red-500">
                {errors.ERP_number}
              </div>
            )}
          </div>

          <div>
            <label className="formField-label">Sector</label>
            <div className="space-y-2">
              {!isAddingNewSector ? (
                <div className="relative">
                  <div className="relative">
                    <Select
                      name="sector"
                      isClearable
                      value={
                        formData.sector
                          ? { value: formData.sector, label: formData.sector }
                          : null
                      }
                      onChange={(selectedOption) => {
                        if (selectedOption?.value === "__add_new__") {
                          setIsAddingNewSector(true);
                        } else {
                          handleInputChange({
                            target: {
                              name: "sector",
                              value: selectedOption ? selectedOption.value : "",
                            },
                          });
                        }
                      }}
                      options={[
                        ...[...sectorData, ...customSectors]
                          .filter((sector) => sector && sector.sector_name)
                          .map((sector) => ({
                            value: sector.sector_name,
                            label: sector.sector_name,
                          })),
                        { value: "__add_new__", label: "Add New..." }, // Special "add new" option
                      ]}
                      placeholder="Select sector..."
                      // classNamePrefix="formField-select"
                      className="pt-3"

                      styles={{
                        control: (base) => ({
                          ...base,
                          // backgroundColor: "#F6F6F6",
                          borderColor: "#ccc",
                          minHeight: "38px",
                          boxShadow: "none",
                        }),
                      }}
                    />

                    {isDeletableCustomSector(formData.sector) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSector(formData.sector)}
                        className="absolute right-[69px] top-[30px] transform -translate-y-1/2 text-red-500 hover:text-red-700"
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
                  {errors.sector && (
                    <div className="mt-1 text-xs text-red-500">
                      {errors.sector}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      ref={newSectorInputRef}
                      type="text"
                      value={newSectorName}
                      onChange={handleNewSectorChange}
                      onKeyDown={handleNewSectorKeyDown}
                      placeholder="Enter new sector name"
                      className="flex-grow formField-inputBox rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <button
                      type="button"
                      onClick={addNewSector}
                      className="px-3 py-2 mt-2 text-white bg-gray-800 rounded-md"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={cancelAddNewSector}
                      className="px-3 py-2 mt-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                  {sectorError && (
                    <div className="text-xs text-red-500">{sectorError}</div>
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
                isDragging ? "border-blue-400 bg-blue-50" : "border-[#B0B0B0]"
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
                handleFile(file);
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
                      onChange={handleFileChange}
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
                    onClick={handleRemoveImage}
                    className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-opacity-80"
                    title="Remove image"
                  >
                    &times;
                  </button>
                </div>
              )}
            </div>
            {/* {fileError && (
              <div className="mt-1 text-xs text-red-500">{fileError}</div>
            )} */}
            {errors.file && (
              <div className="mt-1 text-xs text-red-500">{errors.file}</div>
            )}
          </div>

          <div>
            <label className="formField-label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={5}
              placeholder="Enter description"
              className="formField-textField rounded-md focus:outline-none"
            />
            {errors.description && (
              <div className="mt-1 text-xs text-red-500">
                {errors.description}
              </div>
            )}
          </div>
        </div>

        {/* Supplier Table Section */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Supplier Information</h3>
          <div className="overflow-x-auto border border-gray-300 rounded-lg custom-scrollbar">
            <table className="min-w-[700px] lg:w-full border-separate border-spacing-0 table-auto">
              <thead className="sticky top-0 bg-base-200 z-10 bg-gray-50">
                <tr>
                  <th className="table-title whitespace-nowrap px-4 py-3 text-left border-r border-gray-300">
                    Supplier
                  </th>
                  <th className="table-title whitespace-nowrap px-4 py-3 text-left border-r border-gray-300">
                    Current Price
                  </th>
                  <th className="table-title whitespace-nowrap px-4 py-3 text-left">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {supplierRows.map((row, index) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="table-data px-4 py-3 border-r border-gray-300">
                      <Select
                        className="w-full"
                        value={supplierList
                          ?.filter(
                            (supplier) =>
                              row.supplierId === supplier._id ||
                              !supplierRows.some(
                                (r) =>
                                  r.supplierId === supplier._id &&
                                  r.id !== row.id
                              )
                          )
                          .map((supplier) => ({
                            label: supplier.company_name,
                            value: supplier._id,
                          }))
                          .find((option) => option.value === row.supplierId)}
                        onChange={(selected) =>
                          handleSupplierChange(row.id, selected?.value)
                        }
                        options={supplierList
                          ?.filter(
                            (supplier) =>
                              row.supplierId === supplier._id ||
                              !supplierRows.some(
                                (r) =>
                                  r.supplierId === supplier._id &&
                                  r.id !== row.id
                              )
                          )
                          .map((supplier) => ({
                            label: supplier.company_name,
                            value: supplier._id,
                          }))}
                        placeholder="Select Supplier"
                        isClearable
                        isSearchable
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                        styles={{
                          menuPortal: (base) => ({
                            ...base,
                            zIndex: 9999,
                          }),
                          menu: (provided) => ({
                            ...provided,
                            maxHeight: 400,
                            overflowY: "auto",
                          }),
                          control: (base, state) => ({
                            ...base,
                            boxShadow: "none", // removes the blue glow
                            borderColor: state.isFocused
                              ? "#ccc"
                              : base.borderColor, // fallback border
                            "&:hover": {
                              borderColor: "#999", // optional hover effect
                            },
                          }),
                        }}
                      />

                      {errors.supplierRows?.[index]?.supplierId && (
                        <div className="mt-1 text-xs text-red-500">
                          {errors.supplierRows[index].supplierId}
                        </div>
                      )}
                    </td>
                    <td className="table-data whitespace-nowrap px-4 py-3 border-r border-gray-300">
                      <input
                        type="number"
                        step="10"
                        value={row.currentPrice}
                        onChange={(e) =>
                          handlePriceUpdate(
                            row.id,
                            "currentPrice",
                            e.target.value
                          )
                        }
                        className="no-arrow w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                        placeholder="Enter price in €"
                      />
                      {errors.supplierRows?.[index]?.currentPrice && (
                        <div className="mt-1 text-xs text-red-500">
                          {errors.supplierRows[index].currentPrice}
                        </div>
                      )}
                    </td>
                    <td className="table-data whitespace-nowrap px-4 py-3">
                      <button
                        type="button"
                        onClick={() => removeSupplierRow(row.id)}
                        disabled={supplierRows.length === 1}
                      >
                        <img src={Delete} alt="Delete" />
                      </button>
                    </td>
                  </tr>
                ))}

                <tr>
                  <td colSpan="3" className="px-4 py-3 flex justify-evenly">
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
          {errors.suppliers && (
            <div className="mt-2 text-xs text-red-500">{errors.suppliers}</div>
          )}
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
            className="flex-1 lg:flex-none px-4 lg:px-6 py-2 text-white bg-gray-800 rounded-md hover:bg-gray-700 disabled:opacity-50 text-nowrap"
          >
            {isSubmitting ? "Creating..." : "Create Product"}
          </button>
        </div>
      </form>
      <CreateSupplierModal
        open={createSuppliermodalOpen}
        onClose={() => setCreateSuppliermodalModalOpen(false)}
        setSupplierList={setSupplierList}
      />
    </div>
  );
};

export default CreateProduct;
