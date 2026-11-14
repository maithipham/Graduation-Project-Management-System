/** Chữ cái đại diện cho avatar: "Trần Minh Khôi" → "TK", "Khôi" → "K", rỗng → "?" */
export function getInitials(name: string | null | undefined): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  const first = words[0].charAt(0)
  const last = words.length > 1 ? words[words.length - 1].charAt(0) : ''
  return (first + last).toLocaleUpperCase('vi-VN')
}
