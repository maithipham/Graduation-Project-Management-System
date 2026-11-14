import React from 'react'
import { Edit2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { formatDate } from '@/shared/utils/formatDate'
import type { Semester } from '../types/semester.types'

interface SemesterTableProps {
  semesters: Semester[]
  onEditSemester: (semester: Semester) => void
}

export const SemesterTable: React.FC<SemesterTableProps> = ({
  semesters,
  onEditSemester,
}) => {
  const getStatusBadge = (status: Semester['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Đang diễn ra
          </span>
        )
      case 'upcoming':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
            Chưa bắt đầu
          </span>
        )
      case 'ended':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            Đã kết thúc
          </span>
        )
    }
  }

  return (
    <div className="relative overflow-visible">
      <Table containerClassName="overflow-visible">
        <TableHeader>
          <TableRow className="bg-slate-50/80">
            <TableHead className="w-14 text-center font-bold text-slate-600 text-xs uppercase">
              No.
            </TableHead>
            <TableHead className="font-bold text-slate-600 text-xs uppercase">
              Tên học kỳ
            </TableHead>
            <TableHead className="font-bold text-slate-600 text-xs uppercase">
              Thời gian bắt đầu
            </TableHead>
            <TableHead className="font-bold text-slate-600 text-xs uppercase">
              Thời gian kết thúc
            </TableHead>
            <TableHead className="font-bold text-slate-600 text-xs uppercase">
              Trạng thái
            </TableHead>
            <TableHead className="w-28 text-center font-bold text-slate-600 text-xs uppercase whitespace-nowrap">
              Hành động
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {semesters.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center text-slate-400 text-sm">
                Không tìm thấy học kỳ nào phù hợp với bộ lọc.
              </TableCell>
            </TableRow>
          ) : (
            semesters.map((semester, idx) => (
              <TableRow
                key={semester.id}
                className="hover:bg-slate-50/80 transition-colors"
              >
                <TableCell className="text-center font-medium text-slate-500 text-xs">
                  {idx + 1}
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <span>{semester.name}</span>
                    {semester.status === 'active' && (
                      <span className="text-[10px] font-semibold bg-blue-600 text-white px-2 py-0.5 rounded-full ml-1">
                        Hiện tại
                      </span>
                    )}
                  </div>
                </TableCell>

                <TableCell className="text-slate-600 text-sm">
                  {formatDate(semester.startDate) || semester.startDate || '—'}
                </TableCell>

                <TableCell className="text-slate-600 text-sm">
                  {formatDate(semester.endDate) || semester.endDate || '—'}
                </TableCell>

                <TableCell>{getStatusBadge(semester.status)}</TableCell>

                <TableCell className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditSemester(semester)}
                    className="h-8 px-2.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1.5 rounded-lg cursor-pointer"
                    title="Chỉnh sửa khoảng thời gian học kỳ"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Sửa thời gian</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
