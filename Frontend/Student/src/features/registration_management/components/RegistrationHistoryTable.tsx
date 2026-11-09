import React from 'react'
import type {
  AdvisorRegistrationResponse,
  AdvisorRegistrationStatus,
} from '../types/registration.types'

interface RegistrationHistoryTableProps {
  requests: AdvisorRegistrationResponse[]
  onEdit: (request: AdvisorRegistrationResponse) => void
}

// Chuyển trạng thái BE thành nội dung hiển thị
function getStatusLabel(status: AdvisorRegistrationStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Chờ duyệt'

    case 'TEACHER_APPROVED':
      return 'Chờ duyệt'

    case 'HOD_APPROVED':
      return 'Đã duyệt'

    case 'REJECTED':
      return 'Đã từ chối'

    case 'ASSIGNED_BY_HOD':
      return 'Được phân công'

    default:
      return 'Không xác định'
  }
}

// Định dạng ngày giờ
function formatRegistrationDate(date: string | null): string {
  if (!date) return '—'

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return date
  }

  return parsedDate.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// CSS theo trạng thái
function getStatusClass(status: AdvisorRegistrationStatus): string {
  switch (status) {
    case 'HOD_APPROVED':
    case 'ASSIGNED_BY_HOD':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'

    case 'REJECTED':
      return 'bg-rose-50 text-rose-700 border-rose-200'

    case 'PENDING':
    case 'TEACHER_APPROVED':
    default:
      return 'bg-blue-50 text-[#1565C0] border-blue-200'
  }
}

export const RegistrationHistoryTable: React.FC<
  RegistrationHistoryTableProps
> = ({ requests, onEdit }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      <h3 className="text-base font-bold text-slate-900">
        Lịch sử đăng ký
      </h3>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-700 font-semibold">
            <tr>
              <th className="py-3 px-4 w-40 font-bold">
                Thời gian đăng ký
              </th>

              <th className="py-3 px-4 w-60 font-bold">
                Giảng viên
              </th>

              <th className="py-3 px-4 font-bold">
                Tên đề tài
              </th>

              <th className="py-3 px-4 w-44 font-bold">
                Trạng thái
              </th>

              <th className="py-3 px-4 w-40 font-bold">
                Thời gian xử lý
              </th>

              <th className="py-3 px-4 w-28 font-bold text-center">
                Thao tác
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-slate-600">
            {requests.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-12 text-center text-slate-400 text-xs"
                >
                  Chưa có đơn đăng ký nào. Bấm "Tạo đơn đăng ký GVHD"
                  để gửi đơn mới.
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr
                  key={request.registrationPublicId}
                  className="hover:bg-slate-50/50 transition-colors align-top"
                >
                  {/* Thời gian đăng ký */}
                  <td className="py-3.5 px-4 font-normal text-slate-900 whitespace-nowrap">
                    {formatRegistrationDate(request.submittedAt)}
                  </td>

                  {/* Thông tin giảng viên */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800 text-[13px]">
                      {request.teacherName || 'Chưa có thông tin'}
                    </div>

                    <div className="text-[11.5px] text-slate-500 mt-0.5">
                      {request.teacherCode || 'Chưa có mã giảng viên'}
                    </div>
                  </td>

                  {/* Tên đề tài */}
                  <td className="py-3.5 px-4 text-slate-700">
                    {request.topicName ? (
                      request.topicName
                    ) : (
                      <span className="text-slate-400 italic">
                        Chưa có tên đề tài
                      </span>
                    )}
                  </td>

                  {/* Trạng thái */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col items-start gap-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusClass(
                          request.status,
                        )}`}
                      >
                        {getStatusLabel(request.status)}
                      </span>

                      {request.statusDescription && (
                        <span className="text-[11px] text-slate-500 whitespace-normal max-w-48">
                          {request.statusDescription}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Thời gian xử lý */}
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                    {formatRegistrationDate(request.processedAt)}
                  </td>

                  {/* Thao tác */}
                  <td className="py-3.5 px-4 text-center">
                    {request.status === 'PENDING' ? (
                      <button
                        type="button"
                        onClick={() => onEdit(request)}
                        className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-blue-50 text-[#1565C0] border border-blue-200 text-xs font-semibold hover:bg-blue-100 transition-colors whitespace-nowrap"
                        title="Chỉnh sửa đơn đăng ký"
                      >
                        Sửa đơn
                      </button>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}