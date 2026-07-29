import React, { useState, useEffect } from "react";
import { MessageSquare, Users, MapPin, TrendingUp, Compass, Heart, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../AuthContext";

function Community() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState("discussions"); // discussions, groups, tips
  const [posts, setPosts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostLocation, setNewPostLocation] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchPosts = async () => {
    setLoading(true);
    let type = "";
    if (activeTab === "discussions") type = "CommunityDiscussion";
    if (activeTab === "tips") type = "MovingTip";
    
    try {
      const res = await fetch(`/api/community/posts?page=${page}&limit=10${type ? `&type=${type}` : ""}`);
      const data = await res.json();
      const newPosts = data.posts || [];
      setPosts(prev => page === 1 ? newPosts : [...prev, ...newPosts]);
      setHasMore(data.page < data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/community/groups`);
      const data = await res.json();
      setGroups(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "groups") {
      fetchGroups();
    } else {
      fetchPosts();
    }
  }, [activeTab, page]);

  // Reset page when tab changes
  useEffect(() => {
    setPage(1);
    setPosts([]);
  }, [activeTab]);

  const handlePost = async () => {
    if (!newPostContent) return;
    if (!user) {
      setToast("Please login to post");
      setTimeout(() => setToast(null), 3000);
      return;
    }
    
    setIsPosting(true);
    try {
      const type = activeTab === "tips" ? "MovingTip" : "CommunityDiscussion";
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ content: newPostContent, location: newPostLocation, type })
      });
      if (res.ok) {
        setNewPostContent("");
        setNewPostLocation("");
        if (page === 1) fetchPosts();
        else setPage(1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (postId) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/community/posts/${postId}/like`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container page-container">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center" style={{ marginBottom: "40px" }}>
        <h1 style={{ fontSize: "2.8rem", marginBottom: "15px" }}>Local <span style={{ color: "var(--primary)" }}>Community</span> Hub</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto" }}>
          Join groups, ask for local recommendations, and read moving tips from verified users.
        </p>
      </motion.div>

      {/* Tabs */}
      <div style={{ display: "flex", justifyContent: "center", gap: "15px", marginBottom: "40px" }}>
        <button className={`btn ${activeTab === "discussions" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveTab("discussions")}>
          <MessageSquare size={16} /> Discussions
        </button>
        <button className={`btn ${activeTab === "groups" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveTab("groups")}>
          <Users size={16} /> Housing Groups
        </button>
        <button className={`btn ${activeTab === "tips" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveTab("tips")}>
          <Compass size={16} /> Moving Tips
        </button>
      </div>

      <div className="feed-layout">
        {/* Main Feed Column */}
        <div className="feed-column" style={{ flex: 2 }}>
          {activeTab === "discussions" || activeTab === "tips" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
              {/* Create Post Input */}
              <div className="glass-panel" style={{ padding: "20px", marginBottom: "10px" }}>
                <div style={{ display: "flex", gap: "15px" }}>
                  <div style={{ width: "45px", height: "45px", borderRadius: "50%", background: "var(--primary)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                    {user ? user.username.charAt(0).toUpperCase() : "?"}
                  </div>
                  <input type="text" className="form-control" value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} placeholder="Ask for a recommendation, post a tip, or start a discussion..." style={{ background: "rgba(255,255,255,0.05)", border: "none" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "15px" }}>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <div style={{ position: "relative" }}>
                      <MapPin size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
                      <input type="text" value={newPostLocation} onChange={(e) => setNewPostLocation(e.target.value)} placeholder="Add Location (optional)" className="form-control" style={{ paddingLeft: "30px", background: "rgba(255,255,255,0.05)", border: "none", fontSize: "0.8rem", height: "100%" }} />
                    </div>
                  </div>
                  <button className="btn btn-primary" onClick={handlePost} disabled={isPosting} style={{ padding: "6px 16px", fontSize: "0.9rem" }}>{isPosting ? "Posting..." : "Post"}</button>
                </div>
              </div>

              {/* Feed Posts */}
              {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}><span className="spinner"></span></div>
              ) : posts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>No posts found. Be the first to start a discussion!</div>
              ) : posts.map((post) => (
                <motion.div key={post._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel" style={{ padding: "25px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
                    <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                      {post.author?.profilePicture ? (
                        <img src={post.author.profilePicture} alt="User" style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover" }} loading="lazy" />
                      ) : (
                        <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                          {post.author?.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 style={{ margin: 0, fontSize: "1.1rem" }}>{post.author?.username || "Unknown User"}</h4>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span> &bull; 
                          <span style={{ color: "var(--secondary)" }}>{post.type}</span>
                          {post.location && <>&bull; <span><MapPin size={10} style={{ display: "inline" }}/> {post.location}</span></>}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p style={{ fontSize: "1.05rem", lineHeight: "1.6", marginBottom: "20px" }}>{post.content}</p>
                  
                  <div style={{ display: "flex", gap: "20px", borderTop: "1px solid var(--border-color)", paddingTop: "15px", color: "var(--text-secondary)" }}>
                    <button onClick={() => handleLike(post._id)} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: post.likes?.includes(user?.id) ? "var(--danger)" : "inherit", cursor: "pointer", transition: "color 0.2s" }}>
                      <Heart size={18} fill={post.likes?.includes(user?.id) ? "var(--danger)" : "none"} /> {post.likes?.length || 0}
                    </button>
                    <button style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "inherit", cursor: "pointer", transition: "color 0.2s" }}>
                      <MessageSquare size={18} /> {post.comments?.length || 0} Comments
                    </button>
                    <button style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "inherit", cursor: "pointer", marginLeft: "auto" }}>
                      <Share2 size={18} /> Share
                    </button>
                  </div>
                </motion.div>
              ))}
              
              {!loading && activeTab !== "groups" && hasMore && posts.length > 0 && (
                <div style={{ textAlign: "center", marginTop: "30px" }}>
                  <button className="btn btn-outline" onClick={() => setPage(p => p + 1)}>
                    Load More
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", width: "100%" }}>
              {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "40px", gridColumn: "span 2" }}><span className="spinner"></span></div>
              ) : groups.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", gridColumn: "span 2", color: "var(--text-secondary)" }}>No groups found.</div>
              ) : groups.map((group) => (
                <motion.div key={group._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel" style={{ padding: "25px", textAlign: "center" }}>
                  <div style={{ width: "60px", height: "60px", background: "linear-gradient(135deg, var(--primary), var(--secondary))", borderRadius: "16px", margin: "0 auto 15px auto", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                    <Users size={30} />
                  </div>
                  <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>{group.name}</h3>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "15px" }}>
                    {group.type || "General"} &bull; {group.location || "Online"}
                  </div>
                  <div style={{ fontSize: "0.9rem", fontWeight: "bold", marginBottom: "20px" }}>
                    {group.members?.length || 0} Members
                  </div>
                  <button className="btn btn-primary" style={{ width: "100%" }}>Join Group</button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="sidebar-column" style={{ flex: 1 }}>
          <div className="glass-panel" style={{ padding: "25px" }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
              <TrendingUp size={20} style={{ color: "var(--secondary)" }} /> Trending Topics
            </h3>
            <ul style={{ listStyle: "none", padding: 0 }}>
              <li style={{ marginBottom: "15px" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>#MumbaiRents</div>
                <div style={{ fontWeight: "600" }}>Rents skyrocket in Bandra...</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>1,245 posts</div>
              </li>
              <li style={{ marginBottom: "15px" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>#StudentLife</div>
                <div style={{ fontWeight: "600" }}>Best PG food near Delhi University?</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>856 posts</div>
              </li>
              <li>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>#TechHubs</div>
                <div style={{ fontWeight: "600" }}>Moving to HSR Layout, Bangalore</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>2,301 posts</div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Community;
