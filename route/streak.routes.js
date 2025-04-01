import express from "express";
const streakRoute = express.Router();
import pool from "../db.js";

streakRoute.post("/reset-streaks", async (req, res) => {
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

    res.json({
      message: "Streaks reset successfully",
      usersAffected: result.rowCount,
    });
  } catch (error) {
    console.error("Error resetting streaks:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default streakRoute;
