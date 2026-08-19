import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { validateOrderForm, validateField } from "./OrderValidation";
import {
  fetchCompanies,
  fetchDepartments,
  fetchCenterCostByDept,
} from "../../../store/Company/companyThunk";
import Upload from "../../../assets/svg/uploadIcon.svg";
import { createOrder } from "../../../store/UserOrders/userOrdersThunk";
import { useNavigate } from "react-router-dom";
import { fetchAllProducts, fetchProducts } from "../../../store/Product/productsThunk";
import {
  fetchAdminNotifications,
  fetchNotificationsCount,
  fetchUserNotifications,
} from "../../../store/Notifications/notificationThunk";
import Select from "react-select";
import { Loader } from "../../../components/commen/Loader";

// Product validation function
const validateProductField = (name, value) => {
  let error = "";

  switch (name) {
    case "product_name":
      if (!value || !value.trim()) {
        error = "Product name is required";
      } else if (value.trim().length < 2) {
        error = "Product name must be at least 2 characters";
      } else if (value.trim().length > 100) {
        error = "Product name must not exceed 100 characters";
      }
      break;

    case "quantity":
      if (!value || value === "") {
        error = "Quantity is required";
      } else if (isNaN(value) || parseInt(value) < 1) {
        error = "Quantity must be at least 1";
      } else if (parseInt(value) > 10000) {
        error = "Quantity must not exceed 10,000";
      }
      break;

    case "unit":
      if (!value || !value.trim()) {
        error = "Unit is required";
      } else if (value.trim().length < 1) {
        error = "Unit must be at least 1 character";
      } else if (value.trim().length > 20) {
        error = "Unit must not exceed 20 characters";
      }
      break;

    default:
      break;
  }

  return error;
};

const validateProductForm = (product) => {
  const errors = {};

  const productNameError = validateProductField(
    "product_name",
    product.product_name,
    product
  );
  if (productNameError) errors.product_name = productNameError;

  const quantityError = validateProductField(
    "quantity",
    product.quantity,
    product
  );
  if (quantityError) errors.quantity = quantityError;

  const unitError = validateProductField("unit", product.unit, product);
  if (unitError) errors.unit = unitError;

  return errors;
};

