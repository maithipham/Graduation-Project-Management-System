import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Download, FileText, Minus, Plus, Printer } from 'lucide-react'
import { useMyInfo } from '@/features/auth'
import { STUDENT_PROFILE_MOCK } from '@/shared/constants/studentProfile.mock'

export default function StudentOutlinePreviewPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { data: user } = useMyInfo()

  const fileName = searchParams.get('file') || 'De_cuong_DATN_v2.pdf'
  const [scale, setScale] = useState<number>(1.0)
  const [toastMsg, setToastMsg] = useState<string>('')

  useEffect(() => {
    document.title = `${fileName} - Xem trước`
  }, [fileName])

  const handleBack = () => {
    if (window.opener) {
      window.close()
    } else {
      navigate('/student/outline')
    }
  }

  const handleDownload = () => {
    setToastMsg(`Đang tải xuống tệp: ${fileName}`)
    window.setTimeout(() => setToastMsg(''), 2500)
  }

  const studentName = user?.name?.trim() || STUDENT_PROFILE_MOCK.name

  return (
    <div className="bg-slate-700 text-slate-800 min-h-screen flex flex-col">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg">
          {toastMsg}
        </div>
      )}

      {/* Document Viewer Header */}
      <header className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 shrink-0 sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft size={16} />
            <span>Quay lại</span>
          </button>
          <div className="h-4 w-px bg-slate-700 mx-1 shrink-0" />
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={16} className="text-rose-400 shrink-0" />
            <span className="text-sm font-semibold text-white tracking-wide truncate max-w-xs md:max-w-md">
              {fileName}
            </span>
          </div>
          <span className="hidden sm:inline-block rounded bg-emerald-500/20 text-emerald-300 text-[11px] px-2 py-0.5 font-medium border border-emerald-500/30 shrink-0">
            Đã xác thực
          </span>
        </div>

        {/* Viewer Tools */}
        <div className="flex items-center gap-2 text-xs shrink-0">
          <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={() => setScale((prev) => Math.max(0.6, +(prev - 0.1).toFixed(1)))}
              className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-slate-700 cursor-pointer"
              title="Thu nhỏ"
            >
              <Minus size={14} />
            </button>
            <span className="px-2 font-mono text-[11px] text-slate-300">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setScale((prev) => Math.min(1.6, +(prev + 0.1).toFixed(1)))}
              className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-slate-700 cursor-pointer"
              title="Phóng to"
            >
              <Plus size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
            title="In tài liệu"
          >
            <Printer size={14} />
            <span className="hidden md:inline">In</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1565C0] hover:bg-[#0D47A1] text-white font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <Download size={14} />
            <span>Tải về</span>
          </button>
        </div>
      </header>

      {/* PDF Preview Canvas */}
      <main className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center">
        <div
          style={{
            transform: `scale(${scale})`,
            width: '210mm',
            minHeight: '297mm',
            padding: '25mm 20mm',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          }}
          className="bg-white text-slate-900 transition-transform origin-top duration-150 mx-auto"
        >
          {/* Document Header */}
          <div className="text-center space-y-1 pb-6 border-b-2 border-slate-900">
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-600">
              BỘ NÔNG NGHIỆP VÀ PHÁT TRIỂN NÔNG THÔN
            </p>
            <p className="text-sm font-bold uppercase tracking-wider">TRƯỜNG ĐẠI HỌC THỦY LỢI</p>
            <p className="text-xs font-semibold text-slate-700">KHOA CÔNG NGHỆ THÔNG TIN</p>
            <div className="w-24 h-0.5 bg-slate-800 mx-auto my-2" />
            <h1 className="text-xl font-extrabold uppercase tracking-wide pt-4 text-[#1565C0]">
              ĐỀ CƯƠNG ĐỒ ÁN TỐT NGHIỆP
            </h1>
            <p className="text-xs text-slate-500 italic">Niên khóa 2022 - 2026</p>
          </div>

          {/* Document Metadata */}
          <div className="mt-8 space-y-3 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <span className="font-bold text-slate-700">Tên đề tài:</span>
              <span className="col-span-2 font-semibold text-slate-900">
                {STUDENT_PROFILE_MOCK.topic}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-bold text-slate-700">Sinh viên thực hiện:</span>
              <span className="col-span-2">
                {studentName} - MSSV: {STUDENT_PROFILE_MOCK.mssv} - Lớp:{' '}
                {STUDENT_PROFILE_MOCK.className}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-bold text-slate-700">Giảng viên hướng dẫn:</span>
              <span className="col-span-2 font-semibold text-[#1565C0]">
                {STUDENT_PROFILE_MOCK.mentor}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-bold text-slate-700">Chuyên ngành:</span>
              <span className="col-span-2">Kỹ thuật Phần mềm (Software Engineering)</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-bold text-slate-700">Thời gian thực hiện:</span>
              <span className="col-span-2">Từ 01/10/2026 đến 15/01/2027</span>
            </div>
          </div>

          {/* Outline Content Sections */}
          <div className="mt-8 space-y-6 text-xs leading-relaxed text-slate-800">
            <div>
              <h2 className="text-sm font-bold uppercase text-slate-900 border-b border-slate-200 pb-1 mb-2">
                1. Đặt vấn đề và tính cấp thiết
              </h2>
              <p className="text-justify text-slate-700">
                Hiện nay quy trình quản lý đồ án tốt nghiệp tại các khoa kỹ thuật đối mặt với nhiều
                khó khăn trong việc theo dõi tiến độ, lưu vết duyệt đề tài và phản hồi giữa sinh
                viên với giảng viên hướng dẫn. Hệ thống GPMS được nghiên cứu xây dựng nhằm giải
                quyết bài toán tự động hóa quy trình phân công, nộp đề cương, phản biện và chấm điểm
                bảo vệ trực tuyến, nâng cao tính minh bạch và chất lượng quản lý đào tạo.
              </p>
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase text-slate-900 border-b border-slate-200 pb-1 mb-2">
                2. Mục tiêu nghiên cứu và phạm vi
              </h2>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                <li>
                  Nghiên cứu quy trình nghiệp vụ xét duyệt đề tài, báo cáo tuần và hội đồng bảo vệ
                  tại Trường Đại học Thủy Lợi.
                </li>
                <li>
                  Xây dựng giải pháp kiến trúc phần mềm hướng dịch vụ (RESTful API) và giao diện
                  trực quan thân thiện trên nền tảng Web hiện đại.
                </li>
                <li>
                  Tích hợp luồng xét duyệt đa cấp: Sinh viên → Giảng viên hướng dẫn → Bộ môn / Khoa
                  phê duyệt.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase text-slate-900 border-b border-slate-200 pb-1 mb-2">
                3. Phương pháp nghiên cứu và công nghệ áp dụng
              </h2>
              <p className="text-justify text-slate-700 mb-2">
                Hệ thống áp dụng mô hình Scrum/Agile với chu kỳ phát triển 2 tuần/sprint. Công nghệ
                sử dụng bao gồm:
              </p>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded border border-slate-200 font-mono text-[11px]">
                <div>• Frontend: Single Page Application / Tailwind CSS</div>
                <div>• Backend: Spring Boot / RESTful API</div>
                <div>• CSDL: PostgreSQL / Redis Cache</div>
                <div>• Xác thực: OAuth2, JWT Bearer Token</div>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase text-slate-900 border-b border-slate-200 pb-1 mb-2">
                4. Kế hoạch và tiến độ thực hiện
              </h2>
              <div className="overflow-x-auto border border-slate-200 rounded">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 font-bold border-b border-slate-200 text-slate-700">
                    <tr>
                      <th className="p-2">Tuần</th>
                      <th className="p-2">Nội dung công việc</th>
                      <th className="p-2">Sản phẩm đầu ra</th>
                      <th className="p-2">Dự kiến</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2 font-semibold">Tuần 1 - 2</td>
                      <td className="p-2">Khảo sát yêu cầu, hoàn thiện đề cương chi tiết</td>
                      <td className="p-2">Tài liệu đề cương, SRS</td>
                      <td className="p-2 text-emerald-700 font-semibold">Hoàn thành</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold">Tuần 3 - 6</td>
                      <td className="p-2">Thiết kế kiến trúc hệ thống và cơ sở dữ liệu</td>
                      <td className="p-2">Sơ đồ ERD, Architecture Doc</td>
                      <td className="p-2 text-blue-700">Đang thực hiện</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold">Tuần 7 - 12</td>
                      <td className="p-2">Xây dựng module Đăng ký GVHD, Đề cương, Báo cáo</td>
                      <td className="p-2">Mã nguồn module hoàn chỉnh</td>
                      <td className="p-2 text-slate-500">Chưa bắt đầu</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold">Tuần 13 - 15</td>
                      <td className="p-2">Kiểm thử tích hợp, hoàn thiện báo cáo tốt nghiệp</td>
                      <td className="p-2">Báo cáo cuối cùng, Slide bảo vệ</td>
                      <td className="p-2 text-slate-500">Chưa bắt đầu</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signatures */}
            <div className="pt-8 flex justify-between text-center">
              <div>
                <p className="font-bold text-slate-800">GIẢNG VIÊN HƯỚNG DẪN</p>
                <p className="text-[11px] text-slate-400 italic mb-12">(Ký và ghi rõ họ tên)</p>
                <p className="font-semibold text-slate-900">{STUDENT_PROFILE_MOCK.mentor}</p>
              </div>
              <div>
                <p className="font-bold text-slate-800">SINH VIÊN THỰC HIỆN</p>
                <p className="text-[11px] text-slate-400 italic mb-12">(Ký và ghi rõ họ tên)</p>
                <p className="font-semibold text-slate-900">{studentName}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
