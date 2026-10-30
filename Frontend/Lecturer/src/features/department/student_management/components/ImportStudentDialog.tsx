import { useId } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Download,
  FileSpreadsheet,
  Info,
  RotateCcw,
  Upload,
} from "lucide-react";
import { toast } from "@/shared/components/feedback/toast.store";
import {
  Button,
  Dialog,
  DialogContent,
  FileDropZone,
  FormField,
} from "@/shared/components/ui";
import { cn } from "@/shared/utils/cn";
import { useImportStudents } from "../hooks/useStudents";
import type { SemesterOption } from "../types";
import { StudentImportResult } from "./StudentImportResult";
import { TargetSemesterNote } from "./TargetSemesterNote";

const MAX_IMPORT_SIZE = 50 * 1024 * 1024; // 50MB, trùng giới hạn của BE

// Thứ tự 8 cột trong file mẫu Excel
const IMPORT_COLUMNS = [
  "Mã sinh viên",
  "Họ",
  "Tên",
  "Email",
  "Số điện thoại",
  "Khóa",
  "Lớp",
  "Ngành",
];

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

interface ImportStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Học kì hiện tại — chỉ để hiển thị, không gửi lên BE */
  targetSemester: SemesterOption | undefined;
}

export function ImportStudentDialog({
  open,
  onOpenChange,
  targetSemester,
}: ImportStudentDialogProps) {
  const formId = useId();
  const importStudents = useImportStudents();
  // Có kết quả (data) → chuyển sang màn kết quả; reset() mutation → quay lại bước chọn file
  const result = importStudents.data;

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
    importStudents.reset();
    reset();
  };

  const handleOpenChange = (value: boolean) => {
    if (!value && importStudents.isPending) return;
    if (!value) backToUpload();
    onOpenChange(value);
  };

  const onSubmit = (values: ImportFormValues) => {
    importStudents.mutate(values.file, {
      onSuccess: (data) => {
        if (data.errorCount === 0 && data.warningCount === 0) {
          toast.success(`Đã import thành công ${data.successCount} sinh viên`);
        }
      },
      onError: (error) => setError("file", { message: error.message }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* gap-0: bỏ khoảng cách 16px mặc định giữa header / nội dung / footer của DialogContent */}
      <DialogContent
        className={cn(
          "max-h-[92vh] gap-0 p-0 overflow-y-auto rounded-2xl bg-white shadow-2xl",
          result ? "max-w-6xl" : "max-w-2xl",
        )}
      >
        {/* Header Modal */}
        <div className="flex items-start gap-3.5 border-b border-slate-200 px-5 py-3.5 bg-white sticky top-0 z-20">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E3F2FD] text-[#1565C0]">
            {result ? (
              <FileSpreadsheet className="h-5 w-5" />
            ) : (
              <Upload className="h-5 w-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[16px] font-bold text-slate-800 tracking-tight">
              {result
                ? "Kết quả import sinh viên"
                : "Import danh sách sinh viên"}
            </h3>
            <p className="text-[12.5px] text-slate-500 mt-0.5">
              {result
                ? `Tập tin: ${file?.name ?? ""}`
                : "Hỗ trợ định dạng bảng tính Excel (.xlsx) theo đúng mẫu"}
            </p>
          </div>
        </div>

        {/* Nội dung Modal */}
        <div className="px-5 py-4 bg-white">
          {result ? (
            <StudentImportResult result={result} />
          ) : (
            <form
              id={formId}
              noValidate
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <fieldset
                disabled={importStudents.isPending}
                className="space-y-4"
              >
                <TargetSemesterNote
                  label="Import vào"
                  semester={targetSemester}
                />

                <FormField
                  label="Tệp tin Excel (.xlsx)"
                  required
                  error={errors.file?.message}
                >
                  <FileDropZone
                    file={file}
                    accept=".xlsx"
                    hint="Chấp nhận định dạng .xlsx · Dung lượng tối đa 50 MB"
                    onSelect={(selected) => {
                      if (importStudents.isPending) return;
                      setValue("file", selected, { shouldValidate: true });
                    }}
                    onClear={() => reset()}
                  />
                </FormField>

                {/* Hộp hướng dẫn các cột bắt buộc */}
                <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-4 text-[12.5px] text-slate-700 space-y-2.5">
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <Info className="h-4 w-4 text-[#1565C0] shrink-0" />
                    <span>Yêu cầu cấu trúc dữ liệu:</span>
                  </div>
                  <p className="text-slate-600">
                    File cần có đúng{" "}
                    <span className="font-semibold text-slate-800">8 cột</span>{" "}
                    theo thứ tự sau (dòng đầu tiên là tiêu đề, không gộp ô):
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {IMPORT_COLUMNS.map((column, index) => (
                      <span
                        key={column}
                        className="rounded-md border border-sky-200/90 bg-white px-2 py-0.5 text-[11.5px] font-semibold text-sky-900 shadow-2xs"
                      >
                        {index + 1}. {column}
                      </span>
                    ))}
                  </div>
                  <div className="pt-1 border-t border-sky-100/80">
                    <button
                      type="button"
                      onClick={() =>
                        toast.info("Chức năng tải file mẫu sẽ sớm được hỗ trợ")
                      }
                      className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#1565C0] hover:text-[#0D47A1] hover:underline cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Tải file Excel mẫu
                      (.xlsx)
                    </button>
                  </div>
                </div>
              </fieldset>
            </form>
          )}
        </div>

        {/* Footer Modal */}
        <div className="flex justify-end gap-2.5 border-t border-slate-200 bg-slate-50/70 px-5 py-3 sticky bottom-0 z-20">
          {result ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={backToUpload}
                className="h-9 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 text-[13px] font-semibold hover:bg-slate-50 inline-flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Import file khác
              </Button>
              <Button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="h-9 px-4 rounded-lg bg-[#1565C0] hover:bg-[#0D47A1] text-white text-[13px] font-semibold"
              >
                Hoàn tất
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={importStudents.isPending}
                onClick={() => handleOpenChange(false)}
                className="h-9 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 text-[13px] font-semibold hover:bg-slate-50"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                form={formId}
                disabled={!file || importStudents.isPending}
                className="h-9 px-4 rounded-lg bg-[#1565C0] hover:bg-[#0D47A1] text-white text-[13px] font-semibold inline-flex items-center gap-2 shadow-sm shadow-[#1565C0]/25 disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                {importStudents.isPending ? "Đang xử lý..." : "Xác nhận Import"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
