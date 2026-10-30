import React, { Fragment } from 'react'
import type { StudentScheduleItem } from '../types/schedule.types'
import {
  formatScheduleDate,
  formatScheduleTime,
} from '../services/schedule.service'

interface ScheduleTableProps {
  schedules: StudentScheduleItem[]
  nowMs: number
}

export const ScheduleTable: React.FC<ScheduleTableProps> = ({ schedules, nowMs }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-700 font-semibold">
            <tr>
              <th className="py-3.5 px-4 w-32">Loại lịch</th>
              <th className="py-3.5 px-4 w-28">Ngày</th>
              <th className="py-3.5 px-4 w-36">Khung giờ</th>
              <th className="py-3.5 px-4 w-24">Phòng</th>
              <th className="py-3.5 px-4 w-28">Trạng thái</th>
              <th className="py-3.5 px-4">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {schedules.map((item) => {
              const isReview = item.ty === 'Phản biện'
              const isUpcoming = Date.parse(item.e) > nowMs

              return (
                <tr
                  key={`${item.ty}-${item.s}`}
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
                      {item.ty}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-normal text-slate-900 whitespace-nowrap">
                    {formatScheduleDate(item.s)}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-normal text-slate-900 whitespace-nowrap">
                    {formatScheduleTime(item.s)} – {formatScheduleTime(item.e)}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-normal text-slate-900 whitespace-nowrap">
                    {item.room}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {isUpcoming ? (
                      <span className="text-xs font-semibold text-emerald-600">
                        Sắp tới
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-500">
                        Đã qua
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-normal text-slate-900">
                    <div className="grid grid-cols-[165px_1fr] gap-x-2 gap-y-1.5 text-xs font-normal text-slate-900">
                      {item.p.map(([role, name], idx) => (
                        <Fragment key={`${role}-${name}-${idx}`}>
                          <span className="text-slate-600 whitespace-nowrap">{role}:</span>
                          <span className="text-slate-900">{name}</span>
                        </Fragment>
                      ))}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
