import "dotenv/config";

import http from "http";
import express from "express";
import cors from "cors";

import connectDB from "./config/db.js";
import User from "./models/User.js";
import authRoutes from "./routes/authRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import savedMessageRoutes from "./routes/savedMessageRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import workItemRoutes from "./routes/workItemRoutes.js";
import { configureSocketServer } from "./socket/socketServer.js";

const app = express();

// Render forwards requests through one trusted proxy. This lets rate limiting
// use the real client address from X-Forwarded-For without trusting every proxy.
app.set("trust proxy", 1);

// Allow the frontend (a different origin/port in dev) to call this API.
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// Parse JSON request bodies (e.g. POST /api/auth/login { email, password }).
app.use(express.json());

// Simple liveness check - hit this to confirm the server is up and responding.
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/saved-messages", savedMessageRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/users", userRoutes);
app.use("/api/work-items", workItemRoutes);


// Catch-all 404 for unmatched API routes.
app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

// Central error handler - any route/middleware that calls next(err) ends up here.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      message: `File must be ${process.env.MAX_FILE_SIZE_MB || 25}MB or smaller.`,
    });
  }
  res
    .status(err.status || 500)
    .json({ message: err.message || "Server error" });
});

// Wrap the Express app in a raw HTTP server so Socket.io can attach to the
// same server instance later (Step 4) instead of running on a second port.
const server = http.createServer(app);
const io = configureSocketServer(server);
app.set("io", io);

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();

  // Socket IDs disappear when Node restarts, so clear stale presence left by
  // a previous server process before accepting fresh Socket.IO connections.
  await User.updateMany(
    { isSystemBot: false },
    { $set: { isOnline: false, socketIds: [], lastSeen: new Date() } },
  );

  server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

start();

export { app, server };
