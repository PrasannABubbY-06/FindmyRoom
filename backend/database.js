const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Import Models
const User = require("./models/User");
const Room = require("./models/Room");
const RoommateRequest = require("./models/RoommateRequest");
const Match = require("./models/Match");
const Message = require("./models/Message");
const Post = require("./models/Post");
const Notification = require("./models/Notification");
const Review = require("./models/Review");
const Report = require("./models/Report");

// Lead Schema
const LeadSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  roomTitle: { type: String },
  tenantName: { type: String, required: true },
  tenantEmail: { type: String, required: true },
  tenantPhone: { type: String, required: true },
  tenantId: { type: String }, // Optional, as guest leads might exist
  message: { type: String },
  ownerId: { type: String, required: true },
  status: { type: String, enum: ["Pending", "Accepted", "Rejected"], default: "Pending" },
  createdAt: { type: Date, default: Date.now }
});
const Lead = mongoose.model("Lead", LeadSchema);

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/findmyroom";

async function seedTelanganaRooms() {
  console.log("[FindMyRoom DB] Seeding Telangana/Hyderabad Data...");
  let owner = await User.findOne({ email: "telangana.owner@example.com" });
  if (!owner) {
    const hashedPassword = await bcrypt.hash("password123", 10);
    owner = new User({
      username: "HyderabadRentals",
      email: "telangana.owner@example.com",
      password: hashedPassword,
      role: "owner",
      isVerified: true,
      trustScore: 95
    });
    await owner.save();
  }

  const existingRooms = await Room.countDocuments({ ownerId: owner._id });
  if (existingRooms === 0) {
    const rooms = [
      {
        title: "Premium 2BHK Fully Furnished Flat in HITEC City",
        price: 35000,
        location: "HITEC City, Hyderabad, Telangana",
        description: "Spacious 2BHK flat with modern amenities. Walking distance to major tech parks. Includes AC, high-speed Wi-Fi, modular kitchen, and covered car parking.",
        roomType: "Apartment",
        genderPreference: "Any",
        image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
        facilities: ["Wi-Fi", "AC", "Kitchen", "Parking", "Furnished", "Elevator", "Gym"],
        ownerId: owner._id,
        contactName: owner.username,
        contactPhone: "+91 9876543210",
        contactEmail: owner.email,
        coordinates: { lat: 17.4474, lng: 78.3762 }
      },
      {
        title: "Cozy Single Room for IT Professionals in Gachibowli",
        price: 12000,
        location: "Gachibowli, Hyderabad, Telangana",
        description: "Independent single room in a 3BHK flat. Perfect for IT professionals working in DLF Cyber City or Gachibowli.",
        roomType: "Single Room",
        genderPreference: "Male",
        image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80",
        facilities: ["Wi-Fi", "Kitchen", "Parking", "Furnished"],
        ownerId: owner._id,
        contactName: owner.username,
        contactPhone: "+91 9876543210",
        contactEmail: owner.email,
        coordinates: { lat: 17.4401, lng: 78.3489 }
      },
      {
        title: "Luxury PG for Women in Madhapur",
        price: 9000,
        location: "Madhapur, Hyderabad, Telangana",
        description: "Premium sharing PG for women with 3-times North/South Indian food. Daily cleaning, biometric security, washing machine.",
        roomType: "PG",
        genderPreference: "Female",
        image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
        facilities: ["Wi-Fi", "AC", "Laundry", "Furnished"],
        ownerId: owner._id,
        contactName: owner.username,
        contactPhone: "+91 9876543210",
        contactEmail: owner.email,
        coordinates: { lat: 17.4483, lng: 78.3915 }
      }
    ];
    await Room.insertMany(rooms);
    console.log(`[FindMyRoom DB] Successfully seeded ${rooms.length} Telangana rooms!`);
  }
}

async function connectDB() {
  try {
    console.log("[FindMyRoom DB] Attempting to connect to standard MongoDB...");
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
    console.log("[FindMyRoom DB] Standard MongoDB Connected Successfully!");
    await seedTelanganaRooms();
  } catch (err) {
    console.log("[FindMyRoom DB] Standard MongoDB connection failed. Starting In-Memory MongoDB Server...");
    try {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const mongoServer = await MongoMemoryServer.create();
      const memoryUri = mongoServer.getUri();
      await mongoose.connect(memoryUri, { serverSelectionTimeoutMS: 5000 });
      console.log(`[FindMyRoom DB] In-Memory MongoDB Connected! (${memoryUri})`);
      
      // Since it's an in-memory DB, we MUST seed it every time
      await seedTelanganaRooms();
    } catch (memErr) {
      console.error("[FindMyRoom DB] Failed to start In-Memory MongoDB.", memErr);
      process.exit(1);
    }
  }
}

