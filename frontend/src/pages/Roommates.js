import React, { useState, useEffect } from "react";
import { Users, Search, Filter, ShieldCheck, Heart, MessageCircle, MapPin, Briefcase, Sparkles, Share2, Flag, Plus, Check, MoreVertical, Edit2, Trash2, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import CreateRoommateRequest from "../components/CreateRoommateRequest";
import { RoomCardSkeleton } from "../components/SkeletonLoader";

function Roommates() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  
  // Filters
  const [cityInput, setCityInput] = useState("");
  const [genderInput, setGenderInput] = useState("");
  const [budgetInput, setBudgetInput] = useState("");
  const [occupationInput, setOccupationInput] = useState("");
  const [lifestyleFilters, setLifestyleFilters] = useState({
    smoking: "", pets: "", diet: ""
  });
  
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [useAiMatch, setUseAiMatch] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // "all" or "my"
  
  const fetchFeed = async (isAiMatch = useAiMatch) => {
    setLoading(true);
    let url = "/api/roommates";
    
    if (isAiMatch && token) {
      url = "/api/roommates/personalized";
    }

    const params = new URLSearchParams();
    if (!isAiMatch) {
      if (cityInput) params.append("city", cityInput);
      if (genderInput) params.append("genderPreference", genderInput);
      if (budgetInput) params.append("maxBudget", budgetInput);
      if (occupationInput) params.append("occupation", occupationInput);
      
      const activeLifestyle = {};
      if (lifestyleFilters.smoking) activeLifestyle.smoking = lifestyleFilters.smoking === "true";
      if (lifestyleFilters.pets) activeLifestyle.pets = lifestyleFilters.pets === "true";
      if (lifestyleFilters.diet) activeLifestyle.diet = lifestyleFilters.diet;
      if (Object.keys(activeLifestyle).length > 0) params.append("lifestyle", JSON.stringify(activeLifestyle));
      
      params.append("page", page);
      params.append("limit", 10);
      
      if (params.toString()) url += `?${params.toString()}`;
    }

    try {
      const res = await fetch(url, isAiMatch ? { headers: { "Authorization": `Bearer ${token}` } } : {});
      const data = await res.json();
      
      if (isAiMatch) {
         setFeed(Array.isArray(data) ? data : []);
         setHasMore(false);
      } else {
         const requests = data.requests || (Array.isArray(data) ? data : []);
         setFeed(prev => page === 1 ? requests : [...prev, ...requests]);
         setHasMore(data.page < data.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed(useAiMatch);
  }, [useAiMatch, page]);

  const handleApplyFilters = (e) => {
    e.preventDefault();
    setUseAiMatch(false);
    if (page === 1) fetchFeed(false);
    else setPage(1);
  };
  
  const handleClearFilters = () => {
    setCityInput(""); setGenderInput(""); setBudgetInput("");
    setOccupationInput(""); setLifestyleFilters({ smoking: "", pets: "", diet: "" });
    setUseAiMatch(false);
    setPage(1);
  };
  
  const handleLike = async (postId) => {
    if (!token) return alert("Please login to interact!");
    // Optimistic UI update
    setFeed(prev => prev.map(p => {
      if (p._id === postId) {
        const hasLiked = p.likes.includes(user?.id);
        const newLikes = hasLiked ? p.likes.filter(id => id !== user.id) : [...p.likes, user.id];
        return { ...p, likes: newLikes };
      }
      return p;
    }));
    
    try {
      await fetch(`/api/roommates/${postId}/like`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
    } catch (err) { console.error(err); }
  };

  const handleSave = async (postId) => {
    if (!token) return alert("Please login to interact!");
    setFeed(prev => prev.map(p => {
      if (p._id === postId) {
        const hasSaved = p.saves.includes(user?.id);
        const newSaves = hasSaved ? p.saves.filter(id => id !== user.id) : [...p.saves, user.id];
        return { ...p, saves: newSaves };
      }
      return p;
    }));
    
    try {
      await fetch(`/api/roommates/${postId}/save`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
    } catch (err) { console.error(err); }
  };

  const handleInterested = async (postId) => {
    if (!token) return alert("Please login to connect!");
    try {
      const res = await fetch(`/api/roommates/${postId}/interested`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) alert("Interest sent! The user has been notified.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleReport = async (postId) => {
    if (!token) return alert("Please login to report!");
    try {
      await fetch(`/api/roommates/${postId}/report`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      alert("Post reported to admins.");
    } catch (err) { console.error(err); }
    setActiveDropdown(null);
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await fetch(`/api/roommates/${postId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setFeed(prev => prev.filter(p => p._id !== postId));
      }
    } catch (err) { console.error(err); }
    setActiveDropdown(null);
  };

  const handleMarkFound = async (postId) => {
    try {
      const res = await fetch(`/api/roommates/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ status: "Found Roommate" })
      });
      if (res.ok) {
        setFeed(prev => prev.map(p => p._id === postId ? { ...p, status: "Found Roommate" } : p));
      }
    } catch (err) { console.error(err); }
    setActiveDropdown(null);
  };

  const calculateCompatibility = (postLifestyle) => {
    if (!user || !user.lifestyle) return null;
    let score = 100;
    const uLife = user.lifestyle;
    if (uLife.smoking !== postLifestyle.smoking) score -= 30;
    if (uLife.pets !== postLifestyle.pets) score -= 20;
    if (uLife.diet !== "Any" && postLifestyle.diet !== "Any" && uLife.diet !== postLifestyle.diet) score -= 25;
    if (uLife.sleepSchedule !== "Flexible" && postLifestyle.sleepSchedule !== "Flexible" && uLife.sleepSchedule !== postLifestyle.sleepSchedule) score -= 15;
    return Math.max(0, score);
  };

  const handleMessage = (userId) => {
    if (!token) return alert("Please login to message!");
    // In a full app, this would create a conversation and redirect
    navigate(`/messages`);
  };

  const copyToClipboard = (postId) => {
    const url = `${window.location.origin}/roommates?post=${postId}`;
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  };

  return (
    <div className="container page-container">
      {/* Header & Tabs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "15px" }}>
        <div style={{ display: "flex", gap: "15px" }}>
          <button 
            className={`btn ${activeTab === "all" ? "btn-primary" : "btn-secondary"}`} 
            onClick={() => setActiveTab("all")}
            style={{ borderRadius: "20px", padding: "8px 20px" }}
          >
            All Requests
          </button>
          {user && (
            <button 
              className={`btn ${activeTab === "my" ? "btn-primary" : "btn-secondary"}`} 
              onClick={() => setActiveTab("my")}
              style={{ borderRadius: "20px", padding: "8px 20px" }}
            >
              My Requests
            </button>
          )}
        </div>
        {token && (
          <button onClick={() => setShowCreateModal(true)} className="btn btn-accent" style={{ padding: "10px 20px", boxShadow: "var(--shadow-primary)" }}>
            <Plus size={18} /> Post a Request
          </button>
        )}
      </div>

      {/* Feed Layout */}
      <div className="feed-layout">
        
        {/* Left Sidebar: Filters */}
        <div className="sidebar-column" style={{ flex: "0 0 320px", display: activeTab === "all" ? "block" : "none" }}>
          <div className="glass-panel" style={{ padding: "24px", position: "sticky", top: "100px" }}>
            <h3 style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Filter size={18} /> Find Roommates
            </h3>
            
            <form onSubmit={handleApplyFilters}>
              <div className="form-group">
                <label className="form-label">City/Area</label>
                <div className="form-control-wrapper">
                  <Search className="form-icon-left" size={16} />
                  <input type="text" className="form-control" placeholder="Bangalore" value={cityInput} onChange={e => setCityInput(e.target.value)} />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Gender Preference</label>
                <select className="form-control form-control-noicon" value={genderInput} onChange={e => setGenderInput(e.target.value)}>
                  <option value="">Any</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Max Budget (₹)</label>
                <input type="number" className="form-control form-control-noicon" placeholder="e.g. 15000" value={budgetInput} onChange={e => setBudgetInput(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Occupation</label>
                <select className="form-control form-control-noicon" value={occupationInput} onChange={e => setOccupationInput(e.target.value)}>
                  <option value="">Any</option>
                  <option value="Student">Student</option>
                  <option value="Working Professional">Working Professional</option>
                  <option value="Freelancer">Freelancer</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Diet</label>
                <select className="form-control form-control-noicon" value={lifestyleFilters.diet} onChange={e => setLifestyleFilters({...lifestyleFilters, diet: e.target.value})}>
                  <option value="">Any</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                </select>
              </div>
              
              <div style={{ display: "flex", gap: "10px", marginTop: "15px", marginBottom: "15px" }}>
                <label style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "5px", color: "var(--text-secondary)" }}>
                  <input type="checkbox" checked={lifestyleFilters.smoking === "true"} onChange={e => setLifestyleFilters({...lifestyleFilters, smoking: e.target.checked ? "true" : ""})} disabled={useAiMatch} />
                  Smoking Allowed
                </label>
                <label style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "5px", color: "var(--text-secondary)" }}>
                  <input type="checkbox" checked={lifestyleFilters.pets === "true"} onChange={e => setLifestyleFilters({...lifestyleFilters, pets: e.target.checked ? "true" : ""})} disabled={useAiMatch} />
                  Pet Friendly
                </label>
              </div>
              
              <div style={{ display: "flex", gap: "10px" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: "10px" }} disabled={useAiMatch}>Apply</button>
                <button type="button" onClick={handleClearFilters} className="btn btn-secondary" style={{ flex: 1, padding: "10px" }}>Clear</button>
              </div>

              {token && (
                <div style={{ marginTop: "15px" }}>
                  <button 
                    type="button" 
                    onClick={() => setUseAiMatch(!useAiMatch)} 
                    className={`btn ${useAiMatch ? 'btn-primary' : 'btn-secondary'}`} 
                    style={{ width: "100%", padding: "10px", display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}
                  >
                    <Sparkles size={16} /> {useAiMatch ? "AI Match Active" : "Use AI Match"}
                  </button>
                  {useAiMatch && <p style={{ fontSize: "0.75rem", color: "var(--secondary)", marginTop: "8px", textAlign: "center" }}>We are finding the best roommates based on your profile.</p>}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Center Feed Column */}
        <div className="feed-column">
          {loading ? (
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "25px" }}>
              <RoomCardSkeleton />
              <RoomCardSkeleton />
              <RoomCardSkeleton />
            </div>
          ) : feed.length === 0 ? (
            <div className="glass-panel text-center" style={{ padding: "60px 20px", width: "100%" }}>
              <Users size={48} style={{ color: "var(--text-muted)", marginBottom: "15px" }} />
              <h3>No Requests Found</h3>
              <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>Try adjusting your filters or be the first to post a request!</p>
            </div>
          ) : (
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "25px" }}>
              {feed.filter(post => activeTab === "all" || (activeTab === "my" && user && post.user?._id === user.id)).length === 0 ? (
                <div className="glass-panel text-center" style={{ padding: "60px 20px", width: "100%" }}>
                  <Users size={48} style={{ color: "var(--text-muted)", marginBottom: "15px" }} />
                  <h3>No Requests Found</h3>
                  <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>Try adjusting your filters or be the first to post a request!</p>
                </div>
              ) : feed.filter(post => activeTab === "all" || (activeTab === "my" && user && post.user?._id === user.id)).map((post) => {
                const isLiked = user && post.likes?.includes(user.id);
                const isSaved = user && post.saves?.includes(user.id);
                const postUser = post.user || {};
                const lifestyle = postUser.lifestyle || {};

                return (
                  <motion.div key={post._id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="room-card" style={{ maxWidth: "100%", margin: 0 }}>
                    {/* Header */}
                    <div className="room-card-header" style={{ padding: "16px 20px" }}>
                      <div className="owner-info">
                        <div className="owner-avatar" style={{ width: "45px", height: "45px" }}>
                          {postUser.profilePicture ? (
                            <img src={postUser.profilePicture} alt="User" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} loading="lazy" />
                          ) : (
                            postUser.username?.charAt(0).toUpperCase() || "U"
                          )}
                        </div>
                        <div>
                          <div className="owner-name" style={{ fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "5px" }}>
                            {postUser.username} {postUser.isVerified && <ShieldCheck size={14} style={{ color: "var(--secondary)" }} />}
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "5px" }}>
                            <Briefcase size={10} /> {postUser.occupation || "Not specified"}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {post.status === "Found Roommate" ? (
                          <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", padding: "4px 10px", borderRadius: "20px", fontSize: "0.75rem", color: "#10b981", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                            <CheckCircle size={12} color="#10b981" /> Roommate Found
                          </div>
                        ) : (
                          <div style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(16,185,129,0.1))", border: "1px solid rgba(99,102,241,0.2)", padding: "4px 10px", borderRadius: "20px", fontSize: "0.75rem", color: "var(--text-primary)", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                            <Sparkles size={12} color="var(--primary)" /> Looking for Roommate
                          </div>
                        )}
                        
                        <div style={{ position: "relative" }}>
                          <button onClick={() => setActiveDropdown(activeDropdown === post._id ? null : post._id)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "4px" }}>
                            <MoreVertical size={18} />
                          </button>
                          {activeDropdown === post._id && (
                            <div className="glass-panel" style={{ position: "absolute", right: 0, top: "30px", padding: "8px", zIndex: 10, minWidth: "150px", display: "flex", flexDirection: "column", gap: "5px", boxShadow: "0 10px 20px rgba(0,0,0,0.2)" }}>
                              {user && user.id === postUser._id ? (
                                <>
                                  <button onClick={() => { setEditingPost(post); setActiveDropdown(null); }} className="btn btn-secondary" style={{ padding: "6px", fontSize: "0.8rem", textAlign: "left", display: "flex", alignItems: "center", gap: "8px", border: "none" }}><Edit2 size={14} /> Edit</button>
                                  {post.status !== "Found Roommate" && (
                                    <button onClick={() => handleMarkFound(post._id)} className="btn btn-secondary" style={{ padding: "6px", fontSize: "0.8rem", textAlign: "left", display: "flex", alignItems: "center", gap: "8px", border: "none" }}><CheckCircle size={14} /> Mark Found</button>
                                  )}
                                  <button onClick={() => handleDelete(post._id)} className="btn btn-secondary" style={{ padding: "6px", fontSize: "0.8rem", textAlign: "left", display: "flex", alignItems: "center", gap: "8px", color: "var(--danger)", border: "none" }}><Trash2 size={14} /> Delete</button>
                                </>
                              ) : (
                                <button onClick={() => handleReport(post._id)} className="btn btn-secondary" style={{ padding: "6px", fontSize: "0.8rem", textAlign: "left", display: "flex", alignItems: "center", gap: "8px", color: "var(--danger)", border: "none" }}><Flag size={14} /> Report</button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="room-card-content" style={{ padding: "20px" }}>
                      <p style={{ fontSize: "1rem", lineHeight: "1.5", marginBottom: "15px" }}>{post.description}</p>
                      
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
                        <div style={{ background: "rgba(255,255,255,0.03)", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-color)", flex: "1 1 calc(50% - 10px)" }}>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", display: "block", marginBottom: "2px" }}>Location</span>
                          <span style={{ fontSize: "0.9rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}><MapPin size={12} /> {post.areaPreference ? `${post.areaPreference}, ` : ""}{post.city}</span>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.03)", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-color)", flex: "1 1 calc(50% - 10px)" }}>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", display: "block", marginBottom: "2px" }}>Max Budget</span>
                          <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--secondary)" }}>₹{post.maxBudget.toLocaleString('en-IN')}/mo</span>
                        </div>
                      </div>

                      <div className="facilities-container">
                        {post.moveInDate && (
                          <span className="facility-tag" style={{ background: "rgba(99,102,241,0.1)", color: "var(--primary)", borderColor: "rgba(99,102,241,0.2)" }}>
                            Move in: {new Date(post.moveInDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                        <span className="facility-tag">Gender: {post.preferredGender || "Any"}</span>
                        {lifestyle.smoking && <span className="facility-tag" style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)", borderColor: "rgba(239,68,68,0.2)" }}>Smoker</span>}
                        {lifestyle.pets && <span className="facility-tag" style={{ background: "rgba(16,185,129,0.1)", color: "var(--secondary)", borderColor: "rgba(16,185,129,0.2)" }}>Loves Pets</span>}
                        {lifestyle.diet && lifestyle.diet !== "Any" && <span className="facility-tag">Diet: {lifestyle.diet}</span>}
                        {lifestyle.sleepSchedule && lifestyle.sleepSchedule !== "Flexible" && <span className="facility-tag">{lifestyle.sleepSchedule}</span>}
                        
                        {user && user.id !== postUser._id && calculateCompatibility(lifestyle) !== null && (
                          <span className="facility-tag" style={{ marginLeft: "auto", background: calculateCompatibility(lifestyle) > 80 ? "rgba(16,185,129,0.2)" : (calculateCompatibility(lifestyle) > 50 ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)"), color: calculateCompatibility(lifestyle) > 80 ? "#10b981" : (calculateCompatibility(lifestyle) > 50 ? "#f59e0b" : "#ef4444"), fontWeight: "bold" }}>
                            {calculateCompatibility(lifestyle)}% Match
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Social Actions */}
                    <div style={{ padding: "0 20px 15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)" }}>
                      <div className="action-buttons-left">
                        <button onClick={() => handleLike(post._id)} className={`card-action-btn ${isLiked ? 'liked' : ''}`} style={{ border: "none", background: "none", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Heart size={20} fill={isLiked ? "currentColor" : "none"} /> {post.likes?.length || 0}
                        </button>
                        <button onClick={() => copyToClipboard(post._id)} className="card-action-btn" style={{ border: "none", background: "none" }}>
                          <Share2 size={20} />
                        </button>
                      </div>
                      <div className="action-buttons-right" style={{ display: "flex", gap: "12px" }}>
                        <button className="card-action-btn" style={{ border: "none", background: "none", color: "var(--text-muted)" }}>
                          <Flag size={16} />
                        </button>
                        <button onClick={() => handleSave(post._id)} className={`card-action-btn ${isSaved ? 'bookmarked' : ''}`} style={{ border: "none", background: "none" }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                        </button>
                      </div>
                    </div>

                    {/* CTA Buttons */}
                    <div style={{ padding: "15px 20px", display: "flex", gap: "10px", background: "rgba(0,0,0,0.2)" }}>
                      <button onClick={() => handleInterested(post._id)} className="btn btn-secondary" style={{ flex: 1, padding: "10px", fontSize: "0.9rem" }} disabled={post.status === "Found Roommate"}>
                        <Check size={16} /> I'm Interested
                      </button>
                      <button onClick={() => handleMessage(post.user?._id)} className="btn btn-primary" style={{ flex: 2, padding: "10px", fontSize: "0.9rem" }}>
                        <MessageCircle size={16} /> Message {post.user?.username?.split(" ")[0]}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Empty Column for Balance (Optional) */}
        <div style={{ flex: "0 0 250px", display: "none" }}></div>
      </div>

      <AnimatePresence>
        {(showCreateModal || editingPost) && (
          <CreateRoommateRequest 
            initialData={editingPost}
            onClose={() => { setShowCreateModal(false); setEditingPost(null); }}
            onCreated={(newPost, isEdit) => {
              setShowCreateModal(false);
              setEditingPost(null);
              if (isEdit) {
                setFeed(feed.map(p => p._id === newPost._id ? newPost : p));
              } else {
                setFeed([newPost, ...feed]);
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default Roommates;
