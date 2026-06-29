const mongoose = require("mongoose");

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  type: { type: String }, // e.g., "Student Housing", "Flatmates Network"
  location: { type: String },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

// Indexes for scalability
GroupSchema.index({ createdAt: -1 });
GroupSchema.index({ creator: 1 });

module.exports = mongoose.model("Group", GroupSchema);
