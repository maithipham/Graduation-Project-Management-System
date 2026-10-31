import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
import { toast } from "@/shared/components/feedback/toast.store";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui";
import { API_SUCCESS_CODE } from "@/shared/types";
import type { MajorOption } from "@/features/department/student_management";
import { useAcademicTitles, useCreateTeacher } from "../hooks/useTeachers";
import { DEFAULT_ACADEMIC_TITLES } from "../services/teacher.service";
import { useTeacherEmailAutoFill } from "../hooks/useTeacherEmailAutoFill";
import {
  createTeacherSchema,
  EMPTY_CREATE_TEACHER_VALUES,
  type CreateTeacherFormInput,
  type CreateTeacherFormValues,
} from "../utils/createTeacherSchema";
import { TeacherFormFields } from "./TeacherFormFields";

const DEFAULT_SUCCESS_MESSAGE = "Thêm giáo viên thành công";

interface CreateTeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  majors: MajorOption[] | undefined;
  majorsLoading: boolean;
  lockedMajor?: string;
}

export function CreateTeacherDialog({
  open,
  onOpenChange,
  majors,
  majorsLoading,
  lockedMajor,
}: CreateTeacherDialogProps) {
  const createTeacher = useCreateTeacher();
  const { data: academicTitles } = useAcademicTitles();
  const activeMajor = lockedMajor || '';

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    subscribe,
    control,
    formState: { errors, isSubmitted },
  } = useForm<CreateTeacherFormInput, unknown, CreateTeacherFormValues>({
    resolver: zodResolver(createTeacherSchema),
    defaultValues: EMPTY_CREATE_TEACHER_VALUES,
  });

  // Gõ email đúng đuôi → tự điền đơn vị công tác, hạn mức mặc định (chi tiết trong hook)
  const { resetAutoFill } = useTeacherEmailAutoFill({
    subscribe,
    setValue,
    isSubmitted,
    defaultMajor: activeMajor,
  });

  // Mỗi lần mở popup: làm trống form
  useEffect(() => {
    if (open) {
      reset({
        ...EMPTY_CREATE_TEACHER_VALUES,
        major: activeMajor,
      });
      resetAutoFill();
    }
  }, [open, reset, resetAutoFill, activeMajor]);

  // Đang lưu thì không cho đóng, tránh tưởng đã hủy trong khi BE vẫn ghi
  const handleOpenChange = (value: boolean) => {
    if (!value && createTeacher.isPending) return;
    onOpenChange(value);
  };

  const onSubmit = (values: CreateTeacherFormValues) => {
    const isExternal = values.email.toLowerCase().endsWith('@gmail.com');
    const allTitles = academicTitles && academicTitles.length > 0 ? academicTitles : DEFAULT_ACADEMIC_TITLES;
    const matchedTitle = allTitles.find(
      (t) => t.abbreviation === values.academicTitle || String(t.id) === String(values.academicTitleId),
    );
    const payload: CreateTeacherFormValues = {
      ...values,
      major: isExternal ? '' : (activeMajor || values.major || ''),
      academicTitleId: matchedTitle ? matchedTitle.id : (values.academicTitleId ?? null),
      academicTitle: matchedTitle ? matchedTitle.abbreviation : (values.academicTitle || null),
    };
    createTeacher.mutate(payload, {
      onSuccess: (result) => {
        // 1000: thêm mới / kích hoạt lại → toast xanh với đúng câu của BE (BE không trả câu thì dùng câu mặc định).
        // 1100 (đang hoạt động sẵn, không đổi gì): interceptor đã hiện toast vàng
        if (result.code === API_SUCCESS_CODE) {
          toast.success(result.message || DEFAULT_SUCCESS_MESSAGE);
        }
        onOpenChange(false);
      },
      // 3006 (email thuộc tài khoản khác), 3007 (không khớp hồ sơ gốc), 4000, 2007, mất mạng:
      // hiện ngay trong form, giữ nguyên dữ liệu để sửa
      onError: (error) => setError("root.server", { message: error.message }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm giáo viên</DialogTitle>
          <DialogDescription>
            Nhập thông tin một giáo viên hướng dẫn đồ án.
          </DialogDescription>
        </DialogHeader>

        {/* noValidate: tắt popup của trình duyệt, lỗi do zod + FormField hiển thị */}
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <TeacherFormFields
            register={register}
            control={control}
            errors={errors}
            majors={majors}
            majorsLoading={majorsLoading}
            lockedMajor={activeMajor || undefined}
          />

          {errors.root?.server && (
            <p role="alert" className="text-sm font-semibold text-[#DC2626]">
              {errors.root.server.message}
            </p>
          )}

          <p className="flex items-start gap-2 text-xs text-slate-500">
            <Info className="mt-px h-3.5 w-3.5 shrink-0" />
            Nếu giáo viên đã bị tắt, hệ thống sẽ kích hoạt lại và cập nhật số
            điện thoại, đơn vị công tác, ngành, hạn mức. Với giáo viên đang hoạt
            động thì không thay đổi gì.
          </p>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={createTeacher.isPending}
              onClick={() => handleOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={createTeacher.isPending}>
              {createTeacher.isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
