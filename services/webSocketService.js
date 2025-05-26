import { Server } from "socket.io";
import jwt from "jsonwebtoken";

class WebSocketService {
  constructor() {
    this.io = null;
    this.connections = new Map();
  }

  initialize(server) {
    if (!server) {
      console.warn("Server instance not provided for WebSocket initialization");
      return;
    }

    try {
      // Initialize Socket.IO with configuration
      this.io = new Server(server, {
        path: "/socket.io",
        cors: {
          origin: "*", // You can restrict this to specific domains
          methods: ["GET", "POST"],
          credentials: true,
          allowedHeaders: ["Content-Type", "Authorization"],
        },
        transports: ["websocket", "polling"],
        allowEIO3: true,
        pingTimeout: 60000,
        pingInterval: 25000,
        connectTimeout: 45000,
      });

      // Set up authentication middleware
      this.io.use(async (socket, next) => {
        try {
          const token =
            socket.handshake.auth.token || socket.handshake.query.token;

          if (!token) {
            return next(new Error("Authentication required"));
          }

          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          socket.userId = decoded._id.toString();
          next();
        } catch (error) {
          console.error("WebSocket authentication error:", error);
          next(new Error("Authentication failed"));
        }
      });

      // Handle connection event
      this.io.on("connection", (socket) => {
        this.handleConnection(socket);
      });

      // Handle server-level errors
      this.io.engine.on("connection_error", (err) => {
        console.error("Connection error:", err);
      });
    } catch (error) {
      console.error("WebSocket service initialization error:", error);
      throw error;
    }
  }

  handleConnection(socket) {
    try {
      const userId = socket.userId;
      this.connections.set(userId, socket);

      console.log(`User connected: ${userId}`);
      console.log("Active connections:", this.getActiveConnections());

      // Join user to their specific room
      socket.join(`user_${userId}`);

      // Send connection success message
      socket.emit("connection_success", {
        type: "CONNECTION_SUCCESS",
        message: "Successfully connected to notification service",
      });

      // Handle disconnect event
      socket.on("disconnect", () => {
        this.handleDisconnect(socket, userId);
      });

      // Handle errors
      socket.on("error", (error) => {
        console.error(`Socket error for user ${userId}:`, error);
      });
    } catch (error) {
      console.error("Error in handleConnection:", error);
    }
  }

  handleDisconnect(socket, userId) {
    try {
      console.log(`User disconnected: ${userId}`);
      this.connections.delete(userId);
      socket.leave(`user_${userId}`);
      console.log(
        "Active connections after disconnect:",
        this.getActiveConnections()
      );
    } catch (error) {
      console.error("Error in handleDisconnect:", error);
    }
  }

  sendNotification(userId, notification) {
    try {
      console.log("Attempting to send notification to user:", userId);
      console.log("Active connections:", this.getActiveConnections());

      if (!this.io) {
        console.warn("Socket.IO instance not initialized");
        return;
      }

      this.io.to(`user_${userId}`).emit("notification", {
        type: "NOTIFICATION",
        data: notification,
      });
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  }

  broadcastNotification(userIds, notification) {
    try {
      if (!Array.isArray(userIds)) {
        console.error("userIds must be an array");
        return;
      }

      userIds.forEach((userId) => {
        this.sendNotification(userId, notification);
      });
    } catch (error) {
      console.error("Error broadcasting notification:", error);
    }
  }

  getActiveConnections() {
    return Array.from(this.connections.keys());
  }

  isUserConnected(userId) {
    return this.connections.has(userId);
  }

  disconnect() {
    if (this.io) {
      this.io.close();
      this.connections.clear();
      this.io = null;
    }
  }
}

// Export a singleton instance
const webSocketService = new WebSocketService();
export default webSocketService;
