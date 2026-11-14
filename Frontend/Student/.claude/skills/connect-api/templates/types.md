# Mẫu: type từ DTO Java

Vị trí trong feature: `types/registration.types.ts`

Ví dụ dùng feature `student/supervisor_registration` (đăng ký GVHD). Khi làm feature khác: đổi tên, giữ cấu trúc.

```ts
import type { PageParams } from '@/shared/types'

// Ánh xạ từ enum RegistrationStatus.java
export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

// Ánh xạ từ SupervisorResponse.java (GVHD sinh viên có thể đăng ký)
export interface Supervisor {
  id: number // Long
  code: string
  fullName: string
  email: string
  department: string | null
  quota: number // tổng chỉ tiêu nhận sinh viên
  acceptedCount: number // số sinh viên đã nhận
}

// Ánh xạ từ SupervisorSummary.java (DTO lồng bên trong RegistrationResponse)
export interface SupervisorSummary {
  id: number
  fullName: string
}

// Ánh xạ từ RegistrationResponse.java (đăng ký GVHD của chính sinh viên đang đăng nhập)
export interface SupervisorRegistration {
  id: number
  supervisor: SupervisorSummary
  topicTitle: string
  note: string | null
  status: RegistrationStatus
  rejectReason: string | null
  createdAt: string // LocalDateTime → "2026-09-01T08:30:00"
}

// Ánh xạ từ RegistrationRequest.java (body gửi lên khi đăng ký / sửa đăng ký)
// Không có studentId: BE lấy sinh viên đang đăng nhập từ JWT
export interface SupervisorRegistrationRequest {
  supervisorId: number
  topicTitle: string
  note: string | null
}

// Tham số gửi lên @RequestParam + Pageable của Controller
export interface SupervisorListParams extends PageParams {
  keyword?: string
}
```
