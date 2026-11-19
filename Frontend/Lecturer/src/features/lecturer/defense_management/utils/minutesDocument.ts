import logoDhtl from '@/assets/images/logo_dhtl.png'
import type { CouncilMemberRole } from '../types'

/**
 * Dựng / in / tải Word biên bản bảo vệ đồ án theo mẫu Trường ĐH Thủy Lợi (port từ demo gv_ui).
 * Chỉ thao tác chuỗi HTML phía trình duyệt, không gọi API.
 */

export interface MinutesDocumentMember {
  fullName: string
  role: CouncilMemberRole
}

export interface MinutesDocumentData {
  councilName: string
  location: string | null
  members: MinutesDocumentMember[]
  studentName: string
  studentCode: string
  className: string | null
  topicName: string | null
  supervisorName: string | null
  supervisorEmail: string | null
  slotOrder: number | null
  startTime: string // "07:30"
  endTime: string
  presentationSummary: string
  qaContent: string
  councilConclusion: string
  revisionRequired: boolean | null
  revisionRequirement: string
  score: string // điểm tổng kết / điểm TB Hội đồng (đã định dạng)
  date: Date
}

const ROLE_LABEL: Record<CouncilMemberRole, string> = {
  CHAIRPERSON: 'Chủ tịch HĐ',
  SECRETARY: 'Thư ký',
  COUNCIL_MEMBER: 'Ủy viên',
}

