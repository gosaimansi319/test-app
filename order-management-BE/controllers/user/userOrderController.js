const Order = require("../../models/Order");
const User = require("../../models/User");
const Supplier = require("../../models/Supplier");
const Company = require('../../models/Company');
const Department = require('../../models/Department');
const CenterCost = require('../../models/CenterCost');
const mongoose = require('mongoose');
const { createNotification } = require("../admin/notificationController");
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

// USER PANEL

// Create User Order
const createUserOrder = async (req, res) => {
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
      company_name,
      department_name,
      center_cost_name,
      location,
      new_location,
      urgent,
      change_location,
      reason_for_urgency,
    } = req.body;

    const isUrgent = String(urgent) === "true";

    // Parse products from string to array
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

    // Check for duplicate product names
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

    // Validation
    const missingFields = [];
    if (!company_name) missingFields.push("company_name is required");
    if (!department_name) missingFields.push("department_name is required");
    if (!center_cost_name) missingFields.push("center_cost_name is required");
    if (!location) missingFields.push("location is required");
    if (isUrgent && (!reason_for_urgency || reason_for_urgency.trim() === "")) {
      missingFields.push("reason_for_urgency is required when urgent is true");
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: "fail",
        message: "Validation error",
        status_code: 400,
        data: { errors: missingFields },
      });
    }

    const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || "User";

    // Validate each product
    const productData = [];
    for (const item of parsedProducts) {
      const { product_name, quantity, unit } = item;

      if (!product_name || !quantity || !unit) {
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

      productData.push({
        product_id: product._id,
        product_name: product.product_name,
        quantity,
        unit,
        status: "Pending Review",
        status_history: [
          {
            status: "Pending Review",
            changed_by_id: user._id,
            changed_by_name: fullName,
            changed_at: new Date(),
            product_description: `Product "${product.product_name}" was created in the order.`,
          },
        ],
        private_comments: [],
        public_comments: [],
        comments: [],
        reviews: [],
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

    const isChangeLocation = String(change_location).toLowerCase() === "true";
    const finalLocation = isChangeLocation ? new_location : location;

    // Compute orderStatus from all product statuses
    const allProductStatuses = productData.map((p) => p.status);
    const orderStatus = determineOrderStatusFromProducts(allProductStatuses);

    const order_id = generateOrderId("110");

    const order = await Order.create({
      order_id,
      user_id: userId,
      products: productData,
      order_description,
      company_name,
      department_name,
      center_cost_name,
      location: finalLocation,
      image: imageKey,
      urgent: isUrgent,
      change_location,
      reason_for_urgency,
      status: orderStatus,
      status_history: [
        {
          status: orderStatus,
          changed_by_id: userId,
          changed_by_name: fullName,
          changed_at: new Date(),
        },
      ],
    });

    // Notify Admins and Managers
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
          message: `New order for product "${product.product_name}" (Order ID: ${order.order_id}) created by ${fullName}`,
          type: "order_created",
          relatedOrderId: order._id,
          productSnapshot: {
            product_id: product.product_id,
            product_name: product.product_name,
            quantity: product.quantity,
            unit: product.unit,
            status: product.status,
            message: `New product "${product.product_name}" for Order (Order ID: ${order.order_id}) created by ${fullName}`,
          },
        });
      }
    }

    // Notify the user per product as well
    for (const product of productData) {
      await createNotification({
        to: userId,
        from: userId,
        message: `Your order "${order.order_id}" includes product "${product.product_name}" and is currently Pending for approval.`,
        type: "order_created",
        relatedOrderId: order._id,
        productSnapshot: {
          product_id: product.product_id,
          product_name: product.product_name,
          quantity: product.quantity,
          unit: product.unit,
          status: product.status,
          message: `Your product "${product.product_name}" in order "${order.order_id}" is pending approval.`,
        },
      });
    }

    const responseOrder = order.toObject();

    if (responseOrder.image) {
      responseOrder.image = generateSignedUrl(responseOrder.image);
    }

    res.status(201).json({
      status: "success",
      message: "Order created successfully",
      status_code: 201,
      data: { responseOrder },
    });
  } catch (err) {
    console.error("User Order Error:", err);
    res.status(500).json({
      status: "fail",
      message: "Something went wrong",
      status_code: 500,
      data: {},
    });
  }
};

// Get all Users Orders
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { status, date, orderStatus } = req.query;
    const filters = { user_id: userId };

    if (status) {
      filters.status = new RegExp(status, "i");
    }
    if (date) {
      filters.createdAt = { $gte: new Date(date) };
    }

    // Fetch orders
    const [orders, total_items_before_filtering] = await Promise.all([
      Order.find(filters)
        .sort({ createdAt: -1 })
        .lean(),
      Order.countDocuments(filters),
    ]);

    // Collect user_ids from comments
    const userIds = new Set();
    orders.forEach(order => {
      (order.public_comments || []).forEach(c => userIds.add(c.user_id));
      (order.private_comments || []).forEach(c => userIds.add(c.user_id));
    });

    const users = await User.find({ _id: { $in: Array.from(userIds) } })
      .select("_id first_name last_name image")
      .lean();

    const userMap = {};
    await Promise.all(users.map(async (user) => {
      userMap[user._id.toString()] = {
        name: `${user.first_name} ${user.last_name}`,
        image: user.image ? await generateSignedUrl(user.image) : null,
      };
    }));

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

    // Format orders
    const formattedOrders = await Promise.all(orders.map(async order => {
      const formatComments = (comments = []) =>
        comments.map(comment => ({
          ...comment,
          user_name: userMap[comment.user_id]?.name || "Unknown User",
          user_image: userMap[comment.user_id]?.image || null,
        }));

      const statusCounts = countProductStatuses(order.products);
      const computedOrderStatus = determineOrderStatusFromProducts(order.products.map(p => p.status));

      return {
        ...order,
        created_by: {
          name: `${req.user.first_name} ${req.user.last_name}`,
        },
        image: order.image ? await generateSignedUrl(order.image) : null,
        document: order.document ? await generateSignedUrl(order.document) : null,
        file_for_return_reason: order.file_for_return_reason ? await generateSignedUrl(order.file_for_return_reason) : null,
        orderStatus: computedOrderStatus,
        product_status_counts: {
          total: order.products?.length || 0,
          ...statusCounts,
        },
      };
    }));

    let filteredOrders = formattedOrders;
    if (orderStatus) {
      filteredOrders = formattedOrders.filter(
        (order) => order.orderStatus?.toLowerCase() === orderStatus.toLowerCase()
      );
    }

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
    console.error("getUserOrders error:", err);
    res.status(500).json({
      status: "fail",
      message: "Failed to fetch user orders",
      status_code: 500,
      data: {},
    });
  }
};

