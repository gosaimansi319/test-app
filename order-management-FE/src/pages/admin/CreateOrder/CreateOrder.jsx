import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Upload from "../../../assets/svg/uploadIcon.svg";
import { orderSchema, validateForm } from "./OrderValidation";
import {
  createCenterCost,
  createCompanies,
  createDepartment,
  deleteCenterCost,
  deleteCompanies,
  deleteDepartment,
  fetchCenterCostByDept,
  fetchCompanies,
  fetchDepartments,
} from "../../../store/Company/companyThunk";
import { fetchSuppliers } from "../../../store/Supplier/suppliersThunk";
import { createOrder } from "../../../store/Orders/ordersThunk";
import { fetchAllProducts, fetchProducts } from "../../../store/Product/productsThunk";
import {
  fetchAdminNotifications,
  fetchNotificationsCount,
  fetchUserNotifications,
} from "../../../store/Notifications/notificationThunk";
import CreatableSelect from "react-select/creatable";
import Select, { components } from "react-select";
import toast from "react-hot-toast";
import deleteIcon from "../../../assets/svg/delete-icon.svg";
import { DeleteConfirmDialog } from "../../../components/commen/DeleteConfirmDialog";
import { statusOrderOptions } from "../../../utils/utilities";
import { Loader } from "../../../components/commen/Loader";

