import { useMemo, useState } from "react";
import { Download, Plus, Upload } from "lucide-react";
import { Button, Select } from "@/shared/components/ui";
import { toast } from "@/shared/components/feedback/toast.store";
import { useDebounce } from "@/shared/hooks";
import { CreateStudentDialog } from "../components/CreateStudentDialog";
import { DeleteStudentDialog } from "../components/DeleteStudentDialog";
import { ImportStudentDialog } from "../components/ImportStudentDialog";
import { StudentDetailDialog } from "../components/StudentDetailDialog";
import { StudentTable } from "../components/StudentTable";
import { StudentToolbar } from "../components/StudentToolbar";
import {
  useBatches,
  useCurrentSemester,
  useMajors,
  useSemesters,
  useStudents,
} from "../hooks/useStudents";
import type { StudentListItem, StudentSort } from "../types";
import {
  DEFAULT_STUDENT_FILTERS,
  hasActiveFilters,
  type StudentFilters,
} from "../utils/studentFilters";

const PAGE_SIZE_OPTIONS = [15, 25, 50] as const;
const SEARCH_DEBOUNCE_MS = 400;

// "2026-2027" → "2026–2027" (gạch nối dài như mockup)
const formatAcademicYear = (year: string) => year.replace("-", "–");

// Trùng message 3030 của BE
const NO_CURRENT_SEMESTER_HINT =
  "Hiện chưa có học kỳ nào đang diễn ra, không thể thêm sinh viên";

// Ô Năm học / Học kỳ đầu trang (theo đặc tả: cao 36px, chữ 13px đậm)
const SCOPE_SELECT_CLASS =
  "h-9 rounded-lg border-slate-300 pl-3 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 focus-visible:border-[#1565C0] focus-visible:ring-2 focus-visible:ring-blue-100";

type OpenDialog = "import" | "create" | null;

