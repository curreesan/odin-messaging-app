import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

import profileRoutes from "./src/routes/profileRoutes.js";
import friendshipRoutes from "./src/routes/friendshipRoutes.js";
import conversationRoutes from "./src/routes/conversationRoutes.js";
import messageRoutes from "./src/routes/messageRoutes.js";
import initSocket from "./src/lib/socket.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const httpServer = createServer(app);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  }),
);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ message: "Messaging App API is running!", status: "ok" });
});

app.use("/api/profiles", profileRoutes);
app.use("/api/friendships", friendshipRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

initSocket(io);

httpServer.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
