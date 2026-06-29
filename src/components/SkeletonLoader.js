import React from 'react';
import { motion } from 'framer-motion';

export const Skeleton = ({ width, height, borderRadius = "8px", style }) => {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      style={{
        width,
        height,
        borderRadius,
        background: "var(--skeleton-bg, rgba(255, 255, 255, 0.05))",
        ...style
      }}
      className="skeleton-shimmer"
    />
  );
};

export const RoomCardSkeleton = () => {
  return (
    <div className="room-card" style={{ padding: "0" }}>
      <Skeleton width="100%" height="250px" borderRadius="16px 16px 0 0" />
      <div style={{ padding: "18px" }}>
        <Skeleton width="40%" height="24px" style={{ marginBottom: "12px" }} />
        <Skeleton width="100%" height="16px" style={{ marginBottom: "8px" }} />
        <Skeleton width="80%" height="16px" style={{ marginBottom: "16px" }} />
        <div style={{ display: "flex", gap: "10px" }}>
          <Skeleton width="60px" height="24px" borderRadius="12px" />
          <Skeleton width="60px" height="24px" borderRadius="12px" />
          <Skeleton width="60px" height="24px" borderRadius="12px" />
        </div>
      </div>
    </div>
  );
};