export default function StudentManagementPage() {
  const [filters, setFilters] = useState<StudentFilters>(
    DEFAULT_STUDENT_FILTERS,
  );
  // Học kì người dùng tự chọn; chưa chọn → dùng học kì hiện tại
  const [pickedSemesterId, setPickedSemesterId] = useState<
    string | undefined
  >();
  // Trang hiện tại tính từ 0 giống Spring Pageable; hiển thị cho người dùng thì +1
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [sort, setSort] = useState<StudentSort | undefined>();
  const [selected, setSelected] = useState<StudentListItem | undefined>();
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null);
  const [deleting, setDeleting] = useState<StudentListItem | undefined>();

  const { data: semesterList, isPending: semestersLoading } = useSemesters();
  const current = useCurrentSemester();
  // Danh sách học kì lỗi / rỗng / thiếu kì hiện tại → thêm kì hiện tại vào,
  // để dropdown Năm học / Học kỳ luôn hiện được kì đang xem
  const semesters = useMemo(() => {
    const list = semesterList ?? [];
    const cur = current.data;
    return cur && !list.some((s) => s.publicId === cur.publicId)
      ? [cur, ...list]
      : list;
  }, [semesterList, current.data]);

  // Không có học kì hiện tại (hoặc lỗi) → lấy kì mới nhất (BE đã sắp mới → cũ)
  const semesterId =
    pickedSemesterId ??
    current.data?.publicId ??
    (current.isError ? semesters[0]?.publicId : undefined);
  const semester =
    semesters.find((s) => s.publicId === semesterId) ?? current.data;
  const semesterResolved = semesterId !== undefined;

  // Năm học: các academicYear không trùng, giữ thứ tự mới → cũ
  const academicYears = useMemo(
    () => [...new Set(semesters.map((s) => s.academicYear))],
    [semesters],
  );
  const termsOfYear = semesters.filter(
    (s) => s.academicYear === semester?.academicYear,
  );

  const { data: majors, isPending: majorsLoading } = useMajors();
  const batchesQuery = useBatches({
    semesterId,
    majorId: filters.majorId || undefined,
  });
  const batches = batchesQuery.data;
  // Khóa đã chọn không còn trong học kì / bộ môn mới → coi như "Tất cả khóa"
  const batch =
    filters.batch && batches?.includes(filters.batch) ? filters.batch : "";

  // Chờ người dùng ngừng gõ 400ms mới gọi API tìm kiếm
  const keyword = useDebounce(filters.keyword.trim(), SEARCH_DEBOUNCE_MS);

  const { data, isPending, isError, isPlaceholderData } = useStudents(
    {
      semesterId,
      keyword: keyword || undefined,
      majorId: filters.majorId || undefined,
      batch: batch || undefined,
      status: filters.status || undefined,
      page,
      size: pageSize,
      sort,
    },
    // Chưa biết học kì thì chưa gọi, tránh gọi 2 lần (không semesterId rồi có semesterId)
    { enabled: semesterResolved },
  );

  const filtered = hasActiveFilters({ ...filters, batch });
  const noSemester =
    !semestersLoading && !current.isPending && !semesterResolved;
  // Học kì đang xem đã kết thúc → không cho xóa sinh viên (BE trả 3029)
  const semesterClosed = semester?.statusCode === "COMPLETED";
  // Import / Thêm luôn vào học kì hiện tại (BE tự xác định, FE không gửi semesterId),
  // không phụ thuộc học kì đang chọn. Chưa có kì hiện tại → khóa nút (BE cũng chặn bằng 3030)
  const currentSemester = current.data;
  const viewingCurrent =
    currentSemester !== undefined && semesterId === currentSemester.publicId;

  // Đổi bất kỳ bộ lọc nào → quay về trang đầu
  const updateFilters = (patch: Partial<StudentFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(0);
  };


  const changeSemester = (publicId: string) => {
    setPickedSemesterId(publicId);
    setFilters((prev) => ({ ...prev, batch: "" }));
    setPage(0);
  };

  // Đổi năm học → chọn kì mới nhất của năm đó
  const changeAcademicYear = (year: string) => {
    const latest = semesters.find((s) => s.academicYear === year);
    if (latest) changeSemester(latest.publicId);
  };

  const changeSort = (next: StudentSort | undefined) => {
    setSort(next);
    setPage(0);
  };

  const changePageSize = (size: number) => {
    setPageSize(size);
    setPage(0);
  };

  const closeDialog = (open: boolean) => {
    if (!open) setOpenDialog(null);
  };

  const downloadTemplate = () => toast.info("Chức năng này sẽ được hỗ trợ sau");

  const emptyMessage = noSemester
    ? "Chưa có học kì nào"
    : filtered
      ? "Không tìm thấy sinh viên phù hợp"
      : "Chưa có sinh viên nào trong học kì này";

  // -mt-2: kéo hàng nút lên gần header hơn (main của layout đang p-6)
  return (
    <div className="-mt-2 space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={semester?.academicYear ?? ""}
            onChange={(e) => changeAcademicYear(e.target.value)}
            disabled={academicYears.length === 0}
            aria-label="Năm học"
            // Rê chuột vào ô Năm học để xem trạng thái + thời gian của học kì
            title={
              semester
                ? `${semester.status} · ${semester.startDate} – ${semester.endDate}`
                : undefined
            }
            className={SCOPE_SELECT_CLASS}
            containerClassName="w-36"
          >
            {academicYears.length === 0 && (
              <option value="">
                {semestersLoading ? "Đang tải..." : "Chưa có năm học"}
              </option>
            )}
            {academicYears.map((year) => (
              <option key={year} value={year}>
                {formatAcademicYear(year)}
              </option>
            ))}
          </Select>
          <Select
            value={semesterId ?? ""}
            onChange={(e) => changeSemester(e.target.value)}
            disabled={termsOfYear.length === 0}
            aria-label="Học kỳ"
            className={SCOPE_SELECT_CLASS}
            containerClassName="w-32"
          >
            {termsOfYear.length === 0 && (
              <option value="">
                {semestersLoading ? "Đang tải..." : "Chưa có học kỳ"}
              </option>
            )}
            {termsOfYear.map((s) => (
              <option key={s.publicId} value={s.publicId}>
                {s.term}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="h-9 rounded-lg border-slate-300 px-4 text-[13px] font-semibold text-slate-700 shadow-none hover:border-slate-400 hover:bg-slate-50 hover:text-slate-700"
          >
            <Download /> Tải file mẫu Excel
          </Button>
          <Button
            variant="ghost"
            onClick={() => setOpenDialog("import")}
            disabled={!currentSemester}
            title={currentSemester ? undefined : NO_CURRENT_SEMESTER_HINT}
            className="h-9 rounded-lg border border-sky-200 bg-sky-100 px-4 text-[13px] font-semibold text-sky-800 hover:bg-sky-200 hover:text-sky-800"
          >
            <Upload /> Import File
          </Button>
          <Button
            onClick={() => setOpenDialog("create")}
            disabled={!currentSemester}
            title={currentSemester ? undefined : NO_CURRENT_SEMESTER_HINT}
            className="h-9 rounded-lg bg-[#1565C0] px-4 text-[13px] font-semibold text-white shadow-sm shadow-[#1565C0]/30 hover:bg-[#0D47A1]"
          >
            <Plus /> Thêm sinh viên
          </Button>
        </div>
      </div>

      <StudentToolbar
        filters={{ ...filters, batch }}
        onChange={updateFilters}
        batches={batches}
        batchesLoading={batchesQuery.isLoading}
        majors={majors}
        majorsLoading={majorsLoading}
      />

      <StudentTable
        data={data}
        // Không có học kì nào thì query không chạy → hiện bảng rỗng thay vì skeleton mãi
        isPending={isPending && !noSemester}
        isError={isError}
        isPlaceholderData={isPlaceholderData}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        sort={sort}
        onSortChange={changeSort}
        onPageChange={setPage}
        onPageSizeChange={changePageSize}
        onRowClick={setSelected}
        emptyMessage={emptyMessage}
        // Đang xem kì cũ thì không hiện nút "Thêm sinh viên" ở bảng rỗng:
        // bấm vào sẽ thêm vào kì hiện tại chứ không phải kì đang xem
        onCreate={viewingCurrent ? () => setOpenDialog("create") : undefined}
        // Học kì đã kết thúc → BE từ chối (3029) nên ẩn luôn nút Xóa
        onDelete={semesterResolved && !semesterClosed ? setDeleting : undefined}
      />

      <StudentDetailDialog
        student={selected}
        onClose={() => setSelected(undefined)}
      />
      <DeleteStudentDialog
        student={deleting}
        semester={semester}
        onClose={() => setDeleting(undefined)}
      />
      <ImportStudentDialog
        open={openDialog === "import"}
        onOpenChange={closeDialog}
        targetSemester={currentSemester}
      />
      <CreateStudentDialog
        open={openDialog === "create"}
        onOpenChange={closeDialog}
        targetSemester={currentSemester}
        majors={majors}
        majorsLoading={majorsLoading}
      />
    </div>
  );
}
