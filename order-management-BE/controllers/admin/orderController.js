const Order = require("../../models/Order");
const User = require("../../models/User");
const Supplier = require("../../models/Supplier");
const Company = require("../../models/Company");
const Department = require("../../models/Department");
const CenterCost = require("../../models/CenterCost");
const mongoose = require("mongoose");
const { createNotification } = require("./notificationController");
const Product = require("../../models/Product");
const Notification = require("../../models/Notification");
const { uploadFileToS3, generateSignedUrl } = require("../../utils/s3");

function generateOrderId(branchCode = "110") {
  const date = new Date();
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  const random = Math.floor(10000 + Math.random() * 90000);
  return `OD-${dd}${mm}${yy}-${branchCode}-${random}`;
}

function determineOrderStatusFromProducts(productStatuses) {
  const statusSet = new Set(productStatuses);

  if (statusSet.has("Issue (RMA)")) {
    return "Issue (RMA)";
  }

  if (statusSet.size === 1 && statusSet.has("Pending Review")) {
    return "Pending Assignment";
  }

  if (statusSet.has("In Analysis")) {
    return "In Analysis";
  }

  if (statusSet.size === 1 && statusSet.has("Cancelled")) {
    return "Cancelled";
  }

  if (statusSet.size === 1 && statusSet.has("Approved")) {
    return "Approved";
  }

  if (statusSet.size === 1 && statusSet.has("Not Approved")) {
    return "Not Approved";
  }

  if (
    (statusSet.has("Approved") && statusSet.has("Not Approved")) ||
    (statusSet.has("Approved") && statusSet.has("Completed") && statusSet.has("Not Approved")) ||
    (statusSet.has("Approved") && statusSet.has("Pending Review")) ||
    (statusSet.has("Approved") && statusSet.has("Cancelled"))
  ) {
    return "Partially Approved";
  }

  if (["Ordered", "In Transit", "Received"].some(status => statusSet.has(status))) {
    return "In Processing";
  }

  if (
    (statusSet.size === 1 && statusSet.has("Completed")) ||
    (statusSet.has("Cancelled") && statusSet.has("Not Approved")) ||
    (statusSet.has("Completed") && statusSet.has("Not Approved"))
    // (statusSet.has("Approved") && statusSet.has("Completed") && statusSet.has("Not Approved"))
  ) {
    return "Completed";
  }

  return "Pending Assignment"; // fallback
}

