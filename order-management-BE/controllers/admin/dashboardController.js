const Order = require("../../models/Order");
const Product = require("../../models/Product");
const Role = require("../../models/Role");
const User = require("../../models/User");
const UserDailyStats = require("../../models/UserDailyStats");
const { generateSignedUrl } = require("../../utils/s3");
const moment = require("moment");

// Get Orders
const getUserOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const totalOrders = await Order.countDocuments();

    const orders = await Order.find({})
      .select("_id order_id order_description orderStatus createdAt updatedAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      status: "success",
      message: "Orders fetched successfully",
      status_code: 200,
      data: {
        orders,
        pagination: {
          total: totalOrders,
          page,
          limit,
          totalPages: Math.ceil(totalOrders / limit),
        },
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch user orders",
      status_code: 500,
      error: err.message,
      data: {},
    });
  }
};

// Get Orders status
const getOrderStatusSummary = async (req, res) => {
  try {
    let { start_date, end_date, filter_type } = req.query;

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD

    let start, end;
    const matchFilter = {};

    if (start_date && end_date) {
      start = new Date(`${start_date}T00:00:00.000Z`);
      end = new Date(`${end_date}T23:59:59.999Z`);
    } else if (filter_type) {
      switch (filter_type) {
        case "today":
          start = new Date(`${todayStr}T00:00:00.000Z`);
          end = new Date(`${todayStr}T23:59:59.999Z`);
          break;

        case "week": {
          const day = now.getUTCDay();
          const diffToMonday = day === 0 ? -6 : 1 - day;
          const monday = new Date(now);
          monday.setUTCDate(now.getUTCDate() + diffToMonday);

          const mondayStr = monday.toISOString().split("T")[0];
          start = new Date(`${mondayStr}T00:00:00.000Z`);
          end = new Date(`${todayStr}T23:59:59.999Z`);
          break;
        }

        case "month":
          start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
          end = new Date(`${todayStr}T23:59:59.999Z`);
          break;

        case "year":
          start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
          end = new Date(`${todayStr}T23:59:59.999Z`);
          break;

        default:
          return res.status(400).json({
            status: "fail",
            message: "Invalid filter_type. Use: today, week, month, or year.",
            status_code: 400,
            data: {},
          });
      }
    } else if (start_date) {
      start = new Date(`${start_date}T00:00:00.000Z`);
      end = new Date(`${start_date}T23:59:59.999Z`);
    } else {
      // Default: last 7 days
      end = new Date(`${todayStr}T23:59:59.999Z`);
      start = new Date(end);
      start.setUTCDate(end.getUTCDate() - 6);
      start.setUTCHours(0, 0, 0, 0);
    }

    matchFilter.createdAt  = { $gte: start, $lte: end };

    const statusCounts = await Order.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 }
        }
      }
    ]);

    const allStatuses = [
      "Pending Assignment",
      "In Analysis",
      "Partially Approved",
      "Approved",
      "Ordered",
      "Not Approved",
      "In Processing",
      "Completed",
      "Issue (RMA)",
      "Cancelled"
    ];

    const summary = {};
    allStatuses.forEach(status => {
      summary[status] = 0;
    });

    statusCounts.forEach(entry => {
      if (entry._id && summary.hasOwnProperty(entry._id)) {
        summary[entry._id] = entry.count;
      }
    });

    const total_orders = Object.values(summary).reduce((sum, val) => sum + val, 0);
    const total_orders_overall = await Order.countDocuments();

    res.status(200).json({
      status: "success",
      message: "Order status summary",
      status_code: 200,
      data: {
        total_orders_overall,
        total_orders,
        status_summary: summary,
        ...(filter_type === "today"
          ? { date_range: { today: todayStr } }
          : start && end
          ? {
              date_range: {
                start_date: start.toISOString(),
                end_date: end.toISOString(),
              },
            }
          : {}),
      }
    });

  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch order status summary",
      status_code: 500,
      error: err.message,
      data: {},
    });
  }
};

