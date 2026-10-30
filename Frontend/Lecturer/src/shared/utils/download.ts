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
