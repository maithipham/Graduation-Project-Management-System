import React from 'react'
import { Link } from 'react-router-dom'

export const NotFound: React.FC = () => {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#1e293b' }}>404 - Không tìm thấy trang</h1>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Đường dẫn bạn truy cập không tồn tại hoặc đã bị di dời.</p>
      <Link to="/" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
        ← Quay lại trang chủ
      </Link>
    </div>
  )
}