// for multiple product selection
const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
        status_code: 404,
        data: {},
      });
    }

    let {
      products,
      order_description,
      location,
      new_location,
      status,
      company_name,
      department_name,
      center_cost_name,
      urgent,
      change_location,
      reason_for_urgency,
      create_new_entities
    } = req.body;

    let parsedProducts;
    try {
      parsedProducts = typeof products === "string" ? JSON.parse(products) : products;
    } catch (e) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid JSON format in 'products' field.",
        status_code: 400,
        data: {},
      });
    }

    if (!Array.isArray(parsedProducts) || parsedProducts.length === 0) {
      return res.status(400).json({
        status: "fail",
        message: "At least one product must be provided.",
        status_code: 400,
        data: {},
      });
    }

    // ✅ Check for duplicate product names
    const productNames = parsedProducts.map(p => p.product_name);
    const uniqueProductNames = new Set(productNames);
    if (uniqueProductNames.size !== productNames.length) {
      return res.status(400).json({
        status: "fail",
        message: "Duplicate products are not allowed. Each product must be unique.",
        status_code: 400,
        data: {},
      });
    }

    if (String(urgent) === "true" && (!reason_for_urgency || reason_for_urgency.trim() === "")) {
      return res.status(400).json({
        status: "fail",
        message: "Reason for urgency is required when the order is marked as urgent.",
        status_code: 400,
        data: {},
      });
    }

    let imageKey = null;
    if (req.file) {
      const s3Result = await uploadFileToS3(
        req.file.buffer,
        req.file.originalname,
        "uploads/order",
        req.file.mimetype
      );
      imageKey = s3Result.Key;
    }

    // Manage company/department/center cost
    let company, department, centerCost;

    if (create_new_entities === "true") {
      const existingCompany = await Company.findOne({ name: company_name });
      if (existingCompany) {
        return res.status(409).json({
          status: "fail",
          message: `Company "${company_name}" already exists.`,
          status_code: 409,
          data: {},
        });
      }

      company = await Company.create({ name: company_name });
      department = await Department.create({ name: department_name, company_id: company._id });
      centerCost = await CenterCost.create({ name: center_cost_name, department_id: department._id });
    } else {
      company = await Company.findOne({ name: company_name });
      if (!company) {
        return res.status(404).json({
          status: "fail",
          message: `${company_name} Company Not Exist.`,
          status_code: 404,
          data: {},
        });
      }

      department = await Department.findOne({ name: department_name, company_id: company._id });
      if (!department) {
        return res.status(404).json({
          status: "fail",
          message: `${department_name} Department Not Exist under ${company_name} Company.`,
          status_code: 404,
          data: {},
        });
      }

      centerCost = await CenterCost.findOne({ name: center_cost_name, department_id: department._id });
      if (!centerCost) {
        return res.status(404).json({
          status: "fail",
          message: `${center_cost_name} Center Cost Not Exist under ${department_name} Department.`,
          status_code: 404,
          data: {},
        });
      }
    }

    // const finalLocation = change_location ? new_location : location;
    const isChangeLocation = String(change_location).toLowerCase() === "true";
    const finalLocation = isChangeLocation ? new_location : location;

    const initialStatus = status || "Pending Review";

    // Build product data
    const productData = [];
    for (const item of parsedProducts) {
      const {
        product_name,
        quantity,
        unit,
        supplier_name,
        supplier_price,
        reason_supplier_select
      } = item;

      if (!product_name || !quantity || !unit || !supplier_name || !supplier_price) {
        return res.status(400).json({
          status: "fail",
          message: "Missing product fields in product array.",
          status_code: 400,
          data: {},
        });
      }

      const product = await Product.findOne({ product_name });
      if (!product) {
        return res.status(404).json({
          status: "fail",
          message: `Product "${product_name}" not found.`,
          status_code: 404,
          data: {},
        });
      }

      const supplier = await Supplier.findOne({ company_name: supplier_name });
      if (!supplier) {
        return res.status(404).json({
          status: "fail",
          message: `Supplier "${supplier_name}" not found.`,
          status_code: 404,
          data: {},
        });
      }

      productData.push({
        product_id: product._id,
        product_name: product.product_name,
        quantity,
        unit,
        supplier_id: supplier._id,
        supplier_name: supplier.company_name,
        supplier_price,
        reason_supplier_select,
        status: initialStatus,
        status_history: [
          {
            status: initialStatus,
            changed_by_id: user._id,
            changed_by_name: `${user.first_name} ${user.last_name}`,
            changed_at: new Date(),
            product_description: `Product "${product.product_name}" was created in the order.`,
          }
        ],
        public_comments: [],
        private_comments: [],
        reviews: [],
        comments: []
      });
    }

    // Compute order status from all product statuses
    const allProductStatuses = productData.map(p => p.status);
    const orderStatus = determineOrderStatusFromProducts(allProductStatuses);

    const order_id = generateOrderId("110");
    const fullName = `${user.first_name} ${user.last_name}`;

    const newOrder = new Order({
      order_id,
      user_id: user._id,
      products: productData,
      order_description,
      location: finalLocation,
      image: imageKey,
      orderStatus,
      company_name: company.name,
      department_name: department.name,
      center_cost_name: centerCost.name,
      urgent,
      change_location: change_location,
      reason_for_urgency,
    });

    await newOrder.save();

    const notifyUsers = await User.find().populate("role_id");
    const adminsAndManagers = notifyUsers.filter((u) => {
      const role = u.role_id?.name?.toLowerCase();
      return role === "admin" || role === "manager";
    });

    for (const product of productData) {
      for (const recipient of adminsAndManagers) {
        await createNotification({
          to: recipient._id,
          from: user._id,
          message: `New order for product "${product.product_name}" (Order ID: ${order_id}) created by ${fullName}`,
          type: "order_created",
          relatedOrderId: newOrder._id,
          productSnapshot: {
            product_id: product.product_id,
            product_name: product.product_name,
            quantity: product.quantity,
            unit: product.unit,
            status: product.status,
            message: `New product "${product.product_name}" for Order (Order ID: ${order_id}) created by ${fullName}`,
          },
        });
      }
    }

    const order = newOrder.toObject();
    if (order.image) {
      order.image = generateSignedUrl(order.image);
    }

    res.status(201).json({
      status: "success",
      message: "Order created successfully",
      status_code: 201,
      data: {
        ...order,
        created_by: `${user.first_name} ${user.last_name}`
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to create order",
      status_code: 500,
      error: err.message,
      data: {},
    });
  }
};

