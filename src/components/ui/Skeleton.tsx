export function DashboardSkeleton() {
  return (
    <div className="seller-dashboard">
      <div className="skeleton skeleton-header" />
      <div className="skeleton skeleton-balance" />
      <div className="skeleton skeleton-actions" />
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-card" />
    </div>
  );
}

export function PaySkeleton() {
  return (
    <div>
      <div className="skeleton skeleton-image" />
      <div className="skeleton skeleton-line" style={{ width: "50%", marginTop: "1rem" }} />
      <div className="skeleton skeleton-btn" style={{ marginTop: "1rem" }} />
      <div className="skeleton skeleton-btn" style={{ marginTop: "0.75rem" }} />
    </div>
  );
}
