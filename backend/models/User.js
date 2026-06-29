const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["tenant", "owner", "admin"], required: true },
  
  // Premium Profile Fields
  profilePicture: { type: String, default: "" },
  bio: { type: String, default: "" },
  occupation: { type: String, default: "" },
  companyOrCollege: { type: String, default: "" },
  savedRooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
  
  // Verification & Trust
  isVerified: { type: Boolean, default: false }, // Legacy / general verification
  phoneVerified: { type: Boolean, default: false },
  phoneNumber: { type: String, default: "" },
  emailVerified: { type: Boolean, default: false },
  idVerificationStatus: { type: String, enum: ['None', 'Pending', 'Verified', 'Rejected'], default: 'None' },
  idDocumentUrl: { type: String, default: "" },
  
  trustScore: { type: Number, default: 50 }, // 0 to 100
  averageRating: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },
  
  // Safety
  status: { type: String, enum: ['active', 'suspended', 'banned'], default: 'active' },
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Lifestyle Preferences (for matching)
  lifestyle: {
    gender: { type: String, enum: ["Male", "Female", "Other", "Any"], default: "Any" },
    smoking: { type: Boolean, default: false },
    drinking: { type: Boolean, default: false },
    pets: { type: Boolean, default: false },
    diet: { type: String, enum: ["Veg", "Non-Veg", "Vegan", "Any"], default: "Any" },
    sleepSchedule: { type: String, enum: ["Early Bird", "Night Owl", "Flexible"], default: "Flexible" }
  },

  createdAt: { type: Date, default: Date.now }
});

// Indexes for scalability
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ trustScore: -1 });

module.exports = mongoose.model("User", UserSchema);