// Get Recent public comment by id only
const getRecentPublicOrderComments = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const orders = await Order.find({ "products.public_comments.0": { $exists: true } })
      .select("products order_name")
      .lean();

    const allComments = [];

    for (const order of orders) {
      for (const product of order.products) {
        if (!Array.isArray(product.public_comments)) continue;

        for (const comment of product.public_comments) {
          allComments.push({
            ...comment,
            order_id: order._id,
            order_name: order.order_name,
            product_id: product.product_id,
          });
        }
      }
    }

    if (allComments.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "No public comments found",
        status_code: 404,
        data: { comments: [] }
      });
    }

    // Sort by created_at (most recent first)
    allComments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Take the most recent N
    const recentComments = allComments.slice(0, limit);

    // Fetch user data in parallel
    const userIds = [...new Set(recentComments.map(c => c.user_id).filter(Boolean))];
    const users = await User.find({ _id: { $in: userIds } })
      .select("first_name last_name image")
      .lean();

    const userMap = {};
    for (const user of users) {
      userMap[user._id.toString()] = {
        name: `${user.first_name} ${user.last_name}`,
        image: user.image ? await generateSignedUrl(user.image) : null,
      };
    }

    // Enrich comments with user data
    const enrichedComments = recentComments.map(comment => ({
      ...comment,
      user_name: userMap[comment.user_id?.toString()]?.name || "Unknown User",
      user_image: userMap[comment.user_id?.toString()]?.image || null,
    }));

    return res.status(200).json({
      status: "success",
      message: `Recent ${enrichedComments.length} public comments.`,
      status_code: 200,
      data: {
        comments: enrichedComments
      },
    });

  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Server error",
      status_code: 500,
      data: { errors: [err.message] },
    });
  }
};

// Get User status activity day by day
// const getWeeklyUserActivityStats = async (req, res) => {
//   try {
//     const { start_date, end_date } = req.query;

//     let start, end;

//     if (start_date && end_date) {
//       // Use date-only format to avoid timezone shift
//       start = new Date(`${start_date}T00:00:00.000Z`);
//       end = new Date(`${end_date}T23:59:59.999Z`);
//     } else {
//       // Default: last 7 days including today
//       const today = new Date();
//       end = new Date(today.toISOString().split("T")[0] + "T23:59:59.999Z");

//       start = new Date(today);
//       start.setDate(start.getDate() - 6);
//       start = new Date(start.toISOString().split("T")[0] + "T00:00:00.000Z");
//     }

//     // Generate date list
//     const dates = [];
//     let current = new Date(start);

//     while (current <= end) {
//       const dateStr = current.toISOString().split("T")[0];
//       dates.push(dateStr);
//       current.setUTCDate(current.getUTCDate() + 1); // Use UTC to avoid local timezone shifts
//     }

//     // Build initial result map
//     const result = {};
//     dates.forEach(dateStr => {
//       result[dateStr] = { active: 0, inactive: 0 };
//     });

//     // Query for only these exact string dates (your schema stores `date` as string)
//     const stats = await UserDailyStats.find({ date: { $in: dates } });

//     stats.forEach(stat => {
//       if (result[stat.date]) {
//         result[stat.date] = {
//           active: stat.active,
//           inactive: stat.inactive,
//         };
//       }
//     });

//     // Send response
//     res.status(200).json({
//       status: "success",
//       message: `User status snapshot from ${dates[0]} to ${dates[dates.length - 1]}`,
//       status_code: 200,
//       data: dates.map(date => ({
//         date,
//         ...result[date],
//       })),
//     });

//   } catch (err) {
//     res.status(500).json({
//       status: "fail",
//       message: "Error fetching user status stats: " + err.message,
//       status_code: 500,
//       data: {}
//     });
//   }
// };

