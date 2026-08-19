// models/Notification.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    to: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },

    from: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    },

    message: { 
      type: String, 
      required: true 
    },

    type: {
      type: String,
      enum: [
        "order_created",
        "order_status_updated",
        "order_returned",
        "order_comment",
        "order_comment_reply",
        "order_status_reminder",
        "general",
        "account_status",
        "product_returned",
        "order_completed",
        "product_status_reminder",
        "order_cancelled",
        "order_updated",
      ],
      default: "general",
    },

    relatedOrderId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Order" 
    },

    orderSnapshot: {
      status: String,
      order_description: String,
      createdAt: Date,
      updatedAt: Date,
      updated_date: String,
      updated_time: String,
      updated_by: String,
    },

    productSnapshot: {
      product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      product_name: String,
      quantity: Number,
      unit: String,
      status: String,
      message: String,

      createdAt: Date,
      updatedAt: Date,
      updated_date: String,
      updated_time: String,
      updated_by: String,
    },
    
    isRead: { 
      type: Boolean, 
      default: false 
    },
  },
  { 
    timestamps: true 
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
