import { useState, type ReactNode } from "react";
import { Download, FileSpreadsheet, Filter, Users } from "lucide-react";
import { Button, Dialog, DialogContent } from "@/shared/components/ui";
import { cn } from "@/shared/utils/cn";
import { useExportStudents } from "../hooks/useStudents";
import type { MajorOption, SemesterOption, StudentSort } from "../types";
import {
  describeFilters,
  hasActiveFilters,
  type StudentFilters,
} from "../utils/studentFilters";
import { TargetSemesterNote } from "./TargetSemesterNote";

type ExportScope = "filtered" | "all";

interface ExportStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Học kì đang xem trên trang — export luôn trong học kì này */
  semester: SemesterOption | undefined;
  /** Bộ lọc đang chọn trên trang danh sách */
  filters: StudentFilters;
  majors: MajorOption[] | undefined;
  /** Sắp xếp đang chọn trên bảng → file xếp cùng thứ tự */
  sort: StudentSort | undefined;
  /** Số sinh viên khớp bộ lọc (totalElements của trang danh sách), chưa tải xong thì undefined */
  filteredCount: number | undefined;
}

export function ExportStudentDialog({
  open,
  onOpenChange,
  semester,
  filters,
  majors,
  sort,
  filteredCount,
}: ExportStudentDialogProps) {
  const filtered = hasActiveFilters(filters);
  // undefined = người dùng chưa chọn → mặc định theo bộ lọc nếu đang lọc, không thì toàn bộ
  const [pickedScope, setPickedScope] = useState<ExportScope>();
  const scope = pickedScope ?? (filtered ? "filtered" : "all");
  // Bộ lọc không khớp sinh viên nào → file rỗng, không cho export (chưa biết số thì vẫn cho bấm)
  const emptyFiltered = scope === "filtered" && filteredCount === 0;

  const exportStudents = useExportStudents();
  const exporting = exportStudents.isPending;

  const handleOpenChange = (value: boolean) => {
    if (!value && exporting) return;
    if (!value) setPickedScope(undefined);
    onOpenChange(value);
  };

  const handleExport = () => {
    // Luôn gửi semesterId (học kì đang xem). "Toàn bộ" = bỏ hết bộ lọc; ô "Tất cả" → không gửi tham số đó
    const params =
      scope === "filtered"
        ? {
            semesterId: semester?.publicId,
            keyword: filters.keyword.trim() || undefined,
            majorId: filters.majorId || undefined,
            batch: filters.batch || undefined,
            status: filters.status || undefined,
            sort,
          }
        : { semesterId: semester?.publicId, sort };
    exportStudents.mutate(params, { onSuccess: () => handleOpenChange(false) });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* gap-0: bỏ khoảng cách 16px mặc định giữa header / nội dung / footer của DialogContent */}
      <DialogContent className="max-h-[92vh] max-w-xl gap-0 overflow-y-auto rounded-2xl bg-white p-0 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-start gap-3.5 border-b border-slate-200 bg-white px-5 py-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E3F2FD] text-[#1565C0]">
            <Download className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[16px] font-bold tracking-tight text-slate-800">
              Export danh sách sinh viên
            </h3>
            <p className="mt-0.5 text-[12.5px] text-slate-500">
              Xuất thông tin sinh viên ra file Excel (.xlsx)
            </p>
          </div>
        </div>

        {/* Nội dung */}
        <div className="space-y-4 bg-white px-5 py-4">
          <TargetSemesterNote label="Học kì" semester={semester} />

          <fieldset disabled={exporting} className="space-y-2.5">
            <legend className="mb-2 text-[13px] font-semibold text-slate-700">
              Phạm vi export
            </legend>

            <ScopeOption
              value="filtered"
              checked={scope === "filtered"}
              onSelect={setPickedScope}
              icon={<Filter className="h-4 w-4" />}
              title="Export theo bộ lọc"
              badge={
                filteredCount !== undefined
                  ? `${filteredCount} sinh viên`
                  : undefined
              }
              badgeDanger={filteredCount === 0}
            >
              {filtered ? (
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {describeFilters(filters, majors).map((item) => (
                    <li
                      key={item}
                      className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11.5px] font-medium text-slate-600"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-[12.5px] text-slate-500">
                  Chưa áp dụng bộ lọc nào — kết quả sẽ giống export toàn bộ.
                </p>
              )}
              {emptyFiltered && (
                <p className="mt-1.5 text-xs font-semibold text-[#DC2626]">
                  Không có sinh viên nào khớp bộ lọc, không thể export file rỗng.
                </p>
              )}
            </ScopeOption>

            <ScopeOption
              value="all"
              checked={scope === "all"}
              onSelect={setPickedScope}
              icon={<Users className="h-4 w-4" />}
              title="Export toàn bộ danh sách"
            >
              <p className="mt-1 text-[12.5px] text-slate-500">
                Bỏ qua bộ lọc, xuất tất cả sinh viên của học kì.
              </p>
            </ScopeOption>
          </fieldset>

          <div className="flex items-center gap-2.5 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-[12.5px] text-slate-600">
            <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-600" />
            Định dạng file:{" "}
            <span className="font-semibold text-slate-800">Excel (.xlsx)</span>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-20 flex justify-end gap-2.5 border-t border-slate-200 bg-slate-50/70 px-5 py-3">
          <Button
            type="button"
            variant="outline"
            disabled={exporting}
            onClick={() => handleOpenChange(false)}
            className="h-9 rounded-lg border border-slate-300 bg-white px-4 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={emptyFiltered || exporting}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#1565C0] px-4 text-[13px] font-semibold text-white shadow-sm shadow-[#1565C0]/25 hover:bg-[#0D47A1] disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            {exporting ? "Đang xuất file..." : "Export"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ScopeOptionProps {
  value: ExportScope;
  checked: boolean;
  onSelect: (value: ExportScope) => void;
  icon: ReactNode;
  title: string;
  /** Chữ nhỏ bên phải tiêu đề, ví dụ "12 sinh viên" */
  badge?: string;
  /** Tô đỏ badge (ví dụ "0 sinh viên") */
  badgeDanger?: boolean;
  children: ReactNode;
}

function ScopeOption({
  value,
  checked,
  onSelect,
  icon,
  title,
  badge,
  badgeDanger,
  children,
}: ScopeOptionProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer gap-3 rounded-xl border p-3.5 transition-colors",
        checked
          ? "border-[#1565C0] bg-blue-50/60 ring-1 ring-[#1565C0]/20"
          : "border-slate-200 hover:bg-slate-50",
      )}
    >
      <input
        type="radio"
        name="export-scope"
        value={value}
        checked={checked}
        onChange={() => onSelect(value)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[#1565C0]"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={checked ? "text-[#1565C0]" : "text-slate-500"}>
            {icon}
          </span>
          <span className="text-[13.5px] font-semibold text-slate-800">
            {title}
          </span>
          {badge && (
            <span
              className={cn(
                "ml-auto rounded-full px-2 py-0.5 text-[11.5px] font-semibold tabular-nums",
                badgeDanger
                  ? "bg-red-50 text-[#DC2626]"
                  : "bg-[#E3F2FD] text-[#1565C0]",
              )}
            >
              {badge}
            </span>
          )}
        </div>
        {children}
      </div>
    </label>
  );
}
