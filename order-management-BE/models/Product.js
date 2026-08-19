const mongoose = require("mongoose");
const Order = require("./Order");

const supplierInfoSchema = new mongoose.Schema({
  supplier_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Supplier",
    required: true,
  },

  price: { 
    type: Number, 
    required: true 
  
  },
  previous_price: { 
    type: Number, 
    default: null 
  
  },
  changed_date: { 
    type: Date, 
    default: null 
  },

  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
}, { _id: false });

const productSchema = new mongoose.Schema(
  {
    product_id: { 
      type: String, 
      required: true, 
      unique: true 
    },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    product_name: { 
      type: String 
    },

    brand_name: { 
      type: String 
    },

    UN: { 
      type: String 
    },

    ERP_number: { 
      type: Number 
    },

    sector: { 
      type: String 
    },

    file: { 
      type: String,
      required: true
    },

    description: { 
      type: String 
    },

    suppliers: [supplierInfoSchema],
  },
  { 
    timestamps: true 
  }
);

productSchema.pre('findOneAndDelete', async function (next) {
  try {
    const productToDelete = await this.model.findOne(this.getFilter());
    if (productToDelete) {
      await Order.deleteMany({ order_name: productToDelete.product_name });
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Product", productSchema);
