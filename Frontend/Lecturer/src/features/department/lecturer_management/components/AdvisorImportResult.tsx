import { useState } from 'react'
import { AlertTriangle, CheckCircle2, XCircle, type LucideIcon } from 'lucide-react'
import {
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
import type {
  AdvisorImportResponse,
  AdvisorImportRowResult,
  SupervisorLecturer,
} from '../types'
import { getAvatarColor, getAvatarInitials } from '../utils/teacherDisplay'
import type { ParsedAdvisorExcelRow } from '../utils/parseExcelRows'

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
    messageClass: 'text-amber-700 font-medium',
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

/**
 * Chuẩn hóa kết quả import GVHD từ Backend kết hợp với dữ liệu đọc từ file Excel
 * để đảm bảo hiển thị 100% đầy đủ thông tin giảng viên (Họ tên, Mã GV, Email, Đơn vị, Hạn mức)
 */
function normalizeAdvisorImportRows(
  result: AdvisorImportResponse,
  parsedFileRows: ParsedAdvisorExcelRow[] = [],
  lecturers: SupervisorLecturer[] = [],
): AdvisorImportRowResult[] {
  // 1. Nếu BE trả danh sách rowResults chi tiết thì dùng trực tiếp
  const rawRows =
    result.rowResults ||
    result.rows ||
    ((result as unknown as { data?: AdvisorImportRowResult[] }).data &&
    Array.isArray((result as unknown as { data?: AdvisorImportRowResult[] }).data)
      ? (result as unknown as { data: AdvisorImportRowResult[] }).data
      : null)

  if (Array.isArray(rawRows) && rawRows.length > 0) {
    return rawRows.map((r, idx) => {
      const rawStatus = String(r.status || '').toUpperCase()
      const status: RowImportStatus =
        rawStatus === 'ERROR' || rawStatus === 'FAILED'
          ? 'ERROR'
          : rawStatus === 'WARNING' || rawStatus === 'SKIPPED'
            ? 'WARNING'
            : 'SUCCESS'

      const fullName =
        r.name ||
        r.fullName ||
        `${r.firstName || ''} ${r.lastName || ''}`.trim() ||
        ''

      return {
        rowNumber: r.rowNumber ?? idx + 1,
        teacherCode: r.teacherCode || r.code || '',
        name: fullName,
        academicTitle: r.academicTitle || r.title || '',
        email: r.email || '',
        phone: r.phone || '',
        organization: r.organization || '',
        majorName: r.majorName || r.department || '',
        quota: r.quota ?? r.amount ?? r.maxStudents ?? null,
        status,
        message: r.message || r.reason || '',
      }
    })
  }

  // 2. Nếu Backend chưa trả rowResults nhưng ta đã đọc được các dòng từ file Excel
  if (parsedFileRows.length > 0) {
    const errorMap = new Map<number, string>()
    const errorEmailMap = new Map<string, string>()

    if (Array.isArray(result.errors)) {
      for (const err of result.errors) {
        if (err.rowNumber) errorMap.set(err.rowNumber, err.reason)
        if (err.email) errorEmailMap.set(err.email.trim().toLowerCase(), err.reason)
      }
    }

    const warningEmailSet = new Set<string>()
    if (Array.isArray(result.warnings)) {
      for (const warn of result.warnings) {
        if (warn.email) warningEmailSet.add(warn.email.trim().toLowerCase())
      }
    }

    return parsedFileRows.map((pRow, idx) => {
      const emailLower = (pRow.email || '').trim().toLowerCase()
      const isError =
        errorMap.has(pRow.rowNumber) ||
        (emailLower && errorEmailMap.has(emailLower))
      const errorMsg =
        errorMap.get(pRow.rowNumber) ||
        (emailLower ? errorEmailMap.get(emailLower) : undefined)

      // Kiểm tra xem GV này đã là GVHD trong kỳ chưa
      const matchedSupervisor = lecturers.find(
        (l) =>
          (emailLower && l.email?.trim().toLowerCase() === emailLower) ||
          (pRow.teacherCode && l.teacherCode === pRow.teacherCode),
      )

      let status: RowImportStatus = 'SUCCESS'
      let message = 'Phân công làm giáo viên hướng dẫn kỳ này thành công'

      if (isError) {
        status = 'ERROR'
        message = errorMsg || 'Dòng dữ liệu không hợp lệ'
      } else if (warningEmailSet.has(emailLower) || matchedSupervisor) {
        status = 'WARNING'
        message = 'Đã là GVHD trong học kỳ này, hệ thống tự động bỏ qua'
      } else if (result.skippedCount > 0 && idx >= (result.successCount || 0)) {
        status = 'WARNING'
        message = 'Đã là GVHD trong học kỳ này, hệ thống tự động bỏ qua'
      }

      // Tách học vị nếu có trong họ tên (VD: "PGS.TS. Trần Quốc Bảo")
      let title = matchedSupervisor?.title || ''
      let cleanName = pRow.name
      const titleMatch = pRow.name.match(
        /^(PGS\.TS\.|GS\.TS\.|TS\.|ThS\.|CN\.|KS\.)\s*/i,
      )
      if (titleMatch) {
        if (!title) title = titleMatch[1].trim()
        cleanName = pRow.name.replace(titleMatch[0], '').trim()
      }

      return {
        rowNumber: pRow.rowNumber,
        teacherCode: pRow.teacherCode || matchedSupervisor?.teacherCode || '',
        name: cleanName || matchedSupervisor?.name || '',
        academicTitle: title,
        email: pRow.email || matchedSupervisor?.email || '',
        organization: matchedSupervisor?.categoryLabel || 'Trong trường',
        majorName: matchedSupervisor?.department || '',
        quota: pRow.quota ?? matchedSupervisor?.quota ?? null,
        status,
        message,
      }
    })
  }

  // 3. Fallback tối thiểu nếu không có file parsed
  const rows: AdvisorImportRowResult[] = []

  if (Array.isArray(result.errors)) {
    for (const err of result.errors) {
      rows.push({
        rowNumber: err.rowNumber,
        email: err.email,
        status: 'ERROR',
        message: err.reason || 'Dòng dữ liệu không hợp lệ',
      })
    }
  }

  if (Array.isArray(result.warnings) && result.warnings.length > 0) {
    for (const warn of result.warnings) {
      rows.push({
        rowNumber: warn.rowNumber,
        email: warn.email,
        status: 'WARNING',
        message: warn.reason || 'Đã là GVHD trong học kỳ này, hệ thống tự động bỏ qua',
      })
    }
  } else if (result.skippedCount > 0) {
    for (let i = 1; i <= result.skippedCount; i++) {
      rows.push({
        rowNumber: (result.errors?.length || 0) + i,
        email: '—',
        status: 'WARNING',
        message: 'Đã là GVHD trong học kỳ này, hệ thống tự động bỏ qua',
      })
    }
  }

  if (result.successCount > 0) {
    for (let i = 1; i <= result.successCount; i++) {
      rows.push({
        rowNumber: (result.errors?.length || 0) + (result.skippedCount || 0) + i,
        email: '—',
        status: 'SUCCESS',
        message: 'Phân công làm giáo viên hướng dẫn kỳ này thành công',
      })
    }
  }

  return rows
}

interface AdvisorImportResultProps {
  result: AdvisorImportResponse
  parsedFileRows?: ParsedAdvisorExcelRow[]
  lecturers?: SupervisorLecturer[]
}

export function AdvisorImportResult({
  result,
  parsedFileRows = [],
  lecturers = [],
}: AdvisorImportResultProps) {
  const [rows] = useState<AdvisorImportRowResult[]>(() =>
    normalizeAdvisorImportRows(result, parsedFileRows, lecturers),
  )

  const counts = countRowsByStatus(rows)
  const [activeTab, setActiveTab] = useState<RowImportStatus>(() =>
    pickDefaultTab(counts),
  )

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-700">
        Đã xử lý <span className="font-semibold">{result.totalRows}</span> dòng.{' '}
        {counts.ERROR > 0 ? (
          <>
            Còn <span className="font-semibold text-[#DC2626]">{counts.ERROR} dòng lỗi</span>: vui lòng kiểm tra và sửa trong file Excel rồi import lại.
          </>
        ) : (
          'Không còn dòng lỗi.'
        )}
      </p>

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as RowImportStatus)}>
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
          const tabRows = rows.filter((r) => r.status === status)
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
                    <TableHeader className="sticky top-0 z-10 bg-white shadow-2xs">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-14 text-center">Dòng</TableHead>
                        <TableHead className="w-24">Mã GV</TableHead>
                        <TableHead className="min-w-[190px]">Giảng viên</TableHead>
                        <TableHead className="min-w-[180px]">Email</TableHead>
                        <TableHead className="min-w-[160px]">Đơn vị / Bộ môn</TableHead>
                        <TableHead className="text-right w-24">Hạn mức</TableHead>
                        <TableHead className="min-w-[200px]">
                          {status === 'ERROR' ? 'Lý do lỗi' : 'Thông báo / Trạng thái'}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tabRows.map((row, idx) => {
                        const avatarBg = getAvatarColor(row.email || row.name || String(idx))
                        const initials = getAvatarInitials(row.name || row.email || 'GV')

                        return (
                          <TableRow key={row.rowNumber || idx} className="hover:bg-slate-50/60 transition">
                            {/* Dòng */}
                            <TableCell className="py-2.5 text-center font-semibold text-slate-500">
                              {row.rowNumber}
                            </TableCell>

                            {/* Mã GV */}
                            <TableCell className="py-2.5 font-mono text-xs font-semibold text-slate-700">
                              {row.teacherCode || '—'}
                            </TableCell>

                            {/* Giảng viên (Avatar + Học vị + Họ tên) */}
                            <TableCell className="py-2.5">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={cn(
                                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-2xs',
                                    avatarBg,
                                  )}
                                >
                                  {initials}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {row.academicTitle && (
                                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200">
                                        {row.academicTitle}
                                      </span>
                                    )}
                                    <span className="font-bold text-slate-800 text-xs truncate">
                                      {row.name || (row.email ? row.email.split('@')[0] : '—')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </TableCell>

                            {/* Email */}
                            <TableCell className="py-2.5 text-xs text-slate-600 font-medium">
                              {row.email || '—'}
                            </TableCell>

                            {/* Đơn vị / Bộ môn */}
                            <TableCell className="py-2.5 text-xs text-slate-600">
                              <div className="space-y-0.5">
                                <div className="font-semibold text-slate-700">
                                  {row.majorName || '—'}
                                </div>
                                {row.organization && row.organization !== row.majorName && (
                                  <div className="text-[11px] text-slate-400">
                                    {row.organization}
                                  </div>
                                )}
                              </div>
                            </TableCell>

                            {/* Hạn mức */}
                            <TableCell className="py-2.5 text-right tabular-nums font-bold text-slate-800 text-xs">
                              {row.quota != null ? `${row.quota} SV` : '—'}
                            </TableCell>

                            {/* Thông báo / Lý do */}
                            <TableCell className={cn('py-2.5 text-xs leading-relaxed', config.messageClass)}>
                              {row.message || '—'}
                            </TableCell>
                          </TableRow>
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
