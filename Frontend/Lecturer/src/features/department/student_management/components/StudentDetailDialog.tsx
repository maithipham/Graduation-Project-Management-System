import type { ReactNode } from "react";
import {
  BookOpen,
  Building2,
  CheckCircle2,
  GraduationCap,
  Mail,
  Phone,
  ShieldAlert,
  User,
} from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  Skeleton,
} from "@/shared/components/ui";
import { cn } from "@/shared/utils/cn";
import { useStudentDetail } from "../hooks/useStudents";
import type { StudentListItem } from "../types";
import { StudentStatusBadge } from "./StudentStatusBadge";

// Màu avatar chữ cái đầu đồng bộ 100% với StudentTable
const AVATAR_COLORS = [
  "from-cyan-500 to-sky-600",
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
];

function getAvatarColor(studentCode: string) {
  const sum = [...studentCode].reduce(
    (total, char) => total + char.charCodeAt(0),
    0,
  );
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/);
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

interface StudentDetailDialogProps {
  student: StudentListItem | undefined;
  onClose: () => void;
}

export function StudentDetailDialog({
  student: row,
  onClose,
}: StudentDetailDialogProps) {
  const { data: student, isPending, isError } = useStudentDetail(row?.publicId);

  return (
    <Dialog
      open={row !== undefined}
      onOpenChange={(open) => !open && onClose()}
    >
      {/* gap-0: bỏ khoảng cách 16px mặc định giữa header / nội dung / footer của DialogContent.
          Màn hình thấp vẫn cuộn được nhưng ẩn thanh cuộn */}
      <DialogContent className="max-h-[92vh] max-w-xl gap-0 overflow-y-auto p-0 rounded-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Header Modal */}
        <div className="flex items-start gap-3.5 border-b border-slate-200 px-5 py-3.5 bg-white sticky top-0 z-10">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E3F2FD] text-[#1565C0]">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[16px] font-bold text-slate-800 tracking-tight">
              Thông tin sinh viên
            </h3>
            <p className="text-[12.5px] text-slate-500 mt-0.5">
              Hồ sơ học tập & tiến độ đồ án tốt nghiệp
            </p>
          </div>
        </div>

        {/* Nội dung chi tiết */}
        <div className="px-5 py-4 space-y-3.5 bg-white">
          {isPending ? (
            <StudentDetailSkeleton />
          ) : isError || !student ? (
            <div className="py-12 text-center text-slate-500 text-[13px]">
              Không tải được thông tin chi tiết của sinh viên.
            </div>
          ) : (
            <>
              {/* 1. Hero Card tóm tắt sinh viên */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-[13px] font-bold text-white shadow-xs",
                      getAvatarColor(student.studentCode),
                    )}
                  >
                    {getInitials(student.name)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[15px] font-bold text-slate-800 truncate">
                      {student.name}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="font-mono text-[12px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs">
                        {student.studentCode}
                      </span>
                      {student.batch && (
                        <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10.5px] font-bold text-blue-700">
                          {student.batch}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Trạng thái tài khoản dạng Badge */}
                <div>
                  {student.accountStatus ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />{" "}
                      Được đăng nhập
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Bị
                      khóa đăng nhập
                    </span>
                  )}
                </div>
              </div>

              {/* 2. Lưới thông tin đào tạo & liên hệ */}
              <div className="rounded-xl border border-slate-200 p-3.5 bg-white shadow-2xs">
                <h5 className="text-[11.5px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Thông tin đào tạo & liên hệ
                </h5>
                <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                  <InfoRow icon={Mail} label="Email">
                    <a
                      href={`mailto:${student.email}`}
                      className="text-[#1565C0] hover:underline break-all font-medium"
                    >
                      {student.email}
                    </a>
                  </InfoRow>

                  <InfoRow icon={Phone} label="Số điện thoại">
                    {student.phone || (
                      <span className="text-slate-400 italic">
                        Chưa cập nhật
                      </span>
                    )}
                  </InfoRow>

                  <InfoRow icon={Building2} label="Bộ môn / Chuyên ngành">
                    {student.majorName || "—"}
                  </InfoRow>

                  <InfoRow icon={User} label="Lớp sinh hoạt">
                    {student.className}
                  </InfoRow>
                </div>
              </div>
            </>
          )}

          {/* 3. Đồ án học kỳ đang chọn (Accent Card) */}
          {row && (
            <div className="rounded-xl border border-sky-200/80 bg-sky-50/40 p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-sky-100 pb-2">
                <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#1565C0]">
                  <BookOpen className="w-4 h-4" /> Đồ án học kỳ này
                </div>
                <StudentStatusBadge
                  status={row.status}
                  label={row.statusLabel}
                />
              </div>

              <div className="space-y-2.5">
                <div>
                  <div className="text-[11.5px] font-medium text-slate-500 mb-1">
                    Tên đề tài đăng ký:
                  </div>
                  <div className="text-[13.5px] font-semibold text-slate-800 leading-snug">
                    {row.topicName || (
                      <span className="text-slate-400 font-normal italic">
                        (Chưa đăng ký đề tài)
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-sky-100/60">
                  <div>
                    <div className="text-[11.5px] font-medium text-slate-500 mb-0.5">
                      Giảng viên hướng dẫn:
                    </div>
                    <div className="text-[13px] font-semibold text-slate-800">
                      {row.lecturerName || (
                        <span className="text-slate-400 font-normal italic">
                          Chưa phân công
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11.5px] font-medium text-slate-500 mb-0.5">
                      Đồng hướng dẫn:
                    </div>
                    <div className="text-[13px] font-semibold text-slate-800">
                      {row.coLecturerName || "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-9 rounded-lg border-slate-300 bg-white px-4 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Thanh xám nằm trong dòng chữ: dòng vẫn cao đúng line-height của chữ thật
function TextSkeleton({ className }: { className: string }) {
  return (
    <Skeleton
      className={cn("inline-block h-[0.9em] align-middle", className)}
    />
  );
}

/**
 * Khung đang tải dựng lại đúng khung 2 thẻ thật (cùng class, cùng nhãn), chỉ thay giá trị bằng thanh xám
 * → dữ liệu về chỉ điền chữ vào chỗ, popup không đổi chiều cao (không bị co giật)
 */
function StudentDetailSkeleton() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5">
        <div className="flex items-center gap-3.5 min-w-0">
          <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
          <div className="min-w-0">
            <h4 className="text-[15px] font-bold">
              <TextSkeleton className="w-40" />
            </h4>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {/* Giữ nguyên khung ô MSSV (viền + padding), chữ trong suốt để có đúng chiều cao */}
              <span className="font-mono text-[12px] font-semibold text-transparent bg-slate-200/80 animate-pulse border border-transparent px-2 py-0.5 rounded-md">
                0000000000
              </span>
              <span className="text-[12.5px]">
                <TextSkeleton className="w-16" />
              </span>
            </div>
          </div>
        </div>
        <Skeleton className="h-6.5 w-32 rounded-full" />
      </div>

      <div className="rounded-xl border border-slate-200 p-3.5 bg-white shadow-2xs">
        <h5 className="text-[11.5px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
          Thông tin đào tạo & liên hệ
        </h5>
        <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          <InfoRow icon={Mail} label="Email">
            <TextSkeleton className="w-44" />
          </InfoRow>
          <InfoRow icon={Phone} label="Số điện thoại">
            <TextSkeleton className="w-24" />
          </InfoRow>
          <InfoRow icon={Building2} label="Bộ môn / Chuyên ngành">
            <TextSkeleton className="w-36" />
          </InfoRow>
          <InfoRow icon={User} label="Lớp sinh hoạt">
            <TextSkeleton className="w-20" />
          </InfoRow>
        </div>
      </div>
    </>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: any;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 text-slate-400">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11.5px] font-medium text-slate-500 leading-none mb-1">
          {label}
        </div>
        <div className="text-[13px] font-semibold text-slate-800 truncate">
          {children}
        </div>
      </div>
    </div>
  );
}
