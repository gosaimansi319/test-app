const express = require("express");
const {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
} = require("../controllers/admin/companyController");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRole = require("../middleware/authorizeRole");

const router = express.Router();

router.use(authMiddleware);

router.post("/create", authorizeRole(['admin', 'manager']), createCompany);
router.get("/", getAllCompanies);
router.get("/:id", getCompanyById);
router.put("/update/:id", authorizeRole(['admin', 'manager']), updateCompany);
router.delete("/delete/:id", authorizeRole(['admin']), deleteCompany);

module.exports = router;