// Get all orders
const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { orderStatus, date, department_name, company_name, center_cost_name } = req.query;
    const filters = {};

    if (date) {
      const targetDate = new Date(date);
      const nextDate = new Date(date);
      nextDate.setDate(targetDate.getDate() + 1);

      filters.createdAt = {
        $gte: targetDate,
        $lt: nextDate,
      };
    }

    if (company_name) filters.company_name = new RegExp(company_name, "i");
    if (department_name) filters.department_name = new RegExp(department_name, "i");
    if (center_cost_name) filters.center_cost_name = new RegExp(center_cost_name, "i");

    // Fetch orders and total count before filtering by dynamic orderStatus
    const [orders, total_items_before_filtering] = await Promise.all([
      Order.find(filters)
        .populate({
          path: "user_id",
          select: "first_name last_name email company role_id",
          populate: {
            path: "role_id",
            select: "name",
          },
        })
        .populate("updated_by", "first_name last_name")
        .sort({ createdAt: -1 })
        .lean(),
      Order.countDocuments(filters),
    ]);

    // Get unique order names
    const orderNames = [...new Set(orders.map((order) => order.order_name))];

    // Product info with suppliers populated
    const products = await Product.find({ product_name: { $in: orderNames } })
      .populate({
        path: "suppliers.supplier_id",
        select: "company_name",
      })
      .select("product_name suppliers")
      .lean();

    const productMap = {};
    products.forEach((product) => {
      productMap[product.product_name] = product;
    });

    // Collect user IDs from comments
    const userIds = new Set();
    orders.forEach((order) => {
      (order.public_comments || []).forEach((c) => userIds.add(c.user_id));
      (order.private_comments || []).forEach((c) => userIds.add(c.user_id));
    });

    const users = await User.find({ _id: { $in: Array.from(userIds) } })
      .select("_id first_name last_name image")
      .lean();

    const userMap = {};
    users.forEach((user) => {
      userMap[user._id.toString()] = {
        name: `${user.first_name} ${user.last_name}`,
        image: user.image ? generateSignedUrl(user.image) : null,
      };
    });

    const countProductStatuses = (products = []) => {
      const statusCounts = {
        approved: 0,
        not_approved: 0,
        in_analysis: 0,
      };

      products.forEach((p) => {
        const status = (p.status || "").toLowerCase();
        if (status === "approved") statusCounts.approved++;
        else if (status === "not approved") statusCounts.not_approved++;
        else if (status === "in analysis") statusCounts.in_analysis++;
      });

      return statusCounts;
    };

    const formattedOrders = orders.map((order) => {
      const formatComments = (comments = []) =>
        comments.map((comment) => ({
          ...comment,
          user_name: userMap[comment.user_id]?.name || "Unknown User",
          user_image: userMap[comment.user_id]?.image || null,
        }));

      const matchedProduct = productMap[order.order_name];
      const statusCounts = countProductStatuses(order.products);

      return {
        ...order,
        image: order.image ? generateSignedUrl(order.image) : null,
        created_by: {
          name: `${order.user_id?.first_name || ""} ${order.user_id?.last_name || ""}`,
          role: order.user_id?.role_id?.name || null,
        },
        updated_by: {
          name: `${order.updated_by?.first_name || ""} ${order.updated_by?.last_name || ""}`.trim(),
        },
        orderStatus: determineOrderStatusFromProducts(order.products.map((p) => p.status)),
        product_status_counts: {
          total: order.products?.length || 0,
          ...statusCounts,
        },
      };
    });

    // Filter by dynamic orderStatus AFTER formatting
    let filteredOrders = formattedOrders;
    if (orderStatus) {
      filteredOrders = formattedOrders.filter(
        (order) => order.orderStatus?.toLowerCase() === orderStatus.toLowerCase()
      );
    }

    // Apply pagination after filtering
    const total_items = filteredOrders.length;
    const paginatedOrders = filteredOrders.slice(skip, skip + limit);

    res.status(200).json({
      status: "success",
      message: "Orders fetched successfully",
      status_code: 200,
      data: {
        orders: paginatedOrders,
        pagination: {
          page,
          limit,
          total_pages: Math.ceil(total_items / limit),
          total_items,
        },
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch orders",
      status_code: 500,
      error: err.message,
      data: {},
    });
  }
};

// Get order By ProductId
const getOrdersByProductId = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Check if product exists
    const product = await Product.findById(productId).select("product_name").lean();
    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
        status_code: 404,
        data: {},
      });
    }

    // Find all orders containing the productId
    const matchQuery = {
      "products.product_id": productId,
    };

    const [orders, total_items] = await Promise.all([
      Order.find(matchQuery)
        .populate({
          path: "user_id",
          select: "first_name last_name email company role_id",
          populate: {
            path: "role_id",
            select: "name",
          },
        })
        .populate("updated_by", "first_name last_name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(matchQuery),
    ]);

    // Collect all user IDs from comments
    const userIds = new Set();
    orders.forEach(order => {
      (order.public_comments || []).forEach(c => userIds.add(c.user_id?.toString()));
      (order.private_comments || []).forEach(c => userIds.add(c.user_id?.toString()));
      (order.products || []).forEach(p => {
        (p.public_comments || []).forEach(c => userIds.add(c.user_id?.toString()));
      });
    });

    const users = await User.find({ _id: { $in: Array.from(userIds) } })
      .select("_id first_name last_name image")
      .lean();

    const userMap = {};
    for (const user of users) {
      userMap[user._id.toString()] = {
        name: `${user.first_name} ${user.last_name}`,
        image: user.image ? await generateSignedUrl(user.image) : null,
      };
    }

    const formatComments = (comments = []) =>
      comments.map(comment => ({
        ...comment,
        user_name: userMap[comment.user_id?.toString()]?.name || "Unknown User",
        user_image: userMap[comment.user_id?.toString()]?.image || null,
      }));

    const formattedOrders = await Promise.all(orders.map(async order => {
      const filteredProducts = await Promise.all(order.products
        .filter(p => p.product_id?.toString() === productId)
        .map(async p => {
          return {
            ...p,
            file_for_return_reason: p.file_for_return_reason
              ? await generateSignedUrl(p.file_for_return_reason)
              : null,
            reason_for_return: p.reason_for_return || null,
            public_comments: formatComments(p.public_comments),
          };
        }));

        if(order.image){
          order.image = generateSignedUrl(order.image);
        }

        return {
        ...order,
        products: filteredProducts,
        public_comments: formatComments(order.public_comments),
        private_comments: formatComments(order.private_comments),
        created_by: {
          name: `${order.user_id?.first_name || ""} ${order.user_id?.last_name || ""}`.trim(),
          role: order.user_id?.role_id?.name || null,
        },
        updated_by: {
          name: `${order.updated_by?.first_name || ""} ${order.updated_by?.last_name || ""}`.trim(),
        },
      };
    }));

    res.status(200).json({
      status: "success",
      message: "Orders fetched for given product",
      status_code: 200,
      data: {
        orders: formattedOrders,
        pagination: {
          page,
          limit,
          total_pages: Math.ceil(total_items / limit),
          total_items,
        },
      },
    });
  } catch (err) {
    console.error("getOrdersByProductId error:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch product-related orders",
      status_code: 500,
      error: err.message,
      data: {},
    });
  }
};

