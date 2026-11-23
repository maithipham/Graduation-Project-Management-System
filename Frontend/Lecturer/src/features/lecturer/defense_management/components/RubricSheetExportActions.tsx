import React, { useState } from 'react'
import { Download, FileCheck2 } from 'lucide-react'
import { Button } from '@/shared/components/ui'
import { saveBlob, type DownloadedFile } from '@/shared/utils/download'

interface RubricSheetExportActionsProps {
  // Gọi API export (.docx) sinh từ dữ liệu hiện tại của phiếu
  download: () => Promise<DownloadedFile>
  // File BE đã lưu lúc nộp phiếu chính thức (null khi chưa nộp)
  savedFileUrl?: string | null
  savedFileName?: string | null
  className?: string
}

/**
 * Nút "Xuất phiếu chấm" (phiếu tóm tắt Rubric .docx) + link mở bản đã lưu khi nộp phiếu.
 * Dùng chung cho form chấm của GVPB và thành viên Hội đồng; luôn hiển thị kể cả khi phiếu đã khóa.
 */
export const RubricSheetExportActions: React.FC<RubricSheetExportActionsProps> = ({
  download,
  savedFileUrl,
  savedFileName,
  className,
}) => {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      saveBlob(await download())
    } catch {
      // Interceptor đã hiện toast lỗi từ BE
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ''}`}>
      <Button type="button" variant="outline" size="sm" disabled={downloading} onClick={handleDownload}>
        <Download className="w-3.5 h-3.5 mr-1.5" />
        {downloading ? 'Đang xuất...' : 'Xuất phiếu chấm (.docx)'}
      </Button>
      {savedFileUrl && (
        <a
          href={savedFileUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={savedFileName ?? undefined}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          Bản đã lưu khi nộp
        </a>
      )}
    </div>
  )
}
