const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const User = require("./models/User");
const Room = require("./models/Room");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/findmyroom";

async function seedTelanganaRooms() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    // Create a dummy owner for these listings
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
      console.log("Created test owner: HyderabadRentals");
    }

    // Telangana / Hyderabad real-sounding room rentals
    const rooms = [
      {
        title: "Premium 2BHK Fully Furnished Flat in HITEC City",
        price: 35000,
        location: "HITEC City, Hyderabad, Telangana",
        description: "Spacious 2BHK flat with modern amenities. Walking distance to major tech parks (Cyber Towers, Raheja Mindspace). Includes AC, high-speed Wi-Fi, modular kitchen, and covered car parking.",
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
        description: "Independent single room in a 3BHK flat. Perfect for IT professionals working in DLF Cyber City or Gachibowli. No restrictions, attached bathroom, and shared kitchen.",
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
        description: "Premium sharing PG for women with 3-times North/South Indian food. Daily cleaning, biometric security, washing machine, and fast internet.",
        roomType: "PG",
        genderPreference: "Female",
        image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
        facilities: ["Wi-Fi", "AC", "Laundry", "Furnished"],
        ownerId: owner._id,
        contactName: owner.username,
        contactPhone: "+91 9876543210",
        contactEmail: owner.email,
        coordinates: { lat: 17.4483, lng: 78.3915 }
      },
      {
        title: "Affordable Shared Room near Osmania University",
        price: 5500,
        location: "Tarnaka, Hyderabad, Telangana",
        description: "Shared room in a peaceful residential area, highly suitable for students. Very close to Osmania University and Tarnaka Metro Station.",
        roomType: "Shared Room",
        genderPreference: "Any",
        image: "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80",
        facilities: ["Wi-Fi", "Parking"],
        ownerId: owner._id,
        contactName: owner.username,
        contactPhone: "+91 9876543210",
        contactEmail: owner.email,
        coordinates: { lat: 17.4295, lng: 78.5298 }
      },
      {
        title: "Modern 3BHK Flat near Jubilee Hills",
        price: 55000,
        location: "Jubilee Hills, Hyderabad, Telangana",
        description: "Luxury 3BHK flat in the heart of Jubilee Hills. Access to clubhouse, swimming pool, gym, and 24/7 power backup.",
        roomType: "Apartment",
        genderPreference: "Any",
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
        facilities: ["Wi-Fi", "AC", "Kitchen", "Parking", "Furnished", "Elevator", "Gym"],
        ownerId: owner._id,
        contactName: owner.username,
        contactPhone: "+91 9876543210",
        contactEmail: owner.email,
        coordinates: { lat: 17.4326, lng: 78.4071 }
      }
    ];

    await Room.insertMany(rooms);
    console.log(`Successfully seeded ${rooms.length} Telangana rooms!`);

    process.exit(0);
  } catch (err) {
    console.error("Error seeding data:", err);
    process.exit(1);
  }
}

seedTelanganaRooms();
