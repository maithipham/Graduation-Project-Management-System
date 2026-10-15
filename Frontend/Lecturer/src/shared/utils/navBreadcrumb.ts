/** Hình dạng tối thiểu của một mục menu sidebar (khớp với các file *Nav.config.ts) */
export interface BreadcrumbNavItem {
  to: string
  label: string
  /** true: chỉ khớp đúng URL này (dùng cho trang gốc như Dashboard) */
  end?: boolean
  children?: BreadcrumbNavItem[]
}

function normalize(path: string) {
  return path.length > 1 ? path.replace(/\/+$/, '') : path
}

// Khớp khi URL bằng `to` hoặc là trang con của `to` (theo từng đoạn '/', tránh '/a' khớp nhầm '/ab')
function matches(pathname: string, to: string, end?: boolean) {
  return pathname === to || (!end && pathname.startsWith(`${to}/`))
}

/**
 * Tìm tiêu đề breadcrumb cho URL hiện tại dựa vào cấu hình menu sidebar.
 * Trả về danh sách nhãn từ mục cha đến trang hiện tại, ví dụ ['Quản lý giáo viên', 'Giảng viên'].
 * Ưu tiên mục khớp cụ thể nhất (đường dẫn dài nhất). Không khớp mục nào → [].
 */
export function getNavBreadcrumbs(items: BreadcrumbNavItem[], pathname: string): string[] {
  const path = normalize(pathname)

  // Gom mọi mục (cha và con) kèm chuỗi nhãn của nó, rồi chọn mục khớp có đường dẫn dài nhất
  const candidates = items.flatMap((item) => [
    { item, labels: [item.label] },
    ...(item.children ?? []).map((child) => ({ item: child, labels: [item.label, child.label] })),
  ])

  let best: { labels: string[]; length: number } | undefined
  for (const { item, labels } of candidates) {
    if (matches(path, item.to, item.end) && (!best || item.to.length > best.length)) {
      best = { labels, length: item.to.length }
    }
  }

  return best?.labels ?? []
}
