# Mẫu: service gọi API

Vị trí trong feature: `services/semester.service.ts`

Ví dụ dùng feature `admin/semester_management` (học kỳ). Khi làm feature khác: đổi tên, giữ cấu trúc.

```ts
import { apiClient, API_ENDPOINTS } from '@/shared/api'
import type { ApiResponse, SpringPage } from '@/shared/types'
import { toSpringPage, type RawSpringPage } from '@/shared/utils'
import type { Semester, SemesterListParams, SemesterRequest } from '../types/semester.types'

const BASE_URL = API_ENDPOINTS.admin.semesters

// Giống một @Service: chỉ gọi API và bóc wrapper ApiResponse, không xử lý giao diện
export const semesterService = {
  // GET /admin/semesters?page=0&size=10&sort=createdAt,desc&keyword=...
  async getPage(params: SemesterListParams): Promise<SpringPage<Semester>> {
    const res = await apiClient.get<ApiResponse<RawSpringPage<Semester>>>(BASE_URL, {
      params,
      // sort dạng mảng → ?sort=a,asc&sort=b,desc (đúng kiểu Spring Pageable), không phải sort[]=...
      paramsSerializer: { indexes: null },
    })
    // BE có thể trả Page phẳng hoặc PagedModel ({ content, page: {...} }) → đưa về một dạng
    return toSpringPage(res.data.data, params)
  },

  async getById(id: number): Promise<Semester> {
    const res = await apiClient.get<ApiResponse<Semester>>(`${BASE_URL}/${id}`)
    return res.data.data
  },

  // Gọi từ form: form tự hiện lỗi dưới ô input nên tắt toast lỗi tự động
  async create(body: SemesterRequest): Promise<Semester> {
    const res = await apiClient.post<ApiResponse<Semester>>(BASE_URL, body, { skipErrorToast: true })
    return res.data.data
  },

  async update(id: number, body: SemesterRequest): Promise<Semester> {
    const res = await apiClient.put<ApiResponse<Semester>>(`${BASE_URL}/${id}`, body, {
      skipErrorToast: true,
    })
    return res.data.data
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`${BASE_URL}/${id}`)
  },
}
```
