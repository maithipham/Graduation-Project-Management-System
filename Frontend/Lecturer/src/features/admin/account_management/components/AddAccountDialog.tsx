import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { FormField } from '@/shared/components/ui/form-field'
import { Input } from '@/shared/components/ui/input'
import { Select } from '@/shared/components/ui/select'
import { SearchableSelect } from '@/shared/components/ui/searchable-select'
import { Button } from '@/shared/components/ui/button'
import { toast } from '@/shared/components/feedback/toast.store'
import { useMajors } from '@/features/department/student_management/hooks/useStudents'
import {
  addAccountSchema,
  type AddAccountFormValues,
  type UserAccount,
} from '../types/account.types'

interface AddAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingAccounts: UserAccount[]
  onAccountAdded: (values: AddAccountFormValues) => void
}

const defaultValues: AddAccountFormValues = {
  name: '',
  email: '',
  phone: '',
  role: 'Sinh viên',
  lecturerType: 'internal',
  unit: '',
  facultyId: '',
  major: '',
  department: '',
  status: 'active',
}

export const AddAccountDialog: React.FC<AddAccountDialogProps> = ({
  open,
  onOpenChange,
  existingAccounts,
  onAccountAdded,
}) => {
  const { data: apiMajors, isLoading: isLoadingMajors } = useMajors()

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AddAccountFormValues>({
    resolver: zodResolver(addAccountSchema),
    defaultValues,
  })

  const currentRole = watch('role')
  const currentLecturerType = watch('lecturerType') || 'internal'

  // Danh sách ngành gọi trực tiếp từ database (GET /major)
  const majorSelectOptions = React.useMemo(() => {
    if (!apiMajors || apiMajors.length === 0) return []
    return apiMajors.map((m) => ({
      value: m.name,
      label: m.name,
      description: m.code ? `Mã ngành: ${m.code}` : undefined,
    }))
  }, [apiMajors])

  // Reset form khi modal mở ra
  React.useEffect(() => {
    if (open) {
      reset(defaultValues)
    }
  }, [open, reset])

  const onSubmit = (values: AddAccountFormValues) => {
    // Kiểm tra trùng email (client-side)
    const isDuplicate = existingAccounts.some(
      (acc) => acc.email.toLowerCase() === values.email.trim().toLowerCase(),
    )
    if (isDuplicate) {
      setError('email', {
        type: 'manual',
        message: 'Địa chỉ email này đã tồn tại trong hệ thống.',
      })
      return
    }

    // Xác định unit & department theo đối tượng
    let finalUnit = '—'
    let finalMajor = values.major || ''
    let finalDepartment = values.department || ''

    if (values.role === 'Sinh viên') {
      finalUnit = values.major ? `Ngành ${values.major}` : '—'
      finalDepartment = 'Đại học Thủy Lợi'
    } else if (values.role === 'Giảng viên') {
      if (values.lecturerType === 'internal') {
        finalDepartment = 'Đại học Thủy Lợi'
        finalUnit = values.major ? `${values.major} - ĐH Thủy Lợi` : 'Đại học Thủy Lợi'
      } else {
        // Ngoài trường: không có chuyên ngành trường mình
        finalMajor = ''
        finalDepartment = values.department || 'Đơn vị ngoài trường'
        finalUnit = finalDepartment
      }
    }

    try {
      onAccountAdded({
        ...values,
        major: finalMajor,
        department: finalDepartment,
        unit: finalUnit,
      })
      toast.success('Thêm tài khoản mới thành công!')
      onOpenChange(false)
    } catch {
      setError('root.server', {
        message: 'Đã có lỗi xảy ra trong quá trình thêm tài khoản.',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-slate-100 shrink-0">
          <DialogTitle className="text-base font-bold text-slate-900">
            Thêm tài khoản người dùng
          </DialogTitle>
        </DialogHeader>

        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
              <FormField
                label="Họ và tên"
                required
                error={errors.name?.message}
              >
                <Input
                  placeholder="Ví dụ: Nguyễn Văn A"
                  {...register('name')}
                />
              </FormField>
            </div>

            <div className="sm:col-span-2">
              <FormField
                label="Địa chỉ Email"
                required
                error={errors.email?.message}
              >
                <Input
                  type="email"
                  placeholder="nguyenvana@gmail.com"
                  {...register('email')}
                />
              </FormField>
            </div>

            <div>
              <FormField
                label="Số điện thoại"
                error={errors.phone?.message}
              >
                <Input
                  type="tel"
                  placeholder="0912 345 678"
                  {...register('phone')}
                />
              </FormField>
            </div>

            <div>
              <FormField
                label="Vai trò"
                required
                error={errors.role?.message}
              >
                <Select
                  {...register('role', {
                    onChange: (e) => {
                      if (e.target.value === 'Sinh viên') {
                        setValue('lecturerType', 'internal')
                        setValue('department', 'Đại học Thủy Lợi')
                      } else if (e.target.value === 'Giảng viên') {
                        if (currentLecturerType === 'internal') {
                          setValue('department', 'Đại học Thủy Lợi')
                        } else {
                          setValue('department', '')
                        }
                      }
                    },
                  })}
                >
                  <option value="Giảng viên">Giảng viên</option>
                  <option value="Sinh viên">Sinh viên</option>
                </Select>
              </FormField>
            </div>

            {/* Nếu là Giảng viên: Cho chọn Trong trường hoặc Ngoài trường */}
            {currentRole === 'Giảng viên' && (
              <div className="sm:col-span-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="block text-xs font-semibold text-slate-700 mb-2">
                  Phân loại giảng viên:
                </span>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      value="internal"
                      className="text-blue-600 focus:ring-blue-500"
                      {...register('lecturerType', {
                        onChange: () => {
                          setValue('department', 'Đại học Thủy Lợi')
                        },
                      })}
                    />
                    <span>Trong trường</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      value="external"
                      className="text-blue-600 focus:ring-blue-500"
                      {...register('lecturerType', {
                        onChange: () => {
                          setValue('department', '')
                          setValue('major', '')
                        },
                      })}
                    />
                    <span>Ngoài trường</span>
                  </label>
                </div>
              </div>
            )}

            {/* Nếu là Sinh viên hoặc Giảng viên trong trường: Chọn Chuyên ngành */}
            {(currentRole === 'Sinh viên' || (currentRole === 'Giảng viên' && currentLecturerType === 'internal')) && (
              <div className="sm:col-span-2">
                <FormField
                  label="Chuyên ngành"
                  required={currentRole === 'Sinh viên'}
                  error={errors.major?.message}
                >
                  <Controller
                    control={control}
                    name="major"
                    render={({ field }) => (
                      <SearchableSelect
                        options={majorSelectOptions}
                        value={field.value}
                        disabled={isLoadingMajors}
                        onChange={field.onChange}
                        placeholder={
                          isLoadingMajors
                            ? 'Đang tải danh sách ngành từ cơ sở dữ liệu...'
                            : '-- Chọn chuyên ngành --'
                        }
                        searchPlaceholder="Gõ để tìm kiếm ngành..."
                        emptyText="Chưa có dữ liệu chuyên ngành"
                      />
                    )}
                  />
                </FormField>
              </div>
            )}

            {/* Nếu là Giảng viên ngoài trường: Nhập cơ quan / trường ngoài */}
            {currentRole === 'Giảng viên' && currentLecturerType === 'external' && (
              <div className="sm:col-span-2">
                <FormField
                  label="Đơn vị / Cơ quan công tác (ngoài trường)"
                  required
                  error={errors.department?.message}
                >
                  <Input
                    placeholder="Ví dụ: Đại học Bách Khoa Hà Nội, Viettel, FPT Software..."
                    {...register('department')}
                  />
                </FormField>
              </div>
            )}

              <div className="sm:col-span-2">
                <FormField
                  label="Trạng thái ban đầu"
                  error={errors.status?.message}
                >
                  <Select {...register('status')}>
                    <option value="active">Hoạt động ngay</option>
                    <option value="inactive">Không hoạt động (Tạm dừng)</option>
                  </Select>
                </FormField>
              </div>
            </div>

            {errors.root?.server && (
              <p role="alert" className="text-xs font-semibold text-[#DC2626]">
                {errors.root.server.message}
              </p>
            )}
          </div>

          <DialogFooter className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 shrink-0">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#1565C0] hover:bg-[#0D47A1] text-white"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
