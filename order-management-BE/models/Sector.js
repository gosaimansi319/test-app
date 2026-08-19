const mongoose = require('mongoose');

const sectorSchema = new mongoose.Schema({
  sector_name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  }
}, { 
  timestamps: true 
  }
);

module.exports = mongoose.model('Sector', sectorSchema);
