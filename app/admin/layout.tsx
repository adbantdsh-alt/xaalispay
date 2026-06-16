import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="admin-header-inner">
          <div>
            <p className="admin-eyebrow">XaalisPay</p>
            <h1 className="admin-title">Administration</h1>
          </div>
          <Link href="/dashboard" className="admin-back-link">
            ← App vendeur
          </Link>
        </div>
      </header>
      <main className="admin-main">{children}</main>
    </div>
  );
}
