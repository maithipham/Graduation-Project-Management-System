import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, UserPlus } from "lucide-react";
import { toast } from "@/shared/components/feedback/toast.store";
import { Button, Dialog, DialogContent } from "@/shared/components/ui";
import { API_SUCCESS_CODE } from "@/shared/types";
import { useCreateStudent } from "../hooks/useStudents";
import type { MajorOption, SemesterOption } from "../types";
import {
  createStudentSchema,
  EMPTY_CREATE_STUDENT_VALUES,
  type CreateStudentFormInput,
  type CreateStudentFormValues,
} from "../utils/createStudentSchema";
import { StudentFormFields } from "./StudentFormFields";
import { TargetSemesterNote } from "./TargetSemesterNote";

interface CreateStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  majors: MajorOption[] | undefined;
  majorsLoading: boolean;
  /** Học kì hiện tại — chỉ để hiển thị, không gửi lên BE */
  targetSemester: SemesterOption | undefined;
}

export function CreateStudentDialog({
  open,
  onOpenChange,
  majors,
  majorsLoading,
  targetSemester,
}: CreateStudentDialogProps) {
  const createStudent = useCreateStudent();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateStudentFormInput, unknown, CreateStudentFormValues>({
    resolver: zodResolver(createStudentSchema),
    defaultValues: EMPTY_CREATE_STUDENT_VALUES,
  });

  // Mỗi lần mở popup: làm trống form
  useEffect(() => {
    if (open) reset(EMPTY_CREATE_STUDENT_VALUES);
  }, [open, reset]);

  // Đang lưu thì không cho đóng, tránh tưởng đã hủy trong khi BE vẫn ghi
  const handleOpenChange = (value: boolean) => {
    if (!value && createStudent.isPending) return;
    onOpenChange(value);
  };

  const onSubmit = (values: CreateStudentFormValues) => {
    createStudent.mutate(values, {
      onSuccess: (result) => {
        // 1000: thêm mới / thêm vào kì / cập nhật → toast xanh với đúng câu của BE.
        // 11xx (1101 đã có trong kì, 1102 đã hoàn thành đồ án): interceptor đã hiện toast vàng
        if (result.code === API_SUCCESS_CODE) toast.success(result.message);
        onOpenChange(false);
      },
      // 3014 (trùng tài khoản khác), 3030 (chưa có kì hiện tại), 3023 (kì hiện tại đã kết thúc),
      // 3024 / 3025 (đã xong / đang làm đồ án ở kì khác), 4000, mất mạng:
      // hiện ngay trong form, giữ nguyên dữ liệu để sửa
      onError: (error) => setError("root.server", { message: error.message }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* gap-0: bỏ khoảng cách mặc định để quản lý layout Header/Body/Footer chuẩn xác */}
      <DialogContent className="max-h-[92vh] max-w-2xl gap-0 overflow-hidden p-0 rounded-2xl flex flex-col shadow-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Header Modal */}
        <div className="flex items-start gap-3.5 border-b border-slate-200 bg-white px-6 py-4.5 pr-12 sticky top-0 z-10">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E3F2FD] text-[#1565C0] shadow-sm shadow-[#1565C0]/10">
            <UserPlus className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[16px] font-bold text-slate-800 tracking-tight">
              Thêm sinh viên
            </h3>
            <p className="text-[12.5px] text-slate-500 mt-0.5">
              Nhập thông tin sinh viên làm đồ án tốt nghiệp trong học kỳ này
            </p>
          </div>
        </div>

        {/* Nội dung Form + Footer */}
        {/* noValidate: tắt popup mặc định của trình duyệt, hiển thị lỗi qua zod + FormField */}
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 overflow-hidden"
        >
          {/* Vùng nhập liệu cuộn độc lập */}
          <div className="overflow-y-auto px-6 py-5 space-y-4.5 flex-1 bg-white [scrollbar-width:thin]">
            <TargetSemesterNote label="Thêm vào" semester={targetSemester} />

            <StudentFormFields
              register={register}
              errors={errors}
              majors={majors}
              majorsLoading={majorsLoading}
            />

            {/* Thông báo lỗi từ Server */}
            {errors.root?.server && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-[12.5px] text-rose-700 animate-in fade-in-50"
              >
                <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">
                  {errors.root.server.message}
                </div>
              </div>
            )}
          </div>

          {/* Footer ghim đáy */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-3.5 backdrop-blur-sm sticky bottom-0 z-10">
            <Button
              type="button"
              variant="outline"
              disabled={createStudent.isPending}
              onClick={() => handleOpenChange(false)}
              className="h-9 px-4.5 rounded-lg border border-slate-300 bg-white text-[13px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-800 transition shadow-none cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={createStudent.isPending}
              className="h-9 px-5 rounded-lg bg-[#1565C0] hover:bg-[#0D47A1] text-white text-[13px] font-semibold transition shadow-sm shadow-[#1565C0]/25 inline-flex items-center gap-2 cursor-pointer"
            >
              {createStudent.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 text-white" />
                  <span>Thêm sinh viên</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
