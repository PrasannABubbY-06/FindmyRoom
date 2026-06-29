const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Can be Room ID or User ID
  targetType: { type: String, enum: ["Room", "User"], required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Review", ReviewSchema);
