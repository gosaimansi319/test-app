const express = require('express');
const router = express.Router();
const { getUserOrders, getRecentPublicOrderComments, getOrderStatusSummary, getWeeklyUserActivityStats, getOrderStatusByDay, getAllRecentUsers, getOrderSummaryStats, getOrderCountsByCompanyDeptCostCentre, getResolvedOrdersByManager, getOrderCount } = require("../controllers/admin/dashboardController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get("/recent-orders", getUserOrders);
router.get('/recent-comments', getRecentPublicOrderComments);
router.get('/orders-counts', getOrderStatusSummary);
router.get('/weekly-activity', getWeeklyUserActivityStats);
router.get('/weekly-order-count', getOrderStatusByDay);
router.get('/recent-users', getAllRecentUsers);
router.get('/orders-status', getOrderSummaryStats);
router.get('/CDC_details', getOrderCountsByCompanyDeptCostCentre);
router.get('/manager_orders_details', getResolvedOrdersByManager);
router.get('/orders-stats', getOrderCount);

module.exports = router;