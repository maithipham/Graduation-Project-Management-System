import React from 'react'
import { Link } from 'react-router-dom'
import { School, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import type { Faculty } from '@/features/admin/faculty_management'

interface FacultySummaryCardProps {
  faculties: Faculty[]
}

export const FacultySummaryCard: React.FC<FacultySummaryCardProps> = ({
  faculties,
}) => {
  return (
    <Card className="border-slate-200/90 shadow-xs overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <School className="h-4 w-4 text-blue-600" />
          <CardTitle className="text-base font-bold text-slate-900">
            Danh sách Khoa đào tạo
          </CardTitle>
        </div>
        <Link
          to="/admin/faculties"
          className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/70">
              <TableHead className="w-20 font-bold text-slate-600 text-xs uppercase">
                Mã khoa
              </TableHead>
              <TableHead className="font-bold text-slate-600 text-xs uppercase">
                Tên khoa
              </TableHead>
              <TableHead className="font-bold text-slate-600 text-xs uppercase">
                Trưởng khoa
              </TableHead>
              <TableHead className="font-bold text-slate-600 text-xs uppercase">
                Quy mô
              </TableHead>
              <TableHead className="font-bold text-slate-600 text-xs uppercase">
                Trạng thái
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {faculties.slice(0, 5).map((faculty) => (
              <TableRow
                key={faculty.id}
                className="hover:bg-slate-50/80 transition-colors"
              >
                <TableCell>
                  <span className="font-bold font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs border border-blue-200">
                    {faculty.code}
                  </span>
                </TableCell>

                <TableCell className="font-bold text-slate-900 text-sm">
                  <Link
                    to="/admin/faculties"
                    className="hover:text-blue-700 transition-colors"
                  >
                    {faculty.name}
                  </Link>
                </TableCell>

                <TableCell className="text-xs text-slate-600">
                  {faculty.dean}
                </TableCell>

                <TableCell>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    {faculty.majors.length} ngành
                  </span>
                </TableCell>

                <TableCell>
                  {faculty.status === 'active' ? (
                    <span className="text-xs font-semibold text-emerald-700">
                      Hoạt động
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">
                      Tạm dừng
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
