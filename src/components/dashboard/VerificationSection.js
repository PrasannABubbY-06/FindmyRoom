import React, { useState } from "react";
import { useAuth } from "../../AuthContext";
import { ShieldCheck, Mail, Phone, FileText, CheckCircle, AlertTriangle, UploadCloud } from "lucide-react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../../firebase";

function VerificationSection() {
  const { user, token } = useAuth();
  
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneStep, setPhoneStep] = useState(user?.phoneVerified ? 2 : 0); // 0: enter phone, 1: enter otp, 2: verified
  const [confirmationResult, setConfirmationResult] = useState(null);
  
  const [emailOtp, setEmailOtp] = useState("");
  const [emailInput, setEmailInput] = useState(user?.email || "");
  const [emailStep, setEmailStep] = useState(user?.emailVerified ? 2 : 0);

  const [idFile, setIdFile] = useState(null);
  const [idStatus, setIdStatus] = useState(user?.idVerificationStatus || "None");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const calculateProfileCompletion = () => {
    let score = 20; // Base score for signing up
    if (user?.profilePicture) score += 10;
    if (user?.bio) score += 10;
    if (user?.phoneVerified) score += 20;
    if (user?.emailVerified) score += 20;
    if (user?.idVerificationStatus === "Verified") score += 20;
    return score;
  };

  const setUpRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response) => {
          // reCAPTCHA solved
        }
      });
    }
  };

  const handleSendPhoneOTP = async () => {
    if (!phoneInput) return;
    setLoading(true);
    try {
      setUpRecaptcha();
      // Ensure phone number starts with country code (default to India +91 if missing)
      const formattedPhone = phoneInput.startsWith('+') ? phoneInput : `+91${phoneInput.replace(/\D/g, '')}`;
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setPhoneStep(1);
      setMessage({ type: "success", text: `OTP sent to ${formattedPhone}` });
    } catch (e) {
      console.error(e);
      setMessage({ type: "error", text: "Failed to send OTP. Check phone format." });
      if (window.recaptchaVerifier) {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneOTP = async () => {
    if (!phoneOtp || !confirmationResult) return;
    setLoading(true);
    try {
      const result = await confirmationResult.confirm(phoneOtp);
      // Phone is verified with Firebase, update our backend
      const res = await fetch("/api/users/verify-phone-success", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPhoneStep(2);
        setMessage({ type: "success", text: "Phone verified successfully!" });
      } else {
        setMessage({ type: "error", text: data.message || "Failed to update profile." });
      }
    } catch (e) {
      setMessage({ type: "error", text: "Invalid OTP. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailOTP = async () => {
    if (!emailInput) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ email: emailInput })
      });
      const data = await res.json();
      if (data.success) {
        setEmailStep(1);
        setMessage({ type: "success", text: "Simulated Email OTP sent (use 1234)" });
      }
    } catch (e) {
      setMessage({ type: "error", text: "Failed to send OTP" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOTP = async () => {
    if (!emailOtp) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ email: emailInput, otp: emailOtp })
      });
      const data = await res.json();
      if (data.success) {
        setEmailStep(2);
        setMessage({ type: "success", text: "Email verified successfully!" });
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch (e) {
      setMessage({ type: "error", text: "Verification failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadID = async () => {
    if (!idFile) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("idDocument", idFile);

    try {
      const res = await fetch("/api/user/submit-id", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setIdStatus("Pending");
        setMessage({ type: "success", text: "ID submitted for review!" });
      }
    } catch (e) {
      setMessage({ type: "error", text: "Failed to upload ID" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="dashboard-header-row">
        <div>
          <h2>Trust & Verification</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Complete verifications to increase your trust score and get the Verified badge.</p>
        </div>
      </div>

      {message.text && (
        <div style={{ padding: "10px", marginBottom: "20px", borderRadius: "8px", background: message.type === "error" ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", color: message.type === "error" ? "var(--danger)" : "var(--success)", display: "flex", alignItems: "center", gap: "8px" }}>
          {message.type === "error" ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
          {message.text}
        </div>
      )}

      {/* Trust Score & Profile Completion */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
        <div className="glass-panel" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: `conic-gradient(var(--success) ${calculateProfileCompletion()}%, rgba(255,255,255,0.1) 0)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <div style={{ width: "70px", height: "70px", borderRadius: "50%", background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", fontWeight: "bold" }}>
              {calculateProfileCompletion()}%
            </div>
          </div>
          <div>
            <h3 style={{ marginBottom: "5px" }}>Profile Completion</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Complete your profile to unlock more features.</p>
          </div>
        </div>
        
        <div className="glass-panel" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "20px" }}>
          <ShieldCheck size={50} style={{ color: "#f59e0b" }} />
          <div>
            <h3 style={{ marginBottom: "5px" }}>Trust Score: {user?.trustScore || 50}/100</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Verify identity to increase your score.</p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Phone Verification */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
            <Phone size={20} className={phoneStep === 2 ? "text-success" : ""} style={{ color: phoneStep === 2 ? "var(--success)" : "inherit" }} />
            <h3 style={{ margin: 0 }}>Phone Verification</h3>
          </div>
          
          <div id="recaptcha-container"></div>
          
          {phoneStep === 0 && (
            <div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "15px" }}>Add your phone number to receive a verification code.</p>
              <div style={{ display: "flex", gap: "10px" }}>
                <input type="tel" className="form-control" placeholder="+91 9876543210" value={phoneInput} onChange={e => setPhoneInput(e.target.value)} />
                <button className="btn btn-primary" onClick={handleSendPhoneOTP} disabled={loading}>Send OTP</button>
              </div>
            </div>
          )}
          {phoneStep === 1 && (
            <div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "15px" }}>Enter the code sent to {phoneInput}.</p>
              <div style={{ display: "flex", gap: "10px" }}>
                <input type="text" className="form-control" placeholder="123456" value={phoneOtp} onChange={e => setPhoneOtp(e.target.value)} />
                <button className="btn btn-primary" onClick={handleVerifyPhoneOTP} disabled={loading}>Verify</button>
              </div>
            </div>
          )}
          {phoneStep === 2 && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--success)", background: "rgba(16,185,129,0.1)", padding: "15px", borderRadius: "8px" }}>
              <CheckCircle size={20} />
              <span style={{ fontWeight: "bold" }}>Phone Verified</span>
            </div>
          )}
        </div>

        {/* Email Verification */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
            <Mail size={20} style={{ color: emailStep === 2 ? "var(--success)" : "inherit" }} />
            <h3 style={{ margin: 0 }}>Email Verification</h3>
          </div>
          
          {emailStep === 0 && (
            <div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "15px" }}>Verify your email address.</p>
              <div style={{ display: "flex", gap: "10px" }}>
                <input type="email" className="form-control" value={emailInput} onChange={e => setEmailInput(e.target.value)} />
                <button className="btn btn-primary" onClick={handleSendEmailOTP} disabled={loading}>Send OTP</button>
              </div>
            </div>
          )}
          {emailStep === 1 && (
            <div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "15px" }}>Enter the code sent to {emailInput}. (DEV: use 1234)</p>
              <div style={{ display: "flex", gap: "10px" }}>
                <input type="text" className="form-control" placeholder="1234" value={emailOtp} onChange={e => setEmailOtp(e.target.value)} />
                <button className="btn btn-primary" onClick={handleVerifyEmailOTP} disabled={loading}>Verify</button>
              </div>
            </div>
          )}
          {emailStep === 2 && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--success)", background: "rgba(16,185,129,0.1)", padding: "15px", borderRadius: "8px" }}>
              <CheckCircle size={20} />
              <span style={{ fontWeight: "bold" }}>Email Verified</span>
            </div>
          )}
        </div>

        {/* Government ID Verification */}
        <div className="glass-panel" style={{ padding: "20px", gridColumn: "1 / -1", opacity: 0.6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
            <FileText size={20} style={{ color: "inherit" }} />
            <h3 style={{ margin: 0 }}>Government ID Verification</h3>
            <span style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: "12px", marginLeft: "10px" }}>Coming Soon</span>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            We are upgrading our secure identity verification system. This feature will be available shortly.
          </p>
        </div>
      </div>
    </div>
  );
}

export default VerificationSection;