// Get a single order by ID
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user_id", "first_name last_name email company department role_id")
      .lean();

    if (!order) {
      return res.status(404).json({
        status: "fail",
        message: "Order not found",
        status_code: 404,
        data: {},
      });
    }

    // Sign image if present
    const signedOrderImage = order.image ? await generateSignedUrl(order.image) : null;
    // Sign product images and attach supplier data
    const enrichedProducts = await Promise.all(order.products.map(async (product) => {
      const productDetails = await Product.findById(product.product_id)
        .populate({
          path: "suppliers.supplier_id",
          select: "company_name",
        })
        .select("product_id brand_name UN file suppliers")
        .lean();

      const supplierDetails = productDetails?.suppliers?.find(
        s => s.supplier_id && String(s.supplier_id._id) === String(product.supplier_id)
      );

      const signedProductImage = productDetails?.file ? await generateSignedUrl(productDetails.file) : null;

      const reviewStats = await Order.aggregate([
        { $unwind: "$products" },
        { $match: { "products.product_id": product.product_id } },
        { $unwind: "$products.reviews" },
        { $match: { "products.reviews.rating": { $ne: null } } },
        {
          $group: {
            _id: "$products.product_id",
            total_reviews: { $sum: 1 },
            average_rating: { $avg: "$products.reviews.rating" },
          }
        }
      ]);

      const { total_reviews = 0, average_rating = 0 } = reviewStats[0] || {};
      
      const signedDocumentUrl = product.document ? await generateSignedUrl(product.document) : null;
      const signedReturnFileUrl = product.file_for_return_reason ? await generateSignedUrl(product.file_for_return_reason) : null;
      
      return {
        ...product,
        brand_name: productDetails?.brand_name || null,
        UN: productDetails?.UN || null,
        product_custom_id: productDetails?.product_id || null,
        image: signedProductImage,
        total_reviews,
        average_rating: Number(average_rating.toFixed(1)),
        supplier_details: supplierDetails ? {
          supplier_id: supplierDetails.supplier_id?._id,
          company_name: supplierDetails.supplier_id?.company_name || null,
          price: supplierDetails.price,
          previous_price: supplierDetails.previous_price,
          changed_date: supplierDetails.changed_date,
        } : null,
        document: signedDocumentUrl,
        file_for_return_reason: signedReturnFileUrl,
        // reason_for_return: product.reason_for_return || null,
      };
    }));

    // Collect user IDs from comments
    const userIds = new Set();
    (order.public_comments || []).forEach((c) => userIds.add(c.user_id));
    (order.private_comments || []).forEach((c) => userIds.add(c.user_id));

    // Fetch user details
    const users = await User.find({ _id: { $in: Array.from(userIds) } })
      .select("_id first_name last_name image")
      .lean();

    const userMap = {};
    for (const user of users) {
      const signedImage = user.image ? await generateSignedUrl(user.image) : null;
      userMap[user._id.toString()] = {
        name: `${user.first_name} ${user.last_name}`,
        image: signedImage,
      };
    }

    const formattedOrder = {
      ...order,
      image: signedOrderImage,
      created_by: `${order.user_id?.first_name || ""} ${order.user_id?.last_name || ""}`.trim(),
      products: enrichedProducts,
      orderStatus: determineOrderStatusFromProducts(order.products.map(p => p.status)),
    };

    res.status(200).json({
      status: "success",
      message: "Order fetched successfully",
      status_code: 200,
      data: formattedOrder,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch order",
      status_code: 500,
      error: err.message,
      data: {},
    });
  }
};

