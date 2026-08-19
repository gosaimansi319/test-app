const express = require('express');
const { createOrder, getAllOrders, getOrderById, updateOrder, deleteOrder, deletePaginatedOrders, replyToOrderComment, toggleLikeCommentForAdmin, getPrivateOrderComments, addPrivateOrderComment, likePrivateComment, getPriceUpdatedOrders, getOrdersByProductId } = require('../controllers/admin/orderController');
const { createUserOrder, getUserOrders, getUserOrderById, updateUserOrder, deleteUserOrder, deleteAllUserOrders, cancelUserOrder, returnOrder, addOrderComment, toggleLikeComment, addPublicOrderComment, getPublicOrderComments, togglePublicCommentLike, addOrderReview, getOrderReviews, updateOrderReview, deleteOrderReview, getProductReviews } = require('../controllers/user/userOrderController');
const authMiddleware = require('../middleware/authMiddleware');
const createUploader = require('../middleware/upload');
const checkPermission = require('../middleware/checkPermission');
const authorizeRole = require('../middleware/authorizeRole');
const router = express.Router();

const uploadOrder = createUploader("uploads/order");
const uploadOrder1 = createUploader("uploads/order_returns");

// user panel
router.post("/user-create", authMiddleware, uploadOrder.single("image"), createUserOrder);
router.get("/user-orders", authMiddleware, authorizeRole(["user"]), getUserOrders);
router.get("/user-orders/:id", authMiddleware, authorizeRole(["user"]), getUserOrderById);
router.put('/user-orders/:id', authMiddleware, uploadOrder.any(), updateUserOrder);
router.patch('/user-orders/cancel/:id', authMiddleware, cancelUserOrder);
router.post('/user-orders/return/:orderId/:productId', authMiddleware, uploadOrder1.single('file_for_return_reason'), returnOrder);
router.delete('/user-orders/delete/:id', authMiddleware, deleteUserOrder);
router.delete('/user-orders/delete-all', authMiddleware, deleteAllUserOrders);

// cancelled order comment(for user)
router.post('/user-orders/:orderId/comments', authMiddleware, addOrderComment);
router.patch('/user-orders/:orderId/comments/:commentId/like', authMiddleware, toggleLikeComment);

// public comment section
router.post('/public-comment/:orderId/:productId', authMiddleware, addPublicOrderComment);
router.get('/public-comments/:orderId/:productId', getPublicOrderComments);
router.patch('/:orderId/public-comments/:commentId/like/:productId', authMiddleware, togglePublicCommentLike);

// private comment section(for admin and manager)
router.post('/private-comments/:orderId', authMiddleware, addPrivateOrderComment);
router.get('/private-comments/:orderId', authMiddleware, getPrivateOrderComments);
router.patch('/:orderId/private-comments/:commentId/like', authMiddleware, likePrivateComment);


// Review section
router.post('/user-orders/review/:orderId/:productId', authMiddleware, addOrderReview);
router.get('/user-orders/review/:orderId/:productId', authMiddleware, getOrderReviews);
router.put('/user-orders/:orderId/review/:reviewId', authMiddleware, updateOrderReview);
router.delete('/user-orders/:orderId/review/:reviewId', authMiddleware, deleteOrderReview);
router.get('/user-orders/commentbyproduct/:productId', authMiddleware, getProductReviews);

// admin panel
router.post('/create', authMiddleware, checkPermission('order', 'create'), uploadOrder.single("image"), createOrder);
router.get('/', authMiddleware, checkPermission('order', 'read'), getAllOrders);
router.get("/orders-by-product/:productId", authMiddleware, getOrdersByProductId);

router.get('/:id', authMiddleware, checkPermission('order', 'read'), getOrderById);
router.put('/update/:id', authMiddleware, checkPermission('order', 'update'), uploadOrder.single("image"), updateOrder);
router.delete('/delete/:id', authMiddleware, checkPermission('order', 'delete'), deleteOrder);
router.delete('/delete-all', authMiddleware, checkPermission('order', 'delete'), deletePaginatedOrders);

// cancelled order comment(for admin)
router.post('/:orderId/reply-comment', authMiddleware, replyToOrderComment);
router.patch('/:orderId/comments/:commentId/like', authMiddleware, toggleLikeCommentForAdmin);

module.exports = router;
