const mongoose = require("mongoose");
const CenterCost = require("./CenterCost");

const departmentSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true 
    },

    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
  },
  { 
    timestamps: true 
  }
);

departmentSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    await CenterCost.deleteMany({ department_id: this._id });

    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Department", departmentSchema);
