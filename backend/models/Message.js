const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roomContext: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' }, // Optional, if message is about a specific room
  
  // WhatsApp-style message types
  messageType: { type: String, enum: ['text', 'image', 'audio', 'document', 'location', 'system'], default: 'text' },
  content: { type: String, required: false }, // Text content or system message text
  
  // Media attachments
  mediaUrl: { type: String }, // Path to the uploaded file
  mediaName: { type: String }, // Original filename
  
  // Location sharing
  location: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String }
  },
  
  // Read Receipts
  status: { type: String, enum: ['sent', 'delivered', 'seen'], default: 'sent' },
  
  // AI Scam Detection
  isScamSuspicion: { type: Boolean, default: false },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Message", MessageSchema);