const getWeeklyUserActivityStats = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    let start, end;

    if (start_date && end_date) {
      start = new Date(`${start_date}T00:00:00.000Z`);
      end = new Date(`${end_date}T23:59:59.999Z`);
    } else {
      // Default to last 7 days
      end = new Date(todayStr + "T23:59:59.999Z");
      start = new Date(today);
      start.setUTCDate(today.getUTCDate() - 6);
      start = new Date(start.toISOString().split("T")[0] + "T00:00:00.000Z");
    }

    // Generate date list up to today (no future data)
    const dates = [];
    let current = new Date(start);
    while (current <= end && current <= new Date(todayStr + "T23:59:59.999Z")) {
      const dateStr = current.toISOString().split("T")[0];
      dates.push(dateStr);
      current.setUTCDate(current.getUTCDate() + 1);
    }

    // Build result map with zeroed values
    const result = {};
    dates.forEach(dateStr => {
      result[dateStr] = { active: 0, inactive: 0 };
    });

    // Fetch stats for those dates
    const stats = await UserDailyStats.find({ date: { $in: dates } });

    stats.forEach(stat => {
      if (result[stat.date]) {
        result[stat.date] = {
          active: stat.active,
          inactive: stat.inactive,
        };
      }
    });

    // Override today’s data with live status (if not already saved)
    if (!stats.find(stat => stat.date === todayStr) && result[todayStr]) {
      const realTimeActive = await User.countDocuments({ status: "active" });
      const realTimeInactive = await User.countDocuments({ status: "inactive" });

      result[todayStr] = {
        active: realTimeActive,
        inactive: realTimeInactive,
      };
    }

    const data = dates.map(date => ({
      date,
      ...result[date],
    }));

    res.status(200).json({
      status: "success",
      message: `User status snapshot from ${dates[0]} to ${dates[dates.length - 1]}`,
      status_code: 200,
      data
    });

  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error fetching user status stats: " + err.message,
      status_code: 500,
      data: {}
    });
  }
};

// without cron job 
// const getWeeklyUserActivityStats = async (req, res) => {
//   try {
//     const { startDate, endDate } = req.query;

//     let start, end;

//     if (startDate && endDate) {
//       start = new Date(startDate);
//       end = new Date(endDate);
//     } else {
//       end = new Date();
//       start = new Date();
//       start.setDate(end.getDate() - 6);
//     }

//     const startISO = new Date(start.setHours(0,0,0,0));
//     const endISO = new Date(end.setHours(23,59,59,999));

//     const dates = [];
//     for (let d = new Date(startISO); d <= endISO; d.setDate(d.getDate() + 1)) {
//       dates.push(d.toISOString().split("T")[0]);
//     }

//     const stats = await User.aggregate([
//       {
//         $match: {
//           createdAt: { $gte: startISO, $lte: endISO }
//         }
//       },
//       {
//         $group: {
//           _id: {
//             date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
//             status: "$status"
//           },
//           count: { $sum: 1 }
//         }
//       }
//     ]);

//     const result = {};
//     dates.forEach(date => {
//       result[date] = { active: 0, inactive: 0 };
//     });

//     stats.forEach(({ _id, count }) => {
//       if (result[_id.date]) {
//         result[_id.date][_id.status] = count;
//       }
//     });

//     res.status(200).json({
//       status: "success",
//       message: `User status counts dynamically calculated from ${dates[0]} to ${dates[dates.length - 1]}`,
//       status_code: 200,
//       data: result
//     });
//   } catch (err) {
//     res.status(500).json({
//       status: "fail",
//       message: "Error fetching dynamic user status stats: " + err.message,
//       status_code: 500,
//       data: {}
//     });
//   }
// };

