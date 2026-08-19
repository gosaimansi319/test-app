// cron/saveDailyUserStats.js
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const UserDailyStats = require("../models/UserDailyStats");

const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  console.error("MONGO_URI not found in .env");
  process.exit(1);
}

const run = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB");

    const activeCount = await User.countDocuments({ status: "active" });
    const inactiveCount = await User.countDocuments({ status: "inactive" });

    const dateStr = new Date().toISOString().split("T")[0];

    await UserDailyStats.findOneAndUpdate(
      { date: dateStr },
      {
        active: activeCount,
        inactive: inactiveCount
      },
      { upsert: true }
    );

    console.log(`User stats snapshot saved for ${dateStr}`);
  } catch (error) {
    console.error("Error saving daily user stats:", error.message);
  } finally {
    mongoose.connection.close();
  }
};

run();
