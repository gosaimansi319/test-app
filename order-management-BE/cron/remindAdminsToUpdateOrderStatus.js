// const cron = require('node-cron');
// const Order = require('../models/Order');
// const User = require('../models/User');
// const { createNotification } = require('../controllers/admin/notificationController');

// const sendRepeatingRemindersForStuckOrders = async () => {
//   try {
//     const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours

//     // Find orders stuck in specific statuses and not recently updated
//     const stuckOrders = await Order.find({
//       status: { $in: ["Pending Review", "In Analysis", "Approved", "Not Approved", "Ordered", "In Transit", "Received", "Completed", "Issue (RMA)", "Cancelled",] },
//       updatedAt: { $lte: twoDaysAgo }
//     });

//     if (!stuckOrders.length) return;

//     // Get all admins and managers
//     const users = await User.find().populate('role_id');
//     const adminUsers = users.filter(user => {
//       const role = user.role_id?.name?.toLowerCase();
//       return role === 'admin' || role === 'manager';
//     });

//     for (const order of stuckOrders) {
//       // Skip if already marked as "Overdue Approval"
//       if (order.status === 'Overdue Approval') continue;

//       // Prepare status update and history
//       const user = await User.findById(order.user_id).select('first_name last_name');

//       const changedByName = user
//         ? `${user.first_name} ${user.last_name}`
//         : 'System';

//       // Push status history
//       order.status_history.push({
//         status: 'Overdue Approval',
//         changed_by_id: order.user_id,
//         changed_by_name: changedByName,
//         changed_at: new Date()
//       });

//       // Update order status and timestamp
//       order.status = 'Overdue Approval';
//       order.status_updated_at = new Date();

//       // Notification snapshot
//       const orderSnapshot = {
//         status: order.status,
//         order_description: order.order_description,
//         createdAt: order.createdAt,
//         updatedAt: order.updatedAt,
//         updated_date: order.updatedAt.toISOString().split("T")[0],
//         updated_time: order.updatedAt.toISOString().split("T")[1].split(".")[0],
//         updated_by: changedByName,
//       };

//       // Send notifications to each admin/manager
//       for (const admin of adminUsers) {
//         await createNotification({
//           to: admin._id,
//           from: order.user_id,
//           message: `Reminder: Order "${order.order_name}" is still in "${order.status}" status. Please review and take action.`,
//           type: 'order_status_reminder',
//           relatedOrderId: order._id,
//           orderSnapshot
//         });
//       }
//       await order.save();
//     }

//   } catch (err) {
//     console.error('[Reminder Cron] Error:', err);
//   }
// };

// // Run every hour at minute 0
// cron.schedule('0 * * * *', sendRepeatingRemindersForStuckOrders);

const cron = require('node-cron');
const Order = require('../models/Order');
const User = require('../models/User');
const { createNotification } = require('../controllers/admin/notificationController');

const stuckStatuses = [ 
  "Pending Review", "In Analysis", "Approved", "Not Approved",
  "Ordered", "In Transit", "Received", "Issue (RMA)"
];

const sendRepeatingRemindersForStuckProducts = async () => {
  console.log(`[Reminder Cron] Job started at ${new Date().toISOString()}`);

  try {
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const orders = await Order.find();
    console.log(`[Reminder Cron] ${orders.length} orders found.`);

    const users = await User.find().populate('role_id');
    const adminUsers = users.filter(user => {
      const role = user.role_id?.name?.toLowerCase();
      return role === 'admin' || role === 'manager';
    });
    console.log(`[Reminder Cron] ${adminUsers.length} admin/manager users found.`);

    let totalRemindersSent = 0;

    for (const order of orders) {
      let isOrderModified = false;

      for (const product of order.products) {
        if (!stuckStatuses.includes(product.status)) continue;

        const lastStatusUpdate = product.status_history?.length
          ? product.status_history[product.status_history.length - 1].changed_at
          : order.updatedAt;

        if (new Date(lastStatusUpdate) > twoDaysAgo) continue;
        if (product.reminder_sent) continue;

        const user = await User.findById(order.user_id).select('first_name last_name');
        const changedByName = user ? `${user.first_name} ${user.last_name}` : 'System';

        // Mark reminder as sent
        product.reminder_sent = true;
        isOrderModified = true;

        // Build product snapshot
        const now = new Date();
        const productSnapshot = {
          product_name: product.product_name,
          status: product.status,
          order_id: order.order_id,
          order_description: order.order_description,
          createdAt: now,
          updatedAt: now,
          updated_date: now.toISOString().split("T")[0],
          updated_time: now.toISOString().split("T")[1].split(".")[0],
          updated_by: changedByName
        };

        // Send notifications
        for (const admin of adminUsers) {
          await createNotification({
            to: admin._id,
            from: order.user_id,
            message: `Reminder: Product "${product.product_name}" in Order "${order.order_id}" is still in "${product.status}" status for over 48 hours. Please review it.`,
            type: 'product_status_reminder',
            relatedOrderId: order._id,
            productSnapshot
          });

          console.log(`[Reminder Cron] Sent reminder to ${admin.email || admin._id} for product "${product.product_name}" (Status: ${product.status}) in order "${order.order_id}"`);
        }

        totalRemindersSent++;
      }

      if (isOrderModified) {
        await order.save();
      }
    }

    console.log(`[Reminder Cron] Job finished. Total reminders sent: ${totalRemindersSent}`);
  } catch (err) {
    console.error('[Reminder Cron] Error:', err);
  }
};

// Run every hour
cron.schedule('0 * * * *', sendRepeatingRemindersForStuckProducts);
