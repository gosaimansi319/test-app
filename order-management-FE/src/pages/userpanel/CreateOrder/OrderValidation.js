import * as Yup from "yup";

// Define the validation schema using Yup
export const orderSchema = Yup.object().shape({
  // itemDescription: Yup.string()
  //   .trim()
  //   .required("Item description is required")
  //   .min(3, "Item description must be at least 3 characters"),

  // quantity: Yup.number()
  //   .required("Quantity is required")
  //   .positive("Quantity must be greater than 0")
  //   .integer("Quantity must be a whole number"),

  // unit: Yup.string().trim().required("Unit is required"),

  company: Yup.string().trim().required("Please select a company"),

  department: Yup.string().trim().required("Please select a department"),

  costCenter: Yup.string().trim().required("Please select a cost center"),

  deliveryLocation: Yup.string()
    .trim()
    .required("Please select a delivery location"),

  description: Yup.string()
    .required("Description is required")
    .min(10, "Description should be at least 10 characters")
    .max(200, "Description should not exceed 500 characters"),

  isUrgent: Yup.boolean(),

  urgencyReason: Yup.string().when("isUrgent", {
    is: true,
    then: () =>
      Yup.string()
        .trim()
        .required("Please provide a reason for urgency")
        .min(10, "Reason must be at least 10 characters"),
    otherwise: () => Yup.string().notRequired(),
  }),

  // attachments: Yup.mixed()
  //   .nullable()
  //   .required("Please add attachement")
  //   .test("fileType", "Only image files are allowed", (value) => {
  //     if (!value) return true; // Null is valid (no file)
  //     return value && value.type && value.type.startsWith("image/");
  //   })
  //   .test("fileSize", "File size is too large (max 2MB)", (value) => {
  //     if (!value) return true;
  //     return value && value.size <= 2 * 1024 * 1024; // 2MB limit
  //   }),
});

// Validate the entire form
export const validateOrderForm = (formData) => {
  try {
    orderSchema.validateSync(formData, { abortEarly: false });
    return {};
  } catch (err) {
    const errors = {};
    err.inner.forEach((error) => {
      errors[error.path] = error.message;
    });
    return errors;
  }
};

// Validate a single field for onChange validation
export const validateField = (fieldName, value, formData) => {
  try {
    // Create a schema just for this field
    const fieldSchema = Yup.reach(orderSchema, fieldName);

    // For fields that depend on other fields (like urgencyReason depends on isUrgent)
    let valueToValidate = value;
    let dataToValidate = { [fieldName]: value };

    if (fieldName === "urgencyReason") {
      dataToValidate = {
        isUrgent: formData.isUrgent,
        urgencyReason: value,
      };
    }

    if (fieldSchema) {
      fieldSchema.validateSync(valueToValidate);
    } else if (fieldName === "urgencyReason") {
      // Handle conditional validation specifically
      orderSchema.validateSyncAt(fieldName, dataToValidate);
    }

    return { isValid: true, error: null };
  } catch (err) {
    return { isValid: false, error: err.message };
  }
};
