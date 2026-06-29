import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { Mail, Lock, User, Eye, EyeOff, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("tenant"); // tenant or owner
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const loggedUser = await signup(username, email, password, role);
      if (loggedUser.role === "owner") {
        navigate("/dashboard");
      } else {
        navigate("/rooms");
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page-container">
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel auth-card"
        style={{ maxWidth: "500px" }}
      >
        <div className="form-header">
          <h2>Create Account</h2>
          <p>Join FindMyRoom today for free</p>
        </div>

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "var(--danger)", padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: "0.88rem" }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="form-control-wrapper">
              <User className="form-icon-left" size={18} />
              <input 
                type="text" 
                className="form-control" 
                placeholder="John Doe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="form-control-wrapper">
              <Mail className="form-icon-left" size={18} />
              <input 
                type="email" 
                className="form-control" 
                placeholder="johndoe@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Role selection */}
          <div className="form-group">
            <label className="form-label">Account Role</label>
            <div className="role-selector">
              <div 
                className={`role-option ${role === "tenant" ? "active" : ""}`}
                onClick={() => setRole("tenant")}
              >
                <div className="role-option-title">Tenant</div>
                <div className="role-option-desc">I am looking for rooms to rent</div>
              </div>
              <div 
                className={`role-option ${role === "owner" ? "active" : ""}`}
                onClick={() => setRole("owner")}
              >
                <div className="role-option-title">Owner</div>
                <div className="role-option-desc">I have rooms available for rent</div>
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="form-control-wrapper">
              <Lock className="form-icon-left" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-control" 
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span className="form-icon-right" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="form-control-wrapper">
              <Lock className="form-icon-left" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-control" 
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Submit */}
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            className="btn btn-primary"
            style={{ width: "100%", padding: "12px", marginTop: "10px" }}
            disabled={loading}
          >
            {loading ? <span className="spinner"></span> : "Create Account"}
          </motion.button>
        </form>

        <div className="auth-footer">
          Already have an account?{" "}
          <Link to="/login" className="auth-footer-link">
            Sign in instead
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default Signup;
