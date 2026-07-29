import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useTheme } from "../ThemeContext";
import { Compass, LayoutDashboard, LogOut, LogIn, User, Search, MessageSquare, Sun, Moon, Bell, Menu, X, Users, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import { API_URL } from "../config";

function Navbar() {
  const { user, token, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState(null);

  const handleLogout = () => {
    logout();
    navigate("/");
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    if (!token || !user) return;
    
    // Initial fetch for unread count
    fetch("/api/notifications", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      const count = data.filter(n => !n.isRead).length;
      setUnreadCount(count);
    }).catch(console.error);

    const socket = io(API_URL);
    socket.emit("join", user.id || user._id);
    
    socket.on("new_notification", (notif) => {
      setUnreadCount(prev => prev + 1);
      setToast(notif);
      
      // Play sound
      try {
        const audio = new Audio("https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=message-incoming-132042.mp3");
        audio.play().catch(e => {});
      } catch (e) {}

      setTimeout(() => setToast(null), 5000); // Hide toast after 5s
    });

    return () => socket.disconnect();
  }, [token, user]);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Mobile Menu Toggle & Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button 
            className="mobile-menu-btn" 
            onClick={() => setMobileMenuOpen(true)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'none' }}
          >
            <Menu size={24} />
          </button>
          <Link to="/" className="logo-section">
            <Home size={24} color="var(--primary)" />
            <span style={{ fontWeight: 800, fontSize: '1.2rem', marginLeft: '5px' }}>FindMyRoom</span>
          </Link>
        </div>

        {/* Desktop Links */}
        <div className="nav-links desktop-only">
          <Link to="/rooms" className={`nav-link ${location.pathname === "/rooms" ? "active" : ""}`}>
            Browse
          </Link>
          <Link to="/roommates" className={`nav-link ${location.pathname === "/roommates" ? "active" : ""}`}>
            Find Roommates
          </Link>
          <Link to="/community" className={`nav-link ${location.pathname === "/community" ? "active" : ""}`}>
            Community
          </Link>
          <Link to="/messages" className={`nav-link ${location.pathname === "/messages" ? "active" : ""}`}>
            Messages
          </Link>
          {user && user.role === "owner" && (
            <Link to="/dashboard" className={`nav-link ${location.pathname === "/dashboard" ? "active" : ""}`}>
              Dashboard
            </Link>
          )}
        </div>

        {/* Right Side Buttons */}
        <div className="nav-buttons">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="theme-toggle-btn desktop-only"
            style={{ background: "transparent", border: "none", color: "var(--text-primary)", cursor: "pointer", padding: "8px" }}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </motion.button>
          
          {user ? (
            <>
              <Link to="/notifications" style={{ textDecoration: 'none', position: 'relative', display: 'flex', alignItems: 'center', marginRight: '10px' }}>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{ background: "transparent", border: "none", color: "var(--text-primary)", cursor: "pointer", padding: "8px" }}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute', top: '0px', right: '0px',
                      background: 'var(--primary)', color: 'white',
                      fontSize: '0.65rem', fontWeight: 'bold',
                      borderRadius: '50%', width: '18px', height: '18px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </motion.button>
              </Link>
              <div className="user-badge desktop-only" onClick={() => navigate(user.role === "owner" ? "/dashboard" : "/rooms")}>
                <div className="user-avatar">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: "0.85rem", fontWeight: "600" }}>{user.username}</span>
                <span 
                  style={{ 
                    fontSize: "0.7rem", 
                    opacity: 0.6, 
                    background: user.role === "owner" ? "rgba(99, 102, 241, 0.2)" : "rgba(16, 185, 129, 0.2)",
                    color: user.role === "owner" ? "#818cf8" : "#34d399",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    textTransform: "uppercase"
                  }}
                >
                  {user.role}
                </span>
              </div>
            </>
          ) : (
            <div className="desktop-only" style={{ display: 'flex', gap: '10px' }}>
              <Link to="/login"><button className="btn btn-secondary">Login</button></Link>
              <Link to="/signup"><button className="btn btn-primary">Register</button></Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="mobile-drawer"
          >
            <div className="mobile-drawer-header">
              <Link to="/" className="logo-section" onClick={() => setMobileMenuOpen(false)}>
                <Home size={24} color="var(--primary)" />
                <span style={{ fontWeight: 800, fontSize: '1.2rem', marginLeft: '5px' }}>FindMyRoom</span>
              </Link>
              <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}>
                <X size={24} />
              </button>
            </div>

            <div className="mobile-drawer-links">
              <Link to="/" onClick={() => setMobileMenuOpen(false)}><Home size={20} /> Home</Link>
              <Link to="/rooms" onClick={() => setMobileMenuOpen(false)}><Search size={20} /> Browse</Link>
              <Link to="/roommates" onClick={() => setMobileMenuOpen(false)}><Users size={20} /> Find Roommates</Link>
              <Link to="/community" onClick={() => setMobileMenuOpen(false)}><MessageSquare size={20} /> Community</Link>
              <Link to="/messages" onClick={() => setMobileMenuOpen(false)}><MessageSquare size={20} /> Messages</Link>
              {user && user.role === "owner" && (
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}><LayoutDashboard size={20} /> Dashboard</Link>
              )}
            </div>

            <div className="mobile-drawer-footer">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span>Dark Mode</span>
                <label className="switch">
                  <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
                  <span className="slider round"></span>
                </label>
              </div>

              {user ? (
                <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                  <LogOut size={16} style={{ marginRight: '8px' }} /> Logout
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>Login</Link>
                  <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Register</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Global Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 20, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            style={{
              position: 'fixed', top: '0px', right: '20px', zIndex: 9999,
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              padding: '15px 20px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              display: 'flex', gap: '15px', alignItems: 'center', minWidth: '300px', cursor: 'pointer'
            }}
            onClick={() => {
              setToast(null);
              navigate("/notifications");
            }}
          >
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(99,102,241,0.2)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bell size={20} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: "0.95rem" }}>New Notification</h4>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>{toast.content}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;
