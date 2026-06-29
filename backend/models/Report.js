const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Can be Room ID or User ID
  targetType: { type: String, enum: ["Room", "User"], required: true },
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true }, // e.g., "Spam", "Fake Listing", "Inappropriate", etc.
  description: { type: String },
  status: { type: String, enum: ["Pending", "Reviewed", "Resolved", "Dismissed"], default: "Pending" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Report", ReportSchema);
