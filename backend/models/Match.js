const mongoose = require("mongoose");

const MatchSchema = new mongoose.Schema({
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Pair of users
  compatibilityScore: { type: Number, required: true }, // 0 to 100
  status: { type: String, enum: ["Pending", "Accepted", "Rejected"], default: "Pending" },
  initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Match", MatchSchema);
