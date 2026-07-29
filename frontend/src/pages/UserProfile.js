import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { User, ShieldCheck, MapPin, Calendar, Briefcase, GraduationCap, Mail, MessageSquare, Star, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/users/${id}`, {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("findmyroom_token")}`
          }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load profile");
        setProfileData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  const handleMessage = async () => {
    if (!currentUser) return navigate("/login");
    // To instantly open chat, we could redirect to /messages with the userId
    // But currently /messages doesn't auto-open a specific chat based on URL.
    // Let's just navigate to messages and they can search the user's name, or we can send an initial message.
    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("findmyroom_token")}`
        },
        body: JSON.stringify({ receiverId: id, content: "Hi! I saw your profile and wanted to connect." })
      });
      navigate("/messages");
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}><span className="spinner"></span></div>;
  }

  if (error || !profileData) {
    return (
      <div className="container page-container text-center">
        <h2>Profile Not Found</h2>
        <p style={{ color: "var(--text-secondary)" }}>{error}</p>
        <button onClick={() => navigate(-1)} className="btn btn-primary mt-4"><ArrowLeft size={16} /> Go Back</button>
      </div>
    );
  }

  const { user, listings } = profileData;
  const joinDate = new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="container page-container">
      <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginBottom: "20px", padding: "8px 12px" }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="dashboard-grid">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel" style={{ padding: "30px", textAlign: "center" }}>
          <div style={{ width: "120px", height: "120px", borderRadius: "50%", background: "linear-gradient(135deg, var(--primary), var(--secondary))", margin: "0 auto 20px auto", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", fontWeight: "bold", color: "#fff", overflow: "hidden" }}>
            {user.profilePicture ? <img src={user.profilePicture} alt={user.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" /> : user.username[0].toUpperCase()}
          </div>
          
          <h2 style={{ fontSize: "1.8rem", marginBottom: "5px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            {user.username} {user.isVerified && <ShieldCheck size={20} style={{ color: "var(--secondary)" }} title="Verified User" />}
          </h2>
          <p style={{ color: "var(--text-secondary)", textTransform: "capitalize", fontWeight: "600", fontSize: "0.9rem", marginBottom: "20px" }}>{user.role}</p>

          <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "25px" }}>
            <div style={{ background: "rgba(255,255,255,0.05)", padding: "10px 15px", borderRadius: "10px" }}>
              <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--primary)" }}><Star size={16} style={{ display: "inline", position: "relative", top: "-2px" }} /> {user.trustScore}%</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Trust Score</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.05)", padding: "10px 15px", borderRadius: "10px" }}>
              <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--secondary)" }}>{listings ? listings.length : 0}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Active Listings</div>
            </div>
          </div>

          <div style={{ textAlign: "left", marginBottom: "25px" }}>
            <h4 style={{ fontSize: "1.1rem", marginBottom: "15px", borderBottom: "1px solid var(--border-color)", paddingBottom: "5px" }}>About</h4>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.6", marginBottom: "15px" }}>
              {user.bio || `Hi, I'm ${user.username}! I am looking forward to connecting with great people here.`}
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              {user.occupation && <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Briefcase size={16} /> {user.occupation}</div>}
              {user.companyOrCollege && <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><GraduationCap size={16} /> {user.companyOrCollege}</div>}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Calendar size={16} /> Joined {joinDate}</div>
            </div>
          </div>

          {currentUser && currentUser.id !== user.id && (
            <button onClick={handleMessage} className="btn btn-primary" style={{ width: "100%", padding: "12px", fontSize: "1rem" }}>
              <MessageSquare size={18} /> Send Message
            </button>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <h3 style={{ fontSize: "1.4rem", marginBottom: "20px" }}>{user.role === "owner" ? "Active Room Listings" : "Recent Activity"}</h3>
          
          {user.role === "owner" && listings && listings.length > 0 ? (
            <div className="dashboard-listings-grid">
              {listings.map(room => (
                <div key={room._id} className="mini-listing-card" onClick={() => navigate(`/rooms/${room._id}`)} style={{ cursor: "pointer" }}>
                  <img src={room.image} alt={room.title} className="mini-listing-image" loading="lazy" />
                  <div className="mini-listing-body">
                    <h4 className="mini-listing-title">{room.title}</h4>
                    <div className="mini-listing-meta" style={{ marginTop: "8px" }}>
                      <span className="mini-listing-price">₹{room.price.toLocaleString('en-IN')}/mo</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><MapPin size={10} /> {room.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
              <p>This user has no active listings.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default UserProfile;
