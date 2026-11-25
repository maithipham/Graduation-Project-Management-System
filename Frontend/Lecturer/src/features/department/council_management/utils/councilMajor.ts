interface MajorRef {
  publicId: string
}

interface ResolveCouncilMajorParams {
  /** undefined = chưa tải xong (hoặc lỗi); null = đã tải, tài khoản không phụ trách ngành nào */
  managedMajor: MajorRef | null | undefined
  majors: MajorRef[] | undefined
  /** Ngành người dùng tự chọn ở dropdown */
  pickedMajorId: string
  isAdmin: boolean
}

/**
 * Ngành dùng để gọi API hội đồng. Trả '' khi chưa xác định được → các query bị tắt (enabled = false).
 * Trưởng bộ môn: luôn là ngành phụ trách; chỉ ADMIN mới được chọn / mặc định ngành đầu danh sách,
 * vì BE trả 403 (3018) với ngành ngoài phạm vi.
 */
export function resolveCouncilMajorId({
  managedMajor,
  majors,
  pickedMajorId,
  isAdmin,
}: ResolveCouncilMajorParams): string {
  if (managedMajor === undefined) return ''
  if (managedMajor) return managedMajor.publicId
  if (!isAdmin) return ''
  return pickedMajorId || majors?.[0]?.publicId || ''
}
