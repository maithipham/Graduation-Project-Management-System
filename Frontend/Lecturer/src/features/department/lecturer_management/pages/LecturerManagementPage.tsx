import { useState } from "react";
import { Download, Plus, Upload } from "lucide-react";
import { Button } from "@/shared/components/ui";
import { toast } from "@/shared/components/feedback/toast.store";
import { useDebounce } from "@/shared/hooks";
import { useMajors } from "@/features/department/student_management";
import { CreateTeacherDialog } from "../components/CreateTeacherDialog";
import { ImportTeacherDialog } from "../components/ImportTeacherDialog";
import { TeacherDetailDialog } from "../components/TeacherDetailDialog";
import { TeacherTable } from "../components/TeacherTable";
import { TeacherToolbar } from "../components/TeacherToolbar";
import { useTeachers } from "../hooks/useTeachers";
import type { TeacherSort } from "../types";
import {
  DEFAULT_TEACHER_FILTERS,
  hasActiveTeacherFilters,
  toOrganizationParams,
  type TeacherFilters,
} from "../utils/teacherFilters";

// Khớp @PageableDefault(size = 10) của GET /teacher
const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

// Export Excel sẽ nối API ở bước sau
const notReadyYet = () => toast.info("Chức năng này sẽ được hỗ trợ sau");

export default function LecturerManagementPage() {
  const [filters, setFilters] = useState<TeacherFilters>(
    DEFAULT_TEACHER_FILTERS,
  );
  // Trang hiện tại tính từ 0 giống Spring Pageable; hiển thị cho người dùng thì +1
  const [page, setPage] = useState(0);
  // Không chọn cột nào → BE tự xếp: đang hoạt động trước, mới thêm trước
  const [sort, setSort] = useState<TeacherSort | undefined>();
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // Chờ người dùng ngừng gõ 400ms mới gọi API tìm kiếm
  const name = useDebounce(filters.name.trim(), SEARCH_DEBOUNCE_MS);

  const { data, isPending, isError, isPlaceholderData } = useTeachers({
    name: name || undefined,
    ...toOrganizationParams(filters.organization),
    majorName: filters.majorName || undefined,
    page,
    size: PAGE_SIZE,
    sort,
  });
  const { data: majors, isPending: majorsLoading } = useMajors();

  const filtered = hasActiveTeacherFilters(filters);

  // Đổi bất kỳ bộ lọc nào → quay về trang đầu
  const updateFilters = (patch: Partial<TeacherFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(0);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_TEACHER_FILTERS);
    setSort(undefined);
    setPage(0);
  };

  const changeSort = (next: TeacherSort | undefined) => {
    setSort(next);
    setPage(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Giảng viên
          </h1>
          <p className="text-sm text-slate-500">
            Danh sách giảng viên và hạn mức sinh viên được nhận.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload /> Import Excel
          </Button>
          <Button variant="outline" onClick={notReadyYet}>
            <Download /> Export Excel
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> Thêm giáo viên
          </Button>
        </div>
      </div>

      <TeacherToolbar
        filters={filters}
        onChange={updateFilters}
        onReset={resetFilters}
        showReset={filtered}
        majors={majors}
        majorsLoading={majorsLoading}
      />

      <TeacherTable
        data={data}
        isPending={isPending}
        isError={isError}
        isPlaceholderData={isPlaceholderData}
        pageSize={PAGE_SIZE}
        sort={sort}
        onSortChange={changeSort}
        onPageChange={setPage}
        onRowClick={(teacher) => setSelectedId(teacher.publicId)}
        hasFilters={filtered}
        onCreate={() => setCreateOpen(true)}
      />

      <TeacherDetailDialog
        publicId={selectedId}
        onClose={() => setSelectedId(undefined)}
      />

      <ImportTeacherDialog open={importOpen} onOpenChange={setImportOpen} />

      <CreateTeacherDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        majors={majors}
        majorsLoading={majorsLoading}
      />
    </div>
  );
}
