# Mẫu: service gọi API

Vị trí trong feature: `services/registration.service.ts`

Ví dụ dùng feature `student/supervisor_registration` (đăng ký GVHD). Khi làm feature khác: đổi tên, giữ cấu trúc.

```ts
import { apiClient, API_ENDPOINTS } from '@/shared/api'
import type { ApiResponse, SpringPage } from '@/shared/types'
import type {
  Supervisor,
  SupervisorListParams,
  SupervisorRegistration,
  SupervisorRegistrationRequest,
} from '../types/registration.types'

const SUPERVISORS_URL = API_ENDPOINTS.student.lecturers
const REGISTRATION_URL = API_ENDPOINTS.student.registration

// Giống một @Service: chỉ gọi API và bóc wrapper ApiResponse, không xử lý giao diện
export const registrationService = {
  // GET /student/lecturers?page=0&size=10&sort=fullName,asc&keyword=...
  async getSupervisorPage(params: SupervisorListParams): Promise<SpringPage<Supervisor>> {
    const res = await apiClient.get<ApiResponse<SpringPage<Supervisor>>>(SUPERVISORS_URL, {
      params,
      // sort dạng mảng → ?sort=a,asc&sort=b,desc (đúng kiểu Spring Pageable), không phải sort[]=...
      paramsSerializer: { indexes: null },
    })
    return res.data.data
  },

  async getSupervisorById(id: number): Promise<Supervisor> {
    const res = await apiClient.get<ApiResponse<Supervisor>>(`${SUPERVISORS_URL}/${id}`)
    return res.data.data
  },

  // Đăng ký của chính sinh viên: BE lấy sinh viên từ JWT, FE không gửi studentId. Chưa đăng ký → data = null
  async getMyRegistration(): Promise<SupervisorRegistration | null> {
    const res = await apiClient.get<ApiResponse<SupervisorRegistration | null>>(REGISTRATION_URL)
    return res.data.data
  },

  // Gọi từ form: form tự hiện lỗi dưới ô input nên tắt toast lỗi tự động
  async register(body: SupervisorRegistrationRequest): Promise<SupervisorRegistration> {
    const res = await apiClient.post<ApiResponse<SupervisorRegistration>>(REGISTRATION_URL, body, {
      skipErrorToast: true,
    })
    return res.data.data
  },

  async update(id: number, body: SupervisorRegistrationRequest): Promise<SupervisorRegistration> {
    const res = await apiClient.put<ApiResponse<SupervisorRegistration>>(
      `${REGISTRATION_URL}/${id}`,
      body,
      { skipErrorToast: true },
    )
    return res.data.data
  },

  async cancel(id: number): Promise<void> {
    await apiClient.delete(`${REGISTRATION_URL}/${id}`)
  },
}
```