// Get order status day wise
const getOrderStatusByDay = async (req, res) => {
  try {
    const { start_date, end_date, filter_type } = req.query;

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const todayStart = new Date(`${todayStr}T00:00:00.000Z`);
    const todayEnd = new Date(`${todayStr}T23:59:59.999Z`);

    let startDate, endDateFinal;

    if (start_date && end_date) {
      startDate = new Date(`${start_date}T00:00:00.000Z`);
      endDateFinal = new Date(`${end_date}T23:59:59.999Z`);
    } else if (filter_type) {
      switch (filter_type) {
        case "today":
          startDate = new Date(todayStart);
          endDateFinal = new Date(todayEnd);
          break;

        case "week": {
          const tempNow = new Date();
          const day = tempNow.getUTCDay(); // 0 = Sunday
          const diffToMonday = day === 0 ? -6 : 1 - day;
          const monday = new Date(tempNow);
          monday.setUTCDate(monday.getUTCDate() + diffToMonday);
          const mondayStr = monday.toISOString().split("T")[0];

          startDate = new Date(`${mondayStr}T00:00:00.000Z`);
          endDateFinal = new Date(todayEnd);
          break;
        }

        case "month":
          startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
          endDateFinal = new Date(todayEnd);
          break;

        case "year":
          startDate = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
          endDateFinal = new Date(todayEnd);
          break;

        default:
          return res.status(400).json({
            status: "fail",
            message: "Invalid filter_type. Use one of: today, week, month, year.",
            status_code: 400,
            data: {}
          });
      }
    } else {
      // Default: last 7 days
      endDateFinal = new Date(todayEnd);
      startDate = new Date();
      startDate.setUTCDate(endDateFinal.getUTCDate() - 6);
      startDate = new Date(startDate.toISOString().split("T")[0] + "T00:00:00.000Z");
    }

    // Ensure endDate is not in the future
    if (endDateFinal > todayEnd) endDateFinal = todayEnd;

    const statusList = [
      "Pending Assignment",
      "In Analysis",
      "Partially Approved",
      "Approved",
      "Ordered",
      "Not Approved",
      "In Processing",
      "Completed",
      "Issue (RMA)",
      "Cancelled"
    ];

    const result = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDateFinal
          }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            status: "$orderStatus"
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.date": 1 }
      }
    ]);

    // Prepare default structure
    const response = {};
    const cursor = new Date(startDate);
    const adjustedEnd = new Date(endDateFinal);

    while (cursor <= adjustedEnd) {
      const dateStr = cursor.toISOString().split("T")[0];
      response[dateStr] = {};
      statusList.forEach(status => {
        response[dateStr][status] = 0;
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    // Fill actual counts
    result.forEach(entry => {
      const date = entry._id.date;
      const status = entry._id.status;
      const count = entry.count;

      if (response[date] && statusList.includes(status)) {
        response[date][status] = count;
      }
    });

    res.status(200).json({
      status: "success",
      message: "Daily order status breakdown",
      status_code: 200,
      data: Object.entries(response).map(([date, statusCounts]) => ({
        date,
        ...statusCounts
      }))
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Failed to fetch daily order status",
      status_code: 500,
      error: err.message,
      data: {}
    });
  }
};

// Get all recent users
const getAllRecentUsers = async (req, res) => {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .populate("role_id", "name");

    const formattedUsers = await Promise.all(
      users.map(async (user) => {
        return {
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          image: user.image ? generateSignedUrl(user.image) : null,
          company: user.company || null,
          department: user.department || null,
          center_cost: user.center_cost || null,
          role: user.role_id?.name || null,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
      })
    );

    res.status(200).json({
      status: "success",
      message: "All users fetched successfully",
      status_code: 200,
      data: {
        users: formattedUsers,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error fetching users: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

// Get orders summary
const getOrderSummaryStats = async (req, res) => {
  try {
    const { filter_type = "year" } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    let startDate = null;
    let endDate = new Date(todayEnd);

    switch (filter_type) {
      case "today":
        startDate = new Date(today); // today 00:00
        break;
      case "week":
        const weekStart = new Date(today);
        const dayOfWeek = today.getUTCDay();
        weekStart.setUTCDate(weekStart.getUTCDate() - dayOfWeek);
        startDate = new Date(weekStart);
        break;
      case "month":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      case "all":
      default:
        // No date filter
        break;
    }

    // match filter
    const matchFilter = {};
    if (startDate) {
      matchFilter.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    // Total orders
    const totalOrders = await Order.countDocuments(matchFilter);

    // Aggregate total supplier_price sum from nested products array
    const totalSupplierPriceAgg = await Order.aggregate([
      { $match: matchFilter },
      { $unwind: "$products" },
      {
        $group: {
          _id: null,
          totalSupplierPrice: {
            $sum: {
              $toDouble: { $ifNull: ["$products.supplier_price", 0] },
            },
          },
        },
      },
    ]);
    const totalAmount = totalSupplierPriceAgg[0]?.totalSupplierPrice || 0;

    // Today’s orders (regardless of filter_type)
    const todayOrdersCount = await Order.countDocuments({
      createdAt: {
        $gte: today,
        $lte: todayEnd,
      },
    });

    // Resolved by managers
    const managerRole = await Role.findOne({ name: "manager" }).select("_id");
    let resolvedByManagers = 0;

    if (managerRole) {
      const managerUsers = await User.find({ role_id: managerRole._id }).select("_id");
      const managerUserIds = managerUsers.map((u) => u._id);

      const managerMatch = {
        updated_by: { $in: managerUserIds },
      };
      if (startDate) {
        managerMatch.createdAt = {
          $gte: startDate,
          $lte: endDate,
        };
      }

      resolvedByManagers = await Order.countDocuments(managerMatch);
    }


    res.status(200).json({
      status: "success",
      message: `Order summary stats${filter_type !== "all" ? ` for ${filter_type}` : ""} fetched successfully`,
      status_code: 200,
      data: {
        total_orders: totalOrders,
        total_amount: totalAmount,
        resolved_by_managers: resolvedByManagers,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error fetching order summary stats: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

// Get order by company, department and center cost
const getOrderCountsByCompanyDeptCostCentre = async (req, res) => {
  try {
    const { company_name, department_name, center_cost_name } = req.query;

    const matchFilter = {};
    if (company_name) matchFilter.company_name = company_name;
    if (department_name) matchFilter.department_name = department_name;
    if (center_cost_name) matchFilter.center_cost_name = center_cost_name;

    const pipeline = [];

    // Apply filters if provided
    if (Object.keys(matchFilter).length > 0) {
      pipeline.push({ $match: matchFilter });
    }

    // Group by company -> department -> cost centre
    pipeline.push(
      {
        $group: {
          _id: {
            company: "$company_name",
            department: "$department_name",
            cost_centre: "$center_cost_name",
          },
          order_count: { $sum: 1 },
        },
      },
      {
        $sort: { "order_count": -1 }
      }
    );

    const groupResults = await Order.aggregate(pipeline);

    // Transform flat results into nested format
    const structuredData = {};

    for (const item of groupResults) {
      const company = item._id.company;
      const department = item._id.department;
      const costCentre = item._id.cost_centre;
      const count = item.order_count;

      if (!structuredData[company]) {
        structuredData[company] = {
          company_name: company,
          company_total: 0,
          departments: {},
        };
      }

      if (!structuredData[company].departments[department]) {
        structuredData[company].departments[department] = {
          department_name: department,
          department_total: 0,
          center_costs: [],
        };
      }

      structuredData[company].departments[department].center_costs.push({
        center_cost_name: costCentre,
        count,
      });

      structuredData[company].departments[department].department_total += count;
      structuredData[company].company_total += count;
    }

    // Convert it to array format
    const finalData = Object.values(structuredData).map((company) => ({
      ...company,
      departments: Object.values(company.departments),
    }));

    res.status(200).json({
      status: "success",
      message: "Grouped order counts fetched successfully",
      status_code: 200,
      data: finalData,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error fetching grouped order counts: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

// Order that resolved(or updated) by manager
const getResolvedOrdersByManager = async (req, res) => {
  try {
    const { start_date, end_date, filter_type } = req.query;

    const managerRole = await Role.findOne({ name: "manager" }).select("_id");
    if (!managerRole) {
      return res.status(404).json({
        status: "fail",
        message: "Manager role not found",
        status_code: 404,
        data: {},
      });
    }

    // Find all users who are managers
    const managerUsers = await User.find({ role_id: managerRole._id }).select("_id");
    const managerUserIds = managerUsers.map((user) => user._id);

    // Determine date range
    let start, end;
    const now = new Date();

    if (start_date && end_date) {
      start = new Date(start_date);
      end = new Date(end_date);
    } else if (filter_type) {
      switch (filter_type) {
        case "day":
          start = new Date(now.setHours(0, 0, 0, 0));
          end = new Date(now.setHours(23, 59, 59, 999));
          break;

        case "week":
          {
            const day = now.getDay();
            const diffToMonday = (day === 0 ? -6 : 1 - day);
            start = new Date(now);
            start.setDate(now.getDate() + diffToMonday);
            start.setHours(0, 0, 0, 0);

            end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
          }
          break;

        case "month":
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          break;

        case "year":
          start = new Date(now.getFullYear(), 0, 1);
          end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
          break;

        default:
          return res.status(400).json({
            status: "fail",
            message: "Invalid filter_type. Use: day, week, month, or year.",
            status_code: 400,
            data: {},
          });
      }
    } else {
      // Default: past 7 days
      end = new Date();
      start = new Date();
      start.setDate(end.getDate() - 6);
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // Count orders updated by managers
    const count = await Order.countDocuments({
      updated_by: { $in: managerUserIds },
      updatedAt: { $gte: start, $lte: end },
    });

    res.status(200).json({
      status: "success",
      message: "Orders updated by managers fetched successfully",
      status_code: 200,
      data: {
        count,
        date_range: {
          start_date: start.toISOString(),
          end_date: end.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Error in getResolvedOrdersByManager:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch orders updated by managers",
      status_code: 500,
      error: error.message,
      data: {},
    });
  }
};

// Get all order count
const getOrderCount = async (req, res) => {
  try {
    const { start_date, end_date, filter_type } = req.query;

    let filter = {};
    let start = null;
    let end = null;
    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    if (start_date && end_date) {
      start = new Date(`${start_date}T00:00:00.000Z`);
      end = new Date(`${end_date}T23:59:59.999Z`);
    } else if (filter_type) {
      const now = new Date();

      switch (filter_type) {
        case "today":
          start = new Date(`${todayStr}T00:00:00.000Z`);
          end = new Date(`${todayStr}T23:59:59.999Z`);
          break;

        case "week": {
          const day = now.getUTCDay();
          const diffToMonday = day === 0 ? -6 : 1 - day;
          const monday = new Date(now);
          monday.setUTCDate(now.getUTCDate() + diffToMonday);
          const mondayStr = monday.toISOString().split("T")[0];

          start = new Date(`${mondayStr}T00:00:00.000Z`);
          end = new Date(`${todayStr}T23:59:59.999Z`);
          break;
        }

        case "month":
          start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
          end = new Date(`${todayStr}T23:59:59.999Z`);
          break;

        case "year":
          start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
          end = new Date(`${todayStr}T23:59:59.999Z`);
          break;

        default:
          return res.status(400).json({
            status: "fail",
            message: "Invalid filter_type. Use one of: day, week, month, year.",
            status_code: 400,
            data: {},
          });
      }
    }

    if (start && end) {
      filter.createdAt = { $gte: start, $lte: end };
    }

    const count = await Order.countDocuments(filter);

    res.status(200).json({
      status: "success",
      message: "Order count fetched successfully",
      status_code: 200,
      data: {
        count,
        ...(filter_type === "today"
          ? { date_range: { today: todayStr } }
          : start && end
          ? {
              date_range: {
                start_date: start.toISOString(),
                end_date: end.toISOString(),
              },
            }
          : {}),
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error fetching order count: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

module.exports = { 
  getUserOrders, 
  getOrderStatusSummary, 
  getRecentPublicOrderComments, 
  getWeeklyUserActivityStats,
  getOrderStatusByDay,
  getAllRecentUsers,
  getOrderSummaryStats,
  getOrderCountsByCompanyDeptCostCentre,
  getResolvedOrdersByManager,
  getOrderCount
}