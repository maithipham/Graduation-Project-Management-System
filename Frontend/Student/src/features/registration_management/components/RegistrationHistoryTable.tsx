import React from 'react'
import { Building2, GraduationCap } from 'lucide-react'
import type {
  RegistrationOrigin,
  SupervisorRegistrationItem,
} from '../types/registration.types'

interface RegistrationHistoryTableProps {
  requests: SupervisorRegistrationItem[]
}

export const OriginBadge: React.FC<{ origin: RegistrationOrigin }> = ({ origin }) => {
  if (origin === 'external') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full font-semibold border bg-violet-50 text-violet-700 border-violet-200 px-1.5 py-0.5 text-[10px]">
        <Building2 size={12} />
        <span>Ngoài trường</span>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full font-semibold border bg-sky-50 text-sky-700 border-sky-200 px-1.5 py-0.5 text-[10px]">
      <GraduationCap size={12} />
      <span>Trong trường</span>
    </span>
  )
}

function renderStatusCell(item: SupervisorRegistrationItem): React.ReactNode {
  if (item.status === 'Đã duyệt') {
    return (
      <div className="flex flex-col items-start gap-1">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Đã duyệt
        </span>
        {item.approvedTime && (
          <span className="text-[11px] text-slate-500 font-medium">{item.approvedTime}</span>
        )}
      </div>
    )
  }

  if (item.status === 'Đã từ chối') {
    return (
      <div className="flex flex-col items-start gap-1">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          Đã từ chối
        </span>
        {item.approvedTime && (
          <span className="text-[10px] text-slate-400">{item.approvedTime}</span>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#1565C0] border border-blue-200">
        Đang xử lý
      </span>
    </div>
  )
}

export const RegistrationHistoryTable: React.FC<RegistrationHistoryTableProps> = ({ requests }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      <h3 className="text-base font-bold text-slate-900">Lịch sử đơn đăng ký GVHD</h3>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-700 font-semibold">
            <tr>
              <th className="py-3 px-4 w-36 font-bold">Thời gian</th>
              <th className="py-3 px-4 w-60 font-bold">Giảng viên</th>
              <th className="py-3 px-4 font-bold">Tên đề tài</th>
              <th className="py-3 px-4 w-36 font-bold">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-slate-400 text-xs">
                  Chưa có đơn đăng ký nào. Bấm &quot;Tạo đơn đăng ký GVHD&quot; để gửi đơn mới.
                </td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors align-top">
                  <td className="py-3.5 px-4 font-normal text-slate-900 whitespace-nowrap">
                    {r.time}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800 text-[13px]">{r.lecturer}</div>
                    <div className="text-[11.5px] text-slate-500 mt-0.5">
                      {r.dept}
                      {r.unit ? ` · ${r.unit}` : ''}
                    </div>
                    <div className="mt-1">
                      <OriginBadge origin={r.origin} />
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    {r.topic ? (
                      r.topic
                    ) : (
                      <span className="text-slate-400 italic">Chưa có tên đề tài</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">{renderStatusCell(r)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

