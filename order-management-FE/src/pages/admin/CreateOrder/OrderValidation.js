// OrderValidation.js
import * as Yup from "yup";

export const orderSchema = Yup.object().shape({
  company: Yup.string().required("Company is required"),

  department: Yup.string().required("Department is required"),

  costCenter: Yup.string().required("Cost center is required"),

  deliveryLocation: Yup.string().required("Delivery location is required"),

  description: Yup.string()
    .required("Description is required")
    // .matches(/^[a-zA-Z0-9 ]*$/, "Description can only contain letters and numbers")
    .min(10, "Description should be at least 10 characters")
    .max(200, "Description should not exceed 500 characters"),

  // Conditional validation
  urgencyReason: Yup.string().when("isUrgent", {
    is: true,
    then: () =>
      Yup.string()
        .required("Urgency reason is required when marked as urgent")
        .min(10, "Please provide a detailed reason for urgency"),
    otherwise: () => Yup.string().notRequired(),
  }),

  // Single attachment validation
  attachments: Yup.mixed().nullable(),
});

// Function to validate the entire form
export const validateForm = async (data) => {
  try {
    await orderSchema.validate(data, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (err) {
    const validationErrors = {};
    if (err.inner) {
      err.inner.forEach((error) => {
        validationErrors[error.path] = error.message;
      });
    }
    return { isValid: false, errors: validationErrors };
  }
};