// Update an Order
const updateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        status: "fail",
        message: "Order not found",
        status_code: 404,
        data: {},
      });
    }

    const {
      order_description,
      location,
      // new_location,
      status,
      company_name,
      department_name,
      center_cost_name,
      urgent,
      // change_location,
      reason_for_urgency,
      create_new_entities,
    } = req.body;

    const isUrgent = urgent != null ? String(urgent).toLowerCase() === "true" : order.urgent;
    // const isChangeLocation = change_location != null ? String(change_location).toLowerCase() === "true" : order.change_location;
    // const finalLocation = isChangeLocation ? new_location || order.location : location || order.location;

    if (req.body.urgent !== undefined) {
      order.urgent = String(req.body.urgent).toLowerCase() === "true";

      if (order.urgent) {
        if (!req.body.reason_for_urgency || req.body.reason_for_urgency.trim() === "") {
          return res.status(400).json({
            status: "fail",
            message: "Reason for urgency is required when urgent is true.",
            status_code: 400,
            data: {},
          });
        }
        order.reason_for_urgency = req.body.reason_for_urgency;
      } else {
        order.reason_for_urgency = null;
      }
    }

    if (req.file) {
      const s3Result = await uploadFileToS3(
        req.file.buffer,
        req.file.originalname,
        "uploads/order",
        req.file.mimetype
      );
      order.image = s3Result.Key;
    } else if (req.body.clear_image === true) {
      order.image = null;
    } else if (Object.prototype.hasOwnProperty.call(req.body, "image") && (req.body.image === null || req.body.image === "null" || req.body.image === "")) {
      order.image = null;
    } else if (req.body.image) {
      order.image = req.body.image;
    }

    if (company_name && department_name && center_cost_name) {
      let company, department, centerCost;

      if (create_new_entities === "true") {
        const existingCompany = await Company.findOne({ name: company_name });
        if (existingCompany) {
          return res.status(409).json({
            status: "fail",
            message: `Company "${company_name}" already exists.`,
            status_code: 409,
            data: {},
          });
        }

        company = await Company.create({ name: company_name });
        department = await Department.create({ name: department_name, company_id: company._id });
        centerCost = await CenterCost.create({ name: center_cost_name, department_id: department._id });
      } else {
        company = await Company.findOne({ name: company_name });
        if (!company) {
          return res.status(404).json({
            status: "fail",
            message: `Company "${company_name}" not found.`,
            status_code: 404,
            data: {},
          });
        }

        department = await Department.findOne({ name: department_name, company_id: company._id });
        if (!department) {
          return res.status(404).json({
            status: "fail",
            message: `Department "${department_name}" not found under "${company_name}".`,
            status_code: 404,
            data: {},
          });
        }

        centerCost = await CenterCost.findOne({ name: center_cost_name, department_id: department._id });
        if (!centerCost) {
          return res.status(404).json({
            status: "fail",
            message: `Center Cost "${center_cost_name}" not found under "${department_name}".`,
            status_code: 404,
            data: {},
          });
        }
      }

      order.company_name = company.name;
      order.department_name = department.name;
      order.center_cost_name = centerCost.name;
    }

    if (order_description !== undefined) order.order_description = order_description;
    if (location !== undefined) order.location = location;
    if (urgent !== undefined) order.urgent = isUrgent;
    // if (change_location !== undefined) order.change_location = isChangeLocation;
    if (reason_for_urgency !== undefined) order.reason_for_urgency = reason_for_urgency;

    if (status && status !== order.orderStatus) {
      order.orderStatus = status;
      order.status_updated_at = new Date();

      order.status_history = order.status_history || [];
      order.status_history.push({
        status,
        changed_by_id: req.user._id,
        changed_by_name: `${req.user.first_name} ${req.user.last_name}`,
        changed_at: new Date(),
      });

      if (status === "Shipped") {
        order.shipped_by = req.user._id;
      }

      await createNotification({
        to: order.user_id,
        from: req.user._id,
        message: `Order status updated to "${status}"`,
        type: "order_status_updated",
        relatedOrderId: order._id,
        orderSnapshot: {
          status: order.orderStatus,
          order_description: order.order_description,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          updated_date: order.updatedAt.toISOString().split("T")[0],
          updated_time: order.updatedAt.toISOString().split("T")[1].split(".")[0],
          updated_by: `${req.user.first_name} ${req.user.last_name}`,
        },
      });
    }

    order.order_approval = req.body.order_approval || order.order_approval;
    order.comment = req.body.comment || order.comment;

    let parsedProducts;
    let productStatuses = [];
    try {
      if (req.body.products) {
        parsedProducts = typeof req.body.products === "string" ? JSON.parse(req.body.products) : req.body.products;

        if (Array.isArray(parsedProducts)) {
          for (const updatedProduct of parsedProducts) {
            const product = order.products.find(
              (p) => String(p.product_id) === String(updatedProduct.product_id)
            );

            if (product) {
              if (updatedProduct.quantity != null) product.quantity = updatedProduct.quantity;
              if (updatedProduct.unit) product.unit = updatedProduct.unit;

              if (updatedProduct.supplier_name) {
                const supplier = await Supplier.findOne({ company_name: updatedProduct.supplier_name });
                if (!supplier) {
                  return res.status(404).json({
                    status: "fail",
                    message: `Supplier "${updatedProduct.supplier_name}" not found.`,
                    status_code: 404,
                    data: {},
                  });
                }
                product.supplier_name = supplier.company_name;
                product.supplier_id = supplier._id;
              }

              if (updatedProduct.supplier_price != null) product.supplier_price = updatedProduct.supplier_price;
              if (updatedProduct.reason_supplier_select != null) product.reason_supplier_select = updatedProduct.reason_supplier_select;
              if (updatedProduct.approved_quantity != null) product.approved_quantity = updatedProduct.approved_quantity;
              if (updatedProduct.delivered_quantity != null) product.delivered_quantity = updatedProduct.delivered_quantity;

              if (
                product.quantity != null &&
                product.approved_quantity != null &&
                product.approved_quantity < product.quantity
              ) {
                console.warn(`Approved quantity (${product.approved_quantity}) is less than requested (${product.quantity}) for product ${product.product_name}.`);
              }

              // NEW: Track and notify on product status change
              if (updatedProduct.status && updatedProduct.status !== product.status) {
                const previousStatus = product.status;
                const newStatus = updatedProduct.status;

                product.status = newStatus;

                product.status_history = product.status_history || [];
                product.status_history.push({
                  status: newStatus,
                  changed_by_id: req.user._id,
                  changed_by_name: `${req.user.first_name} ${req.user.last_name}`,
                  changed_at: new Date(),
                });

                // Send product-level notification
                await createNotification({
                  to: order.user_id,
                  from: req.user._id,
                  message: `Product "${product.product_name}" status updated from "${previousStatus}" to "${newStatus}"`,
                  type: "order_status_updated",
                  relatedOrderId: order._id,
                  productSnapshot: {
                    product_id: product.product_id,
                    product_name: product.product_name,
                    quantity: product.quantity,
                    unit: product.unit,
                    status: newStatus,
                    message: `Status updated by ${req.user.first_name} ${req.user.last_name}`,
                  },
                });
              }

              // Push current status to list
              productStatuses.push(product.status);
            }
          }
        }
      }
    } catch (e) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid JSON in 'products'.",
        status_code: 400,
        data: {},
      });
    }

    if (productStatuses.length === 0) {
      productStatuses = order.products.map(p => p.status);
    }
    order.orderStatus = determineOrderStatusFromProducts(productStatuses);
    order.status_updated_at = new Date();

    if (order.orderStatus === "Completed") {
      // Fetch Admins and Managers
      const [adminsAndManagers] = await Promise.all([
        User.find({ role: { $in: ["admin", "manager"] } }).select("_id").lean(),
      ]);

      const notifyUserIds = [
        ...(adminsAndManagers.map(user => user._id) || []),
        order.user_id,
      ];

      const productNames = order.products.map(p => p.product_name).join(", ");
      
      for (const userId of notifyUserIds) {
        await createNotification({
          to: userId,
          from: req.user._id,
          message: `Order for product(s): "${productNames}" has been marked as Completed.`,
          type: "order_completed",
          relatedOrderId: order._id,
          orderSnapshot: {
            status: order.orderStatus,
            order_description: order.order_description,
            completed_by: `${req.user.first_name} ${req.user.last_name}`,
            completed_at: new Date(),
          },
        });
      }
    }

    order.order_approval = req.body.order_approval || order.order_approval;
    order.comment = req.body.comment || order.comment;

    // who is update the order --> updated_by
    order.updated_by = req.user._id;

    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate("user_id", "first_name last_name email")
      .populate("updated_by", "first_name last_name")
      .lean();

    const signedImageUrl = populatedOrder.image
      ? await generateSignedUrl(populatedOrder.image)
      : null;

    const signedDocumentUrl = populatedOrder.document
      ? await generateSignedUrl(populatedOrder.document)
      : null;

    res.status(200).json({
      status: "success",
      message: "Order updated successfully",
      status_code: 200,
      data: {
        ...populatedOrder,
        image: signedImageUrl,
        document: signedDocumentUrl,
        created_by: `${populatedOrder.user_id?.first_name || ""} ${populatedOrder.user_id?.last_name || ""}`.trim(),
        updated_by: `${populatedOrder.updated_by?.first_name || ""} ${populatedOrder.updated_by?.last_name || ""}`.trim(),
      },
    });
  } catch (err) {
    console.error("Order update error:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to update order",
      status_code: 500,
      error: err.message,
      data: {},
    });
  }
};