// Get User Order By ID
const getUserOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid order ID",
        status_code: 400,
        data: {},
      });
    }

    const order = await Order.findOne({ _id: orderId, user_id: userId }).lean();

    if (!order) {
      return res.status(404).json({
        status: "fail",
        message: "Order not found.",
        status_code: 404,
        data: {},
      });
    }

    const user = await User.findById(userId).select("first_name last_name");
    const createdByName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();

    const signedOrderImage = order.image ? await generateSignedUrl(order.image) : null;
    const enrichedProducts = await Promise.all(order.products.map(async (product) => {
      if (!product.product_id) return product;

      const productDetails = await Product.findById(product.product_id)
        .populate({
          path: "suppliers.supplier_id",
          select: "company_name",
        })
        .select("product_id product_name brand_name UN file suppliers")
        .lean();

      if (!productDetails) return product;

      const supplierDetails = productDetails.suppliers?.find(
        s => s.supplier_id && String(s.supplier_id._id) === String(product.supplier_id)
      );

      const signedProductImage = productDetails.file ? await generateSignedUrl(productDetails.file) : null;

      // Aggregate product reviews from all orders
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
        brand_name: productDetails.brand_name || null,
        UN: productDetails.UN || null,
        product_custom_id: productDetails.product_id || null,
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
      };
    }));

    // Gather user IDs from order-level and product-level comments
    const userIds = new Set();
    (order.public_comments || []).forEach(c => userIds.add(c.user_id?.toString()));
    (order.private_comments || []).forEach(c => userIds.add(c.user_id?.toString()));
    for (const product of order.products) {
      (product.public_comments || []).forEach(c => userIds.add(c.user_id?.toString()));
    }

    const users = await User.find({ _id: { $in: Array.from(userIds) } })
      .select("_id first_name last_name image")
      .lean();

    const userMap = {};
    for (const user of users) {
      const signedImage = user.image ? await generateSignedUrl(user.image) : null;
      userMap[user._id.toString()] = {
        name: `${user.first_name} ${user.last_name}`.trim(),
        image: signedImage,
      };
    }

    const formatComments = (comments = []) =>
      comments.map(comment => ({
        ...comment,
        user_name: userMap[comment.user_id?.toString()]?.name || "Unknown User",
        user_image: userMap[comment.user_id?.toString()]?.image || null,
      }));

    // Format public comments for each product
    for (const product of enrichedProducts) {
      if (product.public_comments && Array.isArray(product.public_comments)) {
        product.public_comments = product.public_comments.map(comment => ({
          ...comment,
          user_name: userMap[comment.user_id?.toString()]?.name || "Unknown User",
          user_image: userMap[comment.user_id?.toString()]?.image || null,
        }));
      }
    }

    const productIds = order.products.map(p => p.product_id).filter(Boolean);
    const allOrdersWithSameProducts = await Order.find({
      "products.product_id": { $in: productIds }
    }).select("reviews").lean();

    const total_reviews = allOrdersWithSameProducts.reduce(
      (sum, o) => sum + (Array.isArray(o.reviews) ? o.reviews.length : 0),
      0
    );

    const allRatings = allOrdersWithSameProducts.flatMap(o =>
      Array.isArray(o.reviews) ? o.reviews.map(r => r.rating) : []
    );

    const average_rating = allRatings.length
      ? parseFloat((allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1))
      : null;

    let orderStatus;
    
    if (order.orderStatus  === "Cancelled") {
      orderStatus = "Cancelled";
    } else {
      orderStatus = determineOrderStatusFromProducts(order.products.map(p => p.status));
    }

    const formattedOrder = {
      ...order,
      created_by: createdByName,
      image: signedOrderImage,
      products: enrichedProducts,
      orderStatus,
    };

    res.status(200).json({
      status: "success",
      message: "Order fetched successfully",
      status_code: 200,
      data: formattedOrder,
    });
  } catch (err) {
    console.error("getUserOrderById error:", err);
    res.status(500).json({
      status: "fail",
      message: "Failed to fetch order",
      status_code: 500,
      data: {},
    });
  }
};

