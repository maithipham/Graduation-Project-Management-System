/**
 * Dạng JSON của Spring Data `Page<T>` khi backend trả về trong `ApiResponse.data`.
 * Lưu ý: `number` là chỉ số trang, BẮT ĐẦU TỪ 0.
 */
export interface SpringPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number // trang hiện tại (0-based)
  size: number // số phần tử mỗi trang
  numberOfElements: number // số phần tử thực có ở trang này
  first: boolean
  last: boolean
  empty: boolean
}

/**
 * Tham số phân trang gửi lên backend, tương ứng `Pageable` của Spring
 * (?page=0&size=10&sort=createdAt,desc).
 */
export interface PageParams {
  page: number // 0-based
  size: number
  sort?: string | string[] // dạng "field,asc" hoặc "field,desc"
}