// Delete an order
const deleteOrder = async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);

    if (!deletedOrder) {
      return res.status(404).json({
        status: "fail",
        message: "Order not found",
        status_code: 404,
        data: {},
      });
    }

    // Delete notifications related to this order
    await Notification.deleteMany({ relatedOrderId: req.params.id });

    res.status(200).json({
      status: "success",
      message: "Order deleted successfully",
      status_code: 200,
      data: {},
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to delete order",
      status_code: 500,
      error: err.message,
      data: {},
    });
  }
};

// Delete All Orders
const deletePaginatedOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const ordersToDelete = await Order.find().skip(skip).limit(limit);

    if (ordersToDelete.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "No orders found in this page range",
        status_code: 404,
        data: {},
      });
    }

    const idsToDelete = ordersToDelete.map((order) => order._id);

    // Delete the orders
    await Order.deleteMany({ _id: { $in: idsToDelete } });

    // Delete related notifications
    await Notification.deleteMany({ relatedOrderId: { $in: idsToDelete } });

    res.status(200).json({
      status: "success",
      message: `Deleted ${ordersToDelete.length} orders from page ${page}`,
      status_code: 200,
      data: {
        deletedCount: ordersToDelete.length,
        page,
        limit,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Error deleting paginated orders: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

// Comment when the status is cancelled
const replyToOrderComment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { message, reply_to } = req.body;
    const adminId = req.user.id;

    // Validate required fields
    const missingFields = [];
    if (!message) missingFields.push("message");
    if (!reply_to) missingFields.push("reply_to");

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: "fail",
        message: "Validation error",
        status_code: 400,
        data: { errors: missingFields.map(field => `${field} is required`) },
      });
    }

    // Ensure user is admin or manager
    const adminUser = await User.findById(adminId).populate("role_id");
    const allowedRoles = ["admin", "manager"];
    if (!allowedRoles.includes(adminUser.role_id?.name)) {
      return res.status(403).json({
        status: "fail",
        message: "Permission denied",
        status_code: 403,
        data: { errors: ["Only admins or managers can reply to comments"] },
      });
    }

    // Fetch order and validate status
    const order = await Order.findById(orderId);
    if (!order || order.orderStatus !== "Cancelled") {
      return res.status(400).json({
        status: "fail",
        message: "Invalid order",
        status_code: 400,
        data: { errors: ["Order not found or not cancelled"] },
      });
    }

    // Find the comment being replied to
    const parentComment = [];
    order.products.forEach(p => {
      if (p.comments && Array.isArray(p.comments)) {
        p.comments.forEach(c => {
          if (c.comment_id.toString() === reply_to) {
            parentComment.push({ comment: c, product: p });
          }
        });
      }
    });

    if (parentComment.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "Parent comment not found",
        status_code: 404,
        data: { errors: [`No parent comment found with ID ${reply_to}`] },
      });
    }

    const { comment: originalComment, product } = parentComment[0];

    // Get full name and image
    const fullName = [adminUser.first_name, adminUser.last_name].filter(Boolean).join(" ");
    const image = adminUser.image ? await generateSignedUrl(adminUser.image) : null;

    // Create reply comment
    const reply = {
      comment_id: new mongoose.Types.ObjectId(),
      user_id: adminId,
      user_name: fullName || "Admin",
      user_image: image,
      message,
      is_reply: true,
      reply_to,
      likes: [],
      created_at: new Date()
    };

    product.comments.push(reply);
    await order.save();

    // Notify original commenter
    await createNotification({
      to: originalComment.user_id,
      from: adminId,
      message: `Admin ${fullName || "an admin"} replied to your comment on order "${order.order_id}".`,
      type: "order_comment_reply",
      relatedOrderId: order._id,
    });

    return res.status(200).json({
      status: "success",
      message: "Reply sent successfully",
      status_code: 200,
      data: { reply },
    });
  } catch (err) {
    console.error("replyToOrderComment error:", err);
    return res.status(500).json({
      status: "error",
      message: "Server error",
      status_code: 500,
      data: { errors: [err.message] },
    });
  }
};