// Update User Order
const updateUserOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, user_id: userId });

    if (!order) {
      return res.status(404).json({
        status: "fail",
        message: "Order not found or not authorized.",
        status_code: 404,
        data: {},
      });
    }

    const allowedUserStatuses = ["Completed", "Issue (RMA)"];

    const {
      order_description,
      company_name,
      department_name,
      center_cost_name,
      location,
      urgent,
      reason_for_urgency,
      products,
      product_id,
      status,
    } = req.body;

    const fullName = `${req.user.first_name} ${req.user.last_name}`.trim();

    // Optional order-level updates
    if (order_description !== undefined) order.order_description = order_description;
    if (company_name !== undefined) order.company_name = company_name;
    if (department_name !== undefined) order.department_name = department_name;
    if (center_cost_name !== undefined) order.center_cost_name = center_cost_name;
    if (urgent !== undefined) order.urgent = String(urgent) === "true";
    if (reason_for_urgency !== undefined) order.reason_for_urgency = reason_for_urgency;
    if (location !== undefined) order.location = location;

    // Upload image if attached
    const filesMap = {};
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        if (!filesMap[file.fieldname]) {
          filesMap[file.fieldname] = [];
        }
        filesMap[file.fieldname].push(file);
      }
    }

    // Upload order image
    if (filesMap.image?.[0]) {
      const file = filesMap.image[0];
      const s3Result = await uploadFileToS3(
        file.buffer,
        file.originalname,
        "uploads/order",
        file.mimetype
      );
      order.image = s3Result.Key;
    }

    let updatedProducts = [];

    // Support direct status update from root level (optional)
    if (product_id && status) {
      const existingProduct = order.products.find(
        (p) => String(p.product_id) === String(product_id)
      );
      if (!existingProduct) {
        return res.status(404).json({
          status: "fail",
          message: `Product with id "${product_id}" not found in this order.`,
          status_code: 404,
          data: {},
        });
      }
      if (existingProduct.status !== status) {
        if (!allowedUserStatuses.includes(status)) {
          return res.status(403).json({
            status: "fail",
            message: `You are only allowed to update status to "Received" or "Issue (RMA)".`,
            status_code: 403,
            data: {},
          });
        }

        existingProduct.status = status;
        existingProduct.status_history.push({
          status,
          changed_by_id: userId,
          changed_by_name: fullName,
          changed_at: new Date(),
        });
        updatedProducts.push(existingProduct);
      }

      const docFieldKey = `${existingProduct.product_name
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")}_doc`;

  if (filesMap[docFieldKey]?.[0]) {
    const file = filesMap[docFieldKey][0];
    const s3Result = await uploadFileToS3(
      file.buffer,
      file.originalname,
      "uploads/order",
      file.mimetype
    );
    existingProduct.document = s3Result.Key;
    if (!updatedProducts.includes(existingProduct)) {
      updatedProducts.push(existingProduct);
    }
  }
    }

    // Handle product-level updates
    if (products) {
      const parsedProducts = typeof products === "string" ? JSON.parse(products) : products;

      for (const updatedProduct of parsedProducts) {
        const {
          product_id,
          product_name,
          quantity,
          unit,
          status,
          replace_product_id
        } = updatedProduct;

        // Step 1: Handle replacement logic
        if (replace_product_id) {
          const indexToRemove = order.products.findIndex(
            (p) => String(p.product_id) === String(replace_product_id)
          );
          if (indexToRemove !== -1) {
            order.products.splice(indexToRemove, 1); // remove the old product
          } else {
            return res.status(404).json({
              status: "fail",
              message: `Product with id "${replace_product_id}" to replace not found in the order.`,
              status_code: 404,
              data: {},
            });
          }
        }

        // Step 2: Find existing product
        let existingProduct = order.products.find(
          (p) => String(p.product_id) === String(product_id)
        );

        const previousStatus = existingProduct?.status;

        if (existingProduct) {
          // Existing product update
          if (status && status !== previousStatus) {
            if (!allowedUserStatuses.includes(status)) {
              return res.status(403).json({
                status: "fail",
                message: `You are only allowed to update status to "Received" or "Issue (RMA)".`,
                status_code: 403,
                data: {},
              });
            }
            existingProduct.status = status;
            existingProduct.status_history.push({
              status,
              changed_by_id: userId,
              changed_by_name: fullName,
              changed_at: new Date(),
            });
          }
          if (quantity !== undefined) existingProduct.quantity = quantity;
          if (unit !== undefined) existingProduct.unit = unit;
        } else {
          // New product addition (either new or replacing)
          if (!product_name || !quantity || !unit) {
            return res.status(400).json({
              status: "fail",
              message: "Missing product fields for new product addition.",
              status_code: 400,
              data: {},
            });
          }

          const productFromDB = await Product.findOne({ product_name });
          if (!productFromDB) {
            return res.status(404).json({
              status: "fail",
              message: `Product "${product_name}" not found in catalog.`,
              status_code: 404,
              data: {},
            });
          }

          const isDuplicate = order.products.some(
            (p) => p.product_name.toLowerCase().trim() === productFromDB.product_name.toLowerCase().trim()
          );

          if (isDuplicate) {
            return res.status(400).json({
              status: "fail",
              message: `Product "${productFromDB.product_name}" is already in the order. Duplicates are not allowed.`,
              status_code: 400,
              data: {},
            });
          }

          existingProduct = {
            product_id: productFromDB._id,
            product_name: productFromDB.product_name,
            quantity,
            unit,
            status: "Pending Review",
            status_history: [
              {
                status: "Pending Review",
                changed_by_id: userId,
                changed_by_name: fullName,
                changed_at: new Date(),
                product_description: `Product "${productFromDB.product_name}" was added to the order.`,
              },
            ],
            private_comments: [],
            public_comments: [],
            comments: [],
            reviews: [],
          };

          order.products.push(existingProduct);
        }

        const docFieldKey = `${existingProduct.product_name
          .replace(/\s+/g, "_")
          .replace(/[^a-zA-Z0-9_]/g, "")}_doc`;

        if (filesMap[docFieldKey]?.[0]) {
          const file = filesMap[docFieldKey][0];
          const s3Result = await uploadFileToS3(
            file.buffer,
            file.originalname,
            "uploads/order",
            file.mimetype
          );
          existingProduct.document = s3Result.Key;
        }

        updatedProducts.push(existingProduct);
      }
    }

    // Recalculate overall order status
    const allProductStatuses = order.products.map((p) => p.status);
    order.orderStatus = determineOrderStatusFromProducts(allProductStatuses);
    order.status_updated_at = new Date();

    await order.save();

    // Notify user about product updates
    for (const product of updatedProducts) {
      await createNotification({
        to: userId,
        from: userId,
        type: "order_status_updated",
        relatedOrderId: order._id,
        message: `Product "${product.product_name}" in order "${order.order_id}" updated by you.`,
        productSnapshot: {
          product_id: product.product_id,
          product_name: product.product_name,
          quantity: product.quantity,
          unit: product.unit,
          status: product.status,
        },
        orderSnapshot: {
          order_id: order.order_id,
          status: order.status,
          order_description: order.order_description,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        },
      });
    }

    // Notify admins/managers
    const notifyUsers = await User.find().populate("role_id");
    const adminsAndManagers = notifyUsers.filter((u) => {
      const role = u.role_id?.name?.toLowerCase();
      return role === "admin" || role === "manager";
    });

    for (const product of updatedProducts) {
      for (const admin of adminsAndManagers) {
        await createNotification({
          to: admin._id,
          from: userId,
          type: "order_status_updated",
          relatedOrderId: order._id,
          message: `Product "${product.product_name}" in order "${order.order_id}" was updated by ${fullName}.`,
          productSnapshot: {
            product_id: product.product_id,
            product_name: product.product_name,
            quantity: product.quantity,
            unit: product.unit,
            status: product.status,
          },
          orderSnapshot: {
            order_id: order.order_id,
            status: order.status,
            order_description: order.order_description,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
          },
        });
      }
    }

    const responseOrder = order.toObject();
    
    if (responseOrder.image) {
      responseOrder.image = generateSignedUrl(responseOrder.image);
    }

    if (Array.isArray(responseOrder.products)) {
      responseOrder.products = responseOrder.products.map((product) => {
        if (product.document) {
          product.document = generateSignedUrl(product.document);
        }
        return product;
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Order updated successfully.",
      status_code: 200,
      data: { order: responseOrder },
    });
  } catch (err) {
    console.error("Error updating user order:", err);
    return res.status(500).json({
      status: "fail",
      message: "Something went wrong while updating the order.",
      status_code: 500,
      error: err.message,
      data: {},
    });
  }
};

// Cancel User Order
// const cancelUserOrder = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const orderId = req.params.id;

//     const order = await Order.findOne({ _id: orderId, user_id: userId })
//       .populate({
//         path: "user_id",
//         select: "first_name last_name email company role_id",
//         populate: { path: "role_id", select: "name" },
//       })
//       .lean();

//     if (!order) {
//       return res.status(404).json({
//         status: "fail",
//         message: "Order not found or unauthorized",
//         status_code: 404,
//         data: {},
//       });
//     }

//     const THIRTY_MINUTES = 30 * 60 * 1000;
//     const orderCreatedTime = new Date(order.createdAt);
//     const currentTime = new Date();

//     if (currentTime - orderCreatedTime > THIRTY_MINUTES) {
//       return res.status(403).json({
//         status: "fail",
//         message: "Order can no longer be cancelled. The 30-minute window has expired.",
//         status_code: 403,
//         data: {},
//       });
//     }

//     if (order.orderStatus === "Cancelled") {
//       return res.status(400).json({
//         status: "fail",
//         message: "Order is already cancelled",
//         status_code: 400,
//         data: {},
//       });
//     }

//     // Update status and status history (need to update in DB)
//     await Order.updateOne(
//       { _id: orderId },
//       {
//         $set: { status: "Cancelled" },
//         $push: {
//           status_history: {
//             status: "Cancelled",
//             changed_by_id: userId,
//             changed_by_name: [req.user.first_name, req.user.last_name]
//               .filter(Boolean)
//               .join(" ") || "User",
//             changed_at: new Date(),
//           },
//         },
//       }
//     );

//     // Reload the updated order with fresh data
//     const updatedOrder = await Order.findById(orderId).lean();

//     // Get product info for the order to fetch suppliers
//     const product = await Product.findOne({ product_name: updatedOrder.order_name })
//       .populate({
//         path: "suppliers.supplier_id",
//         select: "company_name",
//       })
//       .select("product_name suppliers")
//       .lean();

//     // Collect user IDs from comments for mapping user names/images
//     const userIds = new Set();
//     (updatedOrder.public_comments || []).forEach((c) => userIds.add(c.user_id));
//     (updatedOrder.private_comments || []).forEach((c) => userIds.add(c.user_id));

//     const users = await User.find({ _id: { $in: Array.from(userIds) } })
//       .select("_id first_name last_name image")
//       .lean();

