import React, { useState, useEffect } from "react";
import { Bell, Heart, MessageSquare, Eye, Inbox, UserPlus, Home, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

function Notifications() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    
    fetchNotifications();

    // Setup Socket for Real-time
    const socket = io("http://localhost:5000");
    socket.emit("join", user.id || user._id);
    
    socket.on("new_notification", (notif) => {
      setNotifications(prev => [notif, ...prev]);
    });

    return () => socket.disconnect();
  }, [token]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAction = async (id, action) => {
    try {
      const res = await fetch(`/api/notifications/${id}/action`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, actionStatus: action, isRead: true } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "INQUIRY": return <Inbox size={20} style={{ color: "var(--primary)" }} />;
      case "MESSAGE": return <MessageSquare size={20} style={{ color: "#3b82f6" }} />;
      case "SYSTEM": return <Bell size={20} style={{ color: "#f59e0b" }} />;
      case "VIEW": return <Eye size={20} style={{ color: "#10b981" }} />;
      case "SHARE": return <UserPlus size={20} style={{ color: "#8b5cf6" }} />;
      default: return <Bell size={20} />;
    }
  };

  return (
    <div className="container page-container" style={{ maxWidth: "800px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "1.8rem" }}>
          <Bell size={28} /> Notification Center
        </h1>
      </div>

      <div className="glass-panel" style={{ padding: "20px" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}><span className="spinner"></span></div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-secondary)" }}>
            <Bell size={48} style={{ opacity: 0.2, marginBottom: "15px" }} />
            <h3>You're all caught up!</h3>
            <p>No new notifications at this time.</p>
          </div>
        ) : (
          <AnimatePresence>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {notifications.map((notif) => (
                <motion.div 
                  key={notif._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ 
                    display: "flex", 
                    gap: "15px", 
                    padding: "20px", 
                    borderRadius: "12px", 
                    background: notif.isRead ? "rgba(255,255,255,0.03)" : "rgba(99, 102, 241, 0.1)",
                    border: notif.isRead ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(99, 102, 241, 0.3)",
                    transition: "all 0.3s ease",
                    cursor: notif.isRead ? "default" : "pointer"
                  }}
                  onClick={() => !notif.isRead && handleMarkAsRead(notif._id)}
                >
                  <div style={{ 
                    width: "48px", height: "48px", borderRadius: "50%", 
                    background: "rgba(0,0,0,0.2)", display: "flex", 
                    alignItems: "center", justifyContent: "center", flexShrink: 0 
                  }}>
                    {getIcon(notif.type)}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "bold" }}>{notif.type}</span>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "1.05rem", color: notif.isRead ? "var(--text-secondary)" : "#fff", fontWeight: notif.isRead ? "normal" : "600" }}>
                      {notif.content}
                    </p>
                    
                    {notif.relatedRoom && (
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/rooms/${notif.relatedRoom._id}`); }} className="btn btn-secondary" style={{ marginTop: "15px", padding: "6px 12px", fontSize: "0.8rem", marginRight: "10px" }}>
                        View Room
                      </button>
                    )}
                    
                    {/* Actionable buttons */}
                    {(notif.type === 'INQUIRY' || notif.type === 'ROOM_INQUIRY' || notif.type === 'VISIT_REQUEST') && (
                      <div style={{ marginTop: "15px", display: "flex", gap: "10px" }} onClick={(e) => e.stopPropagation()}>
                        {notif.actionStatus === 'none' || notif.actionStatus === 'pending' || !notif.actionStatus ? (
                          <>
                            <button className="btn btn-primary" style={{ padding: "6px 12px", fontSize: "0.8rem" }} onClick={() => handleAction(notif._id, 'accepted')}>Accept</button>
                            <button className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "0.8rem", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.3)" }} onClick={() => handleAction(notif._id, 'rejected')}>Reject</button>
                          </>
                        ) : (
                          <div style={{ fontSize: "0.85rem", fontWeight: "bold", color: notif.actionStatus === 'accepted' ? "#10b981" : "#ef4444" }}>
                            {notif.actionStatus === 'accepted' ? 'Accepted ✓' : 'Rejected ✕'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {!notif.isRead && (
                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "var(--primary)", alignSelf: "center" }}></div>
                  )}
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

export default Notifications;
