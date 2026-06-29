import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../AuthContext";
import { MapPin, IndianRupee, Calendar, Briefcase, X } from "lucide-react";

function CreateRoommateRequest({ onClose, onCreated, initialData }) {
  const { token, user } = useAuth();
  
  const [formData, setFormData] = useState(initialData ? {
    city: initialData.city || "",
    areaPreference: initialData.areaPreference || "",
    maxBudget: initialData.maxBudget || "",
    moveInDate: initialData.moveInDate ? new Date(initialData.moveInDate).toISOString().split('T')[0] : "",
    preferredGender: initialData.preferredGender || "Any",
    preferredOccupations: initialData.preferredOccupations || [],
    description: initialData.description || ""
  } : {
    city: "",
    areaPreference: "",
    maxBudget: "",
    moveInDate: "",
    preferredGender: "Any",
    preferredOccupations: [],
    description: ""
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const occupations = ["Student", "Working Professional", "Freelancer", "Any"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOccupationToggle = (occ) => {
    setFormData(prev => {
      let updated = [...prev.preferredOccupations];
      if (updated.includes(occ)) {
        updated = updated.filter(o => o !== occ);
      } else {
        updated.push(occ);
      }
      return { ...prev, preferredOccupations: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    if (!formData.city || !formData.maxBudget || !formData.description) {
      setError("City, budget, and description are required.");
      setSubmitting(false);
      return;
    }

    try {
      const url = initialData ? `/api/roommates/${initialData._id}` : "/api/roommates";
      const method = initialData ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post request.");
      
      onCreated(data, initialData ? true : false);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(5px)",
      display: "flex", justifyContent: "center", alignItems: "center",
      zIndex: 1000, padding: "20px"
    }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-panel"
        style={{ width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", position: "relative" }}
      >
        <button 
          onClick={onClose}
          style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
        >
          <X size={24} />
        </button>
        
        <div style={{ padding: "30px" }}>
          <h2 style={{ marginBottom: "20px" }}>{initialData ? "Edit Roommate Request" : "Post a Roommate Request"}</h2>
          {error && <div style={{ color: "var(--danger)", marginBottom: "15px", background: "rgba(239,68,68,0.1)", padding: "10px", borderRadius: "8px" }}>{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div className="form-group">
                <label className="form-label">City *</label>
                <div className="form-control-wrapper">
                  <MapPin className="form-icon-left" size={16} />
                  <input type="text" name="city" className="form-control" placeholder="e.g. Bangalore" value={formData.city} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Specific Areas</label>
                <input type="text" name="areaPreference" className="form-control form-control-noicon" placeholder="e.g. Indiranagar, Koramangala" value={formData.areaPreference} onChange={handleChange} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div className="form-group">
                <label className="form-label">Max Budget (₹/month) *</label>
                <div className="form-control-wrapper">
                  <IndianRupee className="form-icon-left" size={16} />
                  <input type="number" name="maxBudget" className="form-control" placeholder="15000" value={formData.maxBudget} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Move-in Date</label>
                <div className="form-control-wrapper">
                  <Calendar className="form-icon-left" size={16} />
                  <input type="date" name="moveInDate" className="form-control" value={formData.moveInDate} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div className="form-group">
                <label className="form-label">Preferred Gender</label>
                <select name="preferredGender" className="form-control form-control-noicon" value={formData.preferredGender} onChange={handleChange}>
                  <option value="Any">Any Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Preferred Occupations</label>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {occupations.map(occ => (
                  <div 
                    key={occ}
                    onClick={() => handleOccupationToggle(occ)}
                    style={{
                      padding: "6px 12px", borderRadius: "20px", fontSize: "0.85rem", cursor: "pointer",
                      border: "1px solid var(--border-color)",
                      background: formData.preferredOccupations.includes(occ) ? "var(--primary)" : "rgba(255,255,255,0.05)",
                      color: formData.preferredOccupations.includes(occ) ? "#fff" : "var(--text-secondary)"
                    }}
                  >
                    {occ}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Bio & Requirements *</label>
              <textarea 
                name="description" 
                className="form-control form-control-noicon" 
                rows={4} 
                placeholder="Hi, I'm looking for a chill roommate to hunt for a 2BHK. I love plants, keep things clean, and prefer a quiet environment."
                value={formData.description} 
                onChange={handleChange} 
                required 
                style={{ resize: "none" }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "12px", marginTop: "10px" }} disabled={submitting}>
              {submitting ? <span className="spinner"></span> : (initialData ? "Update Request" : "Post Request")}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default CreateRoommateRequest;
