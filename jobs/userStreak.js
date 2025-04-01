
import schedule from "node-schedule";
import axios from "axios";
// Runs at 11 59 pm every day
schedule.scheduleJob('59 23 * * *', async function() {
  try {
    const response = await axios.post('http://localhost:5000/api/v1/reset-streaks');
    console.log('Streaks reset successfully:', response.data);
  } catch (error) {
    console.error('Error resetting streaks:', error);
  }
});