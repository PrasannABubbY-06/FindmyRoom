import React, { useState, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Bookmark, MapPin, Phone, Mail, ChevronRight, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "../AuthContext";

const Roomcard = memo(({ room, onMouseEnter, onMouseLeave }) => {
  const { token, user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(user?.savedRooms?.includes(room.id || room._id) || false);
  const navigate = useNavigate();

  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked(!liked);
  };

  // Convert mongoose id to string or handle custom id
  const roomId = room.id || room._id;

  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!token || user?.role !== "tenant") {
      alert("Only logged-in tenants can save rooms.");
      return;
    }

    try {
      const res = await fetch(`/api/rooms/${roomId}/save`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setBookmarked(!bookmarked);
      }
    } catch (error) {
      console.error("Failed to save room:", error);
    }
  };

  return (
    <motion.div
      id={`room-card-${roomId}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="room-card"
    >
      {/* Card Header (Owner Details) */}
      <div className="room-card-header">
        <div className="owner-info">
          <div className="owner-avatar">
            {room.contactName ? room.contactName.charAt(0).toUpperCase() : "O"}
          </div>
          <div>
            <div className="owner-name">{room.contactName || "Room Owner"}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
              Posted {new Date(room.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        <div className="room-location-badge">
          <MapPin size={12} className="logo-icon" />
          <span>{room.location}</span>
        </div>
      </div>

      {/* Card Image */}
      <div className="room-card-image-wrapper" onClick={() => navigate(`/rooms/${roomId}`)} style={{ cursor: "pointer" }}>
        <img
          src={room.image || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"}
          alt={room.title}
          className="room-card-image"
          loading="lazy"
        />
        <div className="room-card-rent">
          ₹{room.price.toLocaleString('en-IN')} <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>/ month</span>
        </div>
      </div>

      {/* Card Action Bar */}
      <div className="room-card-actions">
        <div className="action-buttons-left">
          <button
            onClick={handleLike}
            className={`card-action-btn ${liked ? "liked" : ""}`}
            aria-label="Like Room"
          >
            <Heart size={22} fill={liked ? "currentColor" : "none"} />
          </button>
          <button
            onClick={handleBookmark}
            className={`card-action-btn ${bookmarked ? "bookmarked" : ""}`}
            aria-label="Bookmark Room"
          >
            <Bookmark size={22} fill={bookmarked ? "currentColor" : "none"} />
          </button>
        </div>

        <Link to={`/rooms/${roomId}`} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.85rem", color: "var(--primary)", fontWeight: "600" }}>
          <span>View Details</span>
          <ChevronRight size={16} />
        </Link>
      </div>

      {/* Card Content */}
      <div className="room-card-content">
        <h3 className="room-card-title" onClick={() => navigate(`/rooms/${roomId}`)} style={{ cursor: "pointer" }}>
          {room.title}
        </h3>
        <p className="room-card-description">
          {room.description || "No description provided."}
        </p>

        {room.facilities && room.facilities.length > 0 && (
          <div className="facilities-container">
            {room.facilities.slice(0, 4).map((fac, idx) => (
              <span key={idx} className="facility-tag">{fac}</span>
            ))}
            {room.facilities.length > 4 && (
              <span className="facility-tag" style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "var(--text-secondary)" }}>
                +{room.facilities.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
});

export default Roomcard;









