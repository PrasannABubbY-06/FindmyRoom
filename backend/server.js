const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const db = require("./database");
const upload = require("./services/uploadService");
const aiService = require("./services/aiService");
const otpService = require("./services/otpService");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const compression = require("compression");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT"]
  }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "findmyroom_secret_key_12345";

// Basic Middlewares
app.use(cors());
app.use(express.json({ limit: "5mb" })); // Reduced from 50mb to prevent memory bloat
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Security and Performance Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false // Allow serving images locally
}));
app.use(compression()); // Compress responses

// Security: Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 150, // limit each IP to 150 requests per windowMs
  message: { error: "Too many requests from this IP, please try again later." }
});
app.use("/api", globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs for auth routes
  message: { error: "Too many requests from this IP, please try again after 15 minutes." }
});
app.use("/api/auth", authLimiter);

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 OTP requests per windowMs
  message: { error: "Too many OTP requests from this IP, please try again after 15 minutes." }
});
app.use("/api/otp/send", otpLimiter);

// Serve uploads directory statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Database Connection will be initialized before starting the server

// Middleware for Route Protection
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ error: "Authentication required." });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token." });
    }
    req.user = user;
    next();
  });
}

function authenticateAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.user && req.user.role === "admin") {
      next();
    } else {
      return res.status(403).json({ error: "Admin access required." });
    }
  });
}

