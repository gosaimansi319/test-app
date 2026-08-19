const cron = require("node-cron");
const User = require("../models/User");
const UserDailyStats = require("../models/UserDailyStats");

cron.schedule("0 0 * * *", async () => {
  try {
    const activeCount = await User.countDocuments({ status: "active" });
    const inactiveCount = await User.countDocuments({ status: "inactive" });

    const date = new Date();
    date.setDate(date.getDate() - 1);
    const dateStr = date.toISOString().split("T")[0];

    await UserDailyStats.findOneAndUpdate(
      { date: dateStr },
      {
        active: activeCount,
        inactive: inactiveCount,
      },
      { upsert: true }
    );

    console.log(`User stats snapshot saved for ${dateStr}`);
  } catch (error) {
    console.error("Error saving daily user stats:", error.message);
  }
});