const CreateOrder = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [availableProducts, setAvailableProducts] = useState([]);
  const [totalProds, setTotalProds] = useState([]);

  // Product form validation states
  const [productErrors, setProductErrors] = useState({});
  const [productTouched, setProductTouched] = useState({});

  // Get data from Redux store
  const { companies, departments, centerCost } = useSelector(
    (state) => state.companies
  );
  const { loading } = useSelector((state) => state.order);

  const [formData, setFormData] = useState({
    products: [], // Array of products with name, quantity, unit
    company: "",
    department: "",
    costCenter: "",
    deliveryLocation: "",
    changeLocation: false,
    attachments: null,
    description: "",
    isUrgent: false,
    urgencyReason: "",
  });

  // Current product being added/edited
  const [currentProduct, setCurrentProduct] = useState({
    product_name: "",
    quantity: 1,
    unit: "",
  });

  // Edit mode
  const [editingIndex, setEditingIndex] = useState(-1);

  let loggedUser =
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(sessionStorage.getItem("user"));

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showndepartments, setShownDepartments] = useState([]);
  const [shownCenterCosts, setShownCenterCosts] = useState([]);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch initial data on component mount
  useEffect(() => {
    dispatch(fetchCompanies());
    dispatch(fetchDepartments());
    dispatch(fetchAllProducts())
      .then((res) => {
        if (res.payload && res.payload.products) {
          setTotalProds(res.payload.products);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }, [dispatch]);

  // Update departments when company changes
  useEffect(() => {
    if (formData.company && departments && departments.length > 0) {
      const filtered = departments.filter(
        (dept) => dept?.company_id?.name === formData.company
      );
      setShownDepartments(filtered);
    }
  }, [formData.company, departments]);

  // Update center costs when they change
  useEffect(() => {
    if (centerCost && centerCost.length > 0) {
      setShownCenterCosts(centerCost);
    }
  }, [centerCost]);

  // Fetch available products for search
  useEffect(() => {
    if (search === "") return setAvailableProducts([]);

    dispatch(fetchProducts({ name: search }))
      .then((res) => {
        if (res.payload && res.payload.products) {
          setAvailableProducts(res.payload.products);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }, [dispatch, search]);

  const handleSelect = (item) => {
    setSearch(item);
    setShowDropdown(false);
    setCurrentProduct((prev) => ({
      ...prev,
      product_name: item,
    }));

    // Validate the selected product name
    const error = validateProductField("product_name", item, currentProduct);
    if (error) {
      setProductErrors((prev) => ({ ...prev, product_name: error }));
    } else {
      setProductErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.product_name;
        return newErrors;
      });
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    setCurrentProduct((prev) => ({
      ...prev,
      product_name: value,
    }));
    setShowDropdown(true);

    // Validate product name on change
    const error = validateProductField("product_name", value, currentProduct);
    if (error) {
      setProductErrors((prev) => ({ ...prev, product_name: error }));
    } else {
      setProductErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.product_name;
        return newErrors;
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const validateOnChange = (name, value) => {
    const { error } = validateField(name, value, formData);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Product validation on change
  const validateProductOnChange = (name, value) => {
    const error = validateProductField(name, value, currentProduct);
    if (error) {
      setProductErrors((prev) => ({ ...prev, [name]: error }));
    } else {
      setProductErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file" && files.length > 0) {
      const file = files[0];

      if (file) {
        setFormData((prev) => ({ ...prev, attachments: file }));
        validateOnChange("attachments", file);

        if (file.type.startsWith("image/")) {
          setPreviewUrl(URL.createObjectURL(file));
        } else if (
          file.type === "application/pdf" ||
          file.type === "application/msword" ||
          file.type ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
          setPreviewUrl(URL.createObjectURL(file));
        } else {
          setErrors((prev) => ({
            ...prev,
            attachments: "Only image, PDF or Word documents are allowed",
          }));
          setPreviewUrl(null);
        }
      }
      return;
    } else {
      const newValue = type === "checkbox" ? checked : value;
      setFormData((prev) => ({ ...prev, [name]: newValue }));
      validateOnChange(name, newValue);

      // Special case for isUrgent checkbox
      if (name === "isUrgent" && !checked) {
        setFormData((prev) => ({ ...prev, urgencyReason: "" }));
        validateOnChange("urgencyReason", "");
      }

      if (name === "costCenter") {
        setFormData((prev) => ({ ...prev, deliveryLocation: value }));
      }

      // Handle company change - fetch departments
      if (name === "company") {
        setFormData((prev) => ({ ...prev, department: "", costCenter: "" }));
      }

      // Handle department change - fetch cost centers
      if (name === "department") {
        setFormData((prev) => ({ ...prev, costCenter: "" }));

        // Find the selected department
        const selectedDept = departments.find((dept) => dept.name === value);
        if (selectedDept && selectedDept._id) {
          dispatch(fetchCenterCostByDept(selectedDept._id));
        }
      }
    }

    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  // Handle current product changes with validation
  const handleCurrentProductChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validate the field
    validateProductOnChange(name, value);
    setProductTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleQuantityChange = (action) => {
    setCurrentProduct((prev) => {
      const currentQty = parseInt(prev.quantity) || 0;
      const newQuantity =
        action === "increment" ? currentQty + 1 : Math.max(1, currentQty - 1);

      // Validate quantity
      validateProductOnChange("quantity", newQuantity);
      setProductTouched((prev) => ({ ...prev, quantity: true }));

      return { ...prev, quantity: newQuantity };
    });
  };

  // Handle product blur events
  const handleProductBlur = (e) => {
    const { name, value } = e.target;
    setProductTouched((prev) => ({ ...prev, [name]: true }));
    validateProductOnChange(name, value);
  };

  // Add or update product with validation
  const handleAddProduct = () => {
    // Validate all product fields
    const validationErrors = validateProductForm(currentProduct);
    setProductErrors(validationErrors);

    // Mark all product fields as touched
    setProductTouched({
      product_name: true,
      quantity: true,
      unit: true,
    });

    // Check if there are any validation errors
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    // Check for duplicate products (optional)
    const isDuplicate = formData.products.some(
      (product, index) =>
        product.product_name.toLowerCase() ===
          currentProduct.product_name.toLowerCase() && index !== editingIndex
    );

    if (isDuplicate) {
      setProductErrors((prev) => ({
        ...prev,
        product_name: "This product is already added to the list",
      }));
      return;
    }

    if (editingIndex >= 0) {
      // Update existing product
      const updatedProducts = [...formData.products];
      updatedProducts[editingIndex] = { ...currentProduct };
      setFormData((prev) => ({
        ...prev,
        products: updatedProducts,
      }));
      setEditingIndex(-1);
    } else {
      // Add new product
      setProductErrors((prev) => ({
        ...prev,
        product_name: "This product is already added to the list",
      }));

      setErrors({
        ...validationErrors,
        prodAdd: "",
      });
      setFormData((prev) => ({
        ...prev,
        products: [...prev.products, { ...currentProduct }],
      }));
    }

    // Reset current product and validation states
    setCurrentProduct({
      product_name: "",
      quantity: 1,
      unit: "",
    });
    setSearch("");
    setProductErrors({});
    setProductTouched({});
  };

  // Edit product
  const handleEditProduct = (index) => {
    const product = formData.products[index];
    setCurrentProduct({ ...product });
    setSearch(product.product_name);
    setEditingIndex(index);

    // Clear previous validation errors when editing
    setProductErrors({});
    setProductTouched({});
  };

  // Delete product
  const handleDeleteProduct = (index) => {
    const updatedProducts = formData.products.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      products: updatedProducts,
    }));
  };

  // Cancel add/edit
  const handleCancelProduct = () => {
    setCurrentProduct({
      product_name: "",
      quantity: 1,
      unit: "",
    });
    setSearch("");
    setEditingIndex(-1);
    setProductErrors({});
    setProductTouched({});
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, attachments: null }));
    setPreviewUrl(null);
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.attachments;
      return newErrors;
    });
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];

    if (file) {
      setFormData((prev) => ({ ...prev, attachments: file }));
      validateOnChange("attachments", file);

      if (file.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(file));
      } else if (
        file.type === "application/pdf" ||
        file.type === "application/msword" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setErrors((prev) => ({
          ...prev,
          attachments: "Only image, PDF or Word documents are allowed",
        }));
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateOnChange(name, value);
  };

  // Update dependent field validations when their dependencies change
  useEffect(() => {
    if (formData.isUrgent && touched.urgencyReason) {
      validateOnChange("urgencyReason", formData.urgencyReason);
    }
  }, [formData, touched]);

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();

      const validationErrors = validateOrderForm(formData);

      setErrors({
        ...validationErrors,
        prodAdd:
          formData.products.length === 0
            ? "Please add atleast one product"
            : "",
      });

      // Mark all fields as touched
      setTouched(
        Object.keys(formData).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {})
      );

      if (
        Object.keys(validationErrors).length > 0 ||
        formData.products.length === 0
      ) {
        return;
      }

      // Create FormData for submission
      let form = new FormData();

      // Append form fields
      form.append("order_description", formData.description);
      form.append("company_name", formData.company);
      form.append("department_name", formData.department);
      form.append("center_cost_name", formData.costCenter);
      form.append("location", formData.deliveryLocation);
      form.append("change_location", formData.changeLocation);
      form.append("urgent", formData.isUrgent);
      form.append("reason_for_urgency", formData.urgencyReason || "");

      // Append products array
      form.append("products", JSON.stringify(formData.products));

      // Handle attachments
      if (formData.attachments instanceof File) {
        form.append("image", formData.attachments);
      } else if (formData.attachments?.[0] instanceof File) {
        form.append("image", formData.attachments[0]);
      }

      // Dispatch the API call
      const response = await dispatch(createOrder(form));
      if (response?.type?.includes("fulfilled")) {
        navigate("/user/orderlist");
        dispatch(fetchNotificationsCount());

        if (loggedUser?.role_id?.name === "admin") {
          dispatch(fetchAdminNotifications());
        } else {
          dispatch(fetchUserNotifications());
        }
      } else {
        console.error("Order creation failed:", response);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const hasError = (fieldName) => {
    return touched[fieldName] && errors[fieldName];
  };

  const hasProductError = (fieldName) => {
    return productTouched[fieldName] && productErrors[fieldName];
  };

  const departmentOptions = showndepartments.map((dept) => ({
    value: dept.name,
    label: dept.name,
  }));

  return (
    //user
    <div className="boxShadow p-6 bg-white rounded-md">
      <h3 className="block sm:hidden text-2xl font-bold text-[#212121] leading-9">
        Create Order
      </h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Company, Department, Cost Center */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 item-flex-start">
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
              onBlur={handleBlur}
              options={
                companies?.map((company) => ({
                  value: company.name,
                  label: company.name,
                })) || []
              }
              placeholder="Select company..."
              classNamePrefix="formField-select"
              className="pt-3"
            />
            {hasError("company") && (
              <p className="text-red-500 text-sm mt-1">{errors.company}</p>
            )}
          </div>

          {/* Department */}
          <div>
            <label className="formField-label">Department</label>
            <Select
              isClearable
              name="department"
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
              onBlur={handleBlur}
              options={departmentOptions}
              placeholder="Select department..."
              className="pt-3"
              isDisabled={!formData.company}
            />
            {hasError("department") && (
              <p className="text-red-500 text-sm mt-1">{errors.department}</p>
            )}
          </div>

          {/* Cost Center */}
          <div>
            <label className="formField-label">Cost Center</label>
            <Select
              name="costCenter"
              isClearable
              isDisabled={!formData.department}
              value={
                formData.costCenter
                  ? { value: formData.costCenter, label: formData.costCenter }
                  : null
              }
              onChange={(selectedOption) =>
                handleChange({
                  target: {
                    name: "costCenter",
                    value: selectedOption ? selectedOption.value : "",
                  },
                })
              }
              onBlur={handleBlur}
              options={shownCenterCosts.map((center) => ({
                value: center.name,
                label: center.name,
              }))}
              placeholder="Select cost center..."
              classNamePrefix="formField-select"
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
            {hasError("costCenter") && (
              <p className="text-red-500 text-sm mt-1">{errors.costCenter}</p>
            )}
          </div>
        </div>

        {/* Products Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold">Products</h4>
          </div>

          {/* ▸ Add / Edit product card – design only */}
          <div className="border boxShadow rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-4">
              {editingIndex >= 0 ? "Edit Product" : "Add New Product"}
            </h3>

            {/* ── Product‑related fields ───────────────────────── */}
            <div className="grid grid-cols-1 xl:[grid-template-columns:auto_450px] gap-5 items-center mb-4">
              {/* Product Name */}
              <div className="relative" ref={dropdownRef}>
                <label className="formField-label">Product Name</label>
                <input
                  type="text"
                  name="product_name"
                  value={search}
                  onChange={handleInputChange}
                  onBlur={handleProductBlur}
                  placeholder="Ex. Laptop, Keyboard"
                  onFocus={() => setShowDropdown(true)}
                  className="w-full px-3 mt-3 py-2 border rounded-md focus:outline-none border-gray-300"
                  autoComplete="off"
                />
                {hasProductError("product_name") && (
                  <p className="text-red-500 text-sm mt-1">
                    {productErrors.product_name}
                  </p>
                )}
                {showDropdown && availableProducts.length > 0 && (
                  <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-md max-h-48 overflow-y-auto">
                    {availableProducts.map((item) => (
                      <li
                        key={item._id}
                        onMouseDown={() => {
                          handleSelect(item.product_name);
                        }}
                        className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                      >
                        {item.product_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Quantity & Unit block (stacks on small, row on xl) */}
              <div className="flex gap-5 flex-col sm:flex-row items-start">
                {/* Quantity */}
                <div>
                  <label className="formField-label">Quantity</label>
                  <div className="flex items-center gap-5">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange("decrement")}
                      className="border-2 border-[#282828] rounded-full h-7 w-7 flex items-center justify-center mt-2.5"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="size-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 12h14"
                        />
                      </svg>
                    </button>

                    <input
                      type="number"
                      name="quantity"
                      value={currentProduct.quantity}
                      onChange={handleCurrentProductChange}
                      onBlur={handleProductBlur}
                      className="formField-inputBox text-center max-w-[70px] w-full"
                      min="1"
                      max="10000"
                    />

                    <button
                      type="button"
                      onClick={() => handleQuantityChange("increment")}
                      className="border-2 border-[#282828] rounded-full h-7 w-7 flex items-center justify-center mt-2.5"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="size-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4.5v15m7.5-7.5h-15"
                        />
                      </svg>
                    </button>
                  </div>
                  {hasProductError("quantity") && (
                    <p className="text-red-500 text-sm mt-1">
                      {productErrors.quantity}
                    </p>
                  )}
                </div>

                {/* Unit */}
                <div className="flex flex-col gap-0 flex-1">
                  <label className="formField-label">Unit</label>
                  <input
                    type="text"
                    name="unit"
                    value={currentProduct.unit}
                    onChange={handleCurrentProductChange}
                    onBlur={handleProductBlur}
                    placeholder="Ex. PAL, G, packs"
                    className="formField-inputBox mt-0"
                  />
                  {hasProductError("unit") && (
                    <p className="text-red-500 text-sm mt-1">
                      {productErrors.unit}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Action buttons ──────────────────────────────── */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleAddProduct}
                className="flex-1 lg:flex-none px-4 lg:px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400"
              >
                {editingIndex >= 0 ? "Update Product" : "Add Product"}
              </button>
              <button
                type="button"
                onClick={handleCancelProduct}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

          <p className="text-red-500 text-sm mt-1">{errors.prodAdd}</p>

          {/* Products Table */}
          {formData.products.length > 0 && (
            <div className="border rounded-lg boxShadow overflow-hidden">
              <div className="mt-5 custom-scrollbar overflow-y-hidden">
                <table className="min-w-[700px] lg:w-full table-auto">
                  {/* ── Header ───────────────────────────────────── */}
                  <thead className="border-b border-[#E7E7E7]">
                    <tr>
                      <th className="table-title font-bold whitespace-nowrap">
                        Product
                      </th>
                      <th className="table-title font-bold whitespace-nowrap">
                        Image
                      </th>
                      <th className="table-title font-bold whitespace-nowrap">
                        Qty
                      </th>
                      <th className="table-title font-bold whitespace-nowrap">
                        Unit
                      </th>
                      <th className="table-title font-bold whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  {/* ── Body ─────────────────────────────────────── */}
                  <tbody className="bg-white divide-y divide-[#E7E7E7]">
                    {formData.products.map((product, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="table-data whitespace-nowrap">
                          {product.product_name}
                        </td>

                        <td className="table-data whitespace-nowrap">
                          <img
                            src={
                              totalProds.find(
                                (d) => d.product_name === product.product_name
                              )?.file
                            }
                            alt=""
                            className="w-12 h-12 min-w-12 rounded-xl object-cover"
                          />
                        </td>

                        <td className="table-data whitespace-nowrap">
                          {product.quantity}
                        </td>

                        <td className="table-data whitespace-nowrap">
                          {product.unit}
                        </td>

                        <td className="table-data whitespace-nowrap">
                          <div className="flex justify-flex-start gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditProduct(index)}
                              className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded transition-colors"
                              title="Edit product"
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
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(index)}
                              className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                              title="Delete product"
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Delivery Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="formField-label">Delivery Location</label>
            <input
              type="text"
              name="deliveryLocation"
              value={formData.deliveryLocation}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Add Delivery Location"
              className={`formField-select appearance-none bg-[#F6F6F6] `}
              disabled={!formData.changeLocation}
            />
            {hasError("deliveryLocation") && (
              <p className="text-red-500 text-sm mt-1">
                {errors.deliveryLocation}
              </p>
            )}
            <div className="flex items-center h-12 col-span-1 md:col-span-2">
              <input
                type="checkbox"
                id="checkbox"
                name="changeLocation"
                checked={formData.changeLocation}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <label htmlFor="changeLocation" className="text-sm pl-2">
                Want to change the location?
              </label>
            </div>
          </div>
        </div>

        {/* Attachments and Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="formField-label">Attachments</label>
            <div
              className={`min-h-[80px] border rounded-[10px] border-dashed mt-[10px] py-5 px-3 transition-colors duration-200  border-gray-300 `}
              onDrop={handleImageDrop}
              onDragOver={handleDragOver}
            >
              {!previewUrl ? (
                <div className="flex flex-wrap items-center gap-2.5 justify-center">
                  <span className="text-sm font-normal text-[#212121] leading-6 flex items-center gap-2.5">
                    <span className="h-10 w-10 bg-[#F6F6F6] flex justify-center items-center rounded-[10px]">
                      <img src={Upload} alt="upload" />
                    </span>
                    Drop File or Image here, or
                  </span>
                  <label className="cursor-pointer text-sm text-[#282828] underline hover:text-blue-800">
                    Browse
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/jpg,image/png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleChange}
                    />
                  </label>
                </div>
              ) : (
                <div>
                  {formData.attachments?.type?.startsWith("image/") ? (
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
                        title="Remove file"
                      >
                        &times;
                      </button>
                    </div>
                  ) : (
                    <div className="relative ">
                      <div className="flex items-center justify-between bg-gray-100 text-sm text-[# ] px-4 py-2 rounded-md w-fit hover:bg-gray-200 transition">
                        {formData.attachments?.name}
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-opacity-80"
                        title="Remove file"
                      >
                        &times;
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            {hasError("attachments") && (
              <p className="text-red-500 text-sm mt-1">{errors.attachments}</p>
            )}
          </div>
          <div>
            <label className="formField-label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Describe requirement in detail"
              rows={6}
              className={`formField-textField outline-none  border-gray-300`}
            />
            {hasError("description") && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>
        </div>

        {/* Urgency Section */}
        <div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="checkbox"
              name="isUrgent"
              checked={formData.isUrgent}
              onChange={handleChange}
              className="rounded mr-[5px] m-0 h-4 w-4"
            />
            <label htmlFor="isUrgent" className="formField-label m-0">
              Is it urgent? If yes, please specify the reason.
            </label>
          </div>
          {formData.isUrgent && (
            <>
              <textarea
                name="urgencyReason"
                value={formData.urgencyReason}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter your reason for urgency here..."
                rows={4}
                className={`formField-textField outline-none mt-2  border-gray-300`}
              />
              {hasError("urgencyReason") && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.urgencyReason}
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex justify-between md:justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 lg:flex-none px-4 lg:px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 lg:flex-none px-4 lg:px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400"
            onClick={() => setTouched((prev) => ({ ...prev, submit: true }))}
            disabled={loading}
          >
            {loading ? <Loader /> : "Create Order"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateOrder;
