/** Bỏ các tham số rỗng để URL gọn: không gửi `keyword=` hay `majorId=` */
export function compactParams<T extends object>(params: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  ) as Partial<T>
}
