import React, { useState, useEffect } from "react";
import { useAuth } from "../../AuthContext";
import { Heart, Send, Users, Sparkles, MapPin, ExternalLink, MessageCircle, Bell, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Roomcard from "../Roomcard";
import VerificationSection from "./VerificationSection";

function TenantDashboard() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState("saved");
  
  const [savedRooms, setSavedRooms] = useState([]);
  const [appliedRooms, setAppliedRooms] = useState([]);
  const [roommateRequests, setRoommateRequests] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const fetchData = async (tab) => {
    setLoading(true);
    try {
      if (tab === "saved") {
        const res = await fetch("/api/tenant/saved-rooms", { headers: { "Authorization": `Bearer ${token}` } });
        const data = await res.json();
        setSavedRooms(Array.isArray(data) ? data : []);
      } else if (tab === "applied") {
        const res = await fetch("/api/tenant/applied", { headers: { "Authorization": `Bearer ${token}` } });
        const data = await res.json();
        setAppliedRooms(Array.isArray(data) ? data : []);
      } else if (tab === "roommate") {
        const res = await fetch("/api/tenant/roommate-requests", { headers: { "Authorization": `Bearer ${token}` } });
        const data = await res.json();
        setRoommateRequests(Array.isArray(data) ? data : []);
      } else if (tab === "recommendations") {
        const prefs = { budget: 15000, location: "Hyderabad", lifestyle: user?.lifestyle };
        const res = await fetch("/api/rooms/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ prefs })
        });
        const data = await res.json();
        setRecommendations(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-grid">
      {/* Sidebar Navigation */}
      <div className="dashboard-sidebar-menu">
        <div style={{ padding: "0 20px 15px 20px" }}>
          <h3 style={{ fontSize: "1.1rem", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tenant Hub</h3>
        </div>
        
        <button className={`dashboard-menu-item ${activeTab === "saved" ? "active" : ""}`} onClick={() => setActiveTab("saved")}>
          <Heart size={18} /> Saved Rooms
        </button>
        
        <button className={`dashboard-menu-item ${activeTab === "applied" ? "active" : ""}`} onClick={() => setActiveTab("applied")}>
          <Send size={18} /> Applied Rooms
        </button>
        
        <button className={`dashboard-menu-item ${activeTab === "roommate" ? "active" : ""}`} onClick={() => setActiveTab("roommate")}>
          <Users size={18} /> My Roommate Requests
        </button>
        
        <button className={`dashboard-menu-item ${activeTab === "recommendations" ? "active" : ""}`} onClick={() => setActiveTab("recommendations")}>
          <Sparkles size={18} /> AI Recommendations
        </button>

        <button className={`dashboard-menu-item ${activeTab === "verification" ? "active" : ""}`} onClick={() => setActiveTab("verification")}>
          <CheckCircle size={18} /> Verification & Trust
        </button>

        <div style={{ borderTop: "1px solid var(--border-color)", margin: "15px 20px", paddingTop: "15px" }}>
          <a href="/messages" className="dashboard-menu-item" style={{ textDecoration: "none" }}>
            <MessageCircle size={18} /> Messages
          </a>
          <a href="/notifications" className="dashboard-menu-item" style={{ textDecoration: "none" }}>
            <Bell size={18} /> Notifications
          </a>
        </div>
      </div>

      {/* Dashboard Content Container */}
      <div className="glass-panel dashboard-content-panel">
        <AnimatePresence mode="wait">
          
          {/* Tab: Saved Rooms */}
          {activeTab === "saved" && (
            <motion.div key="saved" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>
              <div className="dashboard-header-row">
                <div>
                  <h2>Saved Rooms</h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Properties you've saved for later</p>
                </div>
              </div>

              {loading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}><span className="spinner"></span></div>
              ) : savedRooms.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <Heart size={40} style={{ color: "var(--text-muted)", marginBottom: "15px" }} />
                  <h3>No Saved Rooms</h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "8px" }}>Explore rooms and click the heart icon to save them here.</p>
                  <a href="/rooms" className="btn btn-primary mt-4" style={{ display: "inline-block" }}>Explore Rooms</a>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                  {savedRooms.map(room => (
                    <Roomcard key={room._id} room={room} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Tab: Applied Rooms */}
          {activeTab === "applied" && (
            <motion.div key="applied" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>
              <div className="dashboard-header-row">
                <div>
                  <h2>Applied Rooms</h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Track the status of your inquiries</p>
                </div>
              </div>

              {loading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}><span className="spinner"></span></div>
              ) : appliedRooms.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <Send size={40} style={{ color: "var(--text-muted)", marginBottom: "15px" }} />
                  <h3>No Applications Yet</h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "8px" }}>You haven't contacted any owners yet.</p>
                </div>
              ) : (
                <div className="leads-table-container">
                  <table className="leads-table">
                    <thead>
                      <tr>
                        <th>Property</th>
                        <th>Status</th>
                        <th>Applied On</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appliedRooms.map((lead) => (
                        <tr key={lead._id}>
                          <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>{lead.roomTitle || "Unknown Room"}</td>
                          <td>
                            <span style={{ 
                              padding: "4px 10px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "bold",
                              background: lead.status === "Pending" ? "rgba(245, 158, 11, 0.1)" : lead.status === "Accepted" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                              color: lead.status === "Pending" ? "#f59e0b" : lead.status === "Accepted" ? "#10b981" : "#ef4444"
                            }}>
                              {lead.status}
                            </span>
                          </td>
                          <td style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{new Date(lead.createdAt).toLocaleDateString()}</td>
                          <td>
                            <a href={`/rooms/${lead.roomId}`} className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "0.8rem" }}>View Room</a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {/* Tab: Roommate Requests */}
          {activeTab === "roommate" && (
            <motion.div key="roommate" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>
              <div className="dashboard-header-row">
                <div>
                  <h2>My Roommate Requests</h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Manage the roommate requests you have posted</p>
                </div>
                <a href="/roommates" className="btn btn-primary"><Users size={16} /> Community</a>
              </div>

              {loading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}><span className="spinner"></span></div>
              ) : roommateRequests.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <Users size={40} style={{ color: "var(--text-muted)", marginBottom: "15px" }} />
                  <h3>No Requests Posted</h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "8px" }}>Looking for a roommate? Post a request in the community.</p>
                </div>
              ) : (
                <div className="leads-table-container">
                  <table className="leads-table">
                    <thead>
                      <tr>
                        <th>City / Area</th>
                        <th>Budget</th>
                        <th>Status</th>
                        <th>Interactions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roommateRequests.map((req) => (
                        <tr key={req._id}>
                          <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>{req.city} {req.areaPreference && `(${req.areaPreference})`}</td>
                          <td>₹{req.maxBudget.toLocaleString('en-IN')}/mo</td>
                          <td>
                            <span style={{ 
                              padding: "4px 10px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "bold",
                              background: req.status === "Active" ? "rgba(16, 185, 129, 0.1)" : "rgba(107, 114, 128, 0.1)",
                              color: req.status === "Active" ? "#10b981" : "var(--text-secondary)"
                            }}>
                              {req.status}
                            </span>
                          </td>
                          <td style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                            <span style={{ marginRight: '10px' }}><Heart size={14} /> {req.likes?.length || 0}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {/* Tab: AI Recommendations */}
          {activeTab === "recommendations" && (
            <motion.div key="recommendations" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>
              <div className="dashboard-header-row">
                <div>
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Sparkles size={24} style={{ color: 'var(--primary)' }}/> Recommended For You</h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>AI-curated list based on your profile and lifestyle preferences</p>
                </div>
              </div>

              {loading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}><span className="spinner"></span></div>
              ) : recommendations.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <Sparkles size={40} style={{ color: "var(--text-muted)", marginBottom: "15px" }} />
                  <h3>No Recommendations Yet</h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "8px" }}>Update your profile preferences to get AI-powered recommendations.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                  {recommendations.map(room => (
                    <Roomcard key={room._id} room={room} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Tab: Verification */}
          {activeTab === "verification" && (
            <motion.div key="verification" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>
              <VerificationSection />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

export default TenantDashboard;
