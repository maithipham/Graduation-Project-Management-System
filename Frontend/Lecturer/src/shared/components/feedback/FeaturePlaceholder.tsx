import React from 'react'
import { Sparkles, ArrowRight } from 'lucide-react'

interface FeaturePlaceholderProps {
  title: string
  subtitle?: string
  role?: string
}

export const FeaturePlaceholder: React.FC<FeaturePlaceholderProps> = ({
  title,
  subtitle = 'Tính năng đang được phát triển theo đặc tả hệ thống.',
  role = 'Hệ thống Quản lý Đồ án Tốt nghiệp',
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#1565C0] border border-blue-200/80 mb-2.5">
            <Sparkles size={13} />
            <span>{role}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>
      </div>

      {/* Placeholder content cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1565C0] flex items-center justify-center font-bold text-sm mb-4">
              0{idx}
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1.5">
              Khối tính năng mẫu #{idx}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Module sẵn sàng để kết nối API và bổ sung bảng dữ liệu, biểu đồ hoặc form nghiệp vụ.
            </p>
            <div className="text-xs font-semibold text-[#1565C0] flex items-center gap-1 hover:underline cursor-pointer">
              Xem chi tiết <ArrowRight size={13} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FeaturePlaceholder
