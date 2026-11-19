/**
 * Tiện ích xử lý ngày giờ ISO không có múi giờ (LocalDateTime)
 * Tuyệt đối không dùng toISOString() để tránh lệch múi giờ UTC so với giờ địa phương.
 */

export function parseIsoParts(isoString?: string | null): {
  date: string // YYYY-MM-DD
  time: string // HH:mm
  hours: number
  minutes: number
} | null {
  if (!isoString) return null
  const clean = isoString.trim()
  const [datePart, timePart] = clean.split('T')
  if (!datePart) return null
  const [hh = '00', mm = '00'] = (timePart || '').split(':')
  const hours = parseInt(hh, 10) || 0
  const minutes = parseInt(mm, 10) || 0
  return {
    date: datePart,
    time: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
    hours,
    minutes,
  }
}

export function combineDateAndTime(dateStr: string, timeStr: string): string {
  const cleanDate = dateStr.trim()
  const cleanTime = timeStr.trim().replace('h', ':')
  const [hh = '00', mm = '00'] = cleanTime.split(':')
  const h = String(parseInt(hh, 10) || 0).padStart(2, '0')
  const m = String(parseInt(mm, 10) || 0).padStart(2, '0')
  return `${cleanDate}T${h}:${m}:00`
}

export function addMinutesToDateTime(
  dateStr: string,
  timeStr: string,
  minutesToAdd: number,
): { dateStr: string; timeStr: string; iso: string } {
  const cleanDate = dateStr.trim()
  const [y, mon, d] = cleanDate.split('-').map(Number)
  const cleanTime = timeStr.trim().replace('h', ':')
  const [h, min] = cleanTime.split(':').map(Number)

  const dateObj = new Date(y, mon - 1, d, h || 0, (min || 0) + minutesToAdd, 0)
  const resYear = dateObj.getFullYear()
  const resMonth = String(dateObj.getMonth() + 1).padStart(2, '0')
  const resDay = String(dateObj.getDate()).padStart(2, '0')
  const resHours = String(dateObj.getHours()).padStart(2, '0')
  const resMins = String(dateObj.getMinutes()).padStart(2, '0')

  const newDateStr = `${resYear}-${resMonth}-${resDay}`
  const newTimeStr = `${resHours}:${resMins}`
  return {
    dateStr: newDateStr,
    timeStr: newTimeStr,
    iso: `${newDateStr}T${newTimeStr}:00`,
  }
}

export function formatDayOfWeekDate(dateStr?: string | null): string {
  if (!dateStr) return ''
  const clean = dateStr.includes('T') ? dateStr.substring(0, 10) : dateStr
  const [year, month, day] = clean.split('-').map(Number)
  if (!year || !month || !day) return dateStr
  const d = new Date(year, month - 1, day)
  const days = [
    'Chủ Nhật',
    'Thứ Hai',
    'Thứ Ba',
    'Thứ Tư',
    'Thứ Năm',
    'Thứ Sáu',
    'Thứ Bảy',
  ]
  const dayName = days[d.getDay()]
  const dayPad = String(day).padStart(2, '0')
  const monPad = String(month).padStart(2, '0')
  return `${dayName}, ${dayPad}/${monPad}/${year}`
}

export function formatDateSlash(dateStr?: string | null): string {
  if (!dateStr) return ''
  const clean = dateStr.includes('T') ? dateStr.substring(0, 10) : dateStr
  const [year, month, day] = clean.split('-').map(Number)
  if (!year || !month || !day) return dateStr
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
}

export function formatTimeSlot(timeStr?: string | null): string {
  if (!timeStr) return ''
  return timeStr.replace(':', 'h')
}
