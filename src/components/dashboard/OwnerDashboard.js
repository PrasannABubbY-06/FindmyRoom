import React, { useState, useEffect } from "react";
import { useAuth } from "../../AuthContext";
import { LayoutDashboard, PlusCircle, Inbox, Image, IndianRupee, MapPin, ShieldCheck, Mail, Phone, ExternalLink, Activity, Eye, TrendingUp, Sparkles, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import VerificationSection from "./VerificationSection";

function OwnerDashboard() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState("analytics");
  
  // Lists
  const [myListings, setMyListings] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(false);

  // Analytics Stats
  const [stats, setStats] = useState({
    totalViews: 0,
    totalLeads: 0,
    activeListings: 0,
    trustScore: user?.trustScore || 50
  });

  // Form Fields
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [roomType, setRoomType] = useState("Single Room");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [facilities, setFacilities] = useState([]);
  const [contactName, setContactName] = useState(user?.username || "");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  
  // AI States
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [photoFeedback, setPhotoFeedback] = useState(null);
  const [fakeWarning, setFakeWarning] = useState("");
  
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const availableFacilities = ["Wi-Fi", "AC", "Kitchen", "Parking", "Gym", "Laundry", "Furnished", "Elevator"];
  const roomTypes = ["Single Room", "Shared Room", "PG", "Hostel", "Apartment", "Flat", "Independent House"];

  const fetchMyListings = () => {
    setLoadingListings(true);
    fetch("/api/owner/rooms", { headers: { "Authorization": `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        setMyListings(Array.isArray(data) ? data : []);
        setLoadingListings(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingListings(false);
      });
  };

  const fetchLeads = () => {
    setLoadingLeads(true);
    fetch("/api/owner/leads", { headers: { "Authorization": `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        setLeads(Array.isArray(data) ? data : []);
        setLoadingLeads(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingLeads(false);
      });
  };

  const fetchAnalytics = () => {
    fetch("/api/owner/analytics", { headers: { "Authorization": `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if(!data.error) setStats(data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    if (activeTab === "listings") fetchMyListings();
    if (activeTab === "leads") fetchLeads();
    if (activeTab === "analytics") fetchAnalytics();
  }, [activeTab]);

  const handleFacilityToggle = (facility) => {
    if (facilities.includes(facility)) {
      setFacilities(facilities.filter(f => f !== facility));
    } else {
      setFacilities([...facilities, facility]);
    }
  };

  const handleGenerateDescription = async () => {
    if (!title || !price || !location) {
      setFormError("Please enter Title, Rent, and Location first to generate a description.");
      return;
    }
    setGeneratingDesc(true);
    try {
      const response = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ title, price, location, facilities })
      });
      const data = await response.json();
      if (data.description) {
        setDescription(data.description);
      }
    } catch (error) {
      console.error("Generate description error", error);
    } finally {
      setGeneratingDesc(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = async () => { 
      setImagePreview(reader.result); 
      setPhotoFeedback({ checking: true });
      try {
        const response = await fetch("/api/ai/check-photo", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ image: reader.result })
        });
        const data = await response.json();
        setPhotoFeedback({ checking: false, isGood: data.isGood, feedback: data.feedback });
      } catch (error) {
        setPhotoFeedback(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError("");
    setFormSuccess("");

    if (!title || !price || !location || !description) {
      setFormError("Listing Title, Rent, Location, and Description are required.");
      setFormSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title, price: Number(price), location, description, roomType, image: imagePreview, facilities, contactName, contactPhone, contactEmail
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create listing.");

      if (data.room && data.room.isFakeSuspicion) {
        setFakeWarning(`AI Warning: ${data.room.fakeReason}`);
      }

      setFormSuccess("Room listing posted successfully!");
      setTitle(""); setPrice(""); setLocation(""); setDescription(""); setRoomType("Single Room"); setImageFile(null); setImagePreview(""); setFacilities([]); setContactPhone(""); setPhotoFeedback(null);

      setTimeout(() => {
        setFormSuccess("");
        setActiveTab("listings");
      }, 1500);
    } catch (err) {
      setFormError(err.message || "Something went wrong.");
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="dashboard-grid">
      {/* Sidebar Navigation */}
      <div className="dashboard-sidebar-menu">
        <div style={{ padding: "0 20px 15px 20px" }}>
          <h3 style={{ fontSize: "1.1rem", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Owner Hub</h3>
        </div>
        
        <button className={`dashboard-menu-item ${activeTab === "analytics" ? "active" : ""}`} onClick={() => setActiveTab("analytics")}>
          <Activity size={18} /> Analytics & Performance
        </button>
        
        <button className={`dashboard-menu-item ${activeTab === "listings" ? "active" : ""}`} onClick={() => setActiveTab("listings")}>
          <LayoutDashboard size={18} /> Manage Listings
        </button>
        
        <button className={`dashboard-menu-item ${activeTab === "add" ? "active" : ""}`} onClick={() => setActiveTab("add")}>
          <PlusCircle size={18} /> Post a Room/Flat
        </button>
        
        <button className={`dashboard-menu-item ${activeTab === "leads" ? "active" : ""}`} onClick={() => setActiveTab("leads")}>
          <Inbox size={18} /> Tenant Inquiries
          {leads.length > 0 && <span style={{ marginLeft: "auto", background: "var(--danger)", color: "#fff", padding: "2px 8px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: "bold" }}>{leads.length}</span>}
        </button>
        
        <button className={`dashboard-menu-item ${activeTab === "verification" ? "active" : ""}`} onClick={() => setActiveTab("verification")}>
          <CheckCircle size={18} /> Verification & Trust
        </button>
      </div>

      {/* Dashboard Content Container */}
      <div className="glass-panel dashboard-content-panel">
        <AnimatePresence mode="wait">
          
          {/* Tab: Analytics */}
          {activeTab === "analytics" && (
            <motion.div key="analytics" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>
              <div className="dashboard-header-row">
                <div>
                  <h2>Performance Analytics</h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Track your property views and tenant engagement</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>
                <div className="glass-panel" style={{ padding: "20px", background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ color: "var(--text-secondary)", fontWeight: "500" }}>Total Views</span>
                    <Eye size={20} style={{ color: "var(--primary)" }} />
                  </div>
                  <div style={{ fontSize: "2rem", fontWeight: "bold" }}>{stats.totalViews.toLocaleString()}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--secondary)", display: "flex", alignItems: "center", gap: "4px", marginTop: "5px" }}><TrendingUp size={14} /> Real-time</div>
                </div>

                <div className="glass-panel" style={{ padding: "20px", background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ color: "var(--text-secondary)", fontWeight: "500" }}>Inquiries</span>
                    <Inbox size={20} style={{ color: "var(--secondary)" }} />
                  </div>
                  <div style={{ fontSize: "2rem", fontWeight: "bold" }}>{stats.totalLeads}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--secondary)", display: "flex", alignItems: "center", gap: "4px", marginTop: "5px" }}><TrendingUp size={14} /> Lead conversions</div>
                </div>

                <div className="glass-panel" style={{ padding: "20px", background: "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ color: "var(--text-secondary)", fontWeight: "500" }}>Trust Score</span>
                    <ShieldCheck size={20} style={{ color: "#f59e0b" }} />
                  </div>
                  <div style={{ fontSize: "2rem", fontWeight: "bold" }}>{stats.trustScore}%</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "5px" }}>Owner Reputation</div>
                </div>
              </div>

              <h3>Boost Your Listings</h3>
              <div className="glass-panel" style={{ padding: "25px", marginTop: "15px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)" }}>
                <div>
                  <h4 style={{ fontSize: "1.1rem", marginBottom: "5px" }}>Promote to Top of Feed</h4>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: "400px" }}>Get up to 5x more views by featuring your property at the top of the Instagram-style feed.</p>
                </div>
                <button className="btn btn-primary" style={{ padding: "10px 20px" }}><Sparkles size={16} /> Promote Now</button>
              </div>
            </motion.div>
          )}

          {/* Tab: My Listings */}
          {activeTab === "listings" && (
            <motion.div key="listings" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>
              <div className="dashboard-header-row">
                <div>
                  <h2>My Listed Properties</h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Manage your active listings</p>
                </div>
                <button onClick={() => setActiveTab("add")} className="btn btn-primary">
                  <PlusCircle size={16} /> Add Listing
                </button>
              </div>

              {loadingListings ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}><span className="spinner"></span></div>
              ) : myListings.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <LayoutDashboard size={40} style={{ color: "var(--text-muted)", marginBottom: "15px" }} />
                  <h3>No Rooms Listed Yet</h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "8px" }}>Get started by listing your first room for rent.</p>
                  <button onClick={() => setActiveTab("add")} className="btn btn-primary mt-4">Create Your First Listing</button>
                </div>
              ) : (
                <div className="dashboard-listings-grid">
                  {myListings.map((room) => {
                    const rId = room.id || room._id;
                    return (
                      <div key={rId} className="mini-listing-card">
                        <img src={room.image || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"} alt={room.title} className="mini-listing-image" />
                        <div className="mini-listing-body">
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <h4 className="mini-listing-title" style={{ maxWidth: "75%" }}>{room.title}</h4>
                            <span style={{ fontSize: "0.75rem", background: "rgba(99,102,241,0.1)", color: "var(--primary)", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold" }}>{room.roomType || "Single"}</span>
                          </div>
                          <div className="mini-listing-meta" style={{ marginTop: "8px" }}>
                            <span className="mini-listing-price">₹{room.price.toLocaleString('en-IN')}/mo</span>
                            <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><MapPin size={10} /> {room.location}</span>
                          </div>
                          <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
                            <a href={`/rooms/${rId}`} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ flex: 1, padding: "6px 12px", fontSize: "0.8rem", gap: "4px", justifyContent: "center" }}><ExternalLink size={12} /> View</a>
                            <button className="btn btn-primary" style={{ padding: "6px 12px", fontSize: "0.8rem" }}>Edit</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* Tab: Add Listing */}
          {activeTab === "add" && (
            <motion.div key="add" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>
              <div>
                <h2>Post a Room/Flat</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "25px" }}>Provide room features, rent, location, and upload pictures/videos.</p>
              </div>

              {formError && <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "var(--danger)", padding: "12px", borderRadius: "8px", marginBottom: "20px" }}>{formError}</div>}
              {fakeWarning && <div style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.2)", color: "#f59e0b", padding: "12px", borderRadius: "8px", marginBottom: "20px" }}>{fakeWarning}</div>}
              {formSuccess && <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", color: "var(--secondary)", padding: "12px", borderRadius: "8px", marginBottom: "20px" }}>{formSuccess}</div>}

              <form onSubmit={handleCreateListing}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
                  <div className="form-group">
                    <label className="form-label">Listing Title</label>
                    <input type="text" className="form-control" placeholder="e.g. Spacious Private Master Bedroom in Downtown" value={title} onChange={(e) => setTitle(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monthly Rent (₹)</label>
                    <div className="form-control-wrapper">
                      <IndianRupee className="form-icon-left" size={16} />
                      <input type="number" className="form-control" placeholder="15000" value={price} onChange={(e) => setPrice(e.target.value)} required />
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div className="form-group">
                    <label className="form-label">Property Type</label>
                    <select className="form-control" value={roomType} onChange={(e) => setRoomType(e.target.value)} required>
                      {roomTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location Address</label>
                    <div className="form-control-wrapper">
                      <MapPin className="form-icon-left" size={16} />
                      <input type="text" className="form-control" placeholder="e.g. 124 Main Street, Koramangala, Bangalore" value={location} onChange={(e) => setLocation(e.target.value)} required />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Property Description</label>
                    <button type="button" onClick={handleGenerateDescription} disabled={generatingDesc} className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px", background: "var(--primary)", color: "white", border: "none" }}>
                      <Sparkles size={14} /> {generatingDesc ? "Generating..." : "AI Generate"}
                    </button>
                  </div>
                  <textarea className="form-control" placeholder="Write details about room dimensions, roommate details, utilities included, lease terms..." rows={4} value={description} onChange={(e) => setDescription(e.target.value)} style={{ padding: "12px", resize: "none" }} />
                </div>

                <div className="form-group">
                  <label className="form-label">Upload Room Media (Photos/Videos)</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: "20px", alignItems: "center" }}>
                    <div style={{ border: "2px dashed var(--border-color)", padding: "20px", borderRadius: "8px", textAlign: "center", position: "relative", cursor: "pointer", background: "rgba(255,255,255,0.02)" }}>
                      <Image size={24} style={{ color: "var(--text-muted)", marginBottom: "5px" }} />
                      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Click to browse or drag & drop</p>
                      <input type="file" accept="image/*,video/*" onChange={handleImageChange} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }} />
                    </div>
                    <div style={{ height: "90px", border: "1px solid var(--border-color)", borderRadius: "8px", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.2)", position: "relative" }}>
                      {imagePreview ? <img src={imagePreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>No Media</span>}
                      {photoFeedback && (
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: photoFeedback.checking ? "rgba(0,0,0,0.7)" : photoFeedback.isGood ? "rgba(16,185,129,0.9)" : "rgba(239,68,68,0.9)", color: "white", fontSize: "0.7rem", padding: "4px", textAlign: "center" }}>
                          {photoFeedback.checking ? "AI Checking Quality..." : photoFeedback.isGood ? "Good Quality Image" : `Warning: ${photoFeedback.feedback}`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Facilities & Amenities</label>
                  <div className="amenities-selector-grid">
                    {availableFacilities.map((facility) => (
                      <div key={facility}>
                        <input type="checkbox" id={`fac-${facility}`} className="amenity-checkbox-input" checked={facilities.includes(facility)} onChange={() => handleFacilityToggle(facility)} />
                        <label htmlFor={`fac-${facility}`} className="amenity-checkbox-label">{facility}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <h3 style={{ fontSize: "1.1rem", margin: "25px 0 15px 0", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>Listing Contact Information</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" }}>
                  <div className="form-group"><label className="form-label">Name</label><input type="text" className="form-control" value={contactName} onChange={(e) => setContactName(e.target.value)} required /></div>
                  <div className="form-group"><label className="form-label">Phone</label><input type="tel" className="form-control" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required /></div>
                  <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-control" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required /></div>
                </div>

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="btn btn-primary mt-2" style={{ width: "100%", padding: "14px", fontSize: "1.05rem" }} disabled={formSubmitting}>
                  {formSubmitting ? <span className="spinner"></span> : "Publish Listing"}
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* Tab: Leads */}
          {activeTab === "leads" && (
            <motion.div key="leads" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>
              <div>
                <h2>Tenant Inquiries</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "25px" }}>Manage messages and inquiries from interested tenants.</p>
              </div>

              {loadingLeads ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}><span className="spinner"></span></div>
              ) : leads.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <Inbox size={40} style={{ color: "var(--text-muted)", marginBottom: "15px" }} />
                  <h3>No Leads Received</h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "8px" }}>When tenants show interest in your rooms, their inquiries will appear here.</p>
                </div>
              ) : (
                <div className="leads-table-container">
                  <table className="leads-table">
                    <thead>
                      <tr>
                        <th>Property</th>
                        <th>Tenant Details</th>
                        <th>Message</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead) => {
                        const lId = lead.id || lead._id;
                        return (
                          <tr key={lId}>
                            <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>{lead.roomTitle || "Your Listing"}</td>
                            <td>
                              <div style={{ fontWeight: "600" }}>{lead.tenantName}</div>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}><Mail size={12} /> {lead.tenantEmail}</div>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}><Phone size={12} /> {lead.tenantPhone}</div>
                            </td>
                            <td style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: "300px" }}>{lead.message || <span style={{ fontStyle: "italic", opacity: 0.6 }}>No message</span>}</td>
                            <td><button className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "0.8rem" }}>Reply</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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

export default OwnerDashboard;
