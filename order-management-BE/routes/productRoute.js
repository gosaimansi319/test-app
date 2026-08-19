const express = require('express');
const { createProduct, getAllProducts, getSingleProduct, deleteProduct, deletePaginatedProducts, updateProduct, getUpdatedPriceProducts, getAllProductsWithoutPagination } = require('../controllers/admin/productController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/authorizeRole');
const createUploader = require('../middleware/upload');
const checkPermission = require('../middleware/checkPermission');
const router = express.Router();

const uploadProduct = createUploader('uploads/product');

router.use(authMiddleware);

router.post('/create', checkPermission('product', 'create'), uploadProduct.single('file'), createProduct);
router.put('/update/:productId', checkPermission('product', 'update'), uploadProduct.single('file'), updateProduct);
router.get('/', checkPermission('product', 'read'), uploadProduct.single('file'), getAllProducts);
router.get('/products-data', checkPermission('product', 'read'), uploadProduct.single('file'), getAllProductsWithoutPagination);
router.get("/updated-prices/:productId", getUpdatedPriceProducts);
router.get('/:id', checkPermission('product', 'read'), uploadProduct.single('file'), getSingleProduct);
router.delete('/delete/:productId', checkPermission('product', 'delete'), deleteProduct);
router.delete("/delete-all", checkPermission('product', 'delete'), deletePaginatedProducts);

module.exports = router;
