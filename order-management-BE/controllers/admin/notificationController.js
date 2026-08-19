// controllers/notificationController.js
const Notification = require('../../models/Notification');
const Order = require('../../models/Order');
const User = require('../../models/User');

// Create notification
const createNotification = async ({ to, from, message, type, relatedOrderId, orderSnapshot, productSnapshot }) => {
  if (!orderSnapshot && relatedOrderId) {
    const order = await Order.findById(relatedOrderId);
    if (order) {
      const updatedByUser = await User.findById(from);

      orderSnapshot = {
        order_id: order.order_id,
        orderStatus: order.orderStatus,
        order_description: order.order_description,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        updated_date: order.updatedAt.toISOString().split('T')[0],
        updated_time: order.updatedAt.toISOString().split('T')[1].split('.')[0],
        updated_by: updatedByUser ? `${updatedByUser.first_name} ${updatedByUser.last_name}` : "Unknown"
      };
    }
  }

  if (productSnapshot && from) {
    const updatedByUser = await User.findById(from);

    const now = new Date();
    productSnapshot.createdAt = now;
    productSnapshot.updatedAt = now;
    productSnapshot.updated_date = now.toISOString().split("T")[0];
    productSnapshot.updated_time = now.toISOString().split("T")[1].split(".")[0];
    productSnapshot.updated_by = updatedByUser
      ? `${updatedByUser.first_name} ${updatedByUser.last_name}`
      : "Unknown";
  }
  
  return await Notification.create({
    to,
    from,
    message,
    type,
    relatedOrderId,
    orderSnapshot,
    productSnapshot
  });
};

// Fetch notifications for admins
const getAdminNotifications = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const normalizedStatus = status?.toLowerCase();
    const pageNum = Math.max(parseInt(page), 1);
    const limitNum = Math.min(Math.max(parseInt(limit), 1), 100);
    const skip = (pageNum - 1) * limitNum;

    // Build query filter
    const filter = { to: req.user._id };
    if (normalizedStatus) {
      filter['relatedOrderId.status'] = normalizedStatus;
    }

    // Count total filtered notifications
    const totalItems = await Notification.countDocuments(filter);

    if (totalItems === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'No notifications available',
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

    // Fetch paginated notifications with order populated
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('relatedOrderId');

    // Format notification data
    const data = notifications.map((notification) => {
      const relatedOrder = notification.relatedOrderId;
      const snapshot = notification.productSnapshot;
      const isValidProductSnapshot =
        snapshot &&
        typeof snapshot === "object" &&
        Object.keys(snapshot).some((key) => snapshot[key] !== undefined && snapshot[key] !== null);

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

    res.status(200).json({
      status: 'success',
      message: 'Notifications fetched successfully',
      status_code: 200,
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total_items: totalItems,
        total_pages: Math.ceil(totalItems / limitNum),
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching notifications',
      status_code: 500,
      error: err.message,
      data: [],
    });
  }
};

// Get count of unread notification
const getUnreadNotificationCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    const lastCheck = user.lastNotificationCheck;

    const filter = {
      to: userId,
      isRead: false
    };

    // Optional: only count notifications after last check
    if (lastCheck) {
      filter.createdAt = { $gt: lastCheck };
    }

    const count = await Notification.countDocuments(filter);

    if (count === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'No unread notifications found',
        status_code: 200,
        data: {
          unreadCount: count
        }
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Unread notifications count fetched',
      status_code: 200,
      data: {
        unreadCount: count
      }
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: 'Error fetching unread notification count',
      status_code: 500,
      error: err.message
    });
  }
};

// Mark one notification as read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        status: 'fail',
        message: 'Notification not found',
        status_code: 404,
        data: []
      });
    }

    // Check if the user owns the notification or is an admin
    if (notification.to.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'Access denied',
        status_code: 403,
        data: []
      });
    }

    notification.isRead = true;
    await notification.save();

    // Check if there are any unread notifications left
    const unreadCount = await Notification.countDocuments({
      to: req.user._id,
      isRead: false
    });

    // If none left, update lastNotificationCheck
    if (unreadCount === 0) {
      await User.findByIdAndUpdate(req.user._id, {
        lastNotificationCheck: new Date()
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Notification marked as read',
      status_code: 200,
      data: {
        id: notification._id,
        isRead: true
      }
    });

  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: 'Error updating notification',
      status_code: 500,
      error: err.message
    });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const updated = await Notification.updateMany(
      { to: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    // If no notifications were updated
    if (updated.modifiedCount === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'No unread notifications found to mark as read',
        status_code: 200,
        data: { modifiedCount: 0 }
      });
    }

    await User.findByIdAndUpdate(req.user._id, {
      lastNotificationCheck: new Date()
    });

    return res.status(200).json({
      status: 'success',
      message: 'All unread notifications marked as read',
      status_code: 200,
      data: {
        modifiedCount: updated.modifiedCount
      }
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: 'Error updating notifications',
      status_code: 500,
      error: err.message
    });
  }
};

module.exports = { 
  createNotification, 
  markAsRead, 
  markAllAsRead,
  getAdminNotifications, 
  getUnreadNotificationCount 
}