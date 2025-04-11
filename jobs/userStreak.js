"use strict";

const schedule = require("node-schedule");
const pool = require("../db.js");

// Runs at 11:59 pm every day
console.log("Schedulling Job to reset streaks at 11:59 pm every day");
schedule.scheduleJob("59 23 * * *", async function () {


  try {
    const todayDate = new Date().toISOString().split("T")[0];

    const result = await pool.query(
      `
            UPDATE user_streaks
            SET current_streak = 0, streak_updated_at = NOW()
            WHERE last_entry_date < $1
            RETURNING user_id;
        `,
      [todayDate],
    );

    console.log( `resetted streaks for users: ${result.rows.map(row => row.user_id).join(" ") }`)
  } catch (error) {
    console.error("Error resetting streaks:", error);
  }
});

console.log('scheduleJob')

