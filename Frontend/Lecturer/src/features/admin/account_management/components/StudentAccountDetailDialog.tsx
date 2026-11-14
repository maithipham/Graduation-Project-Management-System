import { useEffect } from "react";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Calendar,
  CheckCircle2,
  GraduationCap,
  Hash,
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
import { isApiError } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { ACCOUNT_KEYS, useStudentAccountDetail } from "../hooks/useAccounts";
import type { StudentAccountItem } from "../types/account.types";

interface StudentAccountDetailDialogProps {
  /** Dòng vừa bấm trên bảng; null = đóng popup */
  student: StudentAccountItem | null;
  onClose: () => void;
}

// Màu avatar xoay vòng theo mã sinh viên — đồng bộ 100% với hệ thống
const AVATAR_COLORS = [
  "from-cyan-500 to-sky-600",
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-violet-500 to-purple-600",
];

function getAvatarColor(studentCode?: string) {
  if (!studentCode) return AVATAR_COLORS[1];
  const sum = [...studentCode].reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0,
  );
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/);
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "SV";
}

interface InfoItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: ReactNode;
}

function InfoItem({ icon: Icon, label, children }: InfoItemProps) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <span className="block text-[11.5px] font-medium text-slate-500 mb-0.5">
          {label}
        </span>
        <div className="text-[13.5px] font-semibold text-slate-800 break-words">
          {children}
        </div>
      </div>
    </div>
  );
}

/** Popup "Thông tin sinh viên" — gọi GET /student/account/{publicId} */
export function StudentAccountDetailDialog({
  student,
  onClose,
}: StudentAccountDetailDialogProps) {
  const queryClient = useQueryClient();
  const {
    data: detail,
    isPending,
    error,
  } = useStudentAccountDetail(student?.publicId ?? null);

  // 404 3008: sinh viên vừa bị xóa ở nơi khác → interceptor đã toast, đóng popup và tải lại danh sách
  useEffect(() => {
    if (student && isApiError(error) && error.status === 404) {
      queryClient.invalidateQueries({ queryKey: ACCOUNT_KEYS.students() });
      onClose();
    }
  }, [error, student, queryClient, onClose]);

  // Hiện ngay dữ liệu sẵn có từ dòng của bảng; số điện thoại chờ API
  const info = detail ?? student;
  const loadingExtra = isPending && !detail;

  return (
    <Dialog open={student !== null} onOpenChange={(open) => !open && onClose()}>
      {/* gap-0: loại bỏ khoảng cách mặc định để phân chia Header/Body/Footer chuẩn xác */}
      <DialogContent className="max-h-[92vh] max-w-xl gap-0 overflow-hidden p-0 rounded-2xl flex flex-col shadow-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Header Modal */}
        <div className="flex items-start gap-3.5 border-b border-slate-200 bg-white px-6 py-4.5 pr-12 sticky top-0 z-10">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E3F2FD] text-[#1565C0] shadow-sm shadow-[#1565C0]/10">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[16px] font-bold text-slate-800 tracking-tight">
              Hồ sơ tài khoản sinh viên
            </h3>
            <p className="text-[12.5px] text-slate-500 mt-0.5">
              Thông tin định danh và trạng thái tài khoản trên hệ thống
            </p>
          </div>
        </div>

        {/* Thân Modal cuộn độc lập */}
        <div className="overflow-y-auto px-6 py-5 space-y-4 flex-1 bg-white [scrollbar-width:thin]">
          {info && (
            <>
              {/* 1. Hero Profile Card tóm tắt sinh viên */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200/90 bg-slate-50/70 p-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-[14px] font-bold text-white shadow-xs",
                      getAvatarColor(info.studentCode),
                    )}
                  >
                    {getInitials(info.name)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[15.5px] font-bold text-slate-800 truncate">
                      {info.name}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="font-mono text-[12px] font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs">
                        {info.studentCode}
                      </span>
                      {info.batch && (
                        <span className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                          {info.batch}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Badge trạng thái tài khoản */}
                <div>
                  {info.accountStatus ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Hoạt động
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                      Không hoạt động
                    </span>
                  )}
                </div>
              </div>

              {/* 2. Lưới thông tin đào tạo & liên hệ */}
              <div className="rounded-xl border border-slate-200 p-4 bg-white shadow-2xs">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3.5">
                  Thông tin đào tạo & liên hệ
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  <InfoItem icon={Mail} label="Email tài khoản">
                    <a
                      href={`mailto:${info.email}`}
                      className="text-[#1565C0] hover:underline break-all font-medium"
                    >
                      {info.email}
                    </a>
                  </InfoItem>

                  <InfoItem icon={Phone} label="Số điện thoại">
                    {loadingExtra ? (
                      <Skeleton className="h-5 w-28" />
                    ) : detail?.phone ? (
                      detail.phone
                    ) : (
                      <span className="text-slate-400 font-normal italic">
                        Chưa cập nhật
                      </span>
                    )}
                  </InfoItem>

                  <InfoItem icon={Building2} label="Bộ môn / Ngành đào tạo">
                    {info.majorName ?? "—"}
                  </InfoItem>

                  <InfoItem icon={User} label="Lớp sinh hoạt">
                    {info.className ?? "—"}
                  </InfoItem>

                  <InfoItem icon={Calendar} label="Khóa đào tạo">
                    {info.batch ?? "—"}
                  </InfoItem>

                  <InfoItem icon={Hash} label="Mã sinh viên (MSSV)">
                    {info.studentCode}
                  </InfoItem>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Modal ghim đáy */}
        <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50/80 px-6 py-3.5 backdrop-blur-sm sticky bottom-0 z-10">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-9 px-5 rounded-lg border border-slate-300 bg-white text-[13px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-800 transition shadow-none cursor-pointer"
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
