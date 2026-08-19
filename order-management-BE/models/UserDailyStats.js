// models/UserDailyStats.js
const mongoose = require("mongoose");

const userDailyStatsSchema = new mongoose.Schema({
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
    unique: true,
  },
  active: {
    type: Number,
    default: 0,
  },
  inactive: {
    type: Number,
    default: 0,
  }
});

module.exports = mongoose.model("UserDailyStats", userDailyStatsSchema);