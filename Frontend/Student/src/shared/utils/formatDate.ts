export function parseDate(dateInput: unknown): Date | null {
  if (!dateInput) return null
  if (dateInput instanceof Date) {
    return Number.isNaN(dateInput.getTime()) ? null : dateInput
  }

  if (Array.isArray(dateInput)) {
    const [year, month = 1, day = 1, hour = 0, minute = 0, second = 0] = dateInput
    const d = new Date(year, month - 1, day, hour, minute, second)
    return Number.isNaN(d.getTime()) ? null : d
  }

  if (typeof dateInput === 'number') {
    const d = new Date(dateInput)
    return Number.isNaN(d.getTime()) ? null : d
  }

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim()
    if (!trimmed) return null

    // Match dd-MM-yyyy or dd/MM/yyyy with optional time
    const dmyMatch = trimmed.match(
      /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/,
    )
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10)
      const month = parseInt(dmyMatch[2], 10) - 1
      const year = parseInt(dmyMatch[3], 10)
      const hour = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 0
      const minute = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0
      const second = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0
      const d = new Date(year, month, day, hour, minute, second)
      return Number.isNaN(d.getTime()) ? null : d
    }

    // Match yyyy-MM-dd or yyyy/MM/dd with optional time
    const ymdMatch = trimmed.match(
      /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/,
    )
    if (ymdMatch) {
      const year = parseInt(ymdMatch[1], 10)
      const month = parseInt(ymdMatch[2], 10) - 1
      const day = parseInt(ymdMatch[3], 10)
      const hour = ymdMatch[4] ? parseInt(ymdMatch[4], 10) : 0
      const minute = ymdMatch[5] ? parseInt(ymdMatch[5], 10) : 0
      const second = ymdMatch[6] ? parseInt(ymdMatch[6], 10) : 0
      const d = new Date(year, month, day, hour, minute, second)
      return Number.isNaN(d.getTime()) ? null : d
    }

    const d = new Date(trimmed)
    return Number.isNaN(d.getTime()) ? null : d
  }

  return null
}

export function formatDate(
  dateInput: string | number | Date | unknown,
  formatStyle: 'short' | 'full' | 'time' = 'short',
): string {
  if (!dateInput) return ''
  const date = parseDate(dateInput)
  if (!date) {
    return typeof dateInput === 'string' ? dateInput.trim() : ''
  }

  if (formatStyle === 'full') {
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  if (formatStyle === 'time') {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Chuyển đổi ngày sang định dạng `YYYY-MM-DD` cho HTML `<input type="date">`
 */
export function formatDateForInput(dateInput: unknown): string {
  const d = parseDate(dateInput)
  if (!d) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