// Helper: Generate Token
function generateToken(user) {
  return jwt.sign(
    { id: user.id || user._id, username: user.username, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// --- Socket.IO Real-Time Chat & Notifications ---
const onlineUsers = new Map(); // userId -> socketId

io.on("connection", (socket) => {
  console.log("New socket connection:", socket.id);

  socket.on("join", (userId) => {
    onlineUsers.set(userId, socket.id);
    // Broadcast to others that this user is online
    socket.broadcast.emit("user_online", userId);
  });

  socket.on("message_status_update", async ({ messageId, status, senderId, receiverId }) => {
    // Notify the sender that their message was delivered/seen
    const senderSocket = onlineUsers.get(senderId);
    if (senderSocket) {
      io.to(senderSocket).emit("message_status_update", { messageId, status, receiverId });
    }
  });

  socket.on("typing", ({ senderId, receiverId }) => {
    const receiverSocket = onlineUsers.get(receiverId);
    if (receiverSocket) {
      io.to(receiverSocket).emit("typing", senderId);
    }
  });

  socket.on("stop_typing", ({ senderId, receiverId }) => {
    const receiverSocket = onlineUsers.get(receiverId);
    if (receiverSocket) {
      io.to(receiverSocket).emit("stop_typing", senderId);
    }
  });

  socket.on("disconnect", () => {
    // Find which user disconnected
    let disconnectedUser = null;
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUser = userId;
        onlineUsers.delete(userId);
        break;
      }
    }
    if (disconnectedUser) {
      io.emit("user_offline", { userId: disconnectedUser, lastSeen: new Date() });
    }
    console.log("Socket disconnected:", socket.id);
  });
});

// Helper to send real-time notification
const sendRealTimeNotification = (receiverId, type, payload) => {
  const receiverSocket = onlineUsers.get(receiverId.toString());
  if (receiverSocket) {
    io.to(receiverSocket).emit(type, payload);
  }
};

// --- Auth Routes ---

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    if (!username || !email || !password || !role) {
      return res.status(400).json({ error: "All fields (username, email, password, role) are required." });
    }

    if (role !== "tenant" && role !== "owner") {
      return res.status(400).json({ error: "Invalid role. Must be 'tenant' or 'owner'." });
    }

    const existingUser = await db.users.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "A user with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.users.create({
      username,
      email,
      password: hashedPassword,
      role
    });

    const token = generateToken(user);
    
    res.status(201).json({
      message: "User registered successfully!",
      token,
      user: {
        id: user.id || user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal Server Error during registration." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await db.users.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = generateToken(user);

    res.json({
      message: "Login successful!",
      token,
      user: {
        id: user.id || user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal Server Error during login." });
  }
});

app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await db.users.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res.json({
      user: {
        id: user.id || user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

// --- Room Routes ---

// AI Generate Description
app.post("/api/ai/generate-description", authenticateToken, async (req, res) => {
  try {
    const description = await aiService.generateRoomDescription(req.body);
    res.json({ description });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate description" });
  }
});

// AI Check Photo Quality
app.post("/api/ai/check-photo", authenticateToken, async (req, res) => {
  try {
    const { image } = req.body;
    const result = await aiService.checkPhotoQuality(image);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to check photo" });
  }
});

// Trending Rooms
app.get("/api/rooms/trending", async (req, res) => {
  try {
    const result = await db.rooms.find({ page: 1, limit: 10 });
    // Assuming find returns { rooms: [...] } or just an array
    const rooms = Array.isArray(result) ? result : (result.rooms || []);
    // Simple sort by views if available, or just random/latest
    const sorted = rooms.sort((a, b) => (b.views || 0) - (a.views || 0));
    res.json(sorted.slice(0, 3));
  } catch (error) {
    console.error("Trending error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// AI Smart Search
app.get("/api/rooms/smart-search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const filters = await aiService.parseSmartSearch(q);
    if (!filters) {
      const fallbackRooms = await db.rooms.find({ location: q, page: req.query.page, limit: req.query.limit });
      return res.json(fallbackRooms.rooms || fallbackRooms);
    }
    
    // Add pagination config
    filters.page = req.query.page;
    filters.limit = req.query.limit;
    
    const result = await db.rooms.find(filters);
    res.json(result.rooms || result);
  } catch (error) {
    console.error("Smart search error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// AI Recommendations
app.post("/api/rooms/recommendations", authenticateToken, async (req, res) => {
  try {
    const { prefs } = req.body;
    const allRooms = await db.rooms.find({});
    const recommended = await aiService.getRecommendations(prefs, allRooms);
    res.json(recommended);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// AI Trending Rooms (Basic implementation)
app.get("/api/rooms/trending", async (req, res) => {
  try {
    const rooms = await db.rooms.find({});
    rooms.sort((a, b) => ((b.views || 0) + (b.likes || 0)) - ((a.views || 0) + (a.likes || 0)));
    res.json(rooms.slice(0, 5));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// AI Similar Rooms
app.get("/api/rooms/:id/similar", async (req, res) => {
  try {
    const targetRoom = await db.rooms.findById(req.params.id);
    if (!targetRoom) return res.status(404).json({ error: "Room not found" });
    const allRooms = await db.rooms.find({});
    const similar = await aiService.getSimilarRooms(targetRoom, allRooms);
    res.json(similar);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get all rooms (with filters)
app.get("/api/rooms", async (req, res) => {
  try {
    const { 
      location, maxPrice, roomType, genderPreference,
      isFurnished, hasAC, hasWiFi, hasParking, foodIncluded, petFriendly
    } = req.query;
    const filters = {};
    if (location) filters.location = location;
    if (maxPrice) filters.maxPrice = maxPrice;
    if (roomType) filters.roomType = roomType;
    if (genderPreference) filters.genderPreference = genderPreference;
    
    // Boolean filters
    if (isFurnished === 'true') filters.isFurnished = true;
    if (hasAC === 'true') filters.hasAC = true;
    if (hasWiFi === 'true') filters.hasWiFi = true;
    if (hasParking === 'true') filters.hasParking = true;
    if (foodIncluded === 'true') filters.foodIncluded = true;
    if (petFriendly === 'true') filters.petFriendly = true;
    
    filters.page = req.query.page;
    filters.limit = req.query.limit;

    const result = await db.rooms.find(filters);
    // Backward compatibility: some frontend code expects an array, others might want the full object
    // We'll return just the rooms array for now to prevent breaking UI, but it is paginated on backend
    res.json(result.rooms || result);
  } catch (error) {
    console.error("Get rooms error:", error);
    res.status(500).json({ error: "Internal Server Error fetching rooms." });
  }
});

// Get single room details
app.get("/api/rooms/:id", async (req, res) => {
  try {
    const room = await db.rooms.incrementViews(req.params.id);
    if (!room) {
      return res.status(404).json({ error: "Room listing not found." });
    }
    res.json(room);
  } catch (error) {
    console.error("Get single room error:", error);
    res.status(500).json({ error: "Internal Server Error fetching room details." });
  }
});

// Add new room listing (Owner only)
app.post("/api/rooms", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Access denied. Only room owners can list rooms." });
    }

    const {
      title,
      price,
      location,
      description,
      roomType,
      image,
      facilities,
      contactName,
      contactPhone,
      contactEmail
    } = req.body;

    if (!title || !price || !location || !description) {
      return res.status(400).json({ error: "Title, rent price, location, and description are required." });
    }

    const fakeCheck = await aiService.detectFakeListing(req.body);

    const newRoom = await db.rooms.create({
      title,
      price: Number(price),
      location,
      description,
      roomType,
      image: image || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
      facilities: facilities || [],
      contactName: contactName || req.user.username,
      contactPhone: contactPhone || "",
      contactEmail: contactEmail || req.user.email,
      ownerId: req.user.id,
      isFakeSuspicion: fakeCheck.isFakeSuspicion,
      fakeReason: fakeCheck.reason
    });

    res.status(201).json({
      message: "Room listing created successfully!",
      room: newRoom
    });
  } catch (error) {
    console.error("Add room error:", error);
    res.status(500).json({ error: "Internal Server Error adding room listing." });
  }
});

// Get owner listings
app.get("/api/owner/rooms", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Access denied." });
    }
    const listings = await db.rooms.findByOwner(req.user.id);
    res.json(listings);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

// Get owner analytics
app.get("/api/owner/analytics", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") return res.status(403).json({ error: "Access denied." });
    
    const rooms = await db.rooms.findByOwner(req.user.id);
    const leads = await db.leads.findByOwner(req.user.id);
    
    const totalViews = rooms.reduce((acc, room) => acc + (room.views || 0), 0);
    const totalLeads = leads.length;
    const activeListings = rooms.length;
    
    const user = await db.users.findById(req.user.id);
    const trustScore = user ? (user.trustScore || 50) : 50;
    
    res.json({ totalViews, totalLeads, activeListings, trustScore });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error." });
  }
});

// --- Lead / Booking Routes ---

// Create tenant lead request for a room
app.post("/api/rooms/:id/leads", async (req, res) => {
  try {
    const { tenantName, tenantEmail, tenantPhone, message } = req.body;
    const roomId = req.params.id;

    if (!tenantName || !tenantEmail || !tenantPhone) {
      return res.status(400).json({ error: "Name, email, and phone number are required." });
    }

    const room = await db.rooms.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: "Room not found." });
    }

    let tenantId = null;
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        tenantId = decoded.id || decoded._id;
      } catch(e) {}
    }

    const lead = await db.leads.create({
      roomId,
      roomTitle: room.title,
      tenantName,
      tenantEmail,
      tenantPhone,
      tenantId,
      message: message || "",
      ownerId: room.ownerId
    });

    // Create Notification for Owner
    const notif = await db.notifications.create({
      recipient: room.ownerId,
      type: "INQUIRY",
      content: `${tenantName} requested to book ${room.title}`,
      relatedRoom: roomId
    });

    // Fire real-time notification to owner
    sendRealTimeNotification(room.ownerId, "new_notification", notif);

    res.status(201).json({
      message: "Booking request submitted successfully! The owner will contact you.",
      lead
    });
  } catch (error) {
    console.error("Create lead error:", error);
    res.status(500).json({ error: "Internal Server Error submitting contact request." });
  }
});

// Get all leads for an owner's listings
app.get("/api/owner/leads", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Access denied. Owner permission required." });
    }
    const leads = await db.leads.findByOwner(req.user.id);
    res.json(leads);
  } catch (error) {
    console.error("Get owner leads error:", error);
    res.status(500).json({ error: "Internal Server Error fetching leads." });
  }
});

// Update Lead Status (Accept/Reject)
app.put("/api/owner/leads/:id/status", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Access denied." });
    }
    const { status } = req.body;
    if (!["Pending", "Accepted", "Rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status." });
    }
    
    const lead = await db.leads.updateStatus(req.params.id, status);
    
    // We could send a notification back to the tenant here if we had the tenant's userId stored on the lead.
    // For now, we update the status.
    
    res.json(lead);
  } catch (error) {
    console.error("Update lead status error:", error);
    res.status(500).json({ error: "Internal Server Error updating lead." });
  }
});

// --- Tenant Routes ---

app.post("/api/rooms/:id/save", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "tenant") return res.status(403).json({ error: "Only tenants can save rooms." });
    const user = await db.users.toggleSaveRoom(req.user.id, req.params.id);
    res.json({ success: true, savedRooms: user.savedRooms });
  } catch (error) {
    console.error("Save room error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/tenant/saved-rooms", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "tenant") return res.status(403).json({ error: "Access denied." });
    const saved = await db.rooms.findSaved(req.user.id);
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/tenant/applied", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "tenant") return res.status(403).json({ error: "Access denied." });
    const applied = await db.leads.findByTenant(req.user.id);
    res.json(applied);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/tenant/roommate-requests", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "tenant") return res.status(403).json({ error: "Access denied." });
    const requests = await db.roommateRequests.findByUser(req.user.id);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- Community Routes ---

app.get("/api/community/posts", async (req, res) => {
  try {
    const { type, page, limit } = req.query;
    const result = await db.posts.getFeed(type, page, limit);
    res.json(result);
  } catch (error) {
    console.error("Error fetching community posts:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/community/posts", authenticateToken, async (req, res) => {
  try {
    const data = { ...req.body, author: req.user.id };
    const post = await db.posts.create(data);
    res.status(201).json(post);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/community/posts/:id/like", authenticateToken, async (req, res) => {
  try {
    const post = await db.posts.toggleLike(req.params.id, req.user.id);
    res.json(post);
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/community/posts/:id/comment", authenticateToken, async (req, res) => {
  try {
    const post = await db.posts.addComment(req.params.id, req.user.id, req.body.text);
    res.json(post);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/community/groups", async (req, res) => {
  try {
    const { page, limit } = req.query;
    const result = await db.groups.findAll(page, limit);
    res.json(result);
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/community/groups", authenticateToken, async (req, res) => {
  try {
    const data = { ...req.body, creator: req.user.id };
    const group = await db.groups.create(data);
    res.status(201).json(group);
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/community/groups/:id/join", authenticateToken, async (req, res) => {
  try {
    const group = await db.groups.toggleJoin(req.params.id, req.user.id);
    res.json(group);
  } catch (error) {
    console.error("Error joining group:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// --- Notifications Routes ---
app.get("/api/notifications", authenticateToken, async (req, res) => {
  try {
    const notifications = await db.notifications.findByUser(req.user.id);
    res.json(notifications);
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/api/notifications/:id/read", authenticateToken, async (req, res) => {
  try {
    await db.notifications.markAsRead(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/api/notifications/:id/action", authenticateToken, async (req, res) => {
  try {
    const { action } = req.body; // 'accepted' or 'rejected'
    if (!['accepted', 'rejected'].includes(action)) {
      return res.status(400).json({ error: "Invalid action." });
    }
    const updated = await db.notifications.updateActionStatus(req.params.id, action);
    res.json(updated);
  } catch (error) {
    console.error("Notification action error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- Roommate Routes ---

app.get("/api/roommates/personalized", authenticateToken, async (req, res) => {
  try {
    const userPrefs = await db.users.findById(req.user.id);
    const allRequests = await db.roommateRequests.findFeed({}); // get active ones
    const sorted = await aiService.getRoommateRecommendations(userPrefs, allRequests.requests || allRequests);
    res.json(sorted);
  } catch (error) {
    console.error("Personalized roommates error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/roommates", async (req, res) => {
  try {
    const { city, maxBudget, genderPreference, occupation, lifestyle, page, limit } = req.query;
    const filters = {};
    if (city) filters.city = city;
    if (maxBudget) filters.maxBudget = maxBudget;
    if (genderPreference) filters.genderPreference = genderPreference;
    if (occupation) filters.occupation = occupation;
    if (lifestyle) {
      try {
        filters.lifestyle = JSON.parse(lifestyle);
      } catch(e) {}
    }
    
    filters.page = page;
    filters.limit = limit;

    const result = await db.roommateRequests.findFeed(filters);
    res.json(result.requests || result);
  } catch (error) {
    console.error("Get roommates error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/roommates", authenticateToken, async (req, res) => {
  try {
    const { city, areaPreference, maxBudget, moveInDate, preferredGender, preferredOccupations, description } = req.body;
    
    if (!city || !maxBudget || !description) {
      return res.status(400).json({ error: "City, max budget, and description are required." });
    }

    const newRequest = await db.roommateRequests.create({
      user: req.user.id,
      city,
      areaPreference,
      maxBudget: Number(maxBudget),
      moveInDate,
      preferredGender: preferredGender || "Any",
      preferredOccupations: preferredOccupations || [],
      description
    });

    res.status(201).json(newRequest);
  } catch (error) {
    console.error("Create roommate request error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/api/roommates/:id", authenticateToken, async (req, res) => {
  try {
    const reqPost = await db.roommateRequests.findById(req.params.id);
    if (!reqPost) return res.status(404).json({ error: "Post not found" });
    if (reqPost.user._id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    const { status, ...updateData } = req.body;
    let updated;
    if (status) {
      updated = await db.roommateRequests.updateStatus(req.params.id, status);
    } else {
      updated = await db.roommateRequests.update(req.params.id, updateData);
    }
    res.json(updated);
  } catch (error) {
    console.error("Update roommate error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/api/roommates/:id", authenticateToken, async (req, res) => {
  try {
    const reqPost = await db.roommateRequests.findById(req.params.id);
    if (!reqPost) return res.status(404).json({ error: "Post not found" });
    if (reqPost.user._id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    await db.roommateRequests.delete(req.params.id);
    res.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    console.error("Delete roommate error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/roommates/:id/like", authenticateToken, async (req, res) => {
  try {
    const updated = await db.roommateRequests.toggleLike(req.params.id, req.user.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/roommates/:id/save", authenticateToken, async (req, res) => {
  try {
    const updated = await db.roommateRequests.toggleSave(req.params.id, req.user.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/roommates/:id/report", authenticateToken, async (req, res) => {
  try {
    const updated = await db.roommateRequests.report(req.params.id, req.user.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/roommates/:id/interested", authenticateToken, async (req, res) => {
  try {
    const reqPost = await db.roommateRequests.findById(req.params.id);
    if (!reqPost) return res.status(404).json({ error: "Post not found" });
    
    // Create Notification for the post owner
    const notif = await db.notifications.create({
      recipient: reqPost.user._id,
      type: "ROOMMATE_INTEREST",
      content: `${req.user.username} is interested in your roommate request!`,
      relatedUser: req.user.id
    });
    sendRealTimeNotification(reqPost.user._id, "new_notification", notif);
    
    res.json({ success: true, message: "Interest sent!" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- Messaging & User Search Routes ---

app.get("/api/users/search", authenticateToken, async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.json([]);
    }
    const users = await db.users.search(query);
    // Don't return self in search results
    const filtered = users.filter(u => u._id.toString() !== req.user.id.toString());
    res.json(filtered);
  } catch (error) {
    console.error("User search error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/users/:id", authenticateToken, async (req, res) => {
  try {
    const user = await db.users.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    // Also fetch their active listings if they are an owner
    let listings = [];
    if (user.role === "owner") {
      listings = await db.rooms.findByOwner(req.params.id);
    }
    
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        bio: user.bio,
        occupation: user.occupation,
        companyOrCollege: user.companyOrCollege,
        isVerified: user.isVerified,
        trustScore: user.trustScore,
        createdAt: user.createdAt
      },
      listings
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/messages", authenticateToken, async (req, res) => {
  try {
    const conversations = await db.messages.getConversations(req.user.id);
    res.json(conversations);
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/messages/:otherUserId", authenticateToken, async (req, res) => {
  try {
    const history = await db.messages.findChatHistory(req.user.id, req.params.otherUserId);
    res.json(history);
  } catch (error) {
    console.error("Get chat history error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/messages", authenticateToken, async (req, res) => {
  try {
    const { receiverId, content, messageType, mediaUrl, mediaName, location } = req.body;
    if (!receiverId) {
      return res.status(400).json({ error: "Receiver is required." });
    }
    
    let isScamSuspicion = false;
    if (content) {
      isScamSuspicion = await aiService.detectScamMessage(content);
    }
    
    const message = await db.messages.create({
      sender: req.user.id,
      receiver: receiverId,
      content: content || "",
      messageType: messageType || "text",
      mediaUrl,
      mediaName,
      location,
      status: "sent", // initial status
      isScamSuspicion
    });

    // Populate sender info to send full object via socket
    const populatedMessage = await db.messages.findChatHistory(req.user.id, receiverId).then(history => history[history.length - 1]);
    
    // Send real-time message to receiver
    sendRealTimeNotification(receiverId, "new_message", populatedMessage);
    
    res.status(201).json(message);
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/api/messages/:otherUserId/read", authenticateToken, async (req, res) => {
  try {
    // Mark messages sent by otherUser to me as read (seen)
    await db.messages.markAsRead(req.params.otherUserId, req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Mark read error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// File upload endpoint for messages
app.post("/api/messages/upload", authenticateToken, upload.single("media"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }
    // Return the URL path
    res.json({ 
      mediaUrl: `/uploads/${req.file.filename}`,
      mediaName: req.file.originalname,
      mimeType: req.file.mimetype
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Internal Server Error during file upload." });
  }
});

// --- Verification & Trust APIs ---

app.post("/api/users/verify-phone-success", authenticateToken, async (req, res) => {
  try {
    // In a highly secure production app, we would verify the Firebase ID Token here via firebase-admin.
    // For now, we trust the client's confirmation since they are authenticated.
    await db.users.update(req.user.id, { phoneVerified: true });
    res.json({ success: true, message: "Phone verified successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/send-email-otp", authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;
    const result = await otpService.sendEmailOTP(email);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/verify-email-otp", authenticateToken, async (req, res) => {
  try {
    const { email, otp } = req.body;
    const result = await otpService.verifyEmailOTP(email, otp);
    if (result.success) {
      await db.users.update(req.user.id, { emailVerified: true });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/user/submit-id", authenticateToken, upload.single("idDocument"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No document uploaded." });
    await db.users.update(req.user.id, { 
      idVerificationStatus: "Pending",
      idDocumentUrl: `/uploads/${req.file.filename}` 
    });
    res.json({ success: true, message: "ID submitted for review." });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- Reviews API ---
app.post("/api/reviews", authenticateToken, async (req, res) => {
  try {
    const { targetId, targetType, rating, comment } = req.body;
    // Basic validation
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: "Valid rating (1-5) is required." });
    
    // Check if review already exists to prevent spam
    const existing = await db.reviews.findByTarget(targetId, targetType);
    if (existing.some(r => r.authorId._id.toString() === req.user.id)) {
      return res.status(400).json({ error: "You have already reviewed this." });
    }
    
    const review = await db.reviews.create({
      targetId, targetType, rating, comment, authorId: req.user.id
    });
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/reviews/:targetId", async (req, res) => {
  try {
    const { targetType } = req.query; // 'User' or 'Room'
    const reviews = await db.reviews.findByTarget(req.params.targetId, targetType);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- Reports API ---
app.post("/api/reports", authenticateToken, async (req, res) => {
  try {
    const { targetId, targetType, reason, description } = req.body;
    const report = await db.reports.create({
      targetId, targetType, reason, description, reporterId: req.user.id
    });
    res.status(201).json({ success: true, report });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/users/:id/block", authenticateToken, async (req, res) => {
  try {
    const user = await db.users.findById(req.user.id);
    if (!user.blockedUsers.includes(req.params.id)) {
      user.blockedUsers.push(req.params.id);
      await user.save();
    }
    res.json({ success: true, message: "User blocked successfully." });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- Admin APIs ---
app.get("/api/admin/reports", authenticateAdmin, async (req, res) => {
  try {
    const reports = await db.reports.findAllPending();
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/admin/reports/:id/resolve", authenticateAdmin, async (req, res) => {
  try {
    const { action } = req.body; // 'dismiss', 'suspend_user', 'remove_room'
    const report = await db.reports.updateStatus(req.params.id, action === 'dismiss' ? 'Dismissed' : 'Resolved');
    
    if (action === 'suspend_user' && report.targetType === 'User') {
      await db.users.update(report.targetId, { status: 'suspended' });
    } else if (action === 'remove_room' && report.targetType === 'Room') {
      await db.rooms.update(report.targetId, { status: 'removed' });
    }
    
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const User = require("./models/User"); // Needed for the specific admin query below
app.get("/api/admin/verifications", authenticateAdmin, async (req, res) => {
  try {
    const users = await User.find({ idVerificationStatus: "Pending" }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/admin/verifications/:userId/resolve", authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body; // 'Verified' or 'Rejected'
    const user = await db.users.update(req.params.userId, { 
      idVerificationStatus: status,
      isVerified: status === 'Verified' ? true : false 
    });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack);
  res.status(500).json({ error: "An unexpected error occurred. Please try again later." });
});

// Database Connection
db.connect().then(() => {
  const startServer = (port) => {
    server.listen(port, () => {
      console.log(`[FindMyRoom Server] Running on http://localhost:${port}`);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`[FindMyRoom Server] Port ${port} is in use, trying ${port + 1}...`);
        startServer(port + 1);
      } else {
        console.error("Server error:", err);
      }
    });
  };
  startServer(PORT);
}).catch(err => {
  console.error("Failed to connect to DB", err);
  process.exit(1);
});