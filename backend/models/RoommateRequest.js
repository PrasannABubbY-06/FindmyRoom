const mongoose = require("mongoose");

const RoommateRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Requirements
  city: { type: String, required: true },
  areaPreference: { type: String },
  maxBudget: { type: Number, required: true },
  moveInDate: { type: Date },
  
  // Preferences
  preferredGender: { type: String, enum: ["Male", "Female", "Other", "Any"], default: "Any" },
  preferredOccupations: [{ type: String }], // e.g., "Student", "IT Professional"
  
  // Details
  description: { type: String, required: true },
  
  // Feed interactions
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  saves: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  status: { type: String, enum: ["Active", "Found Roommate", "Deleted"], default: "Active" },
  isActive: { type: Boolean, default: true },
  
  createdAt: { type: Date, default: Date.now }
});

// Indexes for scalability
RoommateRequestSchema.index({ city: 1 });
RoommateRequestSchema.index({ maxBudget: 1 });
RoommateRequestSchema.index({ status: 1 });
RoommateRequestSchema.index({ user: 1 });

module.exports = mongoose.model("RoommateRequest", RoommateRequestSchema);
