import { useId } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Download, Info, RotateCcw } from "lucide-react";
import { toast } from "@/shared/components/feedback/toast.store";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FileDropZone,
  FormField,
} from "@/shared/components/ui";
import { cn } from "@/shared/utils/cn";
import { useImportTeachers } from "../hooks/useTeachers";
import { TeacherImportResult } from "./TeacherImportResult";

const MAX_IMPORT_SIZE = 50 * 1024 * 1024; // 50MB, trùng giới hạn của BE

// Thứ tự cột A–F trong file mẫu (Mục 6.2 api_addLecturer.md). Không có cột hạn mức: BE tự gán theo email
const IMPORT_COLUMNS = [
  "Họ và tên đệm",
  "Tên",
  "Email",
  "Số điện thoại",
  "Đơn vị công tác",
  "Ngành",
];

// Message trùng với lỗi mức toàn file của POST /teacher/import
const importSchema = z.object({
  file: z
    .file({ error: "File import không được để trống" })
    .refine(
      (file) => file.name.toLowerCase().endsWith(".xlsx"),
      "File import phải có định dạng .xlsx",
    )
    .refine(
      (file) => file.size <= MAX_IMPORT_SIZE,
      "File import vượt quá dung lượng cho phép (50MB)",
    ),
});

type ImportFormValues = z.infer<typeof importSchema>;

interface ImportTeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportTeacherDialog({
  open,
  onOpenChange,
}: ImportTeacherDialogProps) {
  const formId = useId();
  const importTeachers = useImportTeachers();
  // Có kết quả (data) → chuyển sang màn kết quả; reset() mutation → quay lại bước chọn file
  const result = importTeachers.data;

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<ImportFormValues>({
    resolver: zodResolver(importSchema),
    defaultValues: { file: undefined },
  });
  const file = useWatch({ control, name: "file" });

  const backToUpload = () => {
    importTeachers.reset();
    reset();
  };

  const handleOpenChange = (value: boolean) => {
    // Đang gửi file thì không cho đóng, tránh người dùng tưởng đã hủy trong khi BE vẫn lưu
    if (!value && importTeachers.isPending) return;
    if (!value) backToUpload();
    onOpenChange(value);
  };

  const onSubmit = (values: ImportFormValues) => {
    importTeachers.mutate(values.file, {
      onSuccess: (data) => {
        if (data.errorCount === 0 && data.warningCount === 0) {
          toast.success(`Đã import thành công ${data.successCount} giáo viên`);
        }
      },
      // Lỗi mức toàn file (sai tiêu đề, ô gộp, không có dữ liệu, 2007...) hiện ngay dưới ô chọn file
      onError: (error) => setError("file", { message: error.message }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[90vh] overflow-y-auto",
          result ? "max-w-6xl" : "max-w-3xl",
        )}
      >
        <DialogHeader>
          <DialogTitle>
            {result ? "Kết quả import giáo viên" : "Import danh sách giáo viên"}
          </DialogTitle>
          <DialogDescription>
            {result
              ? `File: ${file?.name ?? ""}`
              : "Tải lên file Excel theo đúng mẫu để thêm nhiều giáo viên cùng lúc."}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          // Form sửa từng dòng nằm trong bảng kết quả → bảng phải ở ngoài form chọn file (không lồng form)
          <TeacherImportResult result={result} />
        ) : (
          <form
            id={formId}
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <fieldset disabled={importTeachers.isPending} className="space-y-4">
              <FormField
                label="File import"
                required
                error={errors.file?.message}
              >
                <FileDropZone
                  file={file}
                  accept=".xlsx"
                  hint="Chỉ nhận file .xlsx, tối đa 50MB"
                  onSelect={(selected) => {
                    if (importTeachers.isPending) return;
                    setValue("file", selected, { shouldValidate: true });
                  }}
                  // Ô file gán bằng setValue (không register) → reset cả form (chỉ có 1 ô), xóa luôn lỗi
                  onClear={() => reset()}
                />
              </FormField>

              <div className="flex gap-3 rounded-lg border border-blue-100 bg-blue-50/60 p-4 text-sm text-slate-700">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <div className="space-y-2">
                  <p>
                    File gồm{" "}
                    <span className="font-semibold">
                      {IMPORT_COLUMNS.length} cột
                    </span>{" "}
                    theo đúng thứ tự, dòng 1 là tiêu đề, không gộp ô:
                  </p>
                  <ol className="flex flex-wrap gap-1.5">
                    {IMPORT_COLUMNS.map((column, index) => (
                      <li
                        key={column}
                        className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium"
                      >
                        {index + 1}. {column}
                      </li>
                    ))}
                  </ol>
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0"
                    onClick={() => toast.info("Sẽ hỗ trợ sau")}
                  >
                    <Download /> Tải file mẫu
                  </Button>
                </div>
              </div>
            </fieldset>
          </form>
        )}

        <DialogFooter>
          {result ? (
            <>
              <Button type="button" variant="outline" onClick={backToUpload}>
                <RotateCcw /> Import file khác
              </Button>
              <Button type="button" onClick={() => handleOpenChange(false)}>
                Đóng
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={importTeachers.isPending}
                onClick={() => handleOpenChange(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                form={formId}
                disabled={!file || importTeachers.isPending}
              >
                {importTeachers.isPending ? "Đang import..." : "Import"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
