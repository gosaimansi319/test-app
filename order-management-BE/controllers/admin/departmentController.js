const Department = require("../../models/Department");
const Company = require("../../models/Company");

const createDepartment = async (req, res) => {
  try {
    const { name, company_id } = req.body;
    // const userId = req.user._id;

    if (!name || !company_id) {
      return res.status(400).json({
        status: "fail",
        message: "Department name and company_id are required",
        status_code: 400,
        data: {},
      });
    }

    const company = await Company.findById(company_id);
    if (!company) {
      return res.status(404).json({
        status: "fail",
        message: "Company not found",
        status_code: 404,
        data: {},
      });
    }

    const department = new Department({ name, company_id
      // , created_by: userId 
    });
    await department.save();

    res.status(201).json({
      status: "success",
      message: "Department created successfully",
      status_code: 201,
      data: department,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error creating department: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

const getAllDepartments = async (req, res) => {
  try {
    const { company_id } = req.query;
    const filter = company_id ? { company_id } : {};

    const departments = await Department.find(filter)
      .populate("company_id", "name");
      // .populate("created_by", "first_name last_name");

    res.status(200).json({
      status: "success",
      message: "Departments fetched successfully",
      status_code: 200,
      data: departments,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error fetching departments: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate("company_id", "name");
      // .populate("created_by", "first_name last_name");

    if (!department) {
      return res.status(404).json({
        status: "fail",
        message: "Department not found",
        status_code: 404,
        data: {},
      });
    }

    res.status(200).json({
      status: "success",
      message: "Department fetched successfully",
      status_code: 200,
      data: department,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error fetching department: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const { name, company_id } = req.body;

    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        status: "fail",
        message: "Department not found",
        status_code: 404,
        data: {},
      });
    }

    if (company_id) {
      const company = await Company.findById(company_id);
      if (!company) {
        return res.status(404).json({
          status: "fail",
          message: "Company not found",
          status_code: 404,
          data: {},
        });
      }
      department.company_id = company_id;
    }

    if (name) department.name = name;

    await department.save();

    res.status(200).json({
      status: "success",
      message: "Department updated successfully",
      status_code: 200,
      data: department,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error updating department: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        status: "fail",
        message: "Department not found",
        status_code: 404,
        data: {},
      });
    }

    await department.deleteOne();

    res.status(200).json({
      status: "success",
      message: "Department deleted successfully",
      status_code: 200,
      data: {},
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error deleting department: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

module.exports = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};
