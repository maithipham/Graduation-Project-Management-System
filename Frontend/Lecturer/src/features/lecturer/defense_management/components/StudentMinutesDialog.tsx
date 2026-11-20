import React, { useState } from 'react'
import { FileDown, Printer, Save, Send, ShieldCheck } from 'lucide-react'
import logoDhtl from '@/assets/images/logo_dhtl.png'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from '@/shared/components/ui'
import { toast } from '@/shared/components/feedback/toast.store'
import {
  useDefenseMinutes,
  useDefenseScoreBoard,
  useFinalizeDefenseMinutes,
  useSaveDefenseMinutes,
} from '../hooks/useDefenseEvaluation'
import type { CouncilMember, DefenseMinutes, DefenseMinutesRequest, DefenseScoreBoard } from '../types'
import {
  buildStudentMinutesHtml,
  downloadWordDocument,
  printHtmlDocument,
  timeOf,
} from '../utils/minutesDocument'

interface StudentMinutesDialogProps {
  defenseAssignmentPublicId: string | null
  members: CouncilMember[]
  onClose: () => void
}

const ROLE_LABEL: Record<CouncilMember['role'], string> = {
  CHAIRPERSON: 'Chủ tịch HĐ',
  SECRETARY: 'Thư ký',
  COUNCIL_MEMBER: 'Ủy viên',
}

// Điểm đánh giá trên biên bản: điểm tổng kết (nếu đạt), không thì điểm TB Hội đồng
function scoreText(board: DefenseScoreBoard | undefined): string {
  if (!board) return ''
  if (board.finalScore !== null) return board.finalScore.toFixed(1)
  if (board.councilScore !== null) return board.councilScore.toFixed(1)
  return ''
}

/**
 * BƯỚC 14 – Pha 2: Biên bản bảo vệ của 1 sinh viên (mẫu ĐH Thủy Lợi).
 * Thư ký: lưu nháp / nộp (chốt) biên bản. Thành viên khác: chỉ xem, in, tải Word.
 */
