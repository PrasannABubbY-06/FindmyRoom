import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import { ShieldAlert, X } from "lucide-react";
import { motion } from "framer-motion";

function ReportModal({ targetId, targetType = "Room", onClose }) {
  const { token, user } = useAuth();
  const [reason, setReason] = useState("Inappropriate Content");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const reasons = [
    "Inappropriate Content",
    "Spam",
    "Fake Listing / Scam",
    "Harassment",
    "Duplicate Listing",
    "Other"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return setError("You must be logged in to report.");
    
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ targetId, targetType, reason, description })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit report");
      
      setSuccess(true);
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel" style={{ width: "90%", maxWidth: "500px", padding: "30px", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
          <X size={24} />
        </button>
        
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", color: "var(--danger)" }}>
          <ShieldAlert size={28} />
          <h2 style={{ margin: 0 }}>Report {targetType}</h2>
        </div>

        {success ? (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <div style={{ color: "var(--success)", fontSize: "1.2rem", fontWeight: "bold", marginBottom: "10px" }}>Report Submitted Successfully</div>
            <p style={{ color: "var(--text-secondary)" }}>Thank you for helping keep the community safe. Our admin team will review this shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", padding: "10px", borderRadius: "8px", marginBottom: "15px" }}>{error}</div>}
            
            <div className="form-group">
              <label className="form-label">Reason</label>
              <select className="form-control" value={reason} onChange={e => setReason(e.target.value)}>
                {reasons.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Additional Details</label>
              <textarea className="form-control" rows={4} placeholder="Please provide more context about why you are reporting this..." value={description} onChange={e => setDescription(e.target.value)} required />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", background: "var(--danger)", padding: "12px" }} disabled={submitting}>
              {submitting ? <span className="spinner"></span> : "Submit Report"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

export default ReportModal;
