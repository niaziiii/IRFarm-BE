import NotificationModel from "../models/notificationModel.js";
import storeModel from "../models/storeModel.js";
import userModel from "../models/userModel.js";
import WebSocketService from "./webSocketService.js";

export const NOTIFICATION_TYPES = {
  PRODUCT_CREATED: "PRODUCT_CREATED",
  USER_ADDED: "USER_ADDED",
  LOW_STOCK: "LOW_STOCK",
  ORDER_STATUS: "ORDER_STATUS",
  PAYMENT_RECEIVED: "PAYMENT_RECEIVED",
};

class NotificationService {
  async createAndSendNotification(data) {
    try {
      const notification = await NotificationModel.create({
        recipient: data.recipient,
        title: data.title,
        message: data.message,
        type: data.type,
        metadata: data.metadata,
      });

      // Send through WebSocket
      WebSocketService.sendNotification(data.recipient.toString(), {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        createdAt: notification.createdAt,
        metadata: notification.metadata,
        isRead: notification.isRead,
      });

      return notification;
    } catch (error) {
      console.error("Error in createAndSendNotification:", error);
      throw error;
    }
  }

  async sendNotification(data, creatorId) {
    try {
      const creatorUser = await userModel.findById(creatorId);

      if (creatorUser.role == "manager") {
        // get all super_admin
        const allSuperAdmins = await userModel.find({ role: "super_admin" });

        // Notify each super_admin send
        for (const user of allSuperAdmins) {
          await this.createAndSendNotification({
            title: data.title,
            type: data.type,
            message: data.message,
            recipient: user._id,
            metadata: {
              store: creatorUser.store_id,
              user: creatorUser._id,
            },
          });
        }
      }

      if (creatorUser.role == "user") {
        // get all super_admin
        const allSuperAdmins = await userModel.find({ role: "super_admin" });

        // get manager store
        const managerStore = await storeModel.findById(creatorUser.store_id);

        // Get store managers
        const storeManagers = await userModel.find({
          store_id: creatorUser.store_id,
          role: "manager",
        });

        // Notify all super admins
        for (const admin of allSuperAdmins) {
          await this.createAndSendNotification({
            title: data.title,
            type: data.type,
            message: data.message,
            recipient: admin._id,
            metadata: {
              store: managerStore?._id,
              user: creatorUser._id,
            },
          });
        }

        // Notify store managers
        for (const manager of storeManagers) {
          await this.createAndSendNotification({
            title: data.title,
            type: data.type,
            message: data.message,
            recipient: manager._id,
            metadata: {
              store: managerStore?._id,
              user: creatorUser._id,
            },
          });
        }
      }
    } catch (error) {
      console.error("Error sending notifications:", error);
      throw error;
    }
  }

  async getUserNotifications(req) {
    const userId = req.user._id;
    const { startDate, endDate } = req.body || {};

    const filter = { recipient: userId };

    if (startDate || endDate) {
      filter.createdAt = {};

      if (startDate) {
        const startDateObj = new Date(startDate);
        startDateObj.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = startDateObj;
      }

      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDateObj;
      }
    }

    return await NotificationModel.find(filter).sort({ createdAt: -1 });
  }

  async markAsRead(notificationId, userId) {
    return await NotificationModel.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true },
      { new: true }
    );
  }

  async markAllAsRead(userId) {
    return await NotificationModel.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );
  }
}

export default new NotificationService();