// Like for single Comment when the status is cancelled
const toggleLikeCommentForAdmin = async (req, res) => {
  try {
    const { orderId, commentId } = req.params;
    const userId = req.user.id;

    // Validate required params
    const missingFields = [];
    if (!orderId) missingFields.push("orderId");
    if (!commentId) missingFields.push("commentId");

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: "fail",
        message: "Validation error",
        status_code: 400,
        data: { errors: missingFields.map((f) => `${f} is required`) },
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        status: "fail",
        message: "Order not found",
        status_code: 404,
        data: { errors: [`No order found with ID ${orderId}`] },
      });
    }

    const comment = order.comments.find(
      (c) => c.comment_id.toString() === commentId
    );
    if (!comment) {
      return res.status(404).json({
        status: "fail",
        message: "Comment not found",
        status_code: 404,
        data: { errors: [`No comment found with ID ${commentId}`] },
      });
    }

    const index = comment.likes.findIndex((id) => id.toString() === userId);
    const action = index === -1 ? "liked" : "unliked";

    if (index === -1) {
      comment.likes.push(userId);
    } else {
      comment.likes.splice(index, 1);
    }

    await order.save();

    return res.status(200).json({
      status: "success",
      message: `Comment ${action} successfully`,
      status_code: 200,
      data: { likes: comment.likes },
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      status_code: 500,
      data: { errors: [err.message] },
    });
  }
};

