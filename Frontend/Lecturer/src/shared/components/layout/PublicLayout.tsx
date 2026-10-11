import { Link, Outlet } from 'react-router-dom'

export function PublicLayout() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link aria-label="Trang chủ" className="brand" to="/">
          <img alt="Đại học Thủy Lợi" className="brand-logo" src="/logo.webp" />
        </Link>
        <div className="topbar-actions" />
      </header>
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="footer">
        <span>GradPath</span>
        <span>Hệ thống Hỗ trợ Quản lý Quy trình Thực hiện Đồ án Tốt nghiệp</span>
      </footer>
    </div>
  )
}
