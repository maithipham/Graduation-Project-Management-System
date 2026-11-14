import React from 'react'
import { Activity, Clock } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card'
import type { UserAccount } from '@/features/admin/account_management'

interface ActivityHistoryTimelineProps {
  accounts: UserAccount[]
}

export const ActivityHistoryTimeline: React.FC<ActivityHistoryTimelineProps> = ({
  accounts,
}) => {
  // Aggregate all activities from accounts
  const allActivities = accounts.flatMap((acc) =>
    acc.activities.map((act) => ({
      ...act,
      userName: acc.name,
      userRole: acc.role,
    })),
  )

  // Take top 6
  const topActivities = allActivities.slice(0, 6)

  return (
    <Card className="border-slate-200/90 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-600" />
          <CardTitle className="text-base font-bold text-slate-900">
            Nhật ký hoạt động gần đây
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {topActivities.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            Chưa có hoạt động nào được ghi nhận.
          </div>
        ) : (
          <div className="relative pl-5 space-y-3.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {topActivities.map((act) => (
              <div key={act.id} className="relative group">
                <div className="absolute -left-5 top-1 h-2.5 w-2.5 rounded-full bg-blue-600 ring-4 ring-blue-100 group-hover:scale-125 transition-transform" />
                <div className="text-xs font-semibold text-slate-800 leading-tight">
                  {act.action}{' '}
                  <span className="font-normal text-slate-500">
                    ({act.userName} • {act.userRole})
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                  <Clock className="h-3 w-3" />
                  <span>{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
