const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Product = require("./Product");
const Order = require("./Order");

const userSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
    },

    last_name: {
      type: String,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    image: {
      type: String,
    },

    phone_number: {
      type: String,
    },

    company: {
      type: String,
      required: true,
    },

    department: {
      type: String,
    },

    center_cost: {
      type: String,
    },

    address: {
      type: String,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    role_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },

    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    user_id: {
      type: String,
      unique: true,
      required: true,
    },

    lastNotificationCheck: {
      type: Date,
      default: null,
    },
    deactivated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status_updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Hide password in all JSON outputs
userSchema.set("toJSON", {
  transform: function (doc, ret, options) {
    delete ret.password;
    return ret;
  },
});

userSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.status_updated_at = new Date();
  }
  next();
});

userSchema.pre("findOneAndDelete", async function (next) {
  try {
    const doc = await this.model.findOne(this.getFilter());

    if (doc) {
      await Product.deleteMany({ user_id: doc._id });

      await Order.deleteMany({ user_id: doc._id });
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("User", userSchema);