const CreateOrder = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { departments, companies, centerCost } = useSelector(
    (state) => state.companies
  );

  let loggedUser =
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(sessionStorage.getItem("user"));

  const [showndepartments, setShownDepartments] = useState([]);
  const [shownCenterCosts, setShownCenterCost] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formTouched, setFormTouched] = useState({});
  const [previewUrl, setPreviewUrl] = useState(null);
  const [openAlertDialog, setOpenAlertDialog] = useState(false);
  const [dataToDelete, setDataToDelete] = useState(null);

  // Product-related states
  const [currentProduct, setCurrentProduct] = useState({
    itemDescription: "",
    quantity: 1,
    unit: "",
    supplier: "",
    supplierPrice: "",
    reason: "",
    status: "",
    approvedQuantity: "",
  });

  const [productErrors, setProductErrors] = useState({});
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProductIndex, setEditingProductIndex] = useState(-1);
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [selectedProd, setSelectedProd] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [totalProds, setTotalProds] = useState([]);
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    productItems: [],
    company: "",
    department: "",
    costCenter: "",
    deliveryLocation: "",
    changeLocation: false,
    attachments: [],
    description: "",
    isUrgent: false,
    urgencyReason: "",
    status: "Pending Assignment",
    create_new_entities: false,
  });

  const [errors, setErrors] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch initial data
  useEffect(() => {
    dispatch(fetchSuppliers());
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
  // Update center costs when they change

  useEffect(() => {
    if (centerCost && centerCost.length > 0) {
      setShownCenterCost(centerCost);
    }
  }, [centerCost]);

  // Product search effect
  useEffect(() => {
    if (search === "") return setProducts([]);

    dispatch(fetchProducts({ name: search }))
      .then((res) => {
        if (res.payload && res.payload.products) {
          setProducts(res.payload.products);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }, [dispatch, search]);

  // Mark all fields as touched on submit attempt
  const markAllTouched = () => {
    const touched = {};
    Object.keys(formData).forEach((key) => {
      touched[key] = true;
    });
    setFormTouched(touched);
  };

  // Validation function for a specific field
  const validateField = async (name, value) => {
    try {
      if (name === "costCenter") {
        setErrors((prev) => ({ ...prev, deliveryLocation: "" }));
      }
      await orderSchema.validateAt(name, { ...formData, [name]: value });
      setErrors((prev) => ({ ...prev, [name]: "" }));
      return true;
    } catch (err) {
      setErrors((prev) => ({ ...prev, [name]: err.message }));
      return false;
    }
  };

  // Validate product fields
  const validateProductField = (name, value) => {
    const errors = {};
    if (name === "itemDescription" && (!value || value.trim() === "")) {
      errors.itemDescription = "Product description is required";
    }
    if (name === "quantity" && (!value || value < 1)) {
      errors.quantity = "Quantity must be at least 1";
    }

    if (name === "unit" && (!value || value.trim() === "")) {
      errors.unit = "Unit is required";
    }
    if (name === "supplier" && (!value || value.trim() === "")) {
      errors.supplier = "Supplier is required";
    }
    if (name === "quantity" && (!value || value < 1)) {
      errors.quantity = "Quantity must be at least 1";
    }
    if (name === "status" && (!value || value.trim() === "")) {
      errors.status = "Status is required";
    }
    // if (name === "approvedQuantity" && (!value || value < 1)) {
    //   errors.approvedQuantity = "Quantity must be at least 1";
    // }

    setProductErrors((prev) => ({ ...prev, [name]: errors[name] || "" }));
    return !errors[name];
  };
  // Validate entire product object
  const validateProduct = (product) => {
    const errors = {};

    if (!product.itemDescription || product.itemDescription.trim() === "") {
      errors.itemDescription = "Product description is required";
    }
    if (!product.quantity || product.quantity < 1) {
      errors.quantity = "Quantity must be at least 1";
    }
    if (product.quantity > 10000) {
      errors.quantity = "Quantity cannot exceed 10000";
    }
    if (!product.unit || product.unit.trim() === "") {
      errors.unit = "Unit is required";
    }
    if (!product.supplier || product.supplier.trim() === "") {
      errors.supplier = "Supplier is required";
    }
    if (!product.status || product.status.trim() === "") {
      errors.status = "Status is required";
    }
    // if (product.approvedQuantity <= 0) {
    //   errors.approvedQuantity = "Approved Quantity must be at least 1";
    // }
    // if (product.deliveredQuantity <= 0) {
    //   errors.deliveredQuantity = "Delivered Quantity must be at least 1";
    // }
    // if (product.approvedQuantity > product.quantity) {
    //   errors.approvedQuantity = "Invalid Approved Quantity";
    // }
    // if (product.deliveredQuantity > product.quantity) {
    //   errors.deliveredQuantity = "Invalid Delivery Quantity";
    // }

    setProductErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle product input changes
  const handleProductChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === "checkbox" ? checked : value;

    if (name === "approvedQuantity") {
      newValue = newValue.replace(/^0+(?!$)/, "");
    }

    setCurrentProduct((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Update search for itemDescription
    if (name === "itemDescription") {
      setSearch(value);
      setShowDropdown(true);
    }

    // Validate field
    validateProductField(name, newValue);
  };

  // Handle quantity increment/decrement for current product
  const handleProductQuantityChange = (action) => {
    if (action === "increment") {
      const newQuantity = Number(currentProduct.quantity) + 1;
      setCurrentProduct((prev) => ({ ...prev, quantity: newQuantity }));
      validateProductField("quantity", newQuantity);
    } else if (action === "decrement") {
      const newQuantity = Math.max(1, Number(currentProduct.quantity) - 1);
      setCurrentProduct((prev) => ({ ...prev, quantity: newQuantity }));
      validateProductField("quantity", newQuantity);
    }
  };

  // Handle product selection from dropdown
  const handleProductSelect = (item) => {
    setSearch(item);
    setShowDropdown(false);
    setCurrentProduct((prev) => ({
      ...prev,
      itemDescription: item,
    }));
    validateProductField("itemDescription", item);
  };

  // Handle input change for search
  const handleProductInputChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    setCurrentProduct((prev) => ({
      ...prev,
      itemDescription: value,
    }));
    setShowDropdown(true);
    validateProductField("itemDescription", value);
  };

  // Get supplier price for current product
  const getCurrentSupplierPrice = () => {
    const product = products.find(
      (p) => p.product_name === currentProduct.itemDescription
    );
    const price = product?.suppliers?.find(
      (s) => s?.company_name === currentProduct?.supplier
    )?.price;
    return price || "";
  };

  // Add or update product in the list
  const handleAddOrUpdateProduct = () => {
    if (!validateProduct(currentProduct)) {
      return;
    }

    let isDuplicateproduct = formData.productItems.some(
      (product) =>
        product.itemDescription.toLowerCase() ===
        currentProduct.itemDescription.toLowerCase()
    );

    if (isDuplicateproduct) {
      setErrors((prev) => ({
        ...prev,
        productItems: "Cannot add Same product",
      }));
      return;
    }

    const productWithPrice = {
      ...currentProduct,
      supplierPrice: getCurrentSupplierPrice() || currentProduct.supplierPrice,
    };

    if (isEditingProduct) {
      // Update existing product
      setFormData((prev) => ({
        ...prev,
        productItems: prev.productItems.map((item, index) =>
          index === editingProductIndex ? productWithPrice : item
        ),
      }));
      setIsEditingProduct(false);
      setEditingProductIndex(-1);
    } else {
      setErrors((prev) => ({ ...prev, productItems: "" }));
      // Add new product
      setFormData((prev) => ({
        ...prev,
        productItems: [...prev.productItems, productWithPrice],
      }));
    }

    // Reset current product form
    setCurrentProduct({
      itemDescription: "",
      quantity: 1,
      unit: "",
      supplier: "",
      supplierPrice: "",
      reason: "",
      status: "",
      approvedQuantity: "",
    });
    setSearch("");
    setProductErrors({});
    // setSelectedProd(null);
  };

  // Edit product
  const handleEditProduct = (index) => {
    const product = formData.productItems[index];
    let selectProd = totalProds.find(
      (d) => d.product_name === product.itemDescription
    );
    setSelectedProd(selectProd);
    setCurrentProduct(product);
    setSearch(product.itemDescription);
    setIsEditingProduct(true);
    setEditingProductIndex(index);
    setProductErrors({});
  };

  // Delete product
  const handleDeleteProduct = (index) => {
    setFormData((prev) => ({
      ...prev,
      productItems: prev.productItems.filter((_, i) => i !== index),
    }));
    toast.success("Product removed successfully");
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setCurrentProduct({
      itemDescription: "",
      quantity: 1,
      unit: "",
      supplier: "",
      supplierPrice: "",
      reason: "",
      approvedQuantity: "",
    });
    setSearch("");
    setIsEditingProduct(false);
    setEditingProductIndex(-1);
    setProductErrors({});
    setSelectedProd(null);
  };

  // Handle main form input changes
  const handleChange = async (e) => {
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
    }

    const newValue = type === "checkbox" ? checked : value;
    const cleanedValue =
      typeof newValue === "string"
        ? newValue.trim() === ""
          ? ""
          : newValue
        : newValue;

    setFormTouched((prev) => ({ ...prev, [name]: true }));

    // Prepare new state object
    const updatedFormData = {
      ...formData,
      [name]: cleanedValue,
    };

    if (name === "costCenter") updatedFormData.deliveryLocation = value;

    // Reset department & costCenter if company is cleared or changed
    if (name === "company") {
      if (!cleanedValue) {
        updatedFormData.department = "";
        updatedFormData.costCenter = "";
        setShownDepartments([]);
        setShownCenterCost([]);
      } else {
        updatedFormData.department = "";
        updatedFormData.costCenter = "";
        const filtered = departments.filter(
          (dept) => dept?.company_id?.name === cleanedValue
        );
        setShownDepartments(filtered);
        setShownCenterCost([]);
      }
    }

    // Reset costCenter if department is cleared or changed
    if (name === "department") {
      if (!cleanedValue) {
        updatedFormData.costCenter = "";
        setShownCenterCost([]);
      } else {
        try {
          const filteredDept = departments.find(
            (dept) => dept.name === cleanedValue
          );
          if (filteredDept?._id) {
            const res = await dispatch(fetchCenterCostByDept(filteredDept._id));
            setShownCenterCost(res.payload);
          }
        } catch (err) {
          console.error("Error fetching center costs:", err);
        }
      }
    }
    setFormData(updatedFormData);

    // Skip validation if value is empty string
    if (typeof newValue === "string" && newValue.trim() === "") return;

    if (orderSchema.fields[name]) {
      validateField(name, newValue);
    }
  };

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

  // File handling functions
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

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, attachments: [] }));
    setPreviewUrl(null);
  };

  // Helper function to determine if we should show an error
  const shouldShowError = (fieldName) => {
    if (fieldName === "attachments") {
      return errors[fieldName];
    } else {
      return errors[fieldName] && formTouched[fieldName];
    }
  };

  const getCostCenterLabel = (value) => {
    const match = shownCenterCosts.find(
      (center) => center.id === value || center.name === value
    );
    return match ? match.name : value;
  };

  const getCompanyLabel = (value) => {
    const match = companies.find(
      (company) => company.id === value || company.name === value
    );
    return match ? match.name : value;
  };

  const handleCreateCompnDeptCentrCost = async (type, name) => {
    try {
      if (type === "company") {
        await dispatch(createCompanies({ name })).unwrap();
        toast.success("Company created");
        dispatch(fetchCompanies());
        handleChange({ target: { name: "company", value: name } });
      } else if (type === "department") {
        if (!formData.company) {
          return toast.error("Please select a company first");
        }

        const companyId = companies.find(
          (dept) => dept.name === formData.company
        )?._id;
        await dispatch(
          createDepartment({ name, company_id: companyId })
        ).unwrap();
        toast.success("Department created");
        dispatch(fetchDepartments()).then((res) => {
          const filtered = res?.payload?.filter(
            (dept) => dept?.company_id?.name === formData.company
          );
          setShownDepartments(filtered);
          handleChange({ target: { name: "department", value: name } });
        });
      } else if (type === "costCenter") {
        if (!formData.department) {
          return toast.error("Please select a department first");
        }

        const departmentId = departments.find(
          (dept) => dept.name === formData.department
        )?._id;

        if (!departmentId) {
          return toast.error("Department not found");
        }

        await dispatch(
          createCenterCost({ name, department_id: departmentId })
        ).unwrap();

        toast.success("Cost Center created");
        dispatch(fetchCenterCostByDept(departmentId)).then((res) => {
          setShownCenterCost(res.payload);
        });
        handleChange({ target: { name: "costCenter", value: name } });
      }
    } catch (error) {
      toast.error("Failed to create " + type);
      console.error(error);
    }
  };

  const CustomOption = (props) => {
    const { data, selectProps } = props;

    const handleDelete = (e) => {
      e.stopPropagation();
      selectProps.onDeleteOption(data);
    };

    return (
      <components.Option {...props}>
        <div className="flex items-center justify-between w-full">
          <span>{data.label}</span>
          <button
            onClick={handleDelete}
            className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
            type="button"
          >
            <img src={deleteIcon} alt="deleteIcon" />
          </button>
        </div>
      </components.Option>
    );
  };

  const handleOpenAlertDialog = () => setOpenAlertDialog(!openAlertDialog);

  const handleDeleteOption = async (type, value) => {
    setDataToDelete({
      type: type,
      value: value.value,
    });
    setOpenAlertDialog(true);
  };

  const confirmDelete = async () => {
    if (dataToDelete) {
      setIsDeleting(true);
      try {
        if (dataToDelete.type === "company") {
          const company = companies.find(
            (comp) => comp.name === dataToDelete.value
          );
          if (!company) {
            toast.error("Company not found");
            return;
          }
          await dispatch(deleteCompanies(company._id))
          // toast.success("Company deleted");
          dispatch(fetchCompanies());
          setFormData((prev) => ({
            ...prev,
            company: "",
            department: "",
            costCenter: "",
          }));
        }

        if (dataToDelete.type === "department") {
          const department = departments.find(
            (dept) => dept.name === dataToDelete.value
          );

          if (!department) {
            toast.error("Department not found");
            return;
          }

          await dispatch(deleteDepartment(department._id))
          // toast.success("Department deleted");
          dispatch(fetchDepartments()).then((res) => {
            const filtered = res?.payload?.filter(
              (dept) => dept?.company_id?.name === formData.company
            );
            setShownDepartments(filtered);
            setFormData((prev) => ({
              ...prev,
              department: "",
              costCenter: "",
            }));
          });
        }

        if (dataToDelete.type === "costCenter") {
          const costCenter = centerCost.find(
            (cc) => cc.name === dataToDelete.value
          );
          if (!costCenter) {
            toast.error("Cost Center not found");
            return;
          }

          await dispatch(deleteCenterCost(costCenter._id));
          // toast.success("Cost Center deleted");

          const department = departments.find(
            (dept) => dept.name === formData.department
          );
          if (department?._id) {
            dispatch(fetchCenterCostByDept(department._id)).then((res) => {
              setShownCenterCost(res.payload);
              setFormData((prev) => ({
                ...prev,
                costCenter: "",
              }));
            });
          }
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete " + dataToDelete?.type);
      } finally {
        setIsDeleting(false);
        setOpenAlertDialog(false);
        setDataToDelete(null);
      }
    }
  };

  const supplierOptions =
    selectedProd?.suppliers?.map((supplier) => ({
      value: supplier.company_name,
      label: supplier.company_name,
    })) || [];

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    markAllTouched();

    try {
      const { isValid, errors: validationErrors } = await validateForm(
        formData
      );

      // Validate the entire form

      if (!isValid || formData.productItems.length === 0) {
        setErrors({
          ...validationErrors,
          productItems:
            formData.productItems.length === 0
              ? "Please add at least one product"
              : "",
        });
        setIsSubmitting(false);
        const firstErrorField = document.querySelector(".text-red-500");
        if (firstErrorField) {
          firstErrorField.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
        return;
      }

      // Create FormData for submission
      let form = new FormData();

      let productDataModif = formData.productItems.map((product) => {
        return {
          product_name: product.itemDescription,
          quantity: product.quantity,
          unit: product.unit,
          supplier_name: product.supplier,
          supplier_price: product.supplierPrice,
          reason_supplier_select: product.reason,
          status: product.status,
          // approved_quantity: product.approvedQuantity,
        };
      });

      // Append product items as JSON
      form.append("products", JSON.stringify(productDataModif));

      // Append other form fields
      form.append("company_name", formData.company);
      form.append("department_name", formData.department);
      form.append("center_cost_name", formData.costCenter);
      form.append("location", formData.deliveryLocation);
      form.append("change_location", formData.changeLocation);
      form.append("urgent", formData.isUrgent);
      form.append("order_description", formData.description);
      // form.append("status", formData.status);
      form.append("reason_for_urgency", formData.urgencyReason || "");

      // Handle attachments
      if (formData.attachments instanceof File) {
        form.append("image", formData.attachments);
      } else if (formData.attachments?.[0] instanceof File) {
        form.append("image", formData.attachments[0]);
      }

      if (
        formData.company.trim() === "" ||
        formData.department.trim() === "" ||
        formData.costCenter.trim() === ""
      )
        return;

      // Call the API
      dispatch(createOrder(form))
        .then((response) => {
          if (response?.payload) {
            navigate("/admin/orders");
            dispatch(fetchNotificationsCount());

            if (loggedUser?.role_id?.name === "user") {
              dispatch(fetchUserNotifications());
            } else {
              dispatch(fetchAdminNotifications());
            }
          }
        })
        .catch((error) => {
          console.error("Order creation error:", error);
          setErrors((prev) => ({
            ...prev,
            api: "Something went wrong while creating the order.",
          }));
        });
    } catch (error) {
      console.error("Error submitting the form:", error);
      setErrors((prev) => ({
        ...prev,
        api: "An unexpected error occurred. Please try again.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="boxShadow">
      <h2 className="block sm:hidden text-2xl font-bold text-[#212121] leading-9 mb-4">
        Create Order
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Company Selection */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div>
            <label className="formField-label">Company</label>
            <CreatableSelect
              isClearable
              isSearchable
              placeholder="Select or create company"
              value={
                formData?.company
                  ? {
                      label: getCompanyLabel(formData?.company),
                      value: formData?.company,
                    }
                  : null
              }
              options={companies?.map((company) => ({
                label: company.name,
                value: company.name,
              }))}
              onCreateOption={(inputValue) =>
                handleCreateCompnDeptCentrCost("company", inputValue)
              }
              onChange={(selectedOption) =>
                handleChange({
                  target: {
                    name: "company",
                    value: selectedOption?.value || "",
                  },
                })
              }
              components={{ Option: CustomOption }}
              onDeleteOption={(option) => handleDeleteOption("company", option)}
              className={
                shouldShowError("company")
                  ? "border-red-500"
                  : " selectFieldBox"
              }
            />
            {shouldShowError("company") && (
              <p className="text-red-500 text-sm mt-1">{errors.company}</p>
            )}
          </div>

          <div>
            <label className="formField-label">Department</label>
            <CreatableSelect
              isClearable
              isSearchable
              placeholder="Select or create department"
              value={
                formData.department
                  ? { label: formData.department, value: formData.department }
                  : null
              }
              options={showndepartments.map((dept) => ({
                label: dept.name,
                value: dept.name,
              }))}
              onCreateOption={(inputValue) =>
                handleCreateCompnDeptCentrCost("department", inputValue)
              }
              onChange={(selectedOption) =>
                handleChange({
                  target: {
                    name: "department",
                    value: selectedOption?.value || "",
                  },
                })
              }
              components={{ Option: CustomOption }}
              onDeleteOption={(option) =>
                handleDeleteOption("department", option)
              }
              isDisabled={!formData.company}
              className={
                shouldShowError("department")
                  ? "border-red-500"
                  : "selectFieldBox"
              }
            />
            {shouldShowError("department") && (
              <p className="text-red-500 text-sm mt-1">{errors.department}</p>
            )}
          </div>

          <div>
            <label className="formField-label">Cost Center</label>
            <CreatableSelect
              isClearable
              isSearchable
              placeholder="Select or create cost center"
              value={
                formData.costCenter
                  ? {
                      label: getCostCenterLabel(formData.costCenter),
                      value: formData.costCenter,
                    }
                  : null
              }
              options={shownCenterCosts.map((center) => ({
                label: center.name,
                value: center.name,
              }))}
              onCreateOption={(inputValue) =>
                handleCreateCompnDeptCentrCost("costCenter", inputValue)
              }
              onChange={(selectedOption) =>
                handleChange({
                  target: {
                    name: "costCenter",
                    value: selectedOption?.value || "",
                  },
                })
              }
              components={{ Option: CustomOption }}
              onDeleteOption={(option) =>
                handleDeleteOption("costCenter", option)
              }
              isDisabled={!formData.department}
              className={
                shouldShowError("costCenter")
                  ? "border-red-500"
                  : "selectFieldBox"
              }
            />
            {shouldShowError("costCenter") && (
              <p className="text-red-500 text-sm mt-1">{errors.costCenter}</p>
            )}
          </div>
        </div>

        {/* Product Entry Section */}
        <div className="border boxShadow rounded-lg p-5">
          <h3 className="text-lg font-semibold mb-4">
            {isEditingProduct ? "Edit Product" : "Add Product"}
          </h3>

          {/* Product related fields */}
          <div className="grid grid-cols-1 xl:[grid-template-columns:auto_450px] gap-5 items-center mb-4">
            <div className="relative" ref={dropdownRef}>
              <label className="formField-label">
                What do you want to order?
              </label>
              <input
                type="text"
                name="itemDescription"
                value={search}
                onChange={handleProductInputChange}
                placeholder="Ex. Laptop, Keyboard"
                onFocus={() => setShowDropdown(true)}
                className={`w-full px-3 mt-3 py-2 border rounded-md focus:outline-none border-gray-300`}
                autoComplete="off"
              />

              {showDropdown && products.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-md max-h-48 overflow-y-auto">
                  {products.map((item) => (
                    <li
                      key={item._id}
                      onMouseDown={() => {
                        handleProductSelect(item.product_name);
                        setSelectedProd(item);
                      }}
                      className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                    >
                      {item.product_name}
                    </li>
                  ))}
                </ul>
              )}

              {productErrors.itemDescription && (
                <p className="text-red-500 text-sm mt-1">
                  {productErrors.itemDescription}
                </p>
              )}
              {search.length > 3 && products.length < 1 && (
                <p className="text-red-500 text-sm mt-1">Product not found</p>
              )}
            </div>

            <div className="flex gap-5  flex-col sm:flex-row items-start">
              {/* Quantity */}
              <div>
                <label className="formField-label">Quantity</label>
                <div className="flex items-center gap-5">
                  <button
                    type="button"
                    onClick={() => handleProductQuantityChange("decrement")}
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
                    min={1}
                    value={currentProduct.quantity}
                    onChange={handleProductChange}
                    className="formField-inputBox text-center max-w-[70px] w-full"
                  />
                  <button
                    type="button"
                    onClick={() => handleProductQuantityChange("increment")}
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
                {productErrors.quantity && (
                  <p className="text-red-500 text-sm mt-1">
                    {productErrors.quantity}
                  </p>
                )}
              </div>

              {/* Unit */}
              <div className="flex flex-col gap-0 flex-1">
                <label className="formField-label">UN</label>
                <input
                  type="text"
                  name="unit"
                  value={currentProduct.unit}
                  onChange={handleProductChange}
                  placeholder="Ex. PAL, G"
                  className={`formField-inputBox mt-0 `}
                />
                {productErrors.unit && (
                  <p className="text-red-500 text-sm mt-1">
                    {productErrors.unit}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:[grid-template-columns:1fr_156px_1.5fr] gap-5 items-baseline mb-4">
            {/* Supplier */}
            <div>
              <label className="formField-label">Supplier</label>
              <Select
                name="supplier"
                value={
                  supplierOptions.find(
                    (option) => option.value === currentProduct.supplier
                  ) || null
                }
                onChange={(selectedOption) => {
                  // Create a synthetic event to reuse existing handler
                  const syntheticEvent = {
                    target: {
                      name: "supplier",
                      value: selectedOption ? selectedOption.value : "",
                    },
                  };
                  handleProductChange(syntheticEvent);
                }}
                options={supplierOptions}
                className="selectFieldBox"
                placeholder="Select Supplier"
              />
              {productErrors.supplier && (
                <p className="text-red-500 text-sm mt-1">
                  {productErrors.supplier}
                </p>
              )}
            </div>

            {/* Price */}
            <div>
              <label className="formField-label">Price</label>
              <input
                type="text"
                name="supplierPrice"
                value={
                  getCurrentSupplierPrice() || currentProduct.supplierPrice
                }
                onChange={handleProductChange}
                placeholder="0.00"
                className="formField-inputBox"
                readOnly={!!getCurrentSupplierPrice()}
                disabled={true}
              />
            </div>

            {/* Reason */}
            <div>
              <label className="formField-label">Reason for ordering</label>
              <input
                type="text"
                name="reason"
                value={currentProduct.reason}
                onChange={handleProductChange}
                placeholder="Ex. For project development"
                className={`formField-inputBox `}
              />
              {productErrors.reason && (
                <p className="text-red-500 text-sm mt-1">
                  {productErrors.reason}
                </p>
              )}
            </div>
          </div>

          {/* Status and Approved Quantity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-4">
            {/* Status */}
            <div>
              <label className="formField-label">Status</label>
              <Select
                name="status"
                value={
                  statusOrderOptions.find(
                    (option) => option.value === currentProduct.status
                  ) || null
                }
                onChange={(selectedOption) => {
                  const syntheticEvent = {
                    target: {
                      name: "status",
                      value: selectedOption ? selectedOption.value : "",
                    },
                  };
                  handleProductChange(syntheticEvent);
                }}
                options={statusOrderOptions}
                className="selectFieldBox w-64"
                placeholder="Select Option"
              />
              {productErrors.status && (
                <p className="text-red-500 text-sm mt-1">
                  {productErrors.status}
                </p>
              )}
            </div>

            {/* Approved Quantity */}
            {/* <div>
              <label className="formField-label">Approved Quantity</label>
              <input
                type="number"
                name="approvedQuantity"
                value={currentProduct.approvedQuantity}
                onChange={handleProductChange}
                placeholder="Enter approved quantity"
                min={1}
                max={currentProduct.quantity}
                className="formField-inputBox"
              />
              {productErrors.approvedQuantity && (
                <p className="text-red-500 text-sm mt-1">
                  {productErrors.approvedQuantity}
                </p>
              )}
            </div> */}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleAddOrUpdateProduct}
              className="flex-1 lg:flex-none px-4 lg:px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400"
            >
              {isEditingProduct ? "Update Product" : "Add Product"}
            </button>
            {isEditingProduct && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
          <br />
          {errors.productItems && (
            <p className="text-red-500 text-sm">{errors.productItems}</p>
          )}
        </div>

        {/* Product Items Table */}
        {formData.productItems.length > 0 && (
          <div className="border rounded-lg boxShadow overflow-hidden">
            <div className="mt-5 custom-scrollbar overflow-y-hidden">
              <table className="min-w-[700px] lg:w-full table-auto">
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
                      Supplier
                    </th>
                    <th className="table-title font-bold whitespace-nowrap">
                      Price
                    </th>
                    <th className="table-title font-bold whitespace-nowrap">
                      Status
                    </th>
                    <th className="table-title font-bold whitespace-nowrap">
                      Approved Qty
                    </th>
                    <th className="table-title font-bold whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {formData.productItems.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="table-data whitespace-nowrap">
                        {item.itemDescription}
                      </td>
                      <td className="table-data whitespace-nowrap">
                        <img
                          src={
                            totalProds.find(
                              (d) => d.product_name === item.itemDescription
                            )?.file
                          }
                          className="w-12 h-12 min-w-12 rounded-xl overflow-hidden object-cover"
                          alt=""
                        />
                      </td>
                      <td className="table-data whitespace-nowrap">
                        {item.quantity || "N/A"}
                      </td>
                      <td className="table-data whitespace-nowrap">
                        {item.unit || "N/A"}
                      </td>
                      <td className="table-data whitespace-nowrap">
                        {item.supplier || "N/A"}
                      </td>
                      <td className="table-data whitespace-nowrap">
                        {item.supplierPrice || "N/A"}
                      </td>
                      <td className="table-data whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.status === "Approved"
                              ? "bg-green-100 text-green-800"
                              : item.status === "Rejected"
                              ? "bg-red-100 text-red-800"
                              : item.status === "Delivered"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="table-data whitespace-nowrap">
                        {item.approvedQuantity || "N/A"}
                      </td>
                      <td className="table-data whitespace-nowrap">
                        <div className="flex justify-center gap-2">
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
        {/* Product Items Error */}

        {/* Delivery Location */}
        <div className="w-1/3">
          <label className="formField-label text-nowrap">
            Delivery Location
          </label>
          <input
            type="text"
            name="deliveryLocation"
            value={formData.deliveryLocation}
            onChange={handleChange}
            placeholder="Enter delivery address"
            className={`formField-inputBox `}
            disabled={!formData.changeLocation}
          />
          {shouldShowError("deliveryLocation") && (
            <p className="text-red-500 text-sm mt-1">
              {errors.deliveryLocation}
            </p>
          )}
        </div>

        {/* Change Location Checkbox */}
        <div className="flex items-center gap-2">
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

        <div className="flex flex-col lg:flex-row gap-5">
          {/* Description */}
          <div className="w-full">
            <label className="formField-label">Additional Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Any additional information about the order"
              rows={5}
              className={`formField-textField outline-none  border-gray-300`}
            />
            {shouldShowError("description") && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* File Upload */}
          <div className="w-full">
            <label className="formField-label">Attachments</label>
            <div
              onDrop={handleImageDrop}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors mt-2"
            >
              {!previewUrl ? (
                <div>
                  <img src={Upload} alt="Upload" className="mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    Drag and drop files here, or{" "}
                    <label className="cursor-pointer text-sm text-[#282828] underline hover:text-blue-800">
                      Browse
                      <input
                        type="file"
                        name="attachments"
                        onChange={handleChange}
                        accept="image/*,.pdf,.doc,.docx"
                        className="hidden"
                      />
                    </label>
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports: Images, PDF, Word documents
                  </p>
                </div>
              ) : (
                <div className="relative">
                  {formData.attachments?.type?.startsWith("image/") ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-xs max-h-48 mx-auto rounded"
                    />
                  ) : (
                    <div className="flex items-center justify-center p-4">
                      <div className="text-center">
                        <p className="text-gray-600 mb-2">Document uploaded:</p>
                        <p className="font-medium">
                          {formData.attachments?.name}
                        </p>
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
            {shouldShowError("attachments") && (
              <p className="text-red-500 text-sm mt-1">{errors.attachments}</p>
            )}
          </div>
        </div>

        {/* Urgency */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="checkbox"
              name="isUrgent"
              checked={formData.isUrgent}
              onChange={handleChange}
              className="w-4 h-4"
            />
            <label htmlFor="isUrgent" className="text-sm">
              is it urgent? If yes, please specify the reason
            </label>
          </div>

          {formData.isUrgent && (
            <div>
              <label className="formField-label">Reason for Urgency</label>
              <textarea
                name="urgencyReason"
                value={formData.urgencyReason}
                onChange={handleChange}
                placeholder="Please explain why this order is urgent"
                rows={3}
                className={`formField-inputBox resize-none ${
                  shouldShowError("urgencyReason") ? "border-red-500" : ""
                }`}
              />
              {shouldShowError("urgencyReason") && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.urgencyReason}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate("/admin/orders")}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 lg:flex-none px-4 lg:px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400"
          >
            {isSubmitting ? <Loader /> : "Create Order"}
          </button>
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={openAlertDialog}
        onClose={handleOpenAlertDialog}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to delete this ${dataToDelete?.type}? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default CreateOrder;
