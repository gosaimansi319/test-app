const express = require("express");
const {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/admin/departmentController");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRole = require("../middleware/authorizeRole");

const router = express.Router();

router.use(authMiddleware);

router.post("/create", authorizeRole(['admin', 'manager']), createDepartment);
router.get("/", getAllDepartments);
router.get("/:id", getDepartmentById);
router.put("/update/:id", authorizeRole(['admin', 'manager']), updateDepartment);
router.delete("/delete/:id", authorizeRole(['admin']), deleteDepartment);

module.exports = router;
