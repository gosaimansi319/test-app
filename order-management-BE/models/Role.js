const mongoose = require('mongoose');
const User = require('./User');

const permissionSchema = new mongoose.Schema({
  module: { type: String, required: true }, // 'product' or 'user'
  actions: [{ type: String }], // ['create', 'read', 'update', 'delete']
});

const roleSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true 
  },

  permissions: [permissionSchema],
  total_users: { 
    type: Number, 
    default: 0 
  },

  status: { 
    type: String, 
    enum: ['Active', 'Inactive'], 
    default: 'Active' 
  },
}, { timestamps: true });

roleSchema.pre('findOneAndDelete', async function (next) {
  try {
    const role = await this.model.findOne(this.getFilter());
    if (!role) return next();

    // Find users with this role
    const users = await User.find({ role_id: role._id });
    const userIds = users.map(u => u._id);

    // Delete related Products
    await Product.deleteMany({ user_id: { $in: userIds } });

    // Delete related Orders
    await Order.deleteMany({ user_id: { $in: userIds } });

    // Optionally delete suppliers if they are tied to users or orders
    // await Supplier.deleteMany({ created_by_user_id: { $in: userIds } });

    // Delete users
    await User.deleteMany({ role_id: role._id });

    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Role', roleSchema);
