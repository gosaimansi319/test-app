const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const { deleteCenterCost, updateCenterCost, getCenterCostById, getAllCenterCosts, createCenterCost, getCenterCostsByDepartment } = require("../controllers/admin/centercostController");
const authorizeRole = require("../middleware/authorizeRole");

const router = express.Router();

router.use(authMiddleware);

router.post("/create", authorizeRole(['admin', 'manager']), createCenterCost);
router.get("/", getAllCenterCosts);
router.get("/:id", getCenterCostById);
router.get('/by-departments/:department_id', getCenterCostsByDepartment);
router.put("/update/:id", authorizeRole(['admin', 'manager']), updateCenterCost);
router.delete("/delete/:id", authorizeRole(['admin']), deleteCenterCost);

module.exports = router;
