# Mẫu: type từ DTO Java

Vị trí trong feature: `types/semester.types.ts`

Ví dụ dùng feature `admin/semester_management` (học kỳ). Khi làm feature khác: đổi tên, giữ cấu trúc.

```ts
import type { PageParams } from '@/shared/types'

// Ánh xạ từ enum SemesterStatus.java
export type SemesterStatus = 'UPCOMING' | 'ACTIVE' | 'CLOSED'

// Ánh xạ từ SemesterResponse.java (dữ liệu BE trả về)
export interface Semester {
  id: number // Long
  code: string
  name: string
  startDate: string // LocalDate → "2026-09-01"
  endDate: string
  status: SemesterStatus
  createdAt: string // LocalDateTime → "2026-09-01T08:30:00"
}

// Ánh xạ từ SemesterRequest.java (body gửi lên khi tạo/sửa)
export interface SemesterRequest {
  code: string
  name: string
  startDate: string
  endDate: string
}

// Tham số gửi lên @RequestParam + Pageable của Controller
export interface SemesterListParams extends PageParams {
  keyword?: string
  status?: SemesterStatus
}
```
