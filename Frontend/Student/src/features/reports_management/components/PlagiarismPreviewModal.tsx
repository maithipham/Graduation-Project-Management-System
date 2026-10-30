import React, { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle,
  Download,
  FileText,
  Printer,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'

interface PlagiarismPreviewModalProps {
  open: boolean
  fileName: string
  rate: number
  studentName: string
  studentMssv: string
  topicTitle: string
  onClose: () => void
  onDownloadToast: (fileName: string) => void
}

export const PlagiarismPreviewModal: React.FC<PlagiarismPreviewModalProps> = ({
  open,
  fileName,
  rate,
  studentName,
  studentMssv,
  topicTitle,
  onClose,
  onDownloadToast,
}) => {
  const [zoom, setZoom] = useState<number>(1.0)

  const [prevOpen, setPrevOpen] = useState(open)
  if (prevOpen !== open) {
    setPrevOpen(open)
    if (open) setZoom(1.0)
  }

  if (!open) return null

  const isPassing = rate <= 35

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col">
      {/* Header Preview Modal */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between text-white shrink-0 shadow-lg select-none">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
            <FileText size={16} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate text-slate-100 flex items-center gap-2 flex-wrap">
              <span className="truncate">{fileName}</span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                  isPassing
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}
              >
                Kết quả trùng lặp: {rate}% ({isPassing ? 'Hợp lệ' : 'Vượt ngưỡng'})
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Kiểm tra lúc: 07/10/2026 15:10 • Hệ thống chống đạo văn TLU Capstone
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.7, +(z - 0.1).toFixed(1)))}
              className="p-1.5 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
              title="Thu nhỏ"
            >
              <ZoomOut size={16} />
            </button>
            <span className="px-2 text-xs font-mono text-slate-300">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(1)))}
              className="p-1.5 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
              title="Phóng to"
            >
              <ZoomIn size={16} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => onDownloadToast(fileName)}
            className="p-2 hover:bg-slate-800 text-slate-300 rounded-lg transition cursor-pointer"
            title="Tải xuống"
          >
            <Download size={16} />
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 hover:bg-slate-800 text-slate-300 rounded-lg transition cursor-pointer"
            title="In"
          >
            <Printer size={16} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 rounded-lg transition cursor-pointer ml-1"
            title="Đóng"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Document Body Area */}
      <div className="flex-1 overflow-auto bg-slate-900/90 p-4 sm:p-8 flex justify-center items-start">
        <div
          style={{ transform: `scale(${zoom})` }}
          className="bg-white text-slate-900 rounded-xl shadow-2xl p-8 sm:p-12 w-full max-w-3xl transition-transform duration-150 origin-top space-y-6 font-serif"
        >
          <div className="text-center border-b border-slate-200 pb-6 font-sans">
            <div className="text-xs uppercase tracking-widest font-bold text-slate-500">
              TRƯỜNG ĐẠI HỌC THỦY LỢI — KHOA CÔNG NGHỆ THÔNG TIN
            </div>
            <div className="text-xs uppercase tracking-wider text-slate-500 mt-1">
              HỆ THỐNG KIỂM TRA TRÙNG LẶP ĐỒ ÁN TỐT NGHIỆP
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 mt-4 uppercase">
              KẾT QUẢ KIỂM TRA TRÙNG LẶP TỰ ĐỘNG
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Mã phiên kiểm tra: #PLAG-2026-{studentMssv}
            </p>
          </div>

          {/* Thông tin tệp & Tỷ lệ trùng */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 font-sans grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500">Tên tệp kiểm tra:</span>
              <div className="font-bold text-slate-800 mt-0.5">{fileName}</div>
            </div>
            <div>
              <span className="text-slate-500">Thời gian hoàn thành:</span>
              <div className="font-bold text-slate-800 mt-0.5">07/10/2026 15:10:24 (GMT+07)</div>
            </div>
            <div>
              <span className="text-slate-500">Sinh viên thực hiện:</span>
              <div className="font-bold text-slate-800 mt-0.5">
                {studentName} (MSSV: {studentMssv})
              </div>
            </div>
            <div>
              <span className="text-slate-500">Kết luận kiểm tra:</span>
              <div
                className={`font-extrabold ${
                  isPassing ? 'text-emerald-600' : 'text-rose-600'
                } mt-0.5 flex items-center gap-1.5`}
              >
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full ${
                    isPassing ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
                Tỷ lệ trùng: {rate}% (
                {isPassing
                  ? 'Đạt tiêu chuẩn ≤ 35% — Đã duyệt'
                  : 'Vượt ngưỡng cho phép > 35% — Không đạt'}
                )
              </div>
            </div>
          </div>

          {/* Chi tiết nội dung báo cáo trích lục */}
          <div className="space-y-4 text-sm leading-relaxed text-slate-800">
            <h3 className="font-sans font-bold text-base text-slate-900 border-b border-slate-100 pb-2">
              1. Tổng quan đề tài
            </h3>
            <p className="text-justify indent-8">
              Đề tài <strong>&quot;{topicTitle}&quot;</strong> được thực hiện nhằm tối ưu hóa quy
              trình quản lý, phân công giảng viên hướng dẫn và theo dõi tiến độ đồ án của sinh viên
              thuộc Trường Đại học Thủy Lợi. Hệ thống được triển khai bằng kiến trúc hiện đại, hỗ
              trợ nhiều vai trò bao gồm Sinh viên, Giảng viên hướng dẫn, Trưởng bộ môn và Quản trị
              viên.
            </p>

            <h3 className="font-sans font-bold text-base text-slate-900 border-b border-slate-100 pb-2 mt-6">
              2. Chi tiết nguồn trùng lặp đối sánh
            </h3>
            <div className="overflow-x-auto font-sans text-xs">
              <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">STT</th>
                    <th className="p-2.5">Nguồn tài liệu đối sánh</th>
                    <th className="p-2.5">Tỷ lệ tương đồng</th>
                    <th className="p-2.5">Phân loại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  <tr>
                    <td className="p-2.5 font-medium">1</td>
                    <td className="p-2.5 text-blue-700">
                      Tài liệu quy chuẩn đồ án TLU (Ký túc xá &amp; Đào tạo)
                    </td>
                    <td className="p-2.5 font-bold text-slate-800">7.2%</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10.5px]">
                        Mẫu quy định
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">2</td>
                    <td className="p-2.5 text-blue-700">
                      Khóa luận tốt nghiệp K60: Kiến trúc Web microservices
                    </td>
                    <td className="p-2.5 font-bold text-slate-800">3.1%</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10.5px]">
                        Tài liệu tham khảo
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">3</td>
                    <td className="p-2.5 text-blue-700">
                      Các nguồn mở và thư viện mã nguồn GitHub/NPM
                    </td>
                    <td className="p-2.5 font-bold text-slate-800">1.7%</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10.5px]">
                        Thư viện kỹ thuật
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {isPassing ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-sans text-xs mt-6 flex items-start gap-2.5">
                <CheckCircle size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">
                    Đánh giá chung: Báo cáo đạt chuẩn nộp đồ án tốt nghiệp
                  </p>
                  <p className="mt-0.5 text-emerald-700">
                    Báo cáo đáp ứng hoàn toàn quy định về liêm chính học thuật của Nhà trường (tỷ lệ
                    trùng hợp lệ ≤ 35%).
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-sans text-xs mt-6 flex items-start gap-2.5">
                <AlertTriangle size={20} className="text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Cảnh báo: Tỷ lệ trùng lặp vượt ngưỡng cho phép</p>
                  <p className="mt-0.5 text-rose-700">
                    Tỷ lệ trùng lặp {rate}% vượt ngưỡng quy định (≤ 35%). Sinh viên cần chỉnh sửa,
                    diễn đạt lại và bổ sung trích dẫn hợp lệ trước khi nộp lại.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-8 border-t border-slate-200 flex justify-between font-sans text-xs text-slate-500">
            <div>
              TLU Capstone Plagiarism Checker v2.4
              <br />
              Mã xác thực: <strong>SHA256:7f83b1c8...321</strong>
            </div>
            <div className="text-right">
              Trang <strong>1 / 3</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

