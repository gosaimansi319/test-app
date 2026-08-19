const Order = require("../../models/Order");
const Product = require("../../models/Product");
const Role = require("../../models/Role");
const Supplier = require("../../models/Supplier");
const User = require("../../models/User");

// Create role
const createRole = async (req, res) => {
  try {
    const { name, permissions, status } = req.body;

    // Reject if permissions array is empty or not provided
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({
        status: "fail",
        message: "Permissions are required to create a role.",
        status_code: 400,
        data: {},
      });
    }

    let assignedPermissions = permissions.map((perm) => {
      let updatedActions = perm.actions;
      if (updatedActions.includes("all")) {
        updatedActions = ["create", "read", "update", "delete"];
      }
      return {
        module: perm.module,
        actions: updatedActions,
      };
    });

    const role = new Role({
      name,
      permissions: assignedPermissions,
      status: status || 'Active',
    });

    await role.save();

    res.status(201).json({
      status: "success",
      message: "Role created successfully",
      data: role,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error creating role: " + err.message,
      data: {},
    });
  }
};

// Update role
const updateRole = async (req, res) => {
  const { role_id } = req.params;

  const { name, permissions } = req.body;

  try {
    const role = await Role.findById(role_id);

    if (!role) {
      return res.status(404).json({
        status: "fail",
        message: "Role not found",
        status_code: 404,
        data: {},
      });
    }

    // If permissions includes "all", update permissions to full access
    let updatedPermissions = permissions.map((perm) => {
      let updatedActions = perm.actions;
      if (updatedActions.includes("all")) {
        updatedActions = ["create", "read", "update", "delete"];
      }
      return {
        module: perm.module,
        actions: updatedActions,
      };
    });

    role.name = name || role.name;
    role.permissions = updatedPermissions;

    await role.save();

    res.status(200).json({
      status: "success",
      message: "Role updated successfully",
      data: role,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error updating role: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

// Delete role
const deleteRole = async (req, res) => {
  const { role_id } = req.params;

  try {
    const role = await Role.findById(role_id);

    if (!role) {
      return res.status(404).json({
        status: "fail",
        message: "Role not found",
        status_code: 404,
        data: {},
      });
    }

    // Find all users with this role
    const users = await User.find({ role_id });
    const userIds = users.map(user => user._id);

    await Product.deleteMany({ user_id: { $in: userIds } });
    await Order.deleteMany({ user_id: { $in: userIds } });

    const supplierIds = await Order.find({ user_id: { $in: userIds } }).distinct('supplier_id');
    
    await Supplier.deleteMany({ _id: { $in: supplierIds } });
    await User.deleteMany({ role_id });
    await Role.deleteOne({ _id: role_id });

    res.status(200).json({
      status: "success",
      message: "Role deleted successfully",
      data: {},
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error deleting role: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

// Get all roles
const getAllRoles = async (req, res) => {
  try {
    const { name } = req.query;

    const filter = {};
    if (name) {
      filter.name = { $regex: new RegExp(name, "i") };
    }
    const roles = await Role.find(filter);

    res.status(200).json({
      status: "success",
      message: "Roles fetched successfully",
      data: roles,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error fetching roles: " + err.message,
      data: {},
    });
  }
};

// Get a single role by ID
const getRoleById = async (req, res) => {
  const { role_id } = req.params;
  
  try {
    const role = await Role.findById(role_id);

    if (!role) {
      return res.status(404).json({
        status: "fail",
        message: "Role not found",
        status_code: 404,
        data: {},
      });
    }

    res.status(200).json({
      status: "success",
      message: "Role fetched successfully",
      data: role,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error fetching role: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

// Get all role IDs
const getAllRoleIds = async (req, res) => {
  try {
    const roleIds = await Role.find({}, { _id: 1, name: 1 });

    res.status(200).json({
      status: "success",
      message: "Role IDs fetched successfully",
      status_code: 200,
      data: roleIds,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error fetching role IDs: " + err.message,
      data: [],
    });
  }
};

module.exports = { 
  createRole, 
  updateRole, 
  deleteRole, 
  getAllRoles, 
  getRoleById, 
  getAllRoleIds 
};