const mongoose = require("mongoose");

const centerCostSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true 
    },
    
    department_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
  },
  { 
    timestamps: true
  }
);

module.exports = mongoose.model("CenterCost", centerCostSchema);
