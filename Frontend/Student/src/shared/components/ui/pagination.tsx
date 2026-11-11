import type { SpringPage } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { getPageItems } from "@/shared/utils/pagination";
import { Select } from "./select";

// Theo đặc tả trang Quản lý sinh viên: nút cao 32px, bo 8px, chữ 12–12.5px
const NAV_BUTTON_CLASS =
  "inline-flex h-8 cursor-pointer items-center rounded-lg border border-slate-200 bg-white px-2.5 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40";
const PAGE_BUTTON_CLASS =
  "inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-lg px-2 text-[12.5px] transition disabled:pointer-events-none disabled:opacity-60";

interface TablePaginationProps {
  data: SpringPage<unknown>;
  /** Đang chờ trang mới → khóa nút để không bấm dồn */
  disabled: boolean;
  onPageChange: (page: number) => void;
  /** Đơn vị đếm ở dòng "Hiển thị 1–10 trên 25 ...", ví dụ "sinh viên", "giáo viên" */
  itemLabel: string;
  /** Truyền cả 2 thì hiện ô chọn số dòng mỗi trang */
  pageSizeOptions?: readonly number[];
  onPageSizeChange?: (size: number) => void;
}

/** Thanh phân trang dưới bảng cho `SpringPage` (trang 0-based, hiển thị cho người dùng thì +1) */
export function TablePagination({
  data,
  disabled,
  onPageChange,
  itemLabel,
  pageSizeOptions,
  onPageSizeChange,
}: TablePaginationProps) {
  // Trang rỗng → "Hiển thị 0–0 trên 0 ..." thay vì "1–0"
  const from = data.empty ? 0 : data.number * data.size + 1;
  const to = data.number * data.size + data.numberOfElements;

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-[13px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
      <span>
        Hiển thị{" "}
        <span className="font-semibold text-slate-900">
          {from}–{to}
        </span>{" "}
        trên{" "}
        <span className="font-semibold text-slate-900">
          {data.totalElements}
        </span>{" "}
        {itemLabel}
      </span>

      <div className="flex flex-wrap items-center gap-3">
        {pageSizeOptions && onPageSizeChange && (
          <Select
            value={data.size}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            disabled={disabled}
            aria-label="Số dòng mỗi trang"
            className="h-8 rounded-lg border-slate-300 pl-2 pr-7 text-[12.5px] font-medium text-slate-700"
            containerClassName="w-auto"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}/trang
              </option>
            ))}
          </Select>
        )}

        {data.totalPages > 1 && (
          <nav className="flex items-center gap-1" aria-label="Phân trang">
            <button
              type="button"
              className={NAV_BUTTON_CLASS}
              disabled={data.first || disabled}
              onClick={() => onPageChange(data.number - 1)}
              aria-label="Trang trước"
            >
              Trước
            </button>
            {getPageItems(data.number, data.totalPages).map((item, index) =>
              item === "ellipsis" ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-1.5 text-slate-400"
                >
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  className={cn(
                    PAGE_BUTTON_CLASS,
                    item === data.number
                      ? "bg-[#1565C0] font-bold text-white"
                      : "border border-slate-200 bg-white font-semibold text-slate-600 hover:bg-slate-50",
                  )}
                  disabled={disabled}
                  onClick={() => onPageChange(item)}
                  aria-current={item === data.number ? "page" : undefined}
                >
                  {item + 1}
                </button>
              ),
            )}
            <button
              type="button"
              className={NAV_BUTTON_CLASS}
              disabled={data.last || disabled}
              onClick={() => onPageChange(data.number + 1)}
              aria-label="Trang sau"
            >
              Sau
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
