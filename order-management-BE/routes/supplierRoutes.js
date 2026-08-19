const express = require('express');
const { createSupplier, getSuppliers, getSupplierById, updateSupplier, deleteSupplier, deletePaginatedSuppliers } = require('../controllers/admin/supplierController');
const authorizeRole = require('../middleware/authorizeRole');
const authMiddleware = require('../middleware/authMiddleware');
const createUploader = require('../middleware/upload');
const router = express.Router();

const uploadProfile = createUploader('uploads/profile');

// Middlewares
router.use(authMiddleware);

router.post('/create', authorizeRole(['admin', 'manager']), uploadProfile.none(), createSupplier);
router.get('/', getSuppliers);
router.get('/:id', getSupplierById);
router.put('/update/:id', uploadProfile.none(), authorizeRole(['admin', 'manager']), updateSupplier);
router.delete('/delete/:id', authorizeRole(['admin']), deleteSupplier);
router.delete('/delete-all', authorizeRole(['admin']), deletePaginatedSuppliers);

module.exports = router;
