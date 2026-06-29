const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['INQUIRY', 'MESSAGE', 'SYSTEM', 'VIEW', 'SHARE', 'ROOM_INQUIRY', 'VISIT_REQUEST', 'REQUEST_ACCEPTED', 'REQUEST_REJECTED'], required: true },
  content: { type: String, required: true },
  relatedRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Actionable metadata
  actionStatus: { type: String, enum: ['pending', 'accepted', 'rejected', 'none'], default: 'none' },
  actionData: { type: mongoose.Schema.Types.Mixed }, // Custom data like desired visit date
  
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Notification", NotificationSchema);
