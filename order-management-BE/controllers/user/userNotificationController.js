const Notification = require("../../models/Notification");

// Get notifications for a user
const getUserNotifications = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    const normalizedStatus = status?.toLowerCase();
    const pageNum = Math.max(parseInt(page), 1);
    const limitNum = Math.min(Math.max(parseInt(limit), 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const filter = { to: req.user._id };
    if (type) {
      filter.type = type;
    }

    // Count total notifications for pagination
    const totalItems = await Notification.countDocuments(filter);

    if (totalItems === 0) {
      return res.status(200).json({
        status: "success",
        message: "No notifications available",
        status_code: 200,
        data: [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total_items: 0,
          total_pages: 0,
        },
      });
    }

    // Fetch notifications paginated with populated order
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("relatedOrderId");

    // Filter by related order status if needed
    const filtered = normalizedStatus
      ? notifications.filter(
          (notification) =>
            notification.relatedOrderId?.status?.toLowerCase() === normalizedStatus
        )
      : notifications;

    if (filtered.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "No notifications found for this user",
        status_code: 404,
        data: [],
      });
    }

    // Format notifications
    const data = filtered.map((notification) => {
      const relatedOrder = notification.relatedOrderId;
      const snapshot = notification.productSnapshot;
      const isValidProductSnapshot =
        snapshot && Object.keys(snapshot).some((key) => snapshot[key] !== undefined && snapshot[key] !== null);

      const formatted = {
        _id: notification._id,
        message: notification.message,
        type: notification.type,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
        relatedOrder:
          notification.orderSnapshot || relatedOrder
            ? {
                order_id: relatedOrder?.order_id || null,
                status: relatedOrder?.orderStatus || null,
                order_description: relatedOrder?.order_description || null,
                createdAt: relatedOrder?.createdAt || null,
                updatedAt: relatedOrder?.updatedAt || null,
              }
            : null,
      };
      if (isValidProductSnapshot) {
        formatted.productSnapshot = snapshot;
      }

      return formatted;
    });

    // Calculate pagination data for filtered results
    const totalPages = Math.ceil(filtered.length / limitNum);

    return res.status(200).json({
      status: "success",
      message: "Notifications fetched successfully",
      status_code: 200,
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total_items: filtered.length,
        total_pages: totalPages,
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Error fetching notifications",
      status_code: 500,
      error: err.message,
      data: [],
    });
  }
};

module.exports = { getUserNotifications }