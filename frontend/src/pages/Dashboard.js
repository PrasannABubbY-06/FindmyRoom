import React from "react";
import { useAuth } from "../AuthContext";
import { Navigate } from "react-router-dom";
import OwnerDashboard from "../components/dashboard/OwnerDashboard";
import TenantDashboard from "../components/dashboard/TenantDashboard";

function Dashboard() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="container page-container">
      {user.role === "owner" ? <OwnerDashboard /> : <TenantDashboard />}
    </div>
  );
}

export default Dashboard;
