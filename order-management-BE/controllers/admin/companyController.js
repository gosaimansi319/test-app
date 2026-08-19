const Company = require("../../models/Company");
const User = require("../../models/User");

// Create a company
const createCompany = async (req, res) => {
  try {
    const { name } = req.body;
    // const userId = req.user._id;

    if (!name) {
      return res.status(400).json({
        status: "fail",
        message: "Company name is required",
        status_code: 400,
        data: {},
      });
    }

    const existing = await Company.findOne({ name });
    if (existing) {
      return res.status(400).json({
        status: "fail",
        message: "Company with this name already exists",
        status_code: 400,
        data: {},
      });
    }

    const company = new Company({ name,
      //  created_by: userId 
    });
    await company.save();

    res.status(201).json({
      status: "success",
      message: "Company created successfully",
      status_code: 201,
      data: company,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error creating company: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

// Get all companies
const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find();
    // .populate("created_by", "first_name last_name email");

    res.status(200).json({
      status: "success",
      message: "Companies fetched successfully",
      status_code: 200,
      data: companies,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error fetching companies: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

// Get company by ID
const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    // .populate("created_by", "first_name last_name email");

    if (!company) {
      return res.status(404).json({
        status: "fail",
        message: "Company not found",
        status_code: 404,
        data: {},
      });
    }

    res.status(200).json({
      status: "success",
      message: "Company fetched successfully",
      status_code: 200,
      data: company,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error fetching company: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

// Update company
const updateCompany = async (req, res) => {
  try {
    const { name } = req.body;

    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        status: "fail",
        message: "Company not found",
        status_code: 404,
        data: {},
      });
    }

    if (name) company.name = name;

    await company.save();

    res.status(200).json({
      status: "success",
      message: "Company updated successfully",
      status_code: 200,
      data: company,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error updating company: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

// Delete company
const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        status: "fail",
        message: "Company not found",
        status_code: 404,
        data: {},
      });
    }

    await company.deleteOne();

    res.status(200).json({
      status: "success",
      message: "Company deleted successfully",
      status_code: 200,
      data: {},
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error deleting company: " + err.message,
      status_code: 500,
      data: {},
    });
  }
};

module.exports = {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
};
