const CenterCost = require("../../models/CenterCost");
const Department = require("../../models/Department");

const createCenterCost = async (req, res) => {
  try {
    const { name, department_id } = req.body;

    if (!name || !department_id) {
      return res.status(400).json({
        status: "fail",
        message: "Name and department_id are required",
        status_code: 400,
        data: {},
      });
    }

    const department = await Department.findById(department_id);
    if (!department) {
      return res.status(404).json({
        status: "fail",
        message: "Department not found",
        status_code: 404,
        data: {},
      });
    }

    const newCenterCost = new CenterCost({
      name,
      department_id,
      // created_by: req.user._id,
    });

    await newCenterCost.save();

    res.status(201).json({
      status: "success",
      message: "Center cost created successfully",
      status_code: 201,
      data: newCenterCost,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error creating center cost: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

const getAllCenterCosts = async (req, res) => {
  try {
    const centerCosts = await CenterCost.find()
      .populate("department_id", "name");
      // .populate("created_by", "first_name last_name email");

    res.status(200).json({
      status: "success",
      message: "Center costs fetched successfully",
      status_code: 200,
      data: centerCosts,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error fetching center costs: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

const getCenterCostById = async (req, res) => {
  try {
    const centerCost = await CenterCost.findById(req.params.id)
      .populate("department_id", "name");
      // .populate("created_by", "first_name last_name email");

    if (!centerCost) {
      return res.status(404).json({
        status: "fail",
        message: "Center cost not found",
        status_code: 404,
        data: {},
      });
    }

    res.status(200).json({
      status: "success",
      message: "Center cost fetched successfully",
      status_code: 200,
      data: centerCost,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error fetching center cost: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

const updateCenterCost = async (req, res) => {
  try {
    const { name, department_id } = req.body;

    const centerCost = await CenterCost.findById(req.params.id);
    if (!centerCost) {
      return res.status(404).json({
        status: "fail",
        message: "Center cost not found",
        status_code: 404,
        data: {},
      });
    }

    if (department_id) {
      const department = await Department.findById(department_id);
      if (!department) {
        return res.status(404).json({
          status: "fail",
          message: "Department not found",
          status_code: 404,
          data: {},
        });
      }
      centerCost.department_id = department_id;
    }

    if (name) centerCost.name = name;

    await centerCost.save();

    res.status(200).json({
      status: "success",
      message: "Center cost updated successfully",
      status_code: 200,
      data: centerCost,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error updating center cost: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

const deleteCenterCost = async (req, res) => {
  try {
    const centerCost = await CenterCost.findByIdAndDelete(req.params.id);

    if (!centerCost) {
      return res.status(404).json({
        status: "fail",
        message: "Center cost not found",
        status_code: 404,
        data: {},
      });
    }

    res.status(200).json({
      status: "success",
      message: "Center cost deleted successfully",
      status_code: 200,
      data: {},
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error deleting center cost: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

const getCenterCostsByDepartment = async (req, res) => {
  try {
    const { department_id } = req.params;

    if (!department_id) {
      return res.status(400).json({
        status: "fail",
        message: "department_id is required",
        status_code: 400,
        data: {},
      });
    }

    const centerCosts = await CenterCost.find({ department_id }).select("name");

    res.status(200).json({
      status: "success",
      message: "Center costs fetched successfully",
      status_code: 200,
      data: centerCosts,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error fetching center costs: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};


module.exports = {
  createCenterCost,
  getAllCenterCosts,
  getCenterCostById,
  updateCenterCost,
  deleteCenterCost,
  getCenterCostsByDepartment,
};
