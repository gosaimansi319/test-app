const { default: mongoose } = require("mongoose");
const Order = require("../../models/Order");
const Product = require("../../models/Product");
const Role = require("../../models/Role");
const Supplier = require("../../models/Supplier");
const User = require("../../models/User");
const { generateSignedUrl, uploadFileToS3 } = require("../../utils/s3");

const generateProductId = () => {
  const prefix = "OD";
  const date = new Date();
  const datePart = `${String(date.getDate()).padStart(2, "0")}${String(
    date.getMonth() + 1
  ).padStart(2, "0")}${String(date.getFullYear()).slice(2)}`;
  const branchCode = "110";
  const randomNumber = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${datePart}-${branchCode}-${randomNumber}`;
};

// Skip all regex special characters
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Create product
const createProduct = async (req, res) => {
  try {
    const {
      product_name,
      brand_name,
      UN,
      ERP_number,
      sector,
      description,
      suppliers,
    } = req.body;

    if (!product_name || !brand_name || !UN || !ERP_number || !sector || !suppliers) {
      return res.status(400).json({
        status: "fail",
        message: "Required fields missing",
        status_code: 400,
        data: {},
      });
    }

    const parsedSuppliers = JSON.parse(suppliers); // suppliers array
    const supplierEntries = [];

    for (const supplier of parsedSuppliers) {
      const supplierDoc = await Supplier.findOne({ company_name: supplier.company_name });

      if (!supplierDoc) {
        return res.status(404).json({
          status: "fail",
          message: `Supplier '${supplier.company_name}' not found`,
          status_code: 404,
          data: {},
        });
      }

      supplierEntries.push({
        supplier_id: supplierDoc._id,
        price: supplier.price,
        previous_price: null,
        changed_date: null,
        updated_by: req.user.id,
      });
    }

    // Check for duplicate product_name
    const existingProduct = await Product.findOne({ product_name: product_name.trim() });
    if (existingProduct) {
      return res.status(409).json({
        status: "fail",
        message: `Product with name '${product_name}' already exists`,
        status_code: 409,
        data: {},
      });
    }

    const product_id = generateProductId();
    
    let s3Key = null;
    if (req.file) {
      const s3Result = await uploadFileToS3(req.file.buffer, req.file.originalname, 'uploads/product', req.file.mimetype);
      s3Key = s3Result.Key;
    }

    const product = new Product({
      product_id,
      user_id: req.user.id,
      product_name,
      brand_name,
      UN,
      ERP_number,
      sector,
      file: s3Key,
      description,
      suppliers: supplierEntries,
    });

    await product.save();

    const populatedProduct = await Product.findById(product._id)
      .populate({
        path: 'suppliers.supplier_id',
        select: 'company_name',
      })
      .populate({
        path: 'suppliers.updated_by',
        select: 'first_name last_name role_id',
        populate: {
          path: 'role_id',
          select: 'name',
        },
      });

    const formattedSuppliers = populatedProduct.suppliers.map(s => ({
      supplier_id: s.supplier_id._id,
      company_name: s.supplier_id.company_name,
      price: s.price,
      previous_price: s.previous_price,
      changed_date: s.changed_date,
      updated_by: s.updated_by
        ? {
            name: `${s.updated_by.first_name || ""} ${s.updated_by.last_name || ""}`.trim(),
            role: s.updated_by.role_id?.name || "N/A",
          }
        : null,
    }));

    const productResponse = {
      ...populatedProduct.toObject(),
      suppliers: formattedSuppliers,
    };

    if (productResponse.file) {
      productResponse.file = generateSignedUrl(productResponse.file);
    }

    res.status(201).json({
      status: "success",
      message: "Product created successfully",
      status_code: 201,
      data: productResponse,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error creating product: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

// Update Product
const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const {
      product_name,
      brand_name,
      UN,
      ERP_number,
      sector,
      description,
      suppliers,
    } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        status: "fail",
        message: "Product not found",
        status_code: 404,
        data: {},
      });
    }

    // Update basic fields
    if (product_name) product.product_name = product_name;
    if (brand_name) product.brand_name = brand_name;
    if (UN) product.UN = UN;
    if (ERP_number) product.ERP_number = ERP_number;
    if (sector) product.sector = sector;
    if (description) product.description = description;
    if (req.file) {
      const s3Result = await uploadFileToS3(req.file.buffer, req.file.originalname, 'uploads/product', req.file.mimetype);
      product.file = s3Result.Key;
    }

    // if (!req.file) {
    //   return res.status(400).json({
    //     status: "fail",
    //     message: "Product image (file) is required.",
    //     status_code: 400,
    //     data: {},
    //   });
    // }

    // Handle suppliers
    if (suppliers) {
      let parsedSuppliers;
      try {
        parsedSuppliers = JSON.parse(suppliers);
      } catch (e) {
        return res.status(400).json({
          status: "fail",
          message: "Invalid JSON format in suppliers",
          status_code: 400,
          data: {},
        });
      }

      // for (const updatedSupplier of parsedSuppliers) {
      //   const supplierDoc = await Supplier.findOne({
      //     company_name: updatedSupplier.company_name,
      //   });

      //   if (!supplierDoc) {
      //     return res.status(404).json({
      //       status: "fail",
      //       message: `Supplier '${updatedSupplier.company_name}' not found`,
      //       status_code: 404,
      //       data: {},
      //     });
      //   }

      //   const existing = product.suppliers.find(
      //     (s) => s.supplier_id.toString() === supplierDoc._id.toString()
      //   );

      //   if (existing) {
      //     if (existing.price !== updatedSupplier.price) {
      //       existing.previous_price = existing.price;
      //       existing.price = updatedSupplier.price;
      //       existing.changed_date = new Date();
      //       existing.updated_by = req.user?._id;
      //     }
      //   } else {
      //     product.suppliers.push({
      //       supplier_id: supplierDoc._id,
      //       price: updatedSupplier.price,
      //       previous_price: null,
      //       changed_date: null,
      //       updated_by: req.user?._id || null,
      //     });
      //   }
      // }

      const newSupplierIds = [];

      for (const updatedSupplier of parsedSuppliers) {
        const supplierDoc = await Supplier.findOne({
          company_name: updatedSupplier.company_name,
        });

        if (!supplierDoc) {
          return res.status(404).json({
            status: "fail",
            message: `Supplier '${updatedSupplier.company_name}' not found`,
            status_code: 404,
            data: {},
          });
        }

        newSupplierIds.push(supplierDoc._id.toString());

        const existing = product.suppliers.find(
          (s) => s.supplier_id.toString() === supplierDoc._id.toString()
        );

        if (existing) {
          if (existing.price !== updatedSupplier.price) {
            existing.previous_price = existing.price;
            existing.price = updatedSupplier.price;
            existing.changed_date = new Date();
            existing.updated_by = req.user?._id;
          }
        } else {
          product.suppliers.push({
            supplier_id: supplierDoc._id,
            price: updatedSupplier.price,
            previous_price: null,
            changed_date: null,
            updated_by: req.user?._id || null,
          });
        }
      }

      // Remove suppliers not in new list
      product.suppliers = product.suppliers.filter((s) =>
        newSupplierIds.includes(s.supplier_id.toString())
      );
    }

    await product.save();

    // Populate supplier company_name
    const populatedProduct = await Product.findById(product._id).populate({
      path: "suppliers.supplier_id",
      select: "company_name",
    }).lean();

    const formattedSuppliers = populatedProduct.suppliers
      .filter(s => s.supplier_id) // skip null references
      .map((s) => ({
        supplier_id: s.supplier_id._id,
        company_name: s.supplier_id.company_name,
        price: s.price,
        previous_price: s.previous_price,
        changed_date: s.changed_date,
    }));

    const productResponse = {
      ...populatedProduct,
      suppliers: formattedSuppliers,
    };

    if (productResponse.file) {
      productResponse.file = generateSignedUrl(productResponse.file);
    }
    
    return res.status(200).json({
      status: "success",
      message: "Product updated successfully",
      status_code: 200,
      data: productResponse,
    });
  } catch (err) {
    return res.status(500).json({
      status: "fail",
      message: "Error updating product: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

// Updated price of Product
const getUpdatedPriceProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { productId } = req.params;

    if (productId) {
      const product = await Product.findById(productId)
        .populate("suppliers.supplier_id")
        .populate({
          path: "suppliers.updated_by",
          select: "first_name last_name role_id",
          populate: {
            path: "role_id",
            select: "name",
          },
        })
        .lean();

      if (!product) {
        return res.status(404).json({
          status: "error",
          message: "Product not found",
          status_code: 404,
          data: {},
        });
      }

      // Filter suppliers with previous_price and changed_date
      const filteredSuppliers = product.suppliers.filter(
        (s) => s.previous_price !== null && s.changed_date !== null && s.supplier_id
      );

      const totalSuppliers = filteredSuppliers.length;

      // Paginate suppliers array manually
      const paginatedSuppliers = filteredSuppliers.slice(skip, skip + limit);

      // Formatted suppliers
      const updatedSuppliers = paginatedSuppliers.map((s) => ({
        supplier: s.supplier_id || {},
        price: s.price,
        previous_price: s.previous_price,
        changed_date: s.changed_date,
        updated_by: s.updated_by
          ? {
              name: `${s.updated_by.first_name || ""} ${s.updated_by.last_name || ""}`.trim(),
              role: s.updated_by.role_id?.name || "N/A",
            }
          : null,
      }));

      const responseData = {
        product_id: product._id,
        product_name: product.product_name,
        brand_name: product.brand_name,
        updated_suppliers: updatedSuppliers,
        pagination: {
          page,
          limit,
          total_pages: Math.ceil(totalSuppliers / limit),
          total_items: totalSuppliers,
        },
      };

      return res.status(200).json({
        status: "success",
        message: "Updated product prices fetched successfully",
        status_code: 200,
        data: responseData,
      });
    } else {
      const filter = {
        suppliers: {
          $elemMatch: {
            previous_price: { $ne: null },
            changed_date: { $ne: null },
          },
        },
      };

      const [products, total_items] = await Promise.all([
        Product.find(filter)
          .skip(skip)
          .limit(limit)
          .populate("suppliers.supplier_id")
          .populate({
            path: "suppliers.updated_by",
            select: "first_name last_name role_id",
            populate: {
              path: "role_id",
              select: "name",
            },
          })
          .lean(),
        Product.countDocuments(filter),
      ]);

      if (!products.length) {
        return res.status(404).json({
          status: "error",
          message: "No product found with updated prices",
          status_code: 404,
          data: {},
        });
      }

      const formatted = products.map((product) => {
        const updatedSuppliers = product.suppliers
          .filter((s) => s.previous_price !== null && s.changed_date !== null)
          .map((s) => ({
            supplier: s.supplier_id || {},
            price: s.price,
            previous_price: s.previous_price,
            changed_date: s.changed_date,
            updated_by: s.updated_by
              ? {
                  name: `${s.updated_by.first_name || ""} ${s.updated_by.last_name || ""}`.trim(),
                  role: s.updated_by.role_id?.name || "N/A",
                }
              : null,
          }));

        return {
          product_id: product._id,
          product_name: product.product_name,
          brand_name: product.brand_name,
          updated_suppliers: updatedSuppliers,
        };
      });

      res.status(200).json({
        status: "success",
        message: "Updated product prices fetched successfully",
        status_code: 200,
        data: {
          products: formatted,
          pagination: {
            page,
            limit,
            total_pages: Math.ceil(total_items / limit),
            total_items,
          },
        },
      });
    }
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Failed to fetch updated product prices",
      status_code: 500,
      data: {},
    });
  }
};

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { name, role, date } = req.query;
    const filters = {};

    if (name) {
      const escapedName = escapeRegex(name);
      filters.product_name = { $regex: escapedName, $options: 'i' };
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filters.createdAt = { $gte: startDate, $lt: endDate };
    }

    const products = await Product.find(filters)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate({
        path: "suppliers.supplier_id",
        select: "company_name"
      });

    const formatted = await Promise.all(products.map(async (product) => {
      const productObj = product.toJSON();

      // Attach user data
      const user = await User.findById(productObj.user_id).populate('role_id');
      productObj.user = user;

      // Filter by user role
      if (role && user?.role_id?.name?.toLowerCase() !== role.toLowerCase()) {
        return null;
      }

      if (productObj.file) {
        productObj.file = generateSignedUrl(productObj.file);
      }

      productObj.suppliers = productObj.suppliers.map((s) => ({
        supplier_id: s.supplier_id?._id,
        company_name: s.supplier_id?.company_name,
        price: s.price,
        previous_price: s.previous_price,
        changed_date: s.changed_date,
      })).filter(s => s.supplier_id);

      return productObj;
    }));

    const filteredProducts = formatted.filter(p => p !== null);

    let totalProducts = await Product.countDocuments(filters);
    if (role) {
      totalProducts = filteredProducts.length;
    }

    res.status(200).json({
      status: "success",
      message: "Products fetched successfully",
      status_code: 200,
      data: {
        products: filteredProducts,
        pagination: {
          page,
          limit,
          total_pages: Math.ceil(totalProducts / limit),
          total_items: totalProducts,
        },
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error fetching products: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

// Get a Single Product
const getSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate({
        path: "suppliers.supplier_id",
        select: "company_name"
      });

    if (!product) {
      return res.status(404).json({
        status: "fail",
        message: "Product not found",
        status_code: 404,
        data: {},
      });
    }

    const productObj = product.toJSON();

    if (productObj.file) {
      productObj.file = generateSignedUrl(productObj.file);
    }

    // Format supplier data
    productObj.suppliers = productObj.suppliers.map((s) => ({
      supplier_id: s.supplier_id?._id,
      company_name: s.supplier_id?.company_name,
      price: s.price,
      previous_price: s.previous_price,
      changed_date: s.changed_date,
    })).filter(s => s.supplier_id);

    res.status(200).json({
      status: "success",
      message: "Product fetched successfully",
      status_code: 200,
      data: productObj,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error fetching product: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

// Delete a Product
const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid product ID format",
        status_code: 400,
        data: {},
      });
    }

    const deletedProduct = await Product.findOneAndDelete({ _id: productId });

    if (!deletedProduct) {
      return res.status(404).json({
        status: "fail",
        message: "Product not found",
        status_code: 404,
        data: {},
      });
    }

    res.status(200).json({
      status: "success",
      message: "Product deleted successfully",
      status_code: 200,
      data: {},
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error deleting product: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

// Delete all products
const deletePaginatedProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const productsToDelete = await Product.find().skip(skip).limit(limit);

    if (productsToDelete.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "No products found in this page range",
        status_code: 404,
        data: {},
      });
    }

    const idsToDelete = productsToDelete.map((product) => product._id);
    const productNamesToDelete = productsToDelete.map((product) => product.product_name);

    const deletedOrdersResult = await Order.deleteMany({
      order_name: { $in: productNamesToDelete },
    });

    const deletedProductsResult = await Product.deleteMany({ _id: { $in: idsToDelete } });
    
    res.status(200).json({
      status: "success",
      message: `Deleted ${productsToDelete.length} products from page ${page}`,
      status_code: 200,
      data: {
        deletedProducts: deletedProductsResult.deletedCount,
        deletedOrders: deletedOrdersResult.deletedCount,
        page,
        limit,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error deleting paginated products: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

const getAllProductsWithoutPagination = async (req, res) => {
  try {
    const { name, role, date } = req.query;
    const filters = {};

    if (name) {
      const escapedName = escapeRegex(name);
      filters.product_name = { $regex: escapedName, $options: 'i' };
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filters.createdAt = { $gte: startDate, $lt: endDate };
    }

    const products = await Product.find(filters)
      .sort({ createdAt: -1 })
      .populate({
        path: "suppliers.supplier_id",
        select: "company_name"
      });

    const formatted = await Promise.all(products.map(async (product) => {
      const productObj = product.toJSON();

      // Attach user data
      const user = await User.findById(productObj.user_id).populate('role_id');
      productObj.user = user;

      // Filter by user role if specified
      if (role && user?.role_id?.name?.toLowerCase() !== role.toLowerCase()) {
        return null;
      }

      if (productObj.file) {
        productObj.file = generateSignedUrl(productObj.file);
      }

      productObj.suppliers = productObj.suppliers.map((s) => ({
        supplier_id: s.supplier_id?._id,
        company_name: s.supplier_id?.company_name,
        price: s.price,
        previous_price: s.previous_price,
        changed_date: s.changed_date,
      })).filter(s => s.supplier_id);

      return productObj;
    }));

    const filteredProducts = formatted.filter(p => p !== null);

    res.status(200).json({
      status: "success",
      message: "Products fetched successfully",
      status_code: 200,
      data: {
        products: filteredProducts,
        total_items: filteredProducts.length,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error fetching products: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

module.exports = { 
  createProduct, 
  updateProduct, 
  getAllProducts, 
  getSingleProduct, 
  deleteProduct, 
  deletePaginatedProducts, 
  getUpdatedPriceProducts,
  getAllProductsWithoutPagination
};