//     const userMap = {};
//     await Promise.all(users.map(async (user) => {
//       userMap[user._id.toString()] = {
//         name: `${user.first_name} ${user.last_name}`,
//         image: user.image ? await generateSignedUrl(user.image) : null,
//       };
//     }));

//     // Format comments
//     const formatComments = (comments = []) =>
//       comments.map((comment) => ({
//         ...comment,
//         user_name: userMap[comment.user_id]?.name || "Unknown User",
//         user_image: userMap[comment.user_id]?.image || null,
//       }));

//     // Format final order response
//     const responseOrder = {
//       ...updatedOrder,
//       image: updatedOrder.image ? await generateSignedUrl(updatedOrder.image) : null,
//       created_by: {
//         name: `${order.user_id?.first_name || ""} ${order.user_id?.last_name || ""}`,
//         role: order.user_id?.role_id?.name || null,
//       },
//       product_id: product?._id || null,
//       suppliers:
//         product?.suppliers?.map((s) => ({
//           supplier_id: s.supplier_id?._id,
//           company_name: s.supplier_id?.company_name || null,
//           price: s.price,
//           previous_price: s.previous_price,
//           changed_date: s.changed_date,
//         })).filter(s => s.supplier_id) || [],
//       orderStatus: "Cancelled", // since you just cancelled it
//       public_comments: formatComments(updatedOrder.public_comments),
//       private_comments: formatComments(updatedOrder.private_comments),
//     };
    
//     // Notify all admins and managers
//     const notifyUsers = await User.find().populate("role_id");

//     const adminsAndManagers = notifyUsers.filter((user) => {
//       const roleName = user.role_id?.name?.toLowerCase();
//       return roleName === "admin" || roleName === "manager";
//     });

//     const fullName = [req.user.first_name, req.user.last_name].filter(Boolean).join(" ") || "User";

//     await Promise.all(
//       adminsAndManagers.map((user) =>
//         createNotification({
//           to: user._id,
//           from: userId,
//           message: `Order "${updatedOrder.order_description}" was cancelled by ${fullName}.`,
//           type: "order_status_updated",
//           relatedOrderId: updatedOrder._id,
//         })
//       )
//     );

//     // Notify the user as well
//     await createNotification({
//       to: userId,
//       from: userId,
//       message: `You have cancelled the order "${updatedOrder.order_description}".`,
//       type: "order_status_updated",
//       relatedOrderId: updatedOrder._id,
//     });

//     return res.status(200).json({
//       status: "success",
//       message: "Order cancelled successfully",
//       status_code: 200,
//       data: responseOrder,
//     });
//   } catch (err) {
//     console.error("cancelUserOrder error:", err);
//     return res.status(500).json({
//       status: "fail",
//       message: "Something went wrong",
//       status_code: 500,
//       data: {},
//     });
//   }
// };

const cancelUserOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;

    const order = await Order.findOne({ _id: orderId, user_id: userId });

    if (!order) {
      return res.status(404).json({
        status: "fail",
        message: "Order not found or unauthorized",
        status_code: 404,
        data: {},
      });
    }

    const THIRTY_MINUTES = 30 * 60 * 1000;
    const orderCreatedTime = new Date(order.createdAt);
    const currentTime = new Date();

    if (currentTime - orderCreatedTime > THIRTY_MINUTES) {
      return res.status(403).json({
        status: "fail",
        message: "Order can no longer be cancelled. The 30-minute window has expired.",
        status_code: 403,
        data: {},
      });
    }

    if (order.orderStatus === "Cancelled") {
      return res.status(400).json({
        status: "fail",
        message: "Order is already cancelled",
        status_code: 400,
        data: {},
      });
    }

    // Cancel all products and update their history
    const fullName = `${req.user.first_name} ${req.user.last_name}`.trim();
    order.products = order.products.map((product) => {
      product.status = "Cancelled";
      product.status_history.push({
        status: "Cancelled",
        changed_by_id: userId,
        changed_by_name: fullName || "User",
        changed_at: new Date(),
      });
      return product;
    });

    // Update overall order status
    const allStatuses = order.products.map((p) => p.status);
    order.orderStatus = determineOrderStatusFromProducts(allStatuses);
    order.status_updated_at = new Date();

    await order.save();

    const orderSnapshot = {
      order_id: order.order_id,
      orderStatus: order.orderStatus,
      order_description: order.order_description,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    const cancelledProducts = order.products.map((p) => ({
      product_id: p.product_id,
      product_name: p.product_name,
      quantity: p.quantity,
      unit: p.unit,
      status: p.status,
    }));

    // Notify user (self-notification)
    await createNotification({
      to: userId,
      from: userId,
      type: "order_cancelled",
      relatedOrderId: order._id,
      message: `You cancelled order "${order.order_id}".`,
      orderSnapshot,
      productSnapshot: cancelledProducts,
    });

    // Notify Admins and Managers
    const notifyUsers = await User.find().populate("role_id");
    const adminsAndManagers = notifyUsers.filter((u) => {
      const role = u.role_id?.name?.toLowerCase();
      return role === "admin" || role === "manager";
    });

    for (const admin of adminsAndManagers) {
      await createNotification({
        to: admin._id,
        from: userId,
        type: "order_cancelled",
        relatedOrderId: order._id,
        message: `User ${fullName} cancelled order "${order.order_id}".`,
        orderSnapshot,
        productSnapshot: cancelledProducts,
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Order cancelled successfully.",
      status_code: 200,
      data: {
        order_id: order._id,
        new_status: order.orderStatus,
        cancelled_products: order.products.map((p) => ({
          product_id: p.product_id,
          product_name: p.product_name,
          status: p.status,
        })),
      },
    });
  } catch (err) {
    console.error("Error cancelling order:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to cancel order.",
      status_code: 500,
      error: err.message,
      data: {},
    });
  }
};

// const cancelUserOrder = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const orderId = req.params.id;

//     const order = await Order.findOne({ _id: orderId, user_id: userId });

//     if (!order) {
//       return res.status(404).json({
//         status: "fail",
//         message: "Order not found or unauthorized",
//         status_code: 404,
//         data: {},
//       });
//     }

//     const THIRTY_MINUTES = 30 * 60 * 1000;
//     const orderCreatedTime = new Date(order.createdAt);
//     const currentTime = new Date();

//     if (currentTime - orderCreatedTime > THIRTY_MINUTES) {
//       return res.status(403).json({
//         status: "fail",
//         message: "Order can no longer be cancelled. The 30-minute window has expired.",
//         status_code: 403,
//         data: {},
//       });
//     }

//     if (order.orderStatus === "Cancelled") {
//       return res.status(400).json({
//         status: "fail",
//         message: "Order is already cancelled",
//         status_code: 400,
//         data: {},
//       });
//     }

//     // Cancel all products and update their history
//     const fullName = `${req.user.first_name} ${req.user.last_name}`.trim();
//     order.products = order.products.map((product) => {
//       product.status = "Cancelled";
//       product.status_history.push({
//         status: "Cancelled",
//         changed_by_id: userId,
//         changed_by_name: fullName || "User",
//         changed_at: new Date(),
//       });
//       return product;
//     });

