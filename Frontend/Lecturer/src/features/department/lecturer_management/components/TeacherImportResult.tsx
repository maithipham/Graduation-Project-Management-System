import { Fragment, useState } from 'react'
import { AlertTriangle, CheckCircle2, Pencil, XCircle, type LucideIcon } from 'lucide-react'
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui'
import { cn } from '@/shared/utils/cn'
import {
  countRowsByStatus,
  IMPORT_TAB_ORDER,
  pickDefaultTab,
  type RowImportStatus,
} from '@/features/department/student_management'
import type { TeacherImportResponse, TeacherImportRowResult } from '../types'
import { RetryTeacherImportRowForm } from './RetryTeacherImportRowForm'

const TAB_CONFIG: Record<
  RowImportStatus,
  { label: string; icon: LucideIcon; iconClass: string; messageClass: string; empty: string }
> = {
  ERROR: {
    label: 'Lỗi',
    icon: XCircle,
    iconClass: 'text-red-600',
    messageClass: 'font-medium text-[#DC2626]',
    empty: 'Không còn dòng lỗi nào.',
  },
  WARNING: {
    label: 'Cảnh báo',
    icon: AlertTriangle,
    iconClass: 'text-amber-600',
    messageClass: 'text-amber-700',
    empty: 'Không có dòng cảnh báo nào.',
  },
  SUCCESS: {
    label: 'Thành công',
    icon: CheckCircle2,
    iconClass: 'text-emerald-600',
    messageClass: 'text-slate-600',
    empty: 'Chưa có dòng nào được lưu.',
  },
}

const COLUMN_COUNT = 7

/**
 * Kết quả import giáo viên theo từng dòng Excel, chia tab Lỗi / Cảnh báo / Thành công (giống import sinh viên).
 * Dòng lỗi sửa được ngay trên bảng rồi gửi lại qua POST /teacher; số đếm và tab đổi theo kết quả gửi lại.
 * Bấm "Import file khác" thì component bị gỡ ra, lần import sau bắt đầu lại từ đầu.
 */
export function TeacherImportResult({ result }: { result: TeacherImportResponse }) {
  const [rows, setRows] = useState<TeacherImportRowResult[]>(result.rowResults)
  const [activeTab, setActiveTab] = useState<RowImportStatus>(() =>
    pickDefaultTab(countRowsByStatus(result.rowResults)),
  )
  const [editingRow, setEditingRow] = useState<number | null>(null)

  const counts = countRowsByStatus(rows)

  const updateRow = (updated: TeacherImportRowResult) => {
    setRows((current) =>
      current.map((row) => (row.rowNumber === updated.rowNumber ? updated : row)),
    )
    // Gửi lại xong (thành công / cảnh báo) → dòng chuyển tab, đóng form
    if (updated.status !== 'ERROR') setEditingRow(null)
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-700">
        Đã xử lý <span className="font-semibold">{result.totalRows}</span> dòng.{' '}
        {counts.ERROR > 0 ? (
          <>
            Còn <span className="font-semibold text-[#DC2626]">{counts.ERROR} dòng lỗi</span>: bấm
            "Sửa" để chỉnh và gửi lại từng dòng, hoặc sửa trong Excel rồi import lại.
          </>
        ) : (
          'Không còn dòng lỗi.'
        )}
      </p>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as RowImportStatus)}>
        <TabsList>
          {IMPORT_TAB_ORDER.map((status) => {
            const { label, icon: Icon, iconClass } = TAB_CONFIG[status]
            return (
              <TabsTrigger key={status} value={status} className="gap-1.5">
                <Icon className={cn('h-4 w-4', iconClass)} />
                {label}
                <span className="rounded-full bg-slate-200/80 px-1.5 text-xs tabular-nums">
                  {counts[status]}
                </span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {IMPORT_TAB_ORDER.map((status) => {
          const tabRows = rows.filter((row) => row.status === status)
          const config = TAB_CONFIG[status]
          return (
            <TabsContent key={status} value={status}>
              {tabRows.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">
                  {config.empty}
                </p>
              ) : (
                <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-slate-200">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-white">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-16">Dòng</TableHead>
                        <TableHead>Họ tên</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Đơn vị công tác</TableHead>
                        <TableHead>Ngành</TableHead>
                        <TableHead>{status === 'ERROR' ? 'Lý do lỗi' : 'Thông báo'}</TableHead>
                        <TableHead className="w-20" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tabRows.map((row) => {
                        const editing = status === 'ERROR' && editingRow === row.rowNumber
                        return (
                          <Fragment key={row.rowNumber}>
                            <TableRow className={cn(editing && 'bg-blue-50/40 hover:bg-blue-50/40')}>
                              <TableCell className="py-2 text-slate-500">{row.rowNumber}</TableCell>
                              <TableCell className="py-2">
                                {`${row.firstName} ${row.lastName}`.trim()}
                              </TableCell>
                              <TableCell className="py-2">{row.email}</TableCell>
                              <TableCell className="py-2">{row.organization}</TableCell>
                              <TableCell className="py-2">{row.majorName}</TableCell>
                              <TableCell className={cn('py-2 text-xs', config.messageClass)}>
                                {row.message}
                              </TableCell>
                              <TableCell className="py-2 text-right">
                                {status === 'ERROR' && !editing && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingRow(row.rowNumber)}
                                  >
                                    <Pencil /> Sửa
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                            {editing && (
                              <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={COLUMN_COUNT} className="py-3">
                                  <RetryTeacherImportRowForm
                                    row={row}
                                    onRowChange={updateRow}
                                    onCancel={() => setEditingRow(null)}
                                  />
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
