import express from "express";
import process from "node:process"
import dotenv from "dotenv"
import authRoute from "./route/auth.routes.js";
import libraryRoutes from "./route/library.routes.js";
import cors from "cors";
 

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());


app.use('/api/v1/', authRoute);
app.use('/api/v1/', libraryRoutes)
app.get('/', (req, res) => {
    res.send('This is the reflectai v1 backend server');
  });
  


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

