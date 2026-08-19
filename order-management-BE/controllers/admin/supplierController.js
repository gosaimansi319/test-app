const Company = require("../../models/Company");
const Order = require("../../models/Order");
const Supplier = require("../../models/Supplier");

function generateSupplierId(branchCode = "110") {
  const date = new Date();
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  const random = Math.floor(10000 + Math.random() * 90000);
  return `OD-${dd}${mm}${yy}-${branchCode}-${random}`;
}

// Create a Supplier
const createSupplier = async (req, res) => {
  try {
    const { company_name, ...rest } = req.body;

    if (!company_name) {
      return res.status(400).json({
        status: "fail",
        message: "Company name is required",
        status_code: 400,
      });
    }

    const supplierData = {
      ...rest,
      company_name,
      supplier_id: generateSupplierId(),
    };

    const supplier = new Supplier(supplierData);
    await supplier.save();

    res.status(201).json({
      status: "success",
      message: "Supplier created successfully",
      status_code: 201,
      data: supplier,
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: "Failed to create supplier",
      status_code: 400,
      error: err.message,
    });
  }
};

// Get All Supplier
const getSuppliers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { contact_person, company_name, address } = req.query;

    const filter = {};

    if (contact_person) {
      filter.contact_person = { $regex: contact_person, $options: "i" };
    }
    if (company_name) {
      filter.company_name = { $regex: company_name, $options: "i" };
    }
    if (address) {
      filter.address = { $regex: address, $options: "i" };
    }

    const [suppliers, total] = await Promise.all([
      Supplier.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Supplier.countDocuments(filter),
    ]);

    res.status(200).json({
      status: "success",
      message: "Suppliers fetched successfully",
      status_code: 200,
      data: {
        suppliers: suppliers,
        pagination: {
          page: page,
          limit: limit,
          total_pages: Math.ceil(total / limit),
          total_items: total,
        },
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Error fetching suppliers",
      status_code: 500,
      error: err.message,
    });
  }
};

// Get a Supplier by Id
const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({
        status: "error",
        message: "Supplier not found",
        status_code: 404,
      });
    }
    res.status(200).json({
      status: "success",
      message: "Supplier fetched successfully",
      status_code: 200,
      data: supplier,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Error fetching supplier",
      status_code: 500,
      error: err.message,
    });
  }
};

// Update Supplier
const updateSupplier = async (req, res) => {
  try {
    const updated = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) {
      return res.status(404).json({
        status: "error",
        message: "Supplier not found",
        status_code: 404,
      });
    }
    res.status(200).json({
      status: "success",
      message: "Supplier updated successfully",
      status_code: 200,
      data: updated,
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: "Failed to update supplier",
      status_code: 400,
      error: err.message,
    });
  }
};

// Delete a Supplier
// const deleteSupplier = async (req, res) => {
//   try {
//     const deleted = await Supplier.findByIdAndDelete(req.params.id);
//     if (!deleted) {
//       return res.status(404).json({
//         status: "error",
//         message: "Supplier not found",
//         status_code: 404,
//       });
//     }
//     res.status(200).json({
//       status: "success",
//       message: "Supplier deleted successfully",
//       status_code: 200,
//       data: {},
//     });
//   } catch (err) {
//     res.status(500).json({
//       status: "error",
//       message: "Failed to delete supplier",
//       status_code: 500,
//       error: err.message,
//     });
//   }
// };

const deleteSupplier = async (req, res) => {
  try {
    const supplierId = req.params.id;

    // Check if the supplier exists
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({
        status: "error",
        message: "Supplier not found",
        status_code: 404,
      });
    }

    // Check for any orders using this supplier
    const ordersUsingSupplier = await Order.find({ "products.supplier_id": supplierId })
      .select("orderStatus")
      .lean();

    if (ordersUsingSupplier.length > 0) {
      // Check if all such orders are marked as "Completed"
      const hasNonCompleted = ordersUsingSupplier.some(
        (order) => order.orderStatus !== "Completed"
      );

      if (hasNonCompleted) {
        return res.status(400).json({
          status: "error",
          message: "Supplier is linked to incomplete orders. Deletion not allowed.",
          status_code: 400,
        });
      }
    }

    // Safe to delete
    await Supplier.findByIdAndDelete(supplierId);

    return res.status(200).json({
      status: "success",
      message: "Supplier deleted successfully",
      status_code: 200,
      data: {},
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Failed to delete supplier",
      status_code: 500,
      error: err.message,
    });
  }
};

// Delete All Suppliers
const deletePaginatedSuppliers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const suppliersToDelete = await Supplier.find().skip(skip).limit(limit);

    if (suppliersToDelete.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No suppliers found in this page range",
        status_code: 404,
        data: {},
      });
    }

    const deletableSupplierIds = [];

    for (const supplier of suppliersToDelete) {
      const ordersUsingSupplier = await Order.find({
        "products.supplier_id": supplier._id,
      }).select("orderStatus").lean();

      if (ordersUsingSupplier.length === 0) {
        // Not used in any order — can delete
        deletableSupplierIds.push(supplier._id);
      } else {
        // Check if all orders using this supplier are Completed
        const hasNonCompleted = ordersUsingSupplier.some(
          (order) => order.orderStatus !== "Completed"
        );
        if (!hasNonCompleted) {
          deletableSupplierIds.push(supplier._id);
        }
      }
    }

    if (deletableSupplierIds.length === 0) {
      return res.status(400).json({
        status: "error",
        message:
          "No suppliers in this page can be deleted. They are used in active orders.",
        status_code: 400,
        data: {},
      });
    }

    await Supplier.deleteMany({ _id: { $in: deletableSupplierIds } });

    res.status(200).json({
      status: "success",
      message: `Deleted ${suppliersToDelete.length} suppliers from page ${page}`,
      status_code: 200,
      data: {
        deletedCount: suppliersToDelete.length,
        page,
        limit,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Error deleting paginated suppliers: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

module.exports = { 
  createSupplier, 
  getSuppliers, 
  getSupplierById, 
  updateSupplier, 
  deleteSupplier, 
  deletePaginatedSuppliers 
};