//     // Update overall order status
//     const allStatuses = order.products.map((p) => p.status);
//     order.orderStatus = determineOrderStatusFromProducts(allStatuses);
//     order.status_updated_at = new Date();

//     await order.save();

//     const orderSnapshot = {
//       order_id: order.order_id,
//       status: order.orderStatus,
//       order_description: order.order_description,
//       createdAt: order.createdAt,
//       updatedAt: order.updatedAt,
//     };

//     const cancelledProducts = order.products.map((p) => ({
//       product_id: p.product_id,
//       product_name: p.product_name,
//       quantity: p.quantity,
//       unit: p.unit,
//       status: p.status,
//     }));

//     // Notify user (self)
//     await createNotification({
//       to: userId,
//       from: userId,
//       type: "order_cancelled",
//       relatedOrderId: order._id,
//       message: `You cancelled order "${order.order_id}".`,
//       orderSnapshot,
//       productSnapshot: cancelledProducts,
//     });

//     // Notify admins and managers
//     const notifyUsers = await User.find().populate("role_id");
//     const adminsAndManagers = notifyUsers.filter((u) => {
//       const role = u.role_id?.name?.toLowerCase();
//       return role === "admin" || role === "manager";
//     });

//     for (const admin of adminsAndManagers) {
//       await createNotification({
//         to: admin._id,
//         from: userId,
//         type: "order_cancelled",
//         relatedOrderId: order._id,
//         message: `User ${fullName} cancelled order "${order.order_id}".`,
//         orderSnapshot,
//         productSnapshot: cancelledProducts,
//       });
//     }

//     return res.status(200).json({
//       status: "success",
//       message: "Order cancelled successfully.",
//       status_code: 200,
//       data: {
//         order_id: order._id,
//         new_status: order.orderStatus,
//         cancelled_products: cancelledProducts,
//       },
//     });
//   } catch (err) {
//     console.error("Error cancelling order:", err);
//     return res.status(500).json({
//       status: "error",
//       message: "Failed to cancel order.",
//       status_code: 500,
//       error: err.message,
//       data: {},
//     });
//   }
// };

// Return Request By User
// const returnOrder = async (req, res) => {
//   try {
//     const { orderId, productId } = req.params;
//     const userId = req.user.id;
//     const { reason_for_return } = req.body;

//     if (!reason_for_return) {
//       return res.status(400).json({
//         status: "fail",
//         message: "Validation error",
//         status_code: 400,
//         data: { errors: ["reason_for_return is required"] },
//       });
//     }

//     const order = await Order.findOne({ _id: orderId, user_id: userId });
//     if (!order) {
//       return res.status(404).json({
//         status: "fail",
//         message: "Order not found or not owned by user",
//         status_code: 404,
//         data: {},
//       });
//     }

//     const product = order.products.find(p => p.product_id?.toString() === productId);
//     if (!product) {
//       return res.status(404).json({
//         status: "fail",
//         message: "Product not found in the order",
//         status_code: 404,
//         data: {},
//       });
//     }

//     // Upload file if attached
//     if (req.file) {
//       const uploaded = await uploadFileToS3(
//         req.file.buffer,
//         req.file.originalname,
//         'uploads/order_returns',
//         req.file.mimetype
//       );
//       product.file_for_return_reason = uploaded.Key;
//     }

//     // Update product return fields
//     product.status = 'Issue (RMA)';
//     product.reason_for_return = reason_for_return;

//     const fullName = [req.user.first_name, req.user.last_name].filter(Boolean).join(' ') || 'User';

//     product.status_history = product.status_history || [];
//     product.status_history.push({
//       status: "Issue (RMA)",
//       changed_by_id: userId,
//       changed_by_name: fullName,
//       changed_at: new Date(),
//       product_description: `Product "${product.product_name}" marked for return.`,
//     });

//     await order.save();

//     // Notify Admins and Managers
//     const notifyUsers = await User.find().populate('role_id');
//     const adminsAndManagers = notifyUsers.filter(user => {
//       const role = user.role_id?.name?.toLowerCase();
//       return role === 'admin' || role === 'manager';
//     });

//     await Promise.all(
//       adminsAndManagers.map(admin =>
//         createNotification({
//           to: admin._id,
//           from: userId,
//           message: `Product "${product.product_name}" in Order "${order.order_name}" has been requested for return by ${fullName}.`,
//           type: 'product_returned',
//           relatedOrderId: order._id,
//         })
//       )
//     );

//     // Notify the user
//     await createNotification({
//       to: userId,
//       from: userId,
//       message: `You have requested to return product "${product.product_name}" in Order "${order.order_name}".`,
//       type: 'product_returned',
//       relatedOrderId: order._id,
//     });

//     // Prepare response
//     const productObject = product.toObject ? product.toObject() : product;
//     productObject.file_for_return_reason = product.file_for_return_reason
//       ? await generateSignedUrl(product.file_for_return_reason)
//       : null;

//     return res.status(200).json({
//       status: "success",
//       message: "Product return requested successfully",
//       status_code: 200,
//       data: productObject,
//     });

//   } catch (err) {
//     console.error("returnOrder error:", err);
//     res.status(500).json({
//       status: "fail",
//       message: "Something went wrong",
//       status_code: 500,
//       data: {},
//     });
//   }
// };

const returnOrder = async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const userId = req.user.id;
    const { reason_for_return } = req.body;

    if (!reason_for_return) {
      return res.status(400).json({
        status: "fail",
        message: "Validation error",
        status_code: 400,
        data: { errors: ["reason_for_return is required"] },
      });
    }

    const order = await Order.findOne({ _id: orderId, user_id: userId });
    if (!order) {
      return res.status(404).json({
        status: "fail",
        message: "Order not found or not owned by user",
        status_code: 404,
        data: {},
      });
    }

    const product = order.products.find(p => p.product_id?.toString() === productId);
    if (!product) {
      return res.status(404).json({
        status: "fail",
        message: "Product not found in the order",
        status_code: 404,
        data: {},
      });
    }

    let uploadedFileKey = null;

    // Upload file if attached
    if (req.file) {
      const uploaded = await uploadFileToS3(
        req.file.buffer,
        req.file.originalname,
        'uploads/order_returns',
        req.file.mimetype
      );
      uploadedFileKey = uploaded.Key;
      product.file_for_return_reason = uploadedFileKey;
    }

    // Update product return fields
    const previousStatus = product.status;
    product.status = 'Issue (RMA)';
    product.reason_for_return = reason_for_return;

    const fullName = [req.user.first_name, req.user.last_name].filter(Boolean).join(' ') || 'User';

    product.status_history = product.status_history || [];
    product.status_history.push({
      status: "Issue (RMA)",
      changed_by_id: userId,
      changed_by_name: fullName,
      changed_at: new Date(),
      product_description: `Product "${product.product_name}" marked for return.`,
    });

    // Recalculate order status
    const productStatuses = order.products.map(p => p.status);
    order.orderStatus = determineOrderStatusFromProducts(productStatuses);
    order.status_updated_at = new Date();

    await order.save();

    const signedUrl = uploadedFileKey ? await generateSignedUrl(uploadedFileKey) : null;

    // Notify the user (self)
    await createNotification({
      to: userId,
      from: userId,
      type: 'product_returned',
      relatedOrderId: order._id,
      message: `You have requested to return product "${product.product_name}" in order "${order.order_id}".`,
      productSnapshot: {
        product_id: product.product_id,
        product_name: product.product_name,
        quantity: product.quantity,
        unit: product.unit,
        status: product.status,
        reason_for_return,
        document: signedUrl,
      },
      orderSnapshot: {
        order_id: order.order_id,
        status: order.orderStatus,
        order_description: order.order_description,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });

    // Notify Admins and Managers
    const notifyUsers = await User.find().populate('role_id');
    const adminsAndManagers = notifyUsers.filter(user => {
      const role = user.role_id?.name?.toLowerCase();
      return role === 'admin' || role === 'manager';
    });

    await Promise.all(
      adminsAndManagers.map(admin =>
        createNotification({
          to: admin._id,
          from: userId,
          type: 'product_returned',
          relatedOrderId: order._id,
          message: `Product "${product.product_name}" in order "${order.order_id}" was requested for return by ${fullName}.`,
          productSnapshot: {
            product_id: product.product_id,
            product_name: product.product_name,
            quantity: product.quantity,
            unit: product.unit,
            status: product.status,
            reason_for_return,
            document: signedUrl,
          },
          orderSnapshot: {
            order_id: order.order_id,
            status: order.orderStatus,
            order_description: order.order_description,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
          },
        })
      )
    );

    return res.status(200).json({
      status: "success",
      message: "Product return requested successfully",
      status_code: 200,
      data: {
        product_id: product.product_id,
        product_name: product.product_name,
        status: product.status,
        reason_for_return,
        document: signedUrl,
      },
    });

  } catch (err) {
    console.error("returnOrder error:", err);
    res.status(500).json({
      status: "fail",
      message: "Something went wrong",
      status_code: 500,
      data: {},
    });
  }
};

