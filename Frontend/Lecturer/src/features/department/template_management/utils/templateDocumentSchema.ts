import { z } from 'zod'
import { isApiError } from '@/shared/types'
import { FILE_TYPE_VALUES, getFileExtension } from './templateCategory'

/** Đuôi file BE chấp nhận (chỉ kiểm tra đuôi, không kiểm tra nội dung) */
export const ALLOWED_TEMPLATE_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'txt',
  'zip',
  'rar',
] as const

/** Chuỗi cho thuộc tính `accept` của ô chọn file */
export const TEMPLATE_FILE_ACCEPT = ALLOWED_TEMPLATE_EXTENSIONS.map((ext) => `.${ext}`).join(',')

/** Spring nhận tối đa 50MB nhưng gói Free của Cloudinary chỉ nhận 10MB/file → chặn ở 10MB */
export const MAX_TEMPLATE_FILE_BYTES = 10 * 1024 * 1024

export const TEMPLATE_FILE_HINT = 'Chấp nhận PDF, Word, Excel, PowerPoint, TXT, ZIP, RAR · Tối đa 10 MB'

// Message giữ giống BE
const fileRule = z
  .instanceof(File, { error: 'Vui lòng chọn tài liệu cần tải lên' })
  .refine((file) => file.size > 0, 'Vui lòng chọn tài liệu cần tải lên')
  .refine(
    (file) => (ALLOWED_TEMPLATE_EXTENSIONS as readonly string[]).includes(getFileExtension(file.name)),
    'Định dạng tài liệu không được hỗ trợ (chỉ nhận PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP, RAR)',
  )
  .refine((file) => file.size <= MAX_TEMPLATE_FILE_BYTES, 'Tài liệu vượt quá dung lượng cho phép (10MB)')

const fileTypeRule = z.enum(FILE_TYPE_VALUES, { error: 'Vui lòng chọn loại tài liệu' })

const fileNameRule = z.string().trim().max(255, 'Tên tài liệu không được vượt quá 255 ký tự')

/** Form "Tải lên tài liệu": tên bỏ trống → BE lấy tên file gốc */
export const createTemplateFileSchema = z.object({
  file: fileRule,
  fileType: fileTypeRule,
  fileName: fileNameRule,
})

/** Form "Sửa tài liệu": luôn gửi lại tên (để tên không bị đổi theo file mới), file mới là tùy chọn */
export const updateTemplateFileSchema = z.object({
  file: fileRule.optional(),
  fileType: fileTypeRule,
  fileName: fileNameRule.min(1, 'Vui lòng nhập tên tài liệu'),
})

export type CreateTemplateFileFormInput = z.input<typeof createTemplateFileSchema>
export type CreateTemplateFileFormValues = z.output<typeof createTemplateFileSchema>
export type UpdateTemplateFileFormInput = z.input<typeof updateTemplateFileSchema>
export type UpdateTemplateFileFormValues = z.output<typeof updateTemplateFileSchema>

type TemplateFormField = 'file' | 'fileType' | 'fileName'

/**
 * BE dùng chung code 4000 cho mọi lỗi dữ liệu nhập → đoán ô bị lỗi theo `message`.
 * Không gắn được vào ô nào → `undefined` (hiện dòng lỗi chung trên form).
 */
export function getTemplateErrorField(error: unknown): TemplateFormField | undefined {
  if (!isApiError(error)) return undefined
  const message = error.message.toLowerCase()
  if (message.includes('tên tài liệu')) return 'fileName'
  if (message.includes('loại tài liệu') || error.code === 1003) return 'fileType'
  if (
    message.includes('file import') ||
    message.includes('định dạng tài liệu') ||
    message.includes('chọn tài liệu')
  ) {
    return 'file'
  }
  return undefined
}
