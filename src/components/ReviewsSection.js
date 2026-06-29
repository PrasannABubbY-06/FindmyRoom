import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { Star, ShieldAlert, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

function ReviewsSection({ targetId, targetType = "Room" }) {
  const { user, token } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [targetId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews/${targetId}?targetType=${targetType}`);
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return setSubmitError("You must be logged in to leave a review.");
    if (!token) return setSubmitError("Authentication token missing.");
    
    setSubmitting(true);
    setSubmitError("");
    
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ targetId, targetType, rating, comment })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit review");
      
      setComment("");
      setRating(5);
      fetchReviews();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const calculateAverage = () => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (total / reviews.length).toFixed(1);
  };

  return (
    <div style={{ marginTop: "40px" }}>
      <h3 style={{ fontSize: "1.5rem", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
        Reviews <span style={{ background: "var(--primary)", color: "white", padding: "2px 8px", borderRadius: "10px", fontSize: "1rem" }}>{calculateAverage()} <Star size={14} style={{ display: "inline", marginBottom: "2px" }} fill="currentColor" /></span>
      </h3>
      
      {/* Review List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginBottom: "30px" }}>
        {loading ? <div className="spinner"></div> : reviews.length === 0 ? <p style={{ color: "var(--text-secondary)" }}>No reviews yet. Be the first to leave one!</p> : (
          reviews.map(rev => (
            <div key={rev._id} className="glass-panel" style={{ padding: "15px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "35px", height: "35px", borderRadius: "50%", background: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                    {rev.authorId?.username?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <div style={{ fontWeight: "bold" }}>{rev.authorId?.username || "Anonymous User"}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{new Date(rev.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "2px", color: "#f59e0b" }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={16} fill={i < rev.rating ? "currentColor" : "none"} />)}
                </div>
              </div>
              <p style={{ fontSize: "0.95rem", lineHeight: "1.5" }}>{rev.comment}</p>
            </div>
          ))
        )}
      </div>

      {/* Write a Review */}
      {user && (
        <div className="glass-panel" style={{ padding: "20px" }}>
          <h4 style={{ marginBottom: "15px" }}>Write a Review</h4>
          {submitError && <div style={{ color: "var(--danger)", marginBottom: "10px", fontSize: "0.9rem" }}>{submitError}</div>}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem" }}>Rating</label>
              <div style={{ display: "flex", gap: "10px" }}>
                {[1, 2, 3, 4, 5].map(num => (
                  <button type="button" key={num} onClick={() => setRating(num)} style={{ background: "none", border: "none", cursor: "pointer", color: num <= rating ? "#f59e0b" : "var(--text-muted)" }}>
                    <Star size={24} fill={num <= rating ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <textarea className="form-control" rows={3} placeholder="Share your experience..." value={comment} onChange={e => setComment(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner"></span> : "Submit Review"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default ReviewsSection;
