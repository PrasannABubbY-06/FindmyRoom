import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { Navigate } from "react-router-dom";
import { ShieldAlert, CheckCircle, XCircle, AlertTriangle, UserX, Trash2 } from "lucide-react";

function AdminDashboard() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState("reports");
  
  const [verifications, setVerifications] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role !== "admin") return;
    fetchData();
  }, [activeTab, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "verifications") {
        const res = await fetch("/api/admin/verifications", { headers: { "Authorization": `Bearer ${token}` } });
        const data = await res.json();
        setVerifications(Array.isArray(data) ? data : []);
      } else {
        const res = await fetch("/api/admin/reports", { headers: { "Authorization": `Bearer ${token}` } });
        const data = await res.json();
        setReports(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveVerification = async (userId, status) => {
    try {
      await fetch(`/api/admin/verifications/${userId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleResolveReport = async (reportId, action) => {
    try {
      await fetch(`/api/admin/reports/${reportId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ action })
      });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <div className="container" style={{ textAlign: "center", padding: "100px" }}><h2>Access Denied</h2><p>You do not have permission to view this page.</p></div>;

  return (
    <div className="container page-container">
      <div className="dashboard-grid">
        {/* Sidebar */}
        <div className="dashboard-sidebar-menu">
          <div style={{ padding: "0 20px 15px 20px" }}>
            <h3 style={{ fontSize: "1.1rem", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--danger)" }}>Admin Hub</h3>
          </div>
          
          {/* Government ID Verifications - Hidden for now */}
          {/* <button className={`dashboard-menu-item ${activeTab === "verifications" ? "active" : ""}`} onClick={() => setActiveTab("verifications")}>
            <CheckCircle size={18} /> ID Verifications
            {verifications.length > 0 && <span style={{ marginLeft: "auto", background: "var(--primary)", color: "#fff", padding: "2px 8px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: "bold" }}>{verifications.length}</span>}
          </button> */}
          
          <button className={`dashboard-menu-item ${activeTab === "reports" ? "active" : ""}`} onClick={() => setActiveTab("reports")}>
            <ShieldAlert size={18} /> Moderation & Reports
            {reports.length > 0 && <span style={{ marginLeft: "auto", background: "var(--danger)", color: "#fff", padding: "2px 8px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: "bold" }}>{reports.length}</span>}
          </button>
        </div>

        {/* Content */}
        <div className="glass-panel dashboard-content-panel">
          
          {/* 
          {activeTab === "verifications" && (
            <div>
              <h2>Pending ID Verifications</h2>
              <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>Review user-submitted government IDs to grant the Verified badge.</p>
              
              {loading ? <div className="spinner"></div> : verifications.length === 0 ? <p>No pending verifications.</p> : (
                <table className="leads-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Document</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verifications.map(u => (
                      <tr key={u._id}>
                        <td>{u.username}<br/><span style={{fontSize: "0.8rem", color: "var(--text-secondary)"}}>{u.email}</span></td>
                        <td style={{ textTransform: "capitalize" }}>{u.role}</td>
                        <td><a href={u.idDocumentUrl} target="_blank" rel="noreferrer" style={{ color: "var(--primary)" }}>View Document</a></td>
                        <td>
                          <button onClick={() => handleResolveVerification(u._id, "Verified")} className="btn" style={{ background: "var(--success)", color: "white", padding: "6px 12px", marginRight: "10px", fontSize: "0.8rem" }}>Approve</button>
                          <button onClick={() => handleResolveVerification(u._id, "Rejected")} className="btn" style={{ background: "var(--danger)", color: "white", padding: "6px 12px", fontSize: "0.8rem" }}>Reject</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
          */}

          {activeTab === "reports" && (
            <div>
              <h2>Moderation Reports</h2>
              <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>Review reports submitted by users for inappropriate content or behavior.</p>
              
              {loading ? <div className="spinner"></div> : reports.length === 0 ? <p>No pending reports.</p> : (
                <table className="leads-table">
                  <thead>
                    <tr>
                      <th>Target</th>
                      <th>Reason</th>
                      <th>Description</th>
                      <th>Reporter</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map(r => (
                      <tr key={r._id}>
                        <td>
                          <span style={{ fontWeight: "bold" }}>{r.targetType}</span><br/>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>ID: {r.targetId}</span>
                        </td>
                        <td><span style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", padding: "4px 8px", borderRadius: "10px", fontSize: "0.8rem", fontWeight: "bold" }}>{r.reason}</span></td>
                        <td style={{ fontSize: "0.9rem", maxWidth: "250px" }}>{r.description || "N/A"}</td>
                        <td>{r.reporterId?.username || "Unknown"}</td>
                        <td style={{ display: "flex", gap: "8px", flexDirection: "column" }}>
                          <button onClick={() => handleResolveReport(r._id, "dismiss")} className="btn btn-secondary" style={{ padding: "4px", fontSize: "0.75rem" }}>Dismiss</button>
                          {r.targetType === "User" && (
                            <button onClick={() => handleResolveReport(r._id, "suspend_user")} className="btn" style={{ background: "var(--danger)", color: "white", padding: "4px", fontSize: "0.75rem", display: "flex", gap: "4px", justifyContent: "center" }}><UserX size={12}/> Suspend User</button>
                          )}
                          {r.targetType === "Room" && (
                            <button onClick={() => handleResolveReport(r._id, "remove_room")} className="btn" style={{ background: "var(--danger)", color: "white", padding: "4px", fontSize: "0.75rem", display: "flex", gap: "4px", justifyContent: "center" }}><Trash2 size={12}/> Remove Room</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
