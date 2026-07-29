import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MapPin, Phone, Mail, User, ShieldCheck, ArrowLeft, Send, Sparkles, Wifi, Wind, Car, Dumbbell, Award, HelpCircle, ChevronLeft, ChevronRight, PlayCircle, ShieldAlert, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import Roomcard from "../components/Roomcard";
import ReviewsSection from "../components/ReviewsSection";
import ReportModal from "../components/ReportModal";

// Helper for facilities icons mapping
const getFacilityIcon = (facility) => {
  const fac = facility.toLowerCase();
  if (fac.includes("wi-fi") || fac.includes("wifi") || fac.includes("internet")) return <Wifi size={16} />;
  if (fac.includes("ac") || fac.includes("air") || fac.includes("cool")) return <Wind size={16} />;
  if (fac.includes("park")) return <Car size={16} />;
  if (fac.includes("gym") || fac.includes("fitness")) return <Dumbbell size={16} />;
  if (fac.includes("furnish")) return <Award size={16} />;
  return <HelpCircle size={16} />;
};

// Map coordinates helper
function getCoordinatesForLocation(location) {
  const loc = (location || "").toLowerCase();
  if (loc.includes("new york") || loc.includes("ny")) return [40.7128, -74.0060];
  if (loc.includes("boston") || loc.includes("ma")) return [42.3601, -71.0589];
  if (loc.includes("san francisco") || loc.includes("sf") || loc.includes("ca")) return [37.7749, -122.4194];
  if (loc.includes("los angeles") || loc.includes("la")) return [34.0522, -118.2437];
  if (loc.includes("chicago") || loc.includes("il")) return [41.8781, -87.6298];
  if (loc.includes("austin") || loc.includes("tx")) return [30.2672, -97.7431];
  if (loc.includes("seattle") || loc.includes("wa")) return [47.6062, -122.3321];
  if (loc.includes("london") || loc.includes("uk")) return [51.5074, -0.1278];
  if (loc.includes("mumbai")) return [19.0760, 72.8777];
  if (loc.includes("bangalore") || loc.includes("bengaluru")) return [12.9716, 77.5946];
  if (loc.includes("delhi")) return [28.6139, 77.2090];
  
  let hash1 = 0, hash2 = 0;
  for (let i = 0; i < loc.length; i++) {
    hash1 = loc.charCodeAt(i) + ((hash1 << 5) - hash1);
    hash2 = loc.charCodeAt(i) + ((hash2 << 7) - hash2);
  }
  return [40.7128 + (hash1 % 100) / 500, -74.0060 + (hash2 % 100) / 500];
}

function RoomsDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [similarRooms, setSimilarRooms] = useState([]);

  // Gallery state
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Tenant Lead Form state
  const [tenantName, setTenantName] = useState("");
  const [tenantEmail, setTenantEmail] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [leadMessage, setLeadMessage] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  
  const [showReportModal, setShowReportModal] = useState(false);

  const mapInstanceRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/rooms/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load room details.");
        return res.json();
      })
      .then((data) => {
        setRoom(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "Something went wrong.");
        setLoading(false);
      });

    fetch(`/api/rooms/${id}/similar`)
      .then(res => res.json())
      .then(data => setSimilarRooms(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [id]);

  // Initialize Map
  useEffect(() => {
    if (loading || !room || !window.L) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const mapElement = document.getElementById("details-map");
    if (!mapElement) return;

    mapElement._leaflet_id = null;

    try {
      const coords = room.coordinates && room.coordinates.lat ? [room.coordinates.lat, room.coordinates.lng] : getCoordinatesForLocation(room.location);
      const map = window.L.map("details-map").setView(coords, 13);
      mapInstanceRef.current = map;

      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      window.L.marker(coords)
        .bindPopup(`<strong>${room.title}</strong><br/>${room.location}`)
        .addTo(map)
        .openPopup();
    } catch (err) {
      console.error("Leaflet map details error:", err);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [room, loading]);

  const handleSendLead = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);

    try {
      const roomId = room.id || room._id;
      const response = await fetch(`/api/rooms/${roomId}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantName, tenantEmail, tenantPhone, message: leadMessage })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to submit booking inquiry.");

      setSubmitSuccess(true);
      setTenantName("");
      setTenantEmail("");
      setTenantPhone("");
      setLeadMessage("");
    } catch (err) {
      setSubmitError(err.message || "Something went wrong. Please check your data.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="container page-container text-center">
        <h2>Listing Not Found</h2>
        <p style={{ color: "var(--text-secondary)", marginTop: "10px" }}>
          {error || "The room you are looking for does not exist or has been removed."}
        </p>
        <Link to="/rooms" className="btn btn-primary mt-4">
          <ArrowLeft size={16} /> Back to Rooms Feed
        </Link>
      </div>
    );
  }

  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(room.location)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  // Determine media items
  let mediaItems = [];
  if (room.media && room.media.length > 0) {
    mediaItems = room.media;
  } else if (room.image) {
    mediaItems = [{ type: 'image', url: room.image }];
  } else {
    mediaItems = [{ type: 'image', url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80" }];
  }

  const nextMedia = () => setCurrentMediaIndex((prev) => (prev + 1) % mediaItems.length);
  const prevMedia = () => setCurrentMediaIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);

  return (
    <div className="container page-container">
      <Helmet>
        <title>{room.title} | FindMyRoom</title>
        <meta name="description" content={room.description ? room.description.substring(0, 160) : `View details for ${room.title} located at ${room.location}`} />
      </Helmet>

      <Link to="/rooms" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", marginBottom: "25px", fontWeight: "600" }}>
        <ArrowLeft size={18} /> Back to Feed
      </Link>

      <div className="details-grid">
        {/* Main Details Panel */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          
          {/* Media Gallery */}
          <div className="details-gallery" style={{ position: "relative", overflow: "hidden", borderRadius: "16px", aspectRatio: "16/9", background: "#000" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentMediaIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {mediaItems[currentMediaIndex].type === 'video' ? (
                  <video src={mediaItems[currentMediaIndex].url} controls autoPlay loop style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <img src={mediaItems[currentMediaIndex].url} alt={`Gallery ${currentMediaIndex}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                )}
              </motion.div>
            </AnimatePresence>
            
            {mediaItems.length > 1 && (
              <>
                <button onClick={prevMedia} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", color: "#fff", borderRadius: "50%", padding: "10px", border: "none", cursor: "pointer" }}>
                  <ChevronLeft size={24} />
                </button>
                <button onClick={nextMedia} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", color: "#fff", borderRadius: "50%", padding: "10px", border: "none", cursor: "pointer" }}>
                  <ChevronRight size={24} />
                </button>
                <div style={{ position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "5px" }}>
                  {mediaItems.map((_, idx) => (
                    <div key={idx} style={{ width: "8px", height: "8px", borderRadius: "50%", background: idx === currentMediaIndex ? "#fff" : "rgba(255,255,255,0.4)" }} />
                  ))}
                </div>
              </>
            )}
            
            {mediaItems[currentMediaIndex].type === 'video' && (
              <div style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(0,0,0,0.6)", padding: "5px 10px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "5px", color: "#fff", fontSize: "0.8rem" }}>
                <PlayCircle size={14} /> Video Reel
              </div>
            )}
          </div>

          <div className="details-main-info" style={{ marginTop: "20px" }}>
            <div className="details-title-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
              <div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ background: "rgba(99,102,241,0.15)", color: "var(--primary)", padding: "4px 10px", borderRadius: "50px", fontSize: "0.8rem", fontWeight: "600" }}>{room.roomType || "Single Room"}</span>
                  <span style={{ background: "rgba(16,185,129,0.15)", color: "var(--secondary)", padding: "4px 10px", borderRadius: "50px", fontSize: "0.8rem", fontWeight: "600" }}>{room.genderPreference || "Any"} Gender</span>
                </div>
                <h1 className="details-title" style={{ fontSize: "2rem", fontWeight: "700", margin: "0" }}>{room.title}</h1>
              </div>
              <div className="details-rent-badge" style={{ background: "var(--bg-card)", padding: "15px 20px", borderRadius: "12px", border: "1px solid var(--border-color)", textAlign: "center" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: "700", color: "var(--secondary)" }}>₹{room.price.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>per month</div>
              </div>
            </div>

            <div className="details-meta-row" style={{ display: "flex", gap: "20px", marginBottom: "30px", borderBottom: "1px solid var(--border-color)", paddingBottom: "20px" }}>
              <div className="details-meta-item" style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}>
                <MapPin size={16} /> <span>{room.location}</span>
              </div>
              <div className="details-meta-item" style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}>
                <ShieldCheck size={16} style={{ color: "var(--secondary)" }} /> <span>Verified Listing</span>
              </div>
            </div>

            <h2 className="details-section-title" style={{ fontSize: "1.4rem", marginBottom: "15px" }}>About this space</h2>
            <p className="details-description" style={{ color: "var(--text-secondary)", lineHeight: "1.7", marginBottom: "30px" }}>{room.description}</p>

            <h2 className="details-section-title" style={{ fontSize: "1.4rem", marginBottom: "15px" }}>What this place offers</h2>
            <div className="details-facilities-list" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "30px" }}>
              {room.facilities && room.facilities.length > 0 ? (
                room.facilities.map((fac, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "1.05rem" }}>
                    <div style={{ padding: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }}>{getFacilityIcon(fac)}</div>
                    <span>{fac}</span>
                  </div>
                ))
              ) : (
                <p style={{ color: "var(--text-muted)" }}>No facilities listed.</p>
              )}
            </div>

            <h2 className="details-section-title" style={{ fontSize: "1.4rem", marginBottom: "15px" }}>Location</h2>
            <div className="details-map-section" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div style={{ height: "250px", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
                <iframe width="100%" height="100%" frameBorder="0" scrolling="no" src={mapEmbedUrl} title={`Google Maps`}></iframe>
              </div>
              <div style={{ height: "250px", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
                <div id="details-map" style={{ height: "100%", width: "100%" }}></div>
              </div>
            </div>
            
            <ReviewsSection targetId={id} targetType="Room" />
          </div>
        </motion.div>

        {/* Sidebar */}
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          
          {/* Owner Profile Card */}
          <div className="glass-panel" style={{ padding: "25px", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
              <User size={18} /> Listed by
            </h3>
            <div style={{ display: "flex", gap: "15px", alignItems: "center", marginBottom: "20px" }}>
              <div onClick={() => navigate(`/profile/${room.ownerId?._id}`)} style={{ width: "60px", height: "60px", borderRadius: "50%", background: "linear-gradient(135deg, var(--primary), var(--secondary))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: "bold", color: "#fff", cursor: "pointer", overflow: "hidden" }}>
                {room.ownerId?.profilePicture ? <img src={room.ownerId.profilePicture} alt="Owner" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (room.ownerId?.username ? room.ownerId.username[0].toUpperCase() : 'O')}
              </div>
              <div onClick={() => navigate(`/profile/${room.ownerId?._id}`)} style={{ cursor: "pointer" }}>
                <h4 style={{ fontSize: "1.2rem", margin: "0", color: "var(--text-primary)", transition: "color 0.2s" }} className="hover-primary">{room.ownerId?.username || room.contactName || "Verified Owner"}</h4>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                  <ShieldCheck size={14} style={{ color: "var(--secondary)" }} /> Identity verified
                </div>
              </div>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button onClick={() => navigate(`/profile/${room.ownerId?._id}`)} className="btn btn-secondary" style={{ width: "100%" }}><User size={16} /> View Profile</button>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button onClick={() => navigate("/messages")} className="btn btn-primary" style={{ padding: "10px 5px", fontSize: "0.9rem" }}><Mail size={16} /> Message</button>
                {room.contactPhone && (
                  <a href={`tel:${room.contactPhone}`} className="btn btn-secondary" style={{ padding: "10px 5px", fontSize: "0.9rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "5px" }}><Phone size={16} /> Call</a>
                )}
              </div>
            </div>

            <button 
              onClick={() => setShowReportModal(true)}
              style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "5px", margin: "20px auto 0", cursor: "pointer" }}
            >
              <ShieldAlert size={14} /> Report this Listing
            </button>
          </div>

          {/* Lead Capture Card */}
          <div className="glass-panel contact-sidebar-card">
            <h2 className="contact-card-title" style={{ fontSize: "1.3rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles className="logo-icon" size={20} /> Interested in this Room?
            </h2>

            {submitSuccess ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: "3rem", marginBottom: "15px" }}>🎉</div>
                <h3 style={{ color: "var(--secondary)", marginBottom: "8px" }}>Request Sent!</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>The owner will review your request and get back to you shortly.</p>
                <button onClick={() => setSubmitSuccess(false)} className="btn btn-secondary mt-4" style={{ width: "100%" }}>Send another message</button>
              </motion.div>
            ) : (
              <form onSubmit={handleSendLead}>
                {submitError && <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", padding: "10px", borderRadius: "6px", fontSize: "0.8rem", marginBottom: "15px" }}>{submitError}</div>}
                
                <div className="form-group" style={{ marginBottom: "15px" }}>
                  <input type="text" className="form-control" placeholder="Full Name" value={tenantName} onChange={(e) => setTenantName(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: "15px" }}>
                  <input type="email" className="form-control" placeholder="Email Address" value={tenantEmail} onChange={(e) => setTenantEmail(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: "15px" }}>
                  <input type="tel" className="form-control" placeholder="Phone Number" value={tenantPhone} onChange={(e) => setTenantPhone(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: "20px" }}>
                  <textarea className="form-control" placeholder="Hi, I'm interested in this room..." rows={4} value={leadMessage} onChange={(e) => setLeadMessage(e.target.value)} style={{ resize: "none" }} />
                </div>

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="btn btn-primary" style={{ width: "100%", padding: "14px", fontSize: "1.05rem" }} disabled={submitting}>
                  {submitting ? <span className="spinner"></span> : "I'm Interested - Send Request"}
                </motion.button>
              </form>
            )}
          </div>
        </motion.div>
      </div>

      {similarRooms.length > 0 && (
        <div style={{ marginTop: '50px', borderTop: '1px solid var(--border-color)', paddingTop: '40px', paddingBottom: '40px' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={24} style={{ color: 'var(--primary)' }} /> Similar Rooms You Might Like
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
            {similarRooms.slice(0, 3).map(room => <Roomcard key={room._id || room.id} room={room} />)}
          </div>
        </div>
      )}
    </div>
  );
}

export default RoomsDetails;