export function escapeHtml(value: string | null | undefined): string {
  return (value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Xuống dòng trong textarea → <br/>
function multiline(value: string): string {
  return escapeHtml(value).replace(/\n/g, '<br/>')
}

const ROLE_ORDER: Record<CouncilMemberRole, number> = {
  CHAIRPERSON: 0,
  SECRETARY: 1,
  COUNCIL_MEMBER: 2,
}

/** HTML thân biên bản 1 sinh viên (dùng cho In, tải Word và gộp biên bản cả Hội đồng). */
export function buildStudentMinutesHtml(d: MinutesDocumentData): string {
  const members = [...d.members].sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role])
  const chair = members.find((m) => m.role === 'CHAIRPERSON')
  const secretary = members.find((m) => m.role === 'SECRETARY')
  const logoSrc = new URL(logoDhtl, window.location.origin).href
  const cell = 'border: 1px solid black; padding: 4px 8px;'

  return `
  <div style="font-family: 'Times New Roman', Times, serif; color: #000; line-height: 1.4; font-size: 12pt;">
    <table style="width: 100%; border: none; margin-bottom: 8px;">
      <tr>
        <td style="width: 44%; border: none; text-align: center; vertical-align: top;">
          <img src="${logoSrc}" alt="Trường Đại học Thủy lợi" style="height: 68px; max-width: 135px;" />
        </td>
        <td style="width: 56%; border: none; text-align: center; vertical-align: top;">
          <div style="font-weight: bold; font-size: 11pt;">CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
          <div style="font-weight: bold; font-size: 11pt;">Độc lập - Tự do - Hạnh phúc</div>
          <div style="font-size: 10pt;">---------★---------</div>
        </td>
      </tr>
    </table>
    <h2 style="text-align: center; font-size: 15pt; font-weight: bold; margin: 12px 0 16px;">BIÊN BẢN BẢO VỆ ĐỒ ÁN TỐT NGHIỆP</h2>
    <div style="margin-bottom: 10px;">
      <div><b>Hôm nay, ngày</b> ${d.date.getDate()} <b>tháng</b> ${d.date.getMonth() + 1} <b>năm</b> ${d.date.getFullYear()}</div>
      <div><b>Địa điểm:</b> ${escapeHtml(d.location || '')}</div>
      <div><b>Hội đồng:</b> ${escapeHtml(d.councilName)}</div>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
      <thead>
        <tr>
          <th style="${cell} width: 45px;">STT</th>
          <th style="${cell} text-align: left;">Họ tên</th>
          <th style="${cell} text-align: left; width: 140px;">Nhiệm vụ</th>
        </tr>
      </thead>
      <tbody>
        ${members
          .map(
            (m, i) => `<tr>
              <td style="${cell} text-align: center;">${i + 1}</td>
              <td style="${cell}">${escapeHtml(m.fullName)}</td>
              <td style="${cell}">${ROLE_LABEL[m.role]}</td>
            </tr>`,
          )
          .join('')}
      </tbody>
    </table>
    <div style="margin-bottom: 10px;">
      <div><b>Họ tên sinh viên:</b> <b>${escapeHtml(d.studentName)}</b> (${escapeHtml(d.studentCode)}) &nbsp;&nbsp;&nbsp; <b>Lớp:</b> ${escapeHtml(d.className || '')}</div>
      <div><b>Đề tài đồ án tốt nghiệp:</b> ${escapeHtml(d.topicName || '')}</div>
      <div><b>Giảng viên hướng dẫn:</b> ${escapeHtml(d.supervisorName || '')}${d.supervisorEmail ? ` (${escapeHtml(d.supervisorEmail)})` : ''}</div>
      <div><b>Thứ tự bảo vệ:</b> ${d.slotOrder ?? ''} &nbsp;&nbsp;&nbsp; <b>Giờ bắt đầu:</b> ${escapeHtml(d.startTime)} &nbsp;&nbsp;&nbsp; <b>Giờ kết thúc:</b> ${escapeHtml(d.endTime)}</div>
    </div>
    <div style="margin-bottom: 8px;"><b>Nội dung bảo vệ đồ án:</b><br/>${multiline(d.presentationSummary)}</div>
    <div style="margin-bottom: 8px;"><b>Phần trả lời câu hỏi:</b><br/>${multiline(d.qaContent)}</div>
    <div style="margin-bottom: 8px;"><b>Kết luận của Hội đồng:</b><br/>${multiline(d.councilConclusion)}</div>
    <div style="margin-bottom: 8px;"><b>Yêu cầu chỉnh sửa, nộp lại báo cáo sau bảo vệ:</b> ${
      d.revisionRequired === null ? '' : d.revisionRequired ? 'Có' : 'Không'
    }${d.revisionRequired && d.revisionRequirement ? `<br/>${multiline(d.revisionRequirement)}` : ''}</div>
    <div style="margin-bottom: 14px;"><b>Điểm đánh giá:</b> ${escapeHtml(d.score)} <span style="color: #555;">(Thang điểm 10)</span></div>
    <table style="width: 100%; border: none; margin-top: 24px;">
      <tr>
        <td style="width: 50%; border: none; text-align: center; vertical-align: top;">
          <div style="font-weight: bold;">THƯ KÝ HỘI ĐỒNG</div>
          <div style="font-style: italic; font-size: 10.5pt; color: #555;">(Ký và ghi rõ họ tên)</div>
          <div style="height: 60px;"></div>
          <div style="font-weight: bold;">${escapeHtml(secretary?.fullName || '')}</div>
        </td>
        <td style="width: 50%; border: none; text-align: center; vertical-align: top;">
          <div style="font-weight: bold;">CHỦ TỊCH HỘI ĐỒNG</div>
          <div style="font-style: italic; font-size: 10.5pt; color: #555;">(Ký và ghi rõ họ tên)</div>
          <div style="height: 60px;"></div>
          <div style="font-weight: bold;">${escapeHtml(chair?.fullName || '')}</div>
        </td>
      </tr>
    </table>
  </div>`
}

function wrapDocument(bodyHtml: string, title: string): string {
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4 portrait; margin: 2cm 2cm 2cm 2.5cm; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 13pt; color: #000; }
    .page-break { page-break-after: always; }
  </style>
</head>
<body>${bodyHtml}</body>
</html>`
}

/** Tải biên bản về dạng Word (.doc) */
export function downloadWordDocument(filename: string, bodyHtml: string): void {
  const blob = new Blob(['﻿', wrapDocument(bodyHtml, filename)], {
    type: 'application/msword;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** Mở cửa sổ in (người dùng chọn "Lưu thành PDF" để xuất PDF) */
export function printHtmlDocument(title: string, bodyHtml: string): void {
  const win = window.open('', '_blank')
  if (!win) return
  win.document.open()
  win.document.write(wrapDocument(bodyHtml, title))
  win.document.close()
  win.focus()
  // Đợi ảnh logo tải xong rồi mới in
  win.onload = () => win.print()
}

/** "2026-12-10T07:30:00" → "07:30" */
export function timeOf(iso: string | null | undefined): string {
  if (!iso) return ''
  const time = iso.split('T')[1] ?? ''
  return time.slice(0, 5)
}