// Private Conversation(admin and manager)
const addPrivateOrderComment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { message, reply_to, product_id } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role_id?.name;
    const userName = [req.user.first_name, req.user.last_name].filter(Boolean).join(" ");
    let userImage = null;
    if (req.user.image) {
      userImage = await generateSignedUrl(req.user.image);
    }

    // Role check
    if (!["admin", "manager"].includes(userRole)) {
      return res.status(403).json({
        status: "fail",
        message: "Access denied",
        status_code: 403,
        data: {
          errors: ["Only admins and managers can add private comments."],
        },
      });
    }

    // Message validation
    if (!message) {
      return res.status(400).json({
        status: "fail",
        message: "Validation error",
        status_code: 400,
        data: { errors: ["message is required"] },
      });
    }

    // Order check
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        status: "fail",
        message: "Order not found",
        status_code: 404,
        data: { errors: [`No order found with ID ${orderId}`] },
      });
    }

    // Find target comments array depending on product_id presence
    let targetCommentsArray;

    if (product_id) {
      const product = order.products.find(
        (p) => String(p.product_id) === String(product_id)
      );
      if (!product) {
        return res.status(404).json({
          status: "fail",
          message: `Product with ID ${product_id} not found in order`,
          status_code: 404,
          data: { errors: [`Product with ID ${product_id} not found in this order`] },
        });
      }
      if (!Array.isArray(product.private_comments)) {
        product.private_comments = [];
      }
      targetCommentsArray = product.private_comments;
    } else {
      if (!Array.isArray(order.private_comments)) {
        order.private_comments = [];
      }
      targetCommentsArray = order.private_comments;
    }

    // Validate reply_to in the targetCommentsArray if present
    if (reply_to) {
      const exists = targetCommentsArray.some(
        (c) => c.comment_id.toString() === reply_to
      );
      if (!exists) {
        return res.status(400).json({
          status: "fail",
          message: "Reply target not found",
          status_code: 400,
          data: { errors: [`No private comment found with ID ${reply_to}`] },
        });
      }
    }

    // Build comment object
    const comment = {
      comment_id: new mongoose.Types.ObjectId(),
      user_id: userId,
      user_name: userName,
      user_image: userImage,
      message,
      is_reply: !!reply_to,
      reply_to: reply_to || null,
      likes: [],
      created_at: new Date(),
    };

    // Push to correct comments array
    targetCommentsArray.push(comment);

    await order.save();

    return res.status(200).json({
      status: "success",
      message: "Private comment added successfully",
      status_code: 200,
      data: { comment },
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

// Like the private comments(admin and manager)
const likePrivateComment = async (req, res) => {
  try {
    const { orderId, commentId } = req.params;
    const { product_id } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role_id?.name;

    // Role check
    if (!["admin", "manager"].includes(userRole)) {
      return res.status(403).json({
        status: "fail",
        message: "Access denied",
        status_code: 403,
        data: {
          errors: ["Only admins and managers can like private comments."],
        },
      });
    }

    // Fetch the order including products and their private comments if product_id specified
    const order = await Order.findById(orderId).lean();
    if (!order) {
      return res.status(404).json({
        status: "fail",
        message: "Order not found",
        status_code: 404,
        data: { errors: [`No order found with ID ${orderId}`] },
      });
    }

    let comment;
    if (product_id) {
      // Find the product in the order
      const product = order.products.find(
        (p) => p.product_id.toString() === product_id
      );
      if (!product) {
        return res.status(404).json({
          status: "fail",
          message: "Product not found in order",
          status_code: 404,
          data: { errors: [`No product found with ID ${product_id}`] },
        });
      }
      if (!product.private_comments || !Array.isArray(product.private_comments)) {
        return res.status(404).json({
          status: "fail",
          message: "No private comments found for this product",
          status_code: 404,
          data: {},
        });
      }
      comment = product.private_comments.find(
        (c) => c.comment_id.toString() === commentId
      );
    } else {
      if (!order.private_comments || !Array.isArray(order.private_comments)) {
        return res.status(404).json({
          status: "fail",
          message: "No private comments found for this order",
          status_code: 404,
          data: {},
        });
      }
      comment = order.private_comments.find(
        (c) => c.comment_id.toString() === commentId
      );
    }

    if (!comment) {
      return res.status(404).json({
        status: "fail",
        message: "Private comment not found",
        status_code: 404,
        data: { errors: [`No private comment found with ID ${commentId}`] },
      });
    }

    // Toggle like status
    const alreadyLiked = comment.likes.some(
      (id) => id.toString() === userId.toString()
    );
    if (alreadyLiked) {
      comment.likes = comment.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      comment.likes.push(userId);
    }

    // Now save changes accordingly
    if (product_id) {
      // Update the product's private comments array
      // Since we used lean(), we need to update the order document properly here:
      await Order.updateOne(
        { _id: orderId, "products.product_id": product_id, "products.private_comments.comment_id": commentId },
        {
          $set: {
            "products.$[product].private_comments.$[comment].likes": comment.likes,
          },
        },
        {
          arrayFilters: [
            { "product.product_id": product_id },
            { "comment.comment_id": comment.comment_id },
          ],
        }
      );
    } else {
      // Update the order's private comments array
      await Order.updateOne(
        { _id: orderId, "private_comments.comment_id": commentId },
        { $set: { "private_comments.$.likes": comment.likes } }
      );
    }

    // Refetch updated comment with user details populated (optional, for full response)
    const populatedOrder = await Order.findById(orderId)
      .populate({
        path: product_id ? "products.private_comments.user_id" : "private_comments.user_id",
        select: "first_name last_name image",
      });

    let updatedComment;
    if (product_id) {
      const product = populatedOrder.products.find(
        (p) => p.product_id.toString() === product_id
      );
      updatedComment = product.private_comments.find(
        (c) => c.comment_id.toString() === commentId
      );
    } else {
      updatedComment = populatedOrder.private_comments.find(
        (c) => c.comment_id.toString() === commentId
      );
    }

    let userImage = null;
    if (updatedComment.user_id?.image) {
      userImage = await generateSignedUrl(updatedComment.user_id.image);
    }

    const commentResponse = {
      comment_id: updatedComment.comment_id,
      user_id: updatedComment.user_id?._id || updatedComment.user_id,
      user_name:
        updatedComment.user_name ||
        `${updatedComment.user_id?.first_name || ""} ${updatedComment.user_id?.last_name || ""}`.trim(),
      user_image: userImage,
      message: updatedComment.message,
      is_reply: updatedComment.is_reply,
      reply_to: updatedComment.reply_to,
      likes: updatedComment.likes,
      created_at: updatedComment.created_at,
    };

    return res.status(200).json({
      status: "success",
      message: alreadyLiked ? "Comment unliked" : "Comment liked",
      status_code: 200,
      data: {
        comment: commentResponse,
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

// Get all Private comments(admin and manager)
const getPrivateOrderComments = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { product_id } = req.query;

    const order = await Order.findById(orderId).lean();

    if (!order) {
      return res.status(404).json({
        status: "fail",
        message: "Order not found",
        status_code: 404,
        data: { errors: [`No order found with ID ${orderId}`] },
      });
    }

    // Get the product with matching private_comments
    const product = order.products.find(p => p.product_id.toString() === product_id?.toString());

    if (!product) {
      return res.status(404).json({
        status: "fail",
        message: "Product not found in the order",
        status_code: 404,
        data: { errors: [`No product found with ID ${product_id}`] },
      });
    }

    const comments = product.private_comments || [];

    // Get unique user IDs
    const userIds = [...new Set(comments.map(c => c.user_id?.toString()).filter(Boolean))];

    // Fetch user data
    const users = await mongoose.model("User").find({ _id: { $in: userIds } })
      .select("first_name last_name image")
      .lean();

    const userMap = {};
    for (const user of users) {
      const signedImage = user.image ? await generateSignedUrl(user.image) : null;
      userMap[user._id.toString()] = {
        name: `${user.first_name} ${user.last_name}`,
        image: signedImage,
      };
    }

    const transformedComments = comments.map(comment => {
      const userDetails = userMap[comment.user_id?.toString()] || {};
      return {
        ...comment,
        user_id: comment.user_id,
        user_name: userDetails.name || "Unknown User",
        user_image: userDetails.image || null,
      };
    });

    return res.status(200).json({
      status: "success",
      message: "Private comments retrieved successfully",
      status_code: 200,
      data: { private_comments: transformedComments },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "error",
      message: "Server error",
      status_code: 500,
      data: { errors: [err.message] },
    });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrdersByProductId,
  getOrderById,
  updateOrder,
  deleteOrder,
  deletePaginatedOrders,

  // Cancelled Order Comment Section
  replyToOrderComment,
  toggleLikeCommentForAdmin,

  // Private Comment Section(admin and manager only)
  addPrivateOrderComment,
  likePrivateComment,
  getPrivateOrderComments,
};