const db = {
  connect: connectDB,
  users: {
    async findByEmail(email) { return await User.findOne({ email }); },
    async findById(id) { return await User.findById(id); },
    async create(userData) {
      const newUser = new User(userData);
      return await newUser.save();
    },
    async search(queryStr) {
      const regex = new RegExp(queryStr, "i");
      return await User.find({
        $or: [
          { username: regex },
          { email: regex }
        ]
      }).select("-password").limit(10);
    },
    async update(id, data) {
      return await User.findByIdAndUpdate(id, data, { new: true });
    },
    async toggleSaveRoom(userId, roomId) {
      const user = await User.findById(userId);
      if (!user) return null;
      const index = user.savedRooms.indexOf(roomId);
      if (index === -1) {
        user.savedRooms.push(roomId);
      } else {
        user.savedRooms.splice(index, 1);
      }
      return await user.save();
    }
  },
  rooms: {
    async find(filters = {}) {
      const query = {};
      if (filters.location) {
        // Simple natural language fallback (e.g. if location is a full query)
        const locParts = filters.location.split(' ');
        const mainLoc = locParts.length > 2 ? locParts[locParts.length - 1] : filters.location;
        query.$or = [
          { location: { $regex: filters.location, $options: "i" } },
          { title: { $regex: filters.location, $options: "i" } },
          { description: { $regex: filters.location, $options: "i" } }
        ];
      }
      if (filters.maxPrice) query.price = { $lte: Number(filters.maxPrice) };
      if (filters.roomType) query.roomType = filters.roomType;
      if (filters.genderPreference && filters.genderPreference !== "Any") query.genderPreference = { $in: ["Any", filters.genderPreference] };
      
      // Advanced Filters
      if (filters.isFurnished) query.isFurnished = true;
      if (filters.hasAC) query.hasAC = true;
      if (filters.hasWiFi) query.hasWiFi = true;
      if (filters.hasParking) query.hasParking = true;
      if (filters.foodIncluded) query.foodIncluded = true;
      if (filters.petFriendly) query.petFriendly = true;

      // Pagination setup
      const page = Math.max(1, parseInt(filters.page) || 1);
      const limit = Math.max(1, parseInt(filters.limit) || 20);
      const skip = (page - 1) * limit;

      const results = await Room.find(query)
        .populate('ownerId', 'username profilePicture isVerified')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
        
      const total = await Room.countDocuments(query);
      return { rooms: results, total, page, totalPages: Math.ceil(total / limit) };
    },
    async findById(id) { return await Room.findById(id).populate('ownerId', 'username email contactPhone profilePicture isVerified'); },
    async create(roomData) {
      const newRoom = new Room(roomData);
      return await newRoom.save();
    },
    async update(id, data) {
      return await Room.findByIdAndUpdate(id, data, { new: true });
    },
    async findByOwner(ownerId) { return await Room.find({ ownerId }); },
    async incrementViews(id) {
      return await Room.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true }).populate('ownerId', 'username email contactPhone profilePicture isVerified');
    },
    async findSaved(userId) {
      const user = await User.findById(userId).populate('savedRooms');
      return user ? user.savedRooms : [];
    }
  },
  leads: {
    async create(leadData) {
      const newLead = new Lead(leadData);
      return await newLead.save();
    },
    async findByOwner(ownerId) { return await Lead.find({ ownerId }).sort({ createdAt: -1 }); },
    async findByTenant(tenantId) { return await Lead.find({ tenantId }).sort({ createdAt: -1 }); },
    async updateStatus(leadId, status) {
      return await Lead.findByIdAndUpdate(leadId, { status }, { new: true });
    }
  },
  roommateRequests: {
    async create(data) {
      const req = new RoommateRequest(data);
      return await req.save();
    },
    async findActive() { return await RoommateRequest.find({ status: "Active" }).populate('user', 'username profilePicture lifestyle occupation bio isVerified'); },
    async findFeed(filters = {}) {
      const query = { status: { $in: ["Active", "Found Roommate"] } };
      if (filters.city) query.city = { $regex: filters.city, $options: "i" };
      if (filters.maxBudget) query.maxBudget = { $lte: Number(filters.maxBudget) };
      if (filters.genderPreference && filters.genderPreference !== "Any") query.preferredGender = { $in: ["Any", filters.genderPreference] };
      
      // Pre-filter users if occupation/lifestyle is specified to avoid in-memory filtering
      if (filters.occupation || (filters.lifestyle && Object.keys(filters.lifestyle).length > 0)) {
        const userQuery = {};
        if (filters.occupation) userQuery.occupation = filters.occupation;
        
        if (filters.lifestyle) {
          if (filters.lifestyle.smoking !== undefined) userQuery["lifestyle.smoking"] = filters.lifestyle.smoking === "true" || filters.lifestyle.smoking === true;
          if (filters.lifestyle.pets !== undefined) userQuery["lifestyle.pets"] = filters.lifestyle.pets === "true" || filters.lifestyle.pets === true;
          if (filters.lifestyle.diet && filters.lifestyle.diet !== "Any") userQuery["lifestyle.diet"] = filters.lifestyle.diet;
        }
        
        // Find matching users and constrain the roommate request query
        const User = require('./models/User'); // Required locally if not global
        const matchingUsers = await User.find(userQuery).select('_id');
        query.user = { $in: matchingUsers.map(u => u._id) };
      }

      const page = Math.max(1, parseInt(filters.page) || 1);
      const limit = Math.max(1, parseInt(filters.limit) || 20);
      const skip = (page - 1) * limit;

      const requests = await RoommateRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'username profilePicture lifestyle occupation bio isVerified');
        
      const total = await RoommateRequest.countDocuments(query);
      
      return { requests, total, page, totalPages: Math.ceil(total / limit) };
    },
    async findByUser(userId) {
      return await RoommateRequest.find({ user: userId }).sort({ createdAt: -1 }).populate('user', 'username profilePicture isVerified');
    },
    async findById(id) {
      return await RoommateRequest.findById(id).populate('user', 'username profilePicture email lifestyle occupation bio isVerified');
    },
    async update(id, data) {
      return await RoommateRequest.findByIdAndUpdate(id, data, { new: true });
    },
    async delete(id) {
      return await RoommateRequest.findByIdAndDelete(id);
    },
    async updateStatus(id, status) {
      return await RoommateRequest.findByIdAndUpdate(id, { status, isActive: status === "Active" }, { new: true });
    },
    async toggleLike(id, userId) {
      const req = await RoommateRequest.findById(id);
      if (!req) return null;
      const index = req.likes.indexOf(userId);
      if (index === -1) req.likes.push(userId);
      else req.likes.splice(index, 1);
      return await req.save();
    },
    async toggleSave(id, userId) {
      const req = await RoommateRequest.findById(id);
      if (!req) return null;
      const index = req.saves.indexOf(userId);
      if (index === -1) req.saves.push(userId);
      else req.saves.splice(index, 1);
      return await req.save();
    },
    async report(id, userId) {
      const req = await RoommateRequest.findById(id);
      if (!req) return null;
      if (!req.reports.includes(userId)) {
        req.reports.push(userId);
      }
      return await req.save();
    }
  },
  posts: {
    async create(data) {
      const post = new Post(data);
      return await post.save();
    },
    async getFeed(type, page = 1, limit = 20) { 
      const skip = (page - 1) * limit;
      const query = type ? { type } : {};
      const posts = await Post.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'username profilePicture')
        .populate('room');
      
      const total = await Post.countDocuments();
      return { posts, total, page, totalPages: Math.ceil(total / limit) };
    }
  },
  messages: {
    async create(data) {
      const message = new Message(data);
      return await message.save();
    },
    async findChatHistory(user1Id, user2Id) {
      return await Message.find({
        $or: [
          { sender: user1Id, receiver: user2Id },
          { sender: user2Id, receiver: user1Id }
        ]
      }).sort({ createdAt: 1 });
    },
    async getConversations(userId) {
      // Find all distinct users we have chatted with
      const messages = await Message.find({
        $or: [{ sender: userId }, { receiver: userId }]
      }).sort({ createdAt: -1 }).populate('sender', 'username profilePicture isVerified').populate('receiver', 'username profilePicture isVerified');

      const conversations = [];
      const seenUsers = new Set();

      messages.forEach(msg => {
        const otherUser = msg.sender._id.toString() === userId.toString() ? msg.receiver : msg.sender;
        if (!seenUsers.has(otherUser._id.toString())) {
          seenUsers.add(otherUser._id.toString());
          conversations.push({
            user: otherUser,
            lastMessage: msg,
            unreadCount: 0 // Will populate next
          });
        }
      });

      // Calculate unread counts
      for (let conv of conversations) {
        const unread = await Message.countDocuments({
          sender: conv.user._id,
          receiver: userId,
          status: { $ne: 'seen' }
        });
        conv.unreadCount = unread;
      }

      return conversations;
    },
    async markAsRead(senderId, receiverId) {
      return await Message.updateMany(
        { sender: senderId, receiver: receiverId, status: { $ne: 'seen' } },
        { $set: { status: 'seen' } }
      );
    }
  },
  notifications: {
    async create(data) {
      const notif = new Notification(data);
      return await notif.save();
    },
    async findByUser(userId) {
      return await Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .populate('relatedUser', 'username profilePicture')
        .populate('relatedRoom', 'title image');
    },
    async markAsRead(notificationId) {
      return await Notification.findByIdAndUpdate(notificationId, { isRead: true });
    },
    async getUnreadCount(userId) {
      return await Notification.countDocuments({ recipient: userId, isRead: false });
    },
    async updateActionStatus(notificationId, actionStatus) {
      return await Notification.findByIdAndUpdate(notificationId, { actionStatus }, { new: true });
    }
  },
  reviews: {
    async create(data) {
      const review = new Review(data);
      await review.save();
      
      // Update averages
      const model = data.targetType === "User" ? User : Room;
      const allReviews = await Review.find({ targetId: data.targetId, targetType: data.targetType });
      const avg = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;
      
      await model.findByIdAndUpdate(data.targetId, {
        averageRating: parseFloat(avg.toFixed(1)),
        reviewsCount: allReviews.length
      });
      
      return review;
    },
    async findByTarget(targetId, targetType) {
      return await Review.find({ targetId, targetType }).populate('authorId', 'username profilePicture role').sort({ createdAt: -1 });
    }
  },
  reports: {
    async create(data) {
      const report = new Report(data);
      return await report.save();
    },
    async findAllPending() {
      return await Report.find({ status: "Pending" })
        .populate('reporterId', 'username email')
        .sort({ createdAt: 1 });
    },
    async updateStatus(id, status) {
      return await Report.findByIdAndUpdate(id, { status }, { new: true });
    }
  },
  posts: {
    async create(data) {
      const post = new Post(data);
      return await post.save();
    },
    async findFeed(type, page = 1, limit = 20) {
      const query = type ? { type } : {};
      const skip = (page - 1) * limit;
      
      const [data, total] = await Promise.all([
        Post.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('author', 'username profilePicture role'),
        Post.countDocuments(query)
      ]);
      
      return {
        data,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit)
      };
    },
    async toggleLike(postId, userId) {
      const post = await Post.findById(postId);
      if (!post) throw new Error("Post not found");
      const index = post.likes.indexOf(userId);
      if (index > -1) {
        post.likes.splice(index, 1);
      } else {
        post.likes.push(userId);
      }
      return await post.save();
    },
    async addComment(postId, userId, text) {
      return await Post.findByIdAndUpdate(
        postId,
        { $push: { comments: { user: userId, text } } },
        { new: true }
      ).populate('author', 'username profilePicture role');
    }
  },
  groups: {
    async create(data) {
      const Group = require("./models/Group");
      const group = new Group(data);
      return await group.save();
    },
    async findAll(page = 1, limit = 20) {
      const Group = require("./models/Group");
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        Group.find()
          .sort({ members: -1 })
          .skip(skip)
          .limit(limit),
        Group.countDocuments()
      ]);
      
      return {
        data,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit)
      };
    },
    async toggleJoin(groupId, userId) {
      const Group = require("./models/Group");
      const group = await Group.findById(groupId);
      if (!group) throw new Error("Group not found");
      const index = group.members.indexOf(userId);
      if (index > -1) {
        group.members.splice(index, 1);
      } else {
        group.members.push(userId);
      }
      return await group.save();
    }
  }
};

module.exports = db;