// Delete User Order
const deleteUserOrder = async (req, res) => {
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

// Delete All User Orders
const deleteAllUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const ordersToDelete = await Order.find({ user_id: userId })
      .skip(skip)
      .limit(limit);

    if (ordersToDelete.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "No orders found for this user in this page range",
        status_code: 404,
        data: {},
      });
    }

    const idsToDelete = ordersToDelete.map(order => order._id);

    await Order.deleteMany({ _id: { $in: idsToDelete }, user_id: userId });

    return res.status(200).json({
      status: "success",
      message: `Deleted ${ordersToDelete.length} of your orders from page ${page}`,
      status_code: 200,
      data: {
        deletedCount: ordersToDelete.length,
        page,
        limit,
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: "fail",
      message: "Error deleting your paginated orders: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

// Add the comment on cancelled order
const addOrderComment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { message, reply_to } = req.body;
    const userId = req.user.id;

    // Validate message
    if (!message) {
      return res.status(400).json({
        status: "fail",
        message: "Validation error",
        status_code: 400,
        data: { errors: ["message is required"] },
      });
    }

    // Restrict replies
    if (reply_to) {
      return res.status(403).json({
        status: "fail",
        message: "Replying to comments is not allowed",
        status_code: 403,
        data: { errors: ["Users cannot reply to comments"] },
      });
    }

    // Check if order exists and is cancelled
    const order = await Order.findById(orderId);
    if (!order || order.orderStatus !== 'Cancelled') {
      return res.status(400).json({
        status: "fail",
        message: "Invalid order",
        status_code: 400,
        data: { errors: ["Order not found or not cancelled"] },
      });
    }

    // Create the comment
    const comment = {
      comment_id: new mongoose.Types.ObjectId(),
      user_id: userId,
      message,
      is_reply: false,
      reply_to: null,
      likes: [],
      created_at: new Date(),
    };

    // Push the comment to the `comments` array in the order's product
    order.products.forEach(product => {
      product.comments = product.comments || [];
      product.comments.push(comment);
    });

    await order.save();

    // Fetch user for notification
    const user = await User.findById(userId).select("first_name last_name");
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || 'A user';

    // Notify all admins
    const admins = await User.find().populate('role_id');
    await Promise.all(
      admins
        .filter(admin => admin.role_id?.name === 'admin')
        .map(admin =>
          createNotification({
            to: admin._id,
            from: userId,
            message: `User ${fullName} commented on cancelled order "${order.order_id}".`,
            type: 'order_comment',
            relatedOrderId: order._id,
          })
        )
    );

    return res.status(200).json({
      status: "success",
      message: "Comment added successfully",
      status_code: 200,
      data: { comment },
    });

  } catch (err) {
    console.error("addOrderComment error:", err);
    return res.status(500).json({
      status: "error",
      message: "Server error",
      status_code: 500,
      data: { errors: [err.message] },
    });
  }
};

// Add Like on the cancelled order
const toggleLikeComment = async (req, res) => {
  try {
    const { orderId, commentId } = req.params;
    const userId = req.user.id;

    // Validate params
    const missingFields = [];
    if (!orderId) missingFields.push("orderId");
    if (!commentId) missingFields.push("commentId");

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: "fail",
        message: "Validation error",
        status_code: 400,
        data: { errors: missingFields.map(f => `${f} is required`) },
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

    const comment = order.comments.find(c => c.comment_id.toString() === commentId);
    if (!comment) {
      return res.status(404).json({
        status: "fail",
        message: "Comment not found",
        status_code: 404,
        data: { errors: [`No comment found with ID ${commentId}`] },
      });
    }

    const index = comment.likes.findIndex(id => id.toString() === userId);
    let action;

    if (index === -1) {
      comment.likes.push(userId); // like
      action = "liked";
    } else {
      comment.likes.splice(index, 1); // unlike
      action = "unliked";
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

// Add Public conversation
const addPublicOrderComment = async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const { message, reply_to } = req.body;
    const userId = req.user.id;

    // Validate message
    if (!message) {
      return res.status(400).json({
        status: "fail",
        message: "Validation error",
        status_code: 400,
        data: { errors: ["message is required"] },
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

    const product = order.products.find(p => p.product_id?.toString() === productId);
    if (!product) {
      return res.status(404).json({
        status: "fail",
        message: "Product not found in this order",
        status_code: 404,
        data: { errors: [`No product with ID ${productId} in order ${orderId}`] },
      });
    }

    const user = await User.findById(userId).select("first_name last_name image");
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
        status_code: 404,
        data: { errors: [`No user found with ID ${userId}`] },
      });
    }

    // Validate reply target if provided
    if (reply_to) {
      const replyExists = (product.public_comments || []).some(
        c => c.comment_id.toString() === reply_to
      );
      if (!replyExists) {
        return res.status(400).json({
          status: "fail",
          message: "Reply target not found",
          status_code: 400,
          data: { errors: [`Reply comment with ID ${reply_to} not found`] },
        });
      }
    }

    const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ");
    const signedImage = user.image ? await generateSignedUrl(user.image) : null;

    const newComment = {
      comment_id: new mongoose.Types.ObjectId(),
      user_id: userId,
      user_name: fullName,
      user_image: signedImage,
      message,
      is_reply: !!reply_to,
      reply_to: reply_to || null,
      likes: [],
      created_at: new Date(),
    };

    product.public_comments = product.public_comments || [];
    product.public_comments.push(newComment);

    await order.save();

    return res.status(200).json({
      status: "success",
      message: "Public comment added successfully to product",
      status_code: 200,
      data: { comment: newComment },
    });
  } catch (err) {
    console.error("addPublicOrderComment error:", err);
    return res.status(500).json({
      status: "error",
      message: "Server error",
      status_code: 500,
      data: { errors: [err.message] },
    });
  }
};

// Get all Public conversation
const getPublicOrderComments = async (req, res) => {
  try {
    const { orderId, productId } = req.params;

    if (!orderId || !productId) {
      return res.status(400).json({
        status: "fail",
        message: "Validation error",
        status_code: 400,
        data: { errors: ["orderId and productId are required"] },
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

    const product = order.products.find(p => p.product_id?.toString() === productId);
    if (!product) {
      return res.status(404).json({
        status: "fail",
        message: "Product not found in this order",
        status_code: 404,
        data: { errors: [`No product with ID ${productId} in order ${orderId}`] },
      });
    }

    const comments = product.public_comments || [];
    const commentUserIds = [...new Set(comments.map(c => c.user_id?.toString()))];

    // Fetch all involved users
    const users = await User.find({ _id: { $in: commentUserIds } })
      .select('_id first_name last_name image');

    const userMap = {};
    await Promise.all(
      users.map(async user => {
        userMap[user._id.toString()] = {
          name: [user.first_name, user.last_name].filter(Boolean).join(' '),
          image: user.image ? await generateSignedUrl(user.image) : null,
        };
      })
    );

    // Attach user data to each comment
    const enrichedComments = comments
      .map(comment => {
        const userInfo = userMap[comment.user_id?.toString()] || {
          name: 'Unknown User',
          image: null,
        };
        return {
          ...comment.toObject(),
          user_name: userInfo.name,
          user_image: userInfo.image,
        };
      })
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    return res.status(200).json({
      status: "success",
      message: "Public comments fetched successfully",
      status_code: 200,
      data: { comments: enrichedComments },
    });

  } catch (err) {
    console.error("getPublicOrderComments error:", err);
    return res.status(500).json({
      status: "error",
      message: "Server error",
      status_code: 500,
      data: { errors: [err.message] },
    });
  }
};

// Like Public comments
const togglePublicCommentLike = async (req, res) => {
  try {
    const { orderId, productId, commentId } = req.params;
    const userId = req.user.id;

    if (!orderId || !productId || !commentId) {
      const missingFields = [];
      if (!orderId) missingFields.push("orderId");
      if (!productId) missingFields.push("productId");
      if (!commentId) missingFields.push("commentId");

      return res.status(400).json({
        status: "fail",
        message: "Validation error",
        status_code: 400,
        data: { errors: missingFields.map(field => `${field} is required`) },
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

    const product = order.products.find(p => p.product_id?.toString() === productId);
    if (!product) {
      return res.status(404).json({
        status: "fail",
        message: "Product not found in this order",
        status_code: 404,
        data: { errors: [`No product with ID ${productId} in order ${orderId}`] },
      });
    }

    const comment = product.public_comments.find(c => c.comment_id.toString() === commentId);
    if (!comment) {
      return res.status(404).json({
        status: "fail",
        message: "Comment not found",
        status_code: 404,
        data: { errors: [`No comment found with ID ${commentId}`] },
      });
    }

    const alreadyLiked = comment.likes.some(id => id.toString() === userId);

    if (alreadyLiked) {
      comment.likes = comment.likes.filter(id => id.toString() !== userId);
    } else {
      comment.likes.push(userId);
    }

    await order.save();

    // Fetch user info
    const user = await User.findById(comment.user_id).select("first_name last_name image").lean();
    const userName = user ? `${user.first_name} ${user.last_name}`.trim() : "Unknown User";
    const userImage = user?.image ? await generateSignedUrl(user.image) : null;

    const updatedComment = {
      comment_id: comment.comment_id,
      user_id: comment.user_id,
      user_name: userName,
      user_image: userImage,
      message: comment.message,
      is_reply: comment.is_reply,
      reply_to: comment.reply_to,
      likes: comment.likes,
      created_at: comment.created_at,
    };

    return res.status(200).json({
      status: "success",
      message: alreadyLiked ? "Comment unliked" : "Comment liked",
      status_code: 200,
      data: { comment: updatedComment },
    });

  } catch (err) {
    console.error("togglePublicCommentLike error:", err);
    return res.status(500).json({
      status: "error",
      message: "Server error",
      status_code: 500,
      data: { errors: [err.message] },
    });
  }
};

// Add Review
const addOrderReview = async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const { message, rating } = req.body;
    const user = req.user;

    const missingFields = [];
    if (!message) missingFields.push("message");
    if (!rating && rating !== 0) missingFields.push("rating");

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: "fail",
        message: "Validation error",
        status_code: 400,
        data: { errors: missingFields.map(field => `${field} is required`) },
      });
    }

    if (rating < 0 || rating > 5) {
      return res.status(400).json({
        status: "fail",
        message: "Validation error",
        status_code: 400,
        data: { errors: ["Rating must be between 0 and 5"] },
      });
    }

    // Get order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        status: "fail",
        message: "Order not found",
        status_code: 404,
        data: { errors: [`No order found with ID ${orderId}`] },
      });
    }

    // Only allow review by the user who placed the order
    if (order.user_id.toString() !== user._id.toString()) {
      return res.status(403).json({
        status: "fail",
        message: "You are not authorized to review this order",
        status_code: 403,
        data: {},
      });
    }

    // Find the product in the order
    const product = order.products.find(p => p.product_id?.toString() === productId);
    if (!product) {
      return res.status(404).json({
        status: "fail",
        message: "Product not found in this order",
        status_code: 404,
        data: { errors: [`No product with ID ${productId} in order ${orderId}`] },
      });
    }

    // Check if user has already reviewed this product
    const alreadyReviewed = (product.reviews || []).some(
      r => r.user_id.toString() === user._id.toString()
    );
    if (alreadyReviewed) {
      return res.status(400).json({
        status: "fail",
        message: "You have already reviewed this product in this order",
        status_code: 400,
        data: {},
      });
    }

    // Create review object
    const userImage = user.image ? await generateSignedUrl(user.image) : null;
    const review = {
      review_id: new mongoose.Types.ObjectId(),
      user_id: user._id,
      user_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      user_image: userImage,
      rating,
      message,
      created_at: new Date(),
    };

    product.reviews = product.reviews || [];
    product.reviews.push(review);

    await order.save();

    return res.status(200).json({
      status: "success",
      message: "Product review added successfully",
      status_code: 200,
      data: { review },
    });

  } catch (err) {
    console.error("addOrderReview error:", err);
    return res.status(500).json({
      status: "error",
      message: "Server error",
      status_code: 500,
      data: { errors: [err.message] },
    });
  }
};

