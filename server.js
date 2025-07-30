import dotenv from "dotenv";
import app from "./app.js";
import { createServer } from "http";
import connectDB from "./db/connectdb.js";
import WebSocketService from "./services/webSocketService.js";

dotenv.config();

// Error handlers
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error(err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.error(err);
  process.exit(1);
});

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket with error handling
try {
  WebSocketService.initialize(server);
} catch (error) {
  console.error("WebSocket initialization error:", error);
}

const port = process.env.PORT || 3001;
const connectionString = process.env.DB_URL;

// Start server function with proper error handling
const startServer = async () => {
  try {
    // Connect to database
    await connectDB(connectionString);
    console.log("✅ Database connected successfully");

    // if (process.env.NODE_ENV === "development") {
    server.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log(`📱 WebSocket server is ready`);
    });
    // }
  } catch (error) {
    console.error("❌ Server startup error:", error);
    process.exit(1);
  }
};

startServer();

// Export for Vercel
export default app;
