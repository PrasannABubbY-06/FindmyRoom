const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  location: { type: String, required: true },
  
  // Advanced fields
  roomType: { type: String, enum: ["Single Room", "Shared Room", "PG", "Hostel", "Apartment", "Flat", "Independent House"], required: true, default: "Single Room" },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  
  // Media
  image: { type: String }, // Legacy/Thumbnail
  media: [{
    type: { type: String, enum: ["image", "video"] },
    url: { type: String }
  }],
  
  // Amenities & Rules
  facilities: [{ type: String }],
  isFurnished: { type: Boolean, default: false },
  hasAC: { type: Boolean, default: false },
  hasWiFi: { type: Boolean, default: false },
  hasParking: { type: Boolean, default: false },
  foodIncluded: { type: Boolean, default: false },
  petFriendly: { type: Boolean, default: false },

  genderPreference: { type: String, enum: ["Any", "Male", "Female"], default: "Any" },
  
  // Contact
  contactName: { type: String },
  contactPhone: { type: String },
  contactEmail: { type: String },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Analytics & Trust
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'suspended', 'removed'], default: 'active' },
  
  // AI Fake Detection
  isFakeSuspicion: { type: Boolean, default: false },
  fakeReason: { type: String },
  
  createdAt: { type: Date, default: Date.now }
});

// Indexes for scalability
RoomSchema.index({ ownerId: 1 });
RoomSchema.index({ price: 1 });
RoomSchema.index({ roomType: 1 });
RoomSchema.index({ status: 1 });
RoomSchema.index({ location: 'text', title: 'text', description: 'text' });

module.exports = mongoose.model("Room", RoomSchema);