// Get Review
const getOrderReviews = async (req, res) => {
  try {
    const { orderId, productId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        status: "fail",
        message: "Validation error",
        status_code: 400,
        data: { errors: ["Missing orderId parameter"] },
      });
    }

    const order = await Order.findById(orderId).lean();

    if (!order) {
      return res.status(404).json({
        status: "fail",
        message: "Order not found",
        status_code: 404,
        data: { errors: [`No order found with ID ${orderId}`] },
      });
    }

    let reviews = [];

    for (const product of order.products) {
      // If productId param is provided, skip others
      if (productId && product.product_id.toString() !== productId) continue;

      for (const r of product.reviews || []) {
        const user = await User.findById(r.user_id).select("first_name last_name image").lean();
        const userName = r.user_name || (user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "Unknown User");
        const userImage = user?.image ? await generateSignedUrl(user.image) : null;

        reviews.push({
          review_id: r.review_id,
          product_id: product.product_id,
          product_name: product.product_name,
          user_id: user?._id || r.user_id,
          user_name: userName,
          user_image: userImage,
          rating: r.rating,
          message: r.message,
          created_at: r.created_at,
        });
      }
    }

    const totalReviews = reviews.length;

    return res.status(200).json({
      status: "success",
      message: "Reviews fetched successfully",
      status_code: 200,
      data: {
        order_id: order._id,
        total_reviews: totalReviews,
        reviews,
      },
    });

  } catch (err) {
    console.error("getOrderReviews error:", err);
    return res.status(500).json({
      status: "error",
      message: "Server error",
      status_code: 500,
      data: { errors: [err.message] },
    });
  }
};

