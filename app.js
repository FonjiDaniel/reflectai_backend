import express from "express";
import jwt from "jsonwebtoken"
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import process from "node:process"
import cors from "cors";
import  libraryController from "./controllers/libraryController.js";
import authRoute from "./route/auth.routes.js";
import libraryRoutes from "./route/library.routes.js"


dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.json());
app.use(cors());
app.use('/api/v1/', authRoute);
app.use('/api/v1/', libraryRoutes);


io.use(((socket, next) => {


  // Verify the connected client
  if(socket.handshake.auth.token){
    jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET, (err, decoded)  => {
      if (err) return next(new Error(" authentication failed"));
      socket.user = decoded;
      next()
    })
  }
}))

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("updateLibrary", async (data) => {
    console.log("Library update received:", data);

    try {
      const updatedContent = await libraryController.updateLibraryContent(
        data.id,
        data.title,
        data.content,
        data.metadata,
        data.wordCount
      )
      const updatedLibrary = await libraryController.updateLibrary(data.id, data.title);

      if (updatedContent && updatedLibrary) {
        console.log("Database updated successfully:", updatedContent, updatedLibrary);

        
        io.emit("libraryUpdated", updatedContent);
      } else {
        console.error("Update failed: content item not found");
      }
    } catch (error) {
      console.error("Error updating database:", error);



    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));