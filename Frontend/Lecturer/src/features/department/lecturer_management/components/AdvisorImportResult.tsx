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
  TeacherListItem,
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
 * và danh sách giảng viên trong hệ thống để đảm bảo hiển thị 100% đầy đủ thông tin:
 * Họ tên, Học vị, Mã GV, Email, Đơn vị / Bộ môn, Hạn mức (maxStudents).
 */
function normalizeAdvisorImportRows(
  result: AdvisorImportResponse,
  parsedFileRows: ParsedAdvisorExcelRow[] = [],
  lecturers: SupervisorLecturer[] = [],
  teachers: TeacherListItem[] = [],
): AdvisorImportRowResult[] {
  // 1. Nếu BE trả danh sách rowResults chi tiết thì dùng trực tiếp và làm giàu thêm thông tin
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

      const emailLower = (r.email || '').trim().toLowerCase()
      const matchedSupervisor = lecturers.find(
        (l) =>
          (emailLower && l.email?.trim().toLowerCase() === emailLower) ||
          (r.teacherCode && l.teacherCode === r.teacherCode),
      )
      const matchedTeacher = teachers.find(
        (t) =>
          (emailLower && t.email?.trim().toLowerCase() === emailLower) ||
          (r.teacherCode && t.teacherCode === r.teacherCode),
      )

      return {
        rowNumber: r.rowNumber ?? idx + 1,
        teacherCode: r.teacherCode || r.code || matchedSupervisor?.teacherCode || matchedTeacher?.teacherCode || '—',
        name: fullName || matchedSupervisor?.name || (matchedTeacher ? `${matchedTeacher.firstName} ${matchedTeacher.lastName}`.trim() : '—'),
        academicTitle: r.academicTitle || r.title || matchedSupervisor?.title || matchedTeacher?.academicTitle || '',
        email: r.email || matchedSupervisor?.email || matchedTeacher?.email || '—',
        phone: r.phone || matchedTeacher?.phone || '',
        organization:
          r.organization ||
          matchedSupervisor?.categoryLabel ||
          matchedTeacher?.organization ||
          (r.email?.toLowerCase().endsWith('@tlu.edu.vn') ? 'Trong trường - ĐH Thủy Lợi' : 'Ngoài trường'),
        majorName: r.majorName || r.department || matchedSupervisor?.department || matchedTeacher?.majorName || '',
        quota: r.quota ?? r.maxStudents ?? matchedSupervisor?.quota ?? matchedTeacher?.maxStudents ?? null,
        maxStudents: r.maxStudents ?? r.quota ?? matchedSupervisor?.quota ?? matchedTeacher?.maxStudents ?? null,
        status,
        message: r.message || r.reason || (status === 'WARNING' ? 'Đã là GVHD trong học kỳ này, hệ thống tự động bỏ qua' : 'Thành công'),
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

    // Tính toán số dòng skipped dựa vào BE skippedCount nếu warningEmail rỗng
    const skippedTarget = result.skippedCount || result.warningCount || 0

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
          (pRow.teacherCode && l.teacherCode && l.teacherCode.toLowerCase() === pRow.teacherCode.toLowerCase()) ||
          (pRow.name && l.name && l.name.toLowerCase().trim() === pRow.name.toLowerCase().trim()),
      )

      // Tìm thông tin hồ sơ giáo viên trong hệ thống nếu có
      const matchedTeacher = teachers.find(
        (t) =>
          (emailLower && t.email?.trim().toLowerCase() === emailLower) ||
          (pRow.teacherCode && t.teacherCode && t.teacherCode.toLowerCase() === pRow.teacherCode.toLowerCase()) ||
          (pRow.name && `${t.firstName} ${t.lastName}`.trim().toLowerCase() === pRow.name.toLowerCase().trim()),
      )

      let status: RowImportStatus = 'SUCCESS'
      let message = 'Phân công làm giáo viên hướng dẫn kỳ này thành công'

      if (isError) {
        status = 'ERROR'
        message = errorMsg || 'Dòng dữ liệu không hợp lệ'
      } else if (warningEmailSet.has(emailLower) || matchedSupervisor) {
        status = 'WARNING'
        message = 'Đã là GVHD trong học kỳ này, hệ thống tự động bỏ qua'
      } else if (skippedTarget > 0 && !isError && idx >= (result.successCount || 0)) {
        status = 'WARNING'
        message = 'Đã là GVHD trong học kỳ này, hệ thống tự động bỏ qua'
      }

      // Tách học vị nếu có trong họ tên (VD: "PGS.TS. Trần Quốc Bảo")
      let title = pRow.academicTitle || matchedSupervisor?.title || matchedTeacher?.academicTitle || ''
      let cleanName = pRow.name
      const titleMatch = cleanName.match(
        /^(PGS\.TS\.|GS\.TS\.|TS\.|ThS\.|CN\.|KS\.)\s*/i,
      )
      if (titleMatch) {
        if (!title) title = titleMatch[1].trim()
        cleanName = cleanName.replace(titleMatch[0], '').trim()
      }

      const displayCode = pRow.teacherCode || matchedSupervisor?.teacherCode || matchedTeacher?.teacherCode || '—'
      const displayName =
        cleanName ||
        matchedSupervisor?.name ||
        (matchedTeacher ? `${matchedTeacher.firstName} ${matchedTeacher.lastName}`.trim() : '') ||
        (pRow.email ? pRow.email.split('@')[0] : '—')

      const displayEmail = pRow.email || matchedSupervisor?.email || matchedTeacher?.email || '—'

      const displayOrg =
        pRow.organization ||
        matchedSupervisor?.categoryLabel ||
        matchedTeacher?.organization ||
        (displayEmail.toLowerCase().endsWith('@tlu.edu.vn') ? 'Trong trường - ĐH Thủy Lợi' : 'Ngoài trường')

      const displayDept =
        pRow.department ||
        matchedSupervisor?.department ||
        matchedTeacher?.majorName ||
        ''

      const displayQuota =
        pRow.maxStudents ??
        pRow.quota ??
        matchedSupervisor?.quota ??
        matchedTeacher?.maxStudents ??
        null

      return {
        rowNumber: pRow.rowNumber,
        teacherCode: displayCode,
        name: displayName,
        academicTitle: title,
        email: displayEmail,
        organization: displayOrg,
        majorName: displayDept,
        quota: displayQuota,
        maxStudents: displayQuota,
        status,
        message,
      }
    })
  }

  // 3. Fallback thông minh nếu không có dữ liệu file parsed tại client
  const rows: AdvisorImportRowResult[] = []

  // Xử lý các dòng lỗi
  if (Array.isArray(result.errors) && result.errors.length > 0) {
    for (const err of result.errors) {
      const emailLower = (err.email || '').trim().toLowerCase()
      const sup = lecturers.find((l) => emailLower && l.email?.toLowerCase() === emailLower)
      const tch = teachers.find((t) => emailLower && t.email?.toLowerCase() === emailLower)

      rows.push({
        rowNumber: err.rowNumber,
        teacherCode: sup?.teacherCode || tch?.teacherCode || '—',
        name: sup?.name || (tch ? `${tch.firstName} ${tch.lastName}`.trim() : '') || (err.email ? err.email.split('@')[0] : '—'),
        academicTitle: sup?.title || tch?.academicTitle || '',
        email: err.email || '—',
        organization: sup?.categoryLabel || tch?.organization || (emailLower.endsWith('@tlu.edu.vn') ? 'Trong trường - ĐH Thủy Lợi' : 'Ngoài trường'),
        majorName: sup?.department || tch?.majorName || '',
        quota: sup?.quota ?? tch?.maxStudents ?? null,
        maxStudents: sup?.quota ?? tch?.maxStudents ?? null,
        status: 'ERROR',
        message: err.reason || 'Dòng dữ liệu không hợp lệ',
      })
    }
  }

  // Xử lý các dòng cảnh báo (Đã là GVHD trong kỳ, bỏ qua)
  if (Array.isArray(result.warnings) && result.warnings.length > 0) {
    for (const warn of result.warnings) {
      const emailLower = (warn.email || '').trim().toLowerCase()
      const sup = lecturers.find((l) => emailLower && l.email?.toLowerCase() === emailLower)
      const tch = teachers.find((t) => emailLower && t.email?.toLowerCase() === emailLower)

      rows.push({
        rowNumber: warn.rowNumber,
        teacherCode: sup?.teacherCode || tch?.teacherCode || '—',
        name: sup?.name || (tch ? `${tch.firstName} ${tch.lastName}`.trim() : '') || (warn.email ? warn.email.split('@')[0] : '—'),
        academicTitle: sup?.title || tch?.academicTitle || '',
        email: warn.email || '—',
        organization: sup?.categoryLabel || tch?.organization || (emailLower.endsWith('@tlu.edu.vn') ? 'Trong trường - ĐH Thủy Lợi' : 'Ngoài trường'),
        majorName: sup?.department || tch?.majorName || '',
        quota: sup?.quota ?? tch?.maxStudents ?? null,
        maxStudents: sup?.quota ?? tch?.maxStudents ?? null,
        status: 'WARNING',
        message: warn.reason || 'Đã là GVHD trong học kỳ này, hệ thống tự động bỏ qua',
      })
    }
  } else if (result.skippedCount > 0) {
    // Nếu BE chỉ trả skippedCount, lấy từ danh sách lecturers hiện có để hiển thị đầy đủ thông tin
    for (let i = 0; i < result.skippedCount; i++) {
      const sup = lecturers[i]
      const rowNum = (result.errors?.length || 0) + i + 1

      rows.push({
        rowNumber: rowNum,
        teacherCode: sup?.teacherCode || '—',
        name: sup?.name || (sup?.email ? sup.email.split('@')[0] : '—'),
        academicTitle: sup?.title || '',
        email: sup?.email || '—',
        organization: sup?.categoryLabel || 'Trong trường - ĐH Thủy Lợi',
        majorName: sup?.department || '',
        quota: sup?.quota ?? null,
        maxStudents: sup?.quota ?? null,
        status: 'WARNING',
        message: 'Đã là GVHD trong học kỳ này, hệ thống tự động bỏ qua',
      })
    }
  }

  // Xử lý các dòng thành công
  if (result.successCount > 0) {
    for (let i = 0; i < result.successCount; i++) {
      const rowNum = (result.errors?.length || 0) + (result.skippedCount || 0) + i + 1
      rows.push({
        rowNumber: rowNum,
        teacherCode: '—',
        name: 'Giảng viên mới',
        academicTitle: '',
        email: '—',
        organization: 'Trong trường',
        majorName: '',
        quota: null,
        maxStudents: null,
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
  teachers?: TeacherListItem[]
}

export function AdvisorImportResult({
  result,
  parsedFileRows = [],
  lecturers = [],
  teachers = [],
}: AdvisorImportResultProps) {
  const [rows] = useState<AdvisorImportRowResult[]>(() =>
    normalizeAdvisorImportRows(result, parsedFileRows, lecturers, teachers),
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
                        <TableHead className="min-w-[170px]">Đơn vị / Bộ môn</TableHead>
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
                        const quotaDisplay = row.maxStudents ?? row.quota

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
                                  {row.organization || row.majorName || '—'}
                                </div>
                                {row.majorName && row.organization && row.organization !== row.majorName && (
                                  <div className="text-[11px] text-slate-400">
                                    {row.majorName}
                                  </div>
                                )}
                              </div>
                            </TableCell>

                            {/* Hạn mức (maxStudents) */}
                            <TableCell className="py-2.5 text-right tabular-nums font-bold text-slate-800 text-xs">
                              {quotaDisplay != null ? `${quotaDisplay} SV` : '—'}
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
