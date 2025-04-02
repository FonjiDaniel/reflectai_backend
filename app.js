const express = require("express");
const jwt = require("jsonwebtoken");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const process = require("node:process");
const cors = require("cors");
const libraryController = require("./controllers/libraryController.js");
const authRoute = require("./route/auth.routes.js");
const libraryRoutes = require("./route/library.routes.js");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(cors());
app.use("/api/v1/", authRoute);
app.use("/api/v1/", libraryRoutes);

app.get("/", (req, res) => {
  res.send("Server is running on port ${process.env.PORT");
});

io.use((socket, next) => {
  // Verify the connected client using jwt token
  if (socket.handshake.auth.token) {
    jwt.verify(
      socket.handshake.auth.token,
      process.env.JWT_SECRET,
      (err, decoded) => {
        if (err) return next(new Error("authentication failed"));
        socket.user = decoded;
        next();
      }
    );
  }
});

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
      );
      const updatedLibrary = await libraryController.updateLibrary(
        data.id,
        data.title
      );

      if (updatedContent && updatedLibrary) {
        console.log(
          "Database updated successfully:",
          updatedContent,
          updatedLibrary
        );

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

if (require.main === module) {
  const PORT = process.env.PORT;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = {app, server, io}