const express = require("express");
const router = express.Router();
const { createRole, updateRole, deleteRole, getAllRoles, getRoleById, getAllRoleIds } = require("../controllers/admin/roleController");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRole = require("../middleware/authorizeRole");

// Middlewares
router.use(authMiddleware);

router.post("/create", authorizeRole(['admin']), createRole);
router.get("/", authorizeRole(['admin', 'manager']), getAllRoles);
router.get("/role/:role_id", authorizeRole(['admin', 'manager']), getRoleById);
router.get("/ids", authorizeRole(['admin', 'manager']), getAllRoleIds);
router.put("/update/:role_id", authorizeRole(['admin']), updateRole);
router.delete("/delete/:role_id",  authorizeRole(['admin']), deleteRole);

module.exports = router;
