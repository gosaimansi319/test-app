const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    supplier_id: {
      type: String,
      required: true,
      unique: true,
    },

    company_name: {
      type: String,
      required: true,
    },

    NIF_number: {
      type: String,
      required: true,
    },

    ERP_number: {
      type: String,
      required: true,
    },

    contact_person: {
      type: String,
      required: true,
    },

    contact_number: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    supplier_company_name: {
      type: String,
    },

    price: {
      type: Number,
    },

    previous_price: {
      type: Number,
    },

    current_price: {
      type: Number,
    },

    changed_date: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Supplier", supplierSchema);
