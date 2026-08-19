// controllers/sectorController.js
const Sector = require("../../models/Sector");

// Create a new sector
const createSector = async (req, res) => {
  try {
    const { sector_name } = req.body;

    if (!sector_name) {
      return res.status(400).json({
        status: "fail",
        message: "sector_name is required",
        status_code: 400,
      });
    }

    const existing = await Sector.findOne({ sector_name });
    if (existing) {
      return res.status(400).json({
        status: "fail",
        message: "Sector already exists",
        status_code: 400,
      });
    }

    const sector = await Sector.create({ sector_name });

    res.status(201).json({
      status: "success",
      message: "Sector created successfully",
      status_code: 201,
      data: sector,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error creating sector: " + err.message,
      status_code: 500,
    });
  }
};

// Get all sectors
const getAllSectors = async (req, res) => {
  try {
    const sectors = await Sector.find().select("_id sector_name");

    res.status(200).json({
      status: "success",
      message: "Sectors fetched successfully",
      status_code: 200,
      data: sectors,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error fetching sectors: " + err.message,
      status_code: 500,
    });
  }
};

// Delete sector
const deleteSector = async (req, res) => {
  try {
    const { id } = req.params;

    const sector = await Sector.findById(id);
    if (!sector) {
      return res.status(404).json({
        status: "fail",
        message: "Sector not found",
        status_code: 404,
      });
    }

    await sector.deleteOne();

    res.status(200).json({
      status: "success",
      message: "Sector deleted successfully",
      status_code: 200,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: "Error deleting sector: " + err.message,
      status_code: 500,
    });
  }
};

module.exports = { 
  createSector, 
  getAllSectors, 
  deleteSector 
};
