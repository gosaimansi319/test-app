const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    order_id: { 
      type: String, 
      required: true, 
      unique: true 
    },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // for multiple product selection
    products: [
      {
        product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        product_name: { type: String, required: true },
        quantity: { type: Number, required: true },
        approved_quantity: { type: Number, default: 0 },
        delivered_quantity: { type: Number, default: 0 },
        unit: { type: String },
        supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
        supplier_name: { type: String },
        supplier_price: { type: Number },
        reason_supplier_select: { type: String },
        reason_for_return: { type: String },
        file_for_return_reason: { type: String },
        document: { type: String },
        reminder_sent: { type: Boolean, default: false },
        
        status: {
          type: String,
          enum: [
            "Pending Review",
            "In Analysis",
            "Approved",
            "Not Approved",
            "Ordered",
            "In Transit",
            "Received",
            "Completed",
            "Issue (RMA)",
            "Cancelled",
            "Overdue Approval",
          ],
          default: "Pending Review"
        },

        status_history: [
          {
            status: { type: String, required: true },
            changed_by_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
            changed_by_name: { type: String, required: true },
            changed_at: { type: Date, default: Date.now },
            product_description: { type: String },
          }
        ],

        comments: [
          {
            _id: false,
            comment_id: {
              type: mongoose.Schema.Types.ObjectId,
              default: () => new mongoose.Types.ObjectId(),
            },
            user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

            message: { type: String, required: true },
            is_reply: { type: Boolean, default: false },
            reply_to: { type: mongoose.Schema.Types.ObjectId },
            likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
            created_at: { type: Date, default: Date.now },
          }
        ],

        public_comments: [
          {
            _id: false,
            comment_id: {
              type: mongoose.Schema.Types.ObjectId,
              default: () => new mongoose.Types.ObjectId(),
            },
            user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            user_name: String,
            user_image: String,
            message: { type: String, required: true },
            is_reply: { type: Boolean, default: false },
            reply_to: { type: mongoose.Schema.Types.ObjectId },
            likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
            created_at: { type: Date, default: Date.now },
          }
        ],

        private_comments: [
          {
            _id: false,
            comment_id: {
              type: mongoose.Schema.Types.ObjectId,
              default: () => new mongoose.Types.ObjectId(),
            },
            user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
            user_name: String,
            user_image: String,
            message: { type: String, required: true },
            is_reply: { type: Boolean, default: false },
            reply_to: { type: mongoose.Schema.Types.ObjectId },
            likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
            created_at: { type: Date, default: Date.now },
            product_id: { type: mongoose.Types.ObjectId, ref: "Product" },
          }
        ],

        reviews: [
          {
            _id: false,
            review_id: {
              type: mongoose.Schema.Types.ObjectId,
              default: () => new mongoose.Types.ObjectId(),
            },
            user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
            user_name: { type: String, required: true },
            user_image: String,
            rating: { type: Number, required: true, min: 0, max: 5 },
            message: { type: String, required: true },
            created_at: { type: Date, default: Date.now },
          }
        ],
      }
    ],

    orderStatus: {
      type: String,
      enum: [
        "Pending Assignment",
        "In Analysis",
        "Partially Approved",
        "Approved",
        "Ordered",
        "Not Approved",
        "In Processing",
        "Completed",
        "Issue (RMA)",
        "Cancelled",
      ],
      default: "Pending Assignment"
    },
    company_name: { 
      type: String, 
      required: true 
    },

    department_name: { 
      type: String, 
      required: true 
    },

    center_cost_name: { 
      type: String, 
      required: true 
    },
    
    order_description: { 
      type: String 
    },
    
    price: {
      type: Number 
    },
    
    order_price: { 
      type: Number 
    },
    
    location: { 
      type: String 
    },
    
    image: { 
      type: String 
    },
    
    comment: { 
      type: String 
    },

    shipped_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    reminder_sent: {
      type: Boolean,
      default: false,
    },
    
    status_updated_at: {
      type: Date,
      default: Date.now,
    },
    
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    
    order_approval: {
      type: String,
      enum: ["Approve", "Not Approve"],
      default: "Not Approve",
    },
    
    previous_price: { 
      type: Number 
    },
    
    updated_price: { 
      type: Number 
    },
    
    urgent: { 
      type: Boolean, 
      default: false 
    },
    
    change_location: { 
      type: Boolean, 
      default: false 
    },
    
    reason_for_urgency: { 
      type: String 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);