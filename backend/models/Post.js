const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Link to a room (optional)
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  
  type: { type: String, enum: ["RoomReel", "CommunityDiscussion", "MovingTip", "GroupPost"], required: true },
  
  location: { type: String }, // For community posts
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' }, // If it belongs to a group
  
  mediaUrl: { type: String }, // For video/image
  content: { type: String }, // Text content
  
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  
  createdAt: { type: Date, default: Date.now }
});

// Indexes for scalability
PostSchema.index({ createdAt: -1 });
PostSchema.index({ author: 1 });
PostSchema.index({ type: 1 });

module.exports = mongoose.model("Post", PostSchema);