export const StudentMinutesDialog: React.FC<StudentMinutesDialogProps> = ({
  defenseAssignmentPublicId,
  members,
  onClose,
}) => {
  const open = Boolean(defenseAssignmentPublicId)
  const { data: minutes, isPending, isError } = useDefenseMinutes(
    defenseAssignmentPublicId ?? undefined,
  )
  const { data: board } = useDefenseScoreBoard(defenseAssignmentPublicId ?? undefined)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <DialogTitle className="text-[15px] font-bold text-slate-900">
            {minutes
              ? `Biên bản bảo vệ — ${minutes.studentName} (${minutes.studentCode})`
              : 'Biên bản bảo vệ'}
          </DialogTitle>
        </DialogHeader>

        {isPending && (
          <div className="p-6 space-y-3">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}
        {isError && (
          <div className="m-6 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-4 rounded-xl">
            Không tải được biên bản hoặc bạn không có quyền xem biên bản của sinh viên này.
          </div>
        )}
        {minutes && (
          <MinutesForm
            // Dữ liệu mới từ server (sau lưu / chốt) → khởi tạo lại form
            key={`${minutes.minutesPublicId ?? 'new'}-${minutes.updatedAt ?? ''}-${minutes.status ?? ''}`}
            minutes={minutes}
            members={members}
            score={scoreText(board)}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

interface MinutesFormProps {
  minutes: DefenseMinutes
  members: CouncilMember[]
  score: string
  onClose: () => void
}

type MinutesErrors = Partial<
  Record<'presentationSummary' | 'qaContent' | 'councilConclusion' | 'revisionRequired' | 'revisionRequirement', string>
>

const MinutesForm: React.FC<MinutesFormProps> = ({ minutes, members, score, onClose }) => {
  const id = minutes.defenseAssignmentPublicId
  const saveMutation = useSaveDefenseMinutes(id)
  const finalizeMutation = useFinalizeDefenseMinutes(id)
  const editable = minutes.editable
  const finalized = minutes.status === 'FINALIZED'

  const [presentationSummary, setPresentationSummary] = useState(minutes.presentationSummary ?? '')
  const [qaContent, setQaContent] = useState(minutes.qaContent ?? '')
  const [councilConclusion, setCouncilConclusion] = useState(minutes.councilConclusion ?? '')
  const [revisionRequired, setRevisionRequired] = useState<boolean | null>(minutes.revisionRequired)
  const [revisionRequirement, setRevisionRequirement] = useState(minutes.revisionRequirement ?? '')
  const [errors, setErrors] = useState<MinutesErrors>({})
  const [confirmOpen, setConfirmOpen] = useState(false)

  const isBusy = saveMutation.isPending || finalizeMutation.isPending

  const buildRequest = (): DefenseMinutesRequest => ({
    presentationSummary: presentationSummary.trim() || null,
    qaContent: qaContent.trim() || null,
    councilConclusion: councilConclusion.trim() || null,
    revisionRequired,
    revisionRequirement: revisionRequired ? revisionRequirement.trim() || null : null,
  })

  // Kiểm tra giống BE trước khi chốt (DEFENSE_MINUTES_INCOMPLETE, DEFENSE_REVISION_FLAG_REQUIRED...)
  const validateForFinalize = (): boolean => {
    const next: MinutesErrors = {}
    if (!presentationSummary.trim()) next.presentationSummary = 'Vui lòng nhập nội dung bảo vệ đồ án'
    if (!qaContent.trim()) next.qaContent = 'Vui lòng nhập phần trả lời câu hỏi'
    if (!councilConclusion.trim()) next.councilConclusion = 'Vui lòng nhập kết luận của Hội đồng'
    if (revisionRequired === null) next.revisionRequired = 'Vui lòng chọn có hay không yêu cầu chỉnh sửa báo cáo'
    if (revisionRequired && !revisionRequirement.trim()) {
      next.revisionRequirement = 'Vui lòng nhập nội dung Hội đồng yêu cầu chỉnh sửa'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSaveDraft = () => {
    saveMutation.mutate(buildRequest(), {
      onSuccess: () => toast.success(`Đã lưu nháp biên bản bảo vệ cho ${minutes.studentName}`),
    })
  }

  const handleFinalize = async () => {
    try {
      await saveMutation.mutateAsync(buildRequest())
      await finalizeMutation.mutateAsync()
      setConfirmOpen(false)
      toast.success(`Đã nộp biên bản bảo vệ chính thức cho ${minutes.studentName}`)
      onClose()
    } catch {
      // Interceptor đã hiện lỗi
      setConfirmOpen(false)
    }
  }

  const docHtml = () =>
    buildStudentMinutesHtml({
      councilName: minutes.councilName || minutes.councilCode,
      location: minutes.room || minutes.councilLocation,
      members: members.map((m) => ({ fullName: m.fullName, role: m.role })),
      studentName: minutes.studentName,
      studentCode: minutes.studentCode,
      className: minutes.className,
      topicName: minutes.topicName,
      supervisorName: minutes.supervisorName,
      supervisorEmail: minutes.supervisorEmail,
      slotOrder: minutes.slotOrder,
      startTime: timeOf(minutes.defenseStartTime),
      endTime: timeOf(minutes.defenseEndTime),
      presentationSummary,
      qaContent,
      councilConclusion,
      revisionRequired,
      revisionRequirement,
      score,
      date: minutes.defenseStartTime ? new Date(minutes.defenseStartTime) : new Date(),
    })

  const fieldClass = (hasError?: string) =>
    `w-full p-2.5 rounded-lg text-[13px] font-serif outline-none transition ${
      editable
        ? `border border-dashed ${hasError ? 'border-[#DC2626]' : 'border-[#1565C0]'} bg-blue-50/20 focus:bg-white`
        : 'border border-transparent bg-transparent resize-none'
    }`
  const errorText = (msg?: string) =>
    msg ? <p className="text-xs font-bold text-[#DC2626] mt-1">{msg}</p> : null

  const sortedMembers = [...members].sort(
    (a, b) =>
      ['CHAIRPERSON', 'SECRETARY', 'COUNCIL_MEMBER'].indexOf(a.role) -
      ['CHAIRPERSON', 'SECRETARY', 'COUNCIL_MEMBER'].indexOf(b.role),
  )
  const chair = sortedMembers.find((m) => m.role === 'CHAIRPERSON')
  const secretary = sortedMembers.find((m) => m.role === 'SECRETARY')
  const date = minutes.defenseStartTime ? new Date(minutes.defenseStartTime) : new Date()

  return (
    <>
      <div className="px-6 py-2.5 border-b border-slate-100 text-xs flex items-center justify-between gap-2">
        {editable ? (
          <span className="text-blue-700 font-semibold inline-flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Quyền Thư ký: bạn có thể chỉnh sửa và nộp biên bản sinh viên
          </span>
        ) : (
          <span className="text-slate-500 font-medium">
            {finalized
              ? `Biên bản đã nộp chính thức${minutes.secretaryName ? ` bởi ${minutes.secretaryName}` : ''}.`
              : minutes.minutesPublicId
                ? 'Chế độ xem biên bản bảo vệ của Hội đồng.'
                : 'Thư ký chưa lập biên bản cho sinh viên này.'}
          </span>
        )}
        {finalized && (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Đã nộp
          </span>
        )}
      </div>

      {/* Biên bản theo mẫu ĐH Thủy Lợi */}
      <div className="px-8 py-6 font-serif text-[13.5px] text-black leading-relaxed space-y-3">
        <div className="grid grid-cols-[44%_56%] items-start">
          <div className="text-center">
            <img src={logoDhtl} alt="Trường Đại học Thủy lợi" className="h-[68px] mx-auto object-contain" />
          </div>
          <div className="text-center">
            <div className="font-bold text-[13px]">CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div className="font-bold text-[13px]">Độc lập - Tự do - Hạnh phúc</div>
            <div className="text-xs tracking-widest">---------★---------</div>
          </div>
        </div>
        <h2 className="text-center text-[17px] font-bold">BIÊN BẢN BẢO VỆ ĐỒ ÁN TỐT NGHIỆP</h2>

        <div>
          <div>
            <b>Hôm nay, ngày</b> {date.getDate()} <b>tháng</b> {date.getMonth() + 1} <b>năm</b> {date.getFullYear()}
          </div>
          <div>
            <b>Địa điểm:</b> {minutes.room || minutes.councilLocation || ''}
          </div>
          <div>
            <b>Hội đồng:</b> {minutes.councilName || minutes.councilCode}
          </div>
        </div>

        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th className="border border-black px-2 py-1 w-12">STT</th>
              <th className="border border-black px-3 py-1 text-left">Họ tên</th>
              <th className="border border-black px-3 py-1 text-left w-36">Nhiệm vụ</th>
            </tr>
          </thead>
          <tbody>
            {sortedMembers.map((m, idx) => (
              <tr key={m.memberPublicId}>
                <td className="border border-black px-2 py-1 text-center">{idx + 1}</td>
                <td className="border border-black px-3 py-1">{m.fullName}</td>
                <td className="border border-black px-3 py-1">{ROLE_LABEL[m.role]}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-0.5">
          <div>
            <b>Họ tên sinh viên:</b> <b>{minutes.studentName}</b> ({minutes.studentCode}) &nbsp;&nbsp;&nbsp;
            <b>Lớp:</b> {minutes.className || ''}
          </div>
          <div>
            <b>Đề tài đồ án tốt nghiệp:</b> {minutes.topicName || ''}
          </div>
          <div>
            <b>Giảng viên hướng dẫn:</b> {minutes.supervisorName || ''}
            {minutes.supervisorEmail ? ` (${minutes.supervisorEmail})` : ''}
          </div>
          <div className="flex flex-wrap gap-x-6">
            <span>
              <b>Thứ tự bảo vệ:</b> {minutes.slotOrder ?? '—'}
            </span>
            <span>
              <b>Giờ bắt đầu:</b> {timeOf(minutes.defenseStartTime) || '—'}
            </span>
            <span>
              <b>Giờ kết thúc:</b> {timeOf(minutes.defenseEndTime) || '—'}
            </span>
          </div>
        </div>

        <div>
          <b>Nội dung bảo vệ đồ án:</b>
          <textarea
            rows={3}
            readOnly={!editable}
            value={presentationSummary}
            onChange={(e) => setPresentationSummary(e.target.value)}
            placeholder={editable ? 'Tóm tắt phần trình bày, demo của sinh viên...' : ''}
            className={fieldClass(errors.presentationSummary)}
          />
          {errorText(errors.presentationSummary)}
        </div>

        <div>
          <b>Phần trả lời câu hỏi:</b>
          <textarea
            rows={5}
            readOnly={!editable}
            value={qaContent}
            onChange={(e) => setQaContent(e.target.value)}
            placeholder={editable ? 'Câu hỏi 1: ... – Trả lời: ...\nCâu hỏi 2: ... – Trả lời: ...\nCâu hỏi 3: ... – Trả lời: ...' : ''}
            className={fieldClass(errors.qaContent)}
          />
          {errorText(errors.qaContent)}
        </div>

        <div>
          <b>Kết luận của Hội đồng:</b>
          <textarea
            rows={3}
            readOnly={!editable}
            value={councilConclusion}
            onChange={(e) => setCouncilConclusion(e.target.value)}
            className={fieldClass(errors.councilConclusion)}
          />
          {errorText(errors.councilConclusion)}
        </div>

        <div>
          <b>Yêu cầu chỉnh sửa, nộp lại báo cáo sau bảo vệ:</b>
          <div className="flex items-center gap-5 mt-1 font-sans text-[13px]">
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="revisionRequired"
                disabled={!editable}
                checked={revisionRequired === false}
                onChange={() => setRevisionRequired(false)}
              />
              Không
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="revisionRequired"
                disabled={!editable}
                checked={revisionRequired === true}
                onChange={() => setRevisionRequired(true)}
              />
              Có – sinh viên phải nộp lại báo cáo cuối cùng
            </label>
          </div>
          {errorText(errors.revisionRequired)}
          {revisionRequired && (
            <>
              <textarea
                rows={3}
                readOnly={!editable}
                value={revisionRequirement}
                onChange={(e) => setRevisionRequirement(e.target.value)}
                placeholder={editable ? 'Nội dung Hội đồng yêu cầu chỉnh sửa...' : ''}
                className={`${fieldClass(errors.revisionRequirement)} mt-1.5`}
              />
              {errorText(errors.revisionRequirement)}
            </>
          )}
        </div>

        <div>
          <b>Điểm đánh giá:</b> {score || <span className="text-slate-400">Chưa đủ điểm</span>}{' '}
          <span className="text-slate-500 text-[12px]">(Thang điểm 10 – tự lấy từ bảng điểm Hội đồng)</span>
        </div>

        <div className="grid grid-cols-2 text-center pt-6">
          <div>
            <div className="font-bold">THƯ KÝ HỘI ĐỒNG</div>
            <div className="italic text-[12px] text-slate-500">(Ký và ghi rõ họ tên)</div>
            <div className="h-14" />
            <div className="font-bold">{secretary?.fullName}</div>
          </div>
          <div>
            <div className="font-bold">CHỦ TỊCH HỘI ĐỒNG</div>
            <div className="italic text-[12px] text-slate-500">(Ký và ghi rõ họ tên)</div>
            <div className="h-14" />
            <div className="font-bold">{chair?.fullName}</div>
          </div>
        </div>
      </div>

      {/* Thanh thao tác */}
      <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-end gap-2 sticky bottom-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            downloadWordDocument(`Bien_ban_bao_ve_${minutes.studentCode}.doc`, docHtml())
          }
          className="text-xs font-semibold inline-flex items-center gap-1.5"
        >
          <FileDown className="w-3.5 h-3.5" /> Tải Word
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => printHtmlDocument(`Biên bản bảo vệ - ${minutes.studentName}`, docHtml())}
          className="text-xs font-semibold inline-flex items-center gap-1.5"
        >
          <Printer className="w-3.5 h-3.5" /> In / Xuất PDF
        </Button>
        {editable && (
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={handleSaveDraft}
              className="text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> {saveMutation.isPending ? 'Đang lưu...' : 'Lưu nháp'}
            </Button>
            <Button
              size="sm"
              disabled={isBusy}
              onClick={() => validateForFinalize() && setConfirmOpen(true)}
              className="text-xs font-semibold bg-[#1565C0] hover:bg-[#0D47A1] text-white inline-flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Nộp biên bản
            </Button>
          </>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Xác nhận nộp biên bản</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-slate-600 leading-relaxed">
            Nộp biên bản bảo vệ chính thức cho <b className="text-slate-900">{minutes.studentName}</b>. Sau khi nộp,
            biên bản bị khóa, không chỉnh sửa được nữa.
            {revisionRequired && ' Sinh viên sẽ phải nộp lại báo cáo cuối cùng sau khi Hội đồng hoàn tất bảo vệ.'}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmOpen(false)} disabled={isBusy}>
              Xem lại
            </Button>
            <Button
              size="sm"
              onClick={handleFinalize}
              disabled={isBusy}
              className="bg-[#1565C0] hover:bg-[#0D47A1] text-white"
            >
              {isBusy ? 'Đang nộp...' : 'Xác nhận nộp'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default StudentMinutesDialog
