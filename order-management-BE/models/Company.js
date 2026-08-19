const mongoose = require("mongoose");
const Department = require("./Department");

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
  },
  { 
    timestamps: true 
  }
);

companySchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    await Department.deleteMany({ company_id: this._id });

    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Company", companySchema);
