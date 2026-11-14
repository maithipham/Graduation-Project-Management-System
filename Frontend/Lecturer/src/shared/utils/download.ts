import { apiClient } from '@/shared/api/client'
import { toast } from '@/shared/components/feedback/toast.store'

/** File tải về từ BE (ResponseEntity<byte[]>) */
export interface DownloadedFile {
  blob: Blob
  filename: string
}

/**
 * Lấy tên file từ header Content-Disposition, ví dụ
 * `attachment; filename="a.xlsx"` hoặc `attachment; filename*=UTF-8''Danh%20s%C3%A1ch.xlsx`.
 * Không có header (BE chưa expose qua CORS) → trả fallback.
 */
export function getFilenameFromDisposition(header: string | null | undefined, fallback: string): string {
  if (!header) return fallback
  const encoded = /filename\*\s*=\s*(?:UTF-8'')?([^;]+)/i.exec(header)?.[1]
  if (encoded) {
    try {
      return decodeURIComponent(encoded.trim().replace(/^"|"$/g, ''))
    } catch {
      // Tên mã hóa sai → thử filename thường bên dưới
    }
  }
  const plain = /filename\s*=\s*"?([^";]+)"?/i.exec(header)?.[1]
  return plain?.trim() || fallback
}

/** Cho trình duyệt lưu blob thành file (giống bấm link tải về) */
export function saveBlob({ blob, filename }: DownloadedFile): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/**
 * Tải file Excel mẫu (.xlsx) từ API với responseType: 'blob'
 * và xử lý đọc nội dung text từ blob để hiển thị toast lỗi nếu Backend trả về HTTP 4xx/5xx kèm JSON error.
 */
export async function downloadExcelTemplate(
  url: string,
  filename: string,
  fallbackUrl?: string,
): Promise<void> {
  try {
    let response: any
    try {
      response = await apiClient.get<Blob>(url, {
        responseType: 'blob',
      })
    } catch (err: any) {
      if (fallbackUrl && err?.response?.status === 404) {
        response = await apiClient.get<Blob>(fallbackUrl, {
          responseType: 'blob',
        })
      } else {
        throw err
      }
    }

    const data = response?.data
    // Nếu BE trả về JSON báo lỗi trong body 200 (hoặc qua interceptor parseJsonBlob)
    if (data && typeof data === 'object' && !(data instanceof Blob)) {
      const json = data as { message?: string }
      if (json.message) {
        toast.error(json.message)
        return
      }
    }

    if (data instanceof Blob) {
      if (data.type && data.type.includes('json')) {
        try {
          const text = await data.text()
          const json = JSON.parse(text)
          if (json.message) {
            toast.error(json.message)
            return
          }
        } catch {
          // not json
        }
      }

      const excelBlob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      saveBlob({ blob: excelBlob, filename })
      toast.success(`Đã tải xuống file mẫu ${filename}`)
    }
  } catch (err: unknown) {
    const error = err as { response?: { data?: unknown }; message?: string }
    if (error.response?.data) {
      const errData = error.response.data
      if (errData instanceof Blob) {
        try {
          const text = await errData.text()
          const json = JSON.parse(text)
          if (json.message) {
            toast.error(json.message)
            return
          }
        } catch {
          // ignore
        }
      } else if (typeof errData === 'object' && typeof (errData as { message?: unknown }).message === 'string') {
        toast.error((errData as { message: string }).message)
        return
      }
    }
    if (error?.message) {
      toast.error(error.message)
    }
  }
}

