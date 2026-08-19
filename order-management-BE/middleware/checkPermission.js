const User = require("../models/User");
const Role = require("../models/Role");

const checkPermission = (moduleName, action) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id).populate("role_id");

      if (!user || !user.role_id) {
        return res.status(403).json({
          status: "fail",
          message: "Access denied. No role assigned.",
        });
      }

      const role = await Role.findById(user.role_id);

      const hasPermission = role.permissions.some((perm) => {
        return (
          perm.module === moduleName &&
          perm.actions.includes(action)
        );
      });

      if (!hasPermission) {
        return res.status(403).json({
          status: "fail",
          message: `You don't have permission to ${action} ${moduleName}`,
        });
      }

      next();
    } catch (err) {
      return res.status(500).json({
        status: "error",
        message: "Permission check failed: " + err.message,
      });
    }
  };
};

module.exports = checkPermission;
