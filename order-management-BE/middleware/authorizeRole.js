const Role = require('../models/Role');

module.exports = function (requiredRoles = [], requiredPermission = "") {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({
        status: "fail",
        message: "Not authenticated",
        status_code: 403,
        data: {},
      });
    }

    try {
      const role = await Role.findById(req.user.role_id);

      if (!role) {
        return res.status(403).json({
          status: "fail",
          message: "Role not found",
          status_code: 403,
          data: {},
        });
      }

      const userRoleName = role.name?.toLowerCase();
      const normalizedRequiredRoles = requiredRoles.map(r => r.toLowerCase());

      if (requiredRoles.length > 0 && !normalizedRequiredRoles.includes(userRoleName)) {
        return res.status(403).json({
          status: "fail",
          message: "Forbidden: You are not authorized to access this resource",
          status_code: 403,
          data: {},
        });
      }
      
      if (requiredPermission && !role.permissions.includes(requiredPermission)) {
        return res.status(403).json({
          status: "fail",
          message: `Forbidden: You don't have the '${requiredPermission}' permission`,
          status_code: 403,
          data: {},
        });
      }

      next();
    } catch (err) {
      return res.status(500).json({
        status: "fail",
        message: "Error checking role permissions: " + err.message,
        status_code: 500,
        data: {},
      });
    }
  };
};
