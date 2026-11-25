import React, { Fragment } from 'react'
import { Skeleton } from '@/shared/components/ui'
import type { StudentScheduleItem } from '../types/schedule.types'
import {
  formatScheduleDate,
  formatScheduleTimeRange,
  scheduleEndMs,
} from '../services/schedule.service'

interface ScheduleTableProps {
  schedules: StudentScheduleItem[]
  nowMs: number
  isLoading: boolean
  isError: boolean
}

function StatusCell({ item, nowMs }: { item: StudentScheduleItem; nowMs: number }) {
  const endMs = scheduleEndMs(item)
  if (endMs === null) {
    return <span className="text-xs font-semibold text-amber-600">Chưa xếp lịch</span>
  }
  return endMs > nowMs ? (
    <span className="text-xs font-semibold text-emerald-600">Sắp tới</span>
  ) : (
    <span className="text-xs font-semibold text-slate-500">Đã qua</span>
  )
}

export const ScheduleTable: React.FC<ScheduleTableProps> = ({
  schedules,
  nowMs,
  isLoading,
  isError,
}) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-sm font-semibold text-slate-900">Lịch phản biện và bảo vệ</h2>
      </div>

      {isLoading && (
        <div className="space-y-3 px-5 pb-5">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {!isLoading && isError && (
        <p className="px-5 pb-5 text-xs text-rose-600">Không tải được lịch của bạn.</p>
      )}

      {!isLoading && !isError && schedules.length === 0 && (
        <p className="px-5 pb-5 text-xs text-slate-500">
          Bạn chưa có lịch phản biện hoặc bảo vệ nào.
        </p>
      )}

      {!isLoading && !isError && schedules.length > 0 && (
        <div className="overflow-x-auto">
          <table aria-label="Lịch phản biện và bảo vệ" className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-y border-slate-200 text-slate-700 font-semibold">
              <tr>
                <th className="py-3.5 px-4 w-32">Loại lịch</th>
                <th className="py-3.5 px-4 w-28">Ngày</th>
                <th className="py-3.5 px-4 w-36">Khung giờ</th>
                <th className="py-3.5 px-4 w-32">Địa điểm</th>
                <th className="py-3.5 px-4 w-28">Trạng thái</th>
                <th className="py-3.5 px-4">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {schedules.map((item) => {
                const isReview = item.type === 'REVIEW'
                return (
                  <tr
                    key={`${item.councilCode}-${item.type}-${item.examinerOrder ?? 0}`}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isReview
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}
                      >
                        {item.title}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-900 whitespace-nowrap">
                      {formatScheduleDate(item.date)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-900 whitespace-nowrap">
                      {formatScheduleTimeRange(item.startTime, item.endTime)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-900 whitespace-nowrap">
                      {item.location || '—'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusCell item={item} nowMs={nowMs} />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-900">
                      <div className="grid grid-cols-[165px_1fr] gap-x-2 gap-y-1.5">
                        <span className="text-slate-600 whitespace-nowrap">Hội đồng:</span>
                        <span>{item.councilName}</span>
                        {item.participants.map((p, idx) => (
                          <Fragment key={`${p.role}-${p.fullName}-${idx}`}>
                            <span className="text-slate-600 whitespace-nowrap">{p.role}:</span>
                            <span>{p.fullName}</span>
                          </Fragment>
                        ))}
                        {item.note && (
                          <>
                            <span className="text-slate-600 whitespace-nowrap">Ghi chú:</span>
                            <span>{item.note}</span>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