// Update a Review
const updateOrderReview = async (req, res) => {
  try {
    const { orderId, reviewId } = req.params;
    const { message, rating } = req.body;
    const user = req.user;

    // Validate rating if provided
    if (rating !== undefined && (rating < 0 || rating > 5)) {
      return res.status(400).json({
        status: "fail",
        message: "Validation error",
        status_code: 400,
        data: { errors: ["Rating must be between 0 and 5"] },
      });
    }

    // Fetch order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        status: "fail",
        message: "Order not found",
        status_code: 404,
        data: { errors: [`No order found with ID ${orderId}`] },
      });
    }

    // Traverse products to find the review
    let foundReview = null;
    let foundProduct = null;

    for (const product of order.products) {
      const review = (product.reviews || []).find(r => r.review_id.toString() === reviewId);
      if (review) {
        foundReview = review;
        foundProduct = product;
        break;
      }
    }

    if (!foundReview) {
      return res.status(404).json({
        status: "fail",
        message: "Review not found",
        status_code: 404,
        data: { errors: [`No review found with ID ${reviewId}`] },
      });
    }

    // Only allow the user who wrote the review to update it
    if (foundReview.user_id.toString() !== user._id.toString()) {
      return res.status(403).json({
        status: "fail",
        message: "You are not authorized to update this review",
        status_code: 403,
        data: {},
      });
    }

    // Update fields
    if (message !== undefined) foundReview.message = message;
    if (rating !== undefined) foundReview.rating = rating;

    await order.save();

    const userImage = user?.image ? await generateSignedUrl(user.image) : null;

    const updatedReview = {
      review_id: foundReview.review_id,
      product_id: foundProduct.product_id,
      product_name: foundProduct.product_name,
      user_id: foundReview.user_id,
      user_name: foundReview.user_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      user_image: userImage,
      rating: foundReview.rating,
      message: foundReview.message,
      created_at: foundReview.created_at,
    };

    return res.status(200).json({
      status: "success",
      message: "Review updated successfully",
      status_code: 200,
      data: { review: updatedReview },
    });

  } catch (err) {
    console.error("updateOrderReview error:", err);
    return res.status(500).json({
      status: "error",
      message: "Server error",
      status_code: 500,
      data: { errors: [err.message] },
    });
  }
};

// Delete a Review
const deleteOrderReview = async (req, res) => {
  try {
    const { orderId, reviewId } = req.params;
    const user = req.user;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        status: "fail",
        message: "Order not found",
        status_code: 404,
        data: { errors: [`No order found with ID ${orderId}`] },
      });
    }

    let reviewFound = false;

    for (const product of order.products) {
      const reviewIndex = (product.reviews || []).findIndex(
        r => r.review_id.toString() === reviewId
      );

      if (reviewIndex !== -1) {
        const review = product.reviews[reviewIndex];

        // Only the review author or admin can delete
        if (review.user_id.toString() !== user._id.toString() && user.role !== 'admin') {
          return res.status(403).json({
            status: "fail",
            message: "Access denied",
            status_code: 403,
            data: { errors: ["You do not have permission to delete this review"] },
          });
        }

        // Remove review and save
        product.reviews.splice(reviewIndex, 1);
        reviewFound = true;
        break;
      }
    }

    if (!reviewFound) {
      return res.status(404).json({
        status: "fail",
        message: "Review not found",
        status_code: 404,
        data: { errors: ["Review not found"] },
      });
    }

    await order.save();

    return res.status(200).json({
      status: "success",
      message: "Review deleted successfully",
      status_code: 200,
      data: {},
    });

  } catch (err) {
    console.error("deleteOrderReview error:", err);
    return res.status(500).json({
      status: "error",
      message: "Server error",
      status_code: 500,
      data: { errors: [err.message] },
    });
  }
};

// Get all Reviews by Product
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    // Step 1: Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        status: 'fail',
        message: 'Product not found',
        status_code: 404,
        data: { errors: [`No product found with ID ${productId}`] },
      });
    }

    // Step 2: Find all orders that contain the product
    const orders = await Order.find({ "products.product_id": productId });

    if (!orders || orders.length === 0) {
      return res.status(404).json({
        status: 'fail',
        message: 'No orders found for this product',
        status_code: 404,
        data: { reviews: [] },
      });
    }

    // Step 3: Extract all reviews for the product from all orders
    let totalRating = 0;
    let ratingCount = 0;

    // Flatten and collect all reviews for this product
    const allReviews = [];

    for (const order of orders) {
      // Find the product inside the order's products array
      const productInOrder = order.products.find(p => p.product_id.toString() === productId);

      if (productInOrder && productInOrder.reviews?.length) {
        for (const review of productInOrder.reviews) {
          // If user details are populated on reviews, you can populate here
          // Otherwise, you can populate user info or generate signed URLs here as needed

          // Optional: populate user info from User collection or from review.user_id if populated

          if (typeof review.rating === 'number') {
            totalRating += review.rating;
            ratingCount++;
          }

          allReviews.push({
            review_id: review.review_id,
            order_id: order._id,
            user_id: review.user_id,
            user_name: review.user_name,
            user_image: review.user_image, // add user image generation if needed
            rating: review.rating,
            message: review.message,
            created_at: review.created_at,
          });
        }
      }
    }

    const averageRating = ratingCount > 0 ? Number((totalRating / ratingCount).toFixed(1)) : null;

    return res.status(200).json({
      status: 'success',
      message: 'Reviews fetched successfully',
      status_code: 200,
      data: {
        product: {
          product_id: product._id,
          product_name: product.product_name,
        },
        total_reviews: allReviews.length,
        average_rating: averageRating,
        reviews: allReviews,
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: 'Server error',
      status_code: 500,
      data: { errors: [err.message] },
    });
  }
};

module.exports = { 
  // user panel controller
  createUserOrder, getUserOrders, getUserOrderById, updateUserOrder, cancelUserOrder, returnOrder, deleteUserOrder, deleteAllUserOrders,
  
  //comment section
  addOrderComment, toggleLikeComment, addPublicOrderComment, getPublicOrderComments, togglePublicCommentLike, 
  
  // review section
  addOrderReview, getOrderReviews, updateOrderReview, deleteOrderReview, getProductReviews
};