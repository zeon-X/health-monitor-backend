/**
 * Main Express + Socket.IO Server
 * Coordinates: HTTP API, WebSocket broadcasting, Health monitoring service
 */

require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const apiRoutes = require("./routes/api");
const HealthMonitoringService = require("./services/healthMonitoringService");
const { error } = require("console");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
// Replace ${DB_PASSWORD} in connection string with actual password from env
const mongoUri =
  process.env.MONGODB_URI?.replace(
    "${DB_PASSWORD}",
    process.env.DB_PASSWORD || ""
  ) || "mongodb://localhost:27017/health-monitor";

mongoose
  .connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ Connected to MongoDB");
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  });

// Initialize Health Monitoring Service
const healthService = new HealthMonitoringService(io);

// Routes
app.use("/api", apiRoutes);

// WebSocket Events
io.on("connection", (socket) => {
  console.log(`👤 Client connected: ${socket.id}`);

  // Send welcome message
  socket.emit("welcome", {
    message: "Connected to Health Monitoring System",
    timestamp: new Date().toISOString(),
  });

  // Join patient-specific room
  socket.on("subscribe_patient", (patientId) => {
    socket.join(`patient_${patientId}`);
    console.log(`📌 ${socket.id} subscribed to patient_${patientId}`);
    socket.emit("subscribed", { patientId });
  });

  // Acknowledge anomaly
  socket.on("acknowledge_alert", async (data) => {
    console.log(`✅ Alert acknowledged: ${data.anomalyId}`);
    socket.broadcast.emit("alert_acknowledged", data);
  });

  socket.on("disconnect", () => {
    console.log(`👤 Client disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error", error: err.message });
});

// Start Server
const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║   🏥 ELDERLY PATIENT HEALTH MONITORING SYSTEM      ║
║   Backend API running on http://localhost:${PORT}      ║
╚════════════════════════════════════════════════════╝
  `);

  // Start health monitoring
  await healthService.startMonitoring();
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down...");
  healthService.stopMonitoring();
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = { app, server, io };
