
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import type { AvailableAdvisor } from '../types/registration.types'

interface RegistrationFormModalProps {
  open: boolean
  isEditing: boolean
  lecturers: AvailableAdvisor[]
  initialLecturerId: string | null
  initialLecturerName?: string | null
  initialLecturerCode?: string | null
  initialTopic: string
  isLoadingLecturers?: boolean
  isSubmitting?: boolean
  submitError?: string | null
  onClose: () => void
  onSubmit: (lecturer: AvailableAdvisor, topic: string) => void
}

const RegistrationFormModal: React.FC<RegistrationFormModalProps> = ({
  open,
  isEditing,
  lecturers,
  initialLecturerId,
  initialLecturerName,
  initialLecturerCode,
  initialTopic,
  isLoadingLecturers = false,
  isSubmitting = false,
  submitError = null,
  onClose,
  onSubmit,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(
    initialLecturerId,
  )
  const [topicInput, setTopicInput] = useState(initialTopic)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const pickerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Đồng bộ dữ liệu khi mở modal hoặc khi dữ liệu ban đầu thay đổi.
  useEffect(() => {
    if (open) {
      setSelectedId(initialLecturerId)
      setTopicInput(initialTopic)
      setPickerOpen(false)
      setPickerSearch('')
      setErrorMsg(null)
    }
  }, [open, initialLecturerId, initialTopic])

  // Đóng dropdown khi click bên ngoài.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setPickerOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Tìm giảng viên đang được chọn trong danh sách còn chỉ tiêu.
  // Sử dụng teacherPublicId, không sử dụng semesterAdvisorPublicId.
  const selectedLecturer = useMemo(
    () =>
      lecturers.find(
        (lecturer) => lecturer.teacherPublicId === selectedId,
      ) ?? null,
    [lecturers, selectedId],
  )

  // Kiểm tra GVHD cũ có còn trong danh sách GVHD còn chỉ tiêu không.
  const isPreviousLecturerUnavailable =
    isEditing &&
    !isLoadingLecturers &&
    !!initialLecturerId &&
    !lecturers.some(
      (lecturer) => lecturer.teacherPublicId === initialLecturerId,
    )

  // Sinh viên vẫn đang giữ lựa chọn GVHD cũ đã không còn chỉ tiêu.
  const isKeepingUnavailableLecturer =
    isPreviousLecturerUnavailable &&
    selectedId === initialLecturerId

  // Bắt buộc chọn GVHD mới nếu GVHD cũ không còn trong danh sách.
  const needsNewLecturer =
    isPreviousLecturerUnavailable &&
    (!selectedId || selectedId === initialLecturerId)

  // Lọc danh sách GVHD theo từ khóa tìm kiếm.
  const filteredLecturers = useMemo(() => {
    const keyword = pickerSearch.trim().toLowerCase()

    if (!keyword) {
      return lecturers
    }

    return lecturers.filter((lecturer) => {
      const name = lecturer.teacherName?.toLowerCase() ?? ''
      const code = lecturer.teacherCode?.toLowerCase() ?? ''
      const title = lecturer.academicTitle?.toLowerCase() ?? ''
      const organization = lecturer.organization?.toLowerCase() ?? ''

      return (
        name.includes(keyword) ||
        code.includes(keyword) ||
        title.includes(keyword) ||
        organization.includes(keyword)
      )
    })
  }, [lecturers, pickerSearch])

  // Mở dropdown và focus ô tìm kiếm.
  const handleOpenPicker = () => {
    if (isSubmitting || isLoadingLecturers) return

    setPickerOpen(true)
    setPickerSearch('')

    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 0)
  }

  // Chọn GVHD mới.
  const handleSelectLecturer = (lecturer: AvailableAdvisor) => {
    setSelectedId(lecturer.teacherPublicId)
    setPickerOpen(false)
    setPickerSearch('')
    setErrorMsg(null)
  }

  // Xóa lựa chọn hiện tại để chọn GVHD khác.
  const handleClearLecturer = () => {
    setSelectedId(null)
    setPickerSearch('')
    setErrorMsg(null)
    setPickerOpen(true)

    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 0)
  }

  // Đóng modal.
  const handleClose = () => {
    if (isSubmitting) return

    setPickerOpen(false)
    setErrorMsg(null)
    onClose()
  }

  // Gửi đăng ký hoặc cập nhật đăng ký.
  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMsg(null)

    if (!selectedLecturer) {
      if (needsNewLecturer) {
        setErrorMsg(
          'Giảng viên bạn đã đăng ký trước đó không còn trong danh sách còn chỉ tiêu. Vui lòng chọn giảng viên khác.',
        )
      } else if (isEditing) {
        setErrorMsg(
          'Không tìm thấy giảng viên đã chọn. Vui lòng chọn giảng viên khác.',
        )
      } else {
        setErrorMsg(
          'Vui lòng chọn một giảng viên hướng dẫn từ danh sách.',
        )
      }

      return
    }

    const normalizedTopic = topicInput.trim()

    // Tên đề tài không bắt buộc.
    if (normalizedTopic.length > 500) {
      setErrorMsg('Tên đề tài không được vượt quá 500 ký tự.')
      return
    }

    onSubmit(selectedLecturer, normalizedTopic)
  }

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-5">
      <div className="w-full max-w-xl overflow-visible rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800 sm:text-xl">
              {isEditing
                ? 'Cập nhật đăng ký GVHD'
                : 'Đăng ký giảng viên hướng dẫn'}
            </h2>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              {isEditing
                ? 'Bạn có thể thay đổi giảng viên hướng dẫn và tên đề tài.'
                : 'Chọn giảng viên hướng dẫn cho đồ án tốt nghiệp.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="ml-3 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit}>
          <div className="space-y-5 px-5 py-5 sm:px-6">
            {/* Chọn giảng viên */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Giảng viên hướng dẫn
                <span className="ml-1 text-rose-500">*</span>
              </label>

              <div className="relative" ref={pickerRef}>
                <button
                  type="button"
                  onClick={handleOpenPicker}
                  disabled={isLoadingLecturers || isSubmitting}
                  className={`flex min-h-[54px] w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ${
                    pickerOpen
                      ? 'border-blue-500 ring-2 ring-blue-100'
                      : 'border-slate-200 hover:border-blue-300'
                  } disabled:cursor-not-allowed disabled:bg-slate-50`}
                >
                  {selectedLecturer ? (
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">
                        {selectedLecturer.teacherName}
                      </span>

                      <span className="text-xs text-slate-400">
                        ({selectedLecturer.teacherCode})
                      </span>

                      {selectedLecturer.academicTitle && (
                        <span className="text-xs text-slate-500">
                          {selectedLecturer.academicTitle}
                        </span>
                      )}
                    </div>
                  ) : isKeepingUnavailableLecturer ? (
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">
                        {initialLecturerName ||
                          'Giảng viên đã đăng ký trước đó'}
                      </span>

                      {initialLecturerCode && (
                        <span className="text-xs text-slate-400">
                          ({initialLecturerCode})
                        </span>
                      )}

                      <span className="text-xs font-semibold text-rose-600">
                        Không còn khả dụng
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">
                      {isLoadingLecturers
                        ? 'Đang tải danh sách giảng viên...'
                        : 'Chọn giảng viên hướng dẫn'}
                    </span>
                  )}

                  <span className="shrink-0 text-slate-400">
                    {pickerOpen ? '▲' : '▼'}
                  </span>
                </button>

                {/* Nút xóa lựa chọn */}
                {(selectedLecturer || isKeepingUnavailableLecturer) && (
                  <button
                    type="button"
                    onClick={handleClearLecturer}
                    disabled={isSubmitting}
                    className="absolute right-10 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                    title="Chọn giảng viên khác"
                  >
                    ✕
                  </button>
                )}

                {/* Dropdown */}
                {pickerOpen && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                    <div className="border-b border-slate-100 p-3">
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={pickerSearch}
                        onChange={(event) =>
                          setPickerSearch(event.target.value)
                        }
                        placeholder="Tìm theo tên hoặc mã giảng viên..."
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div className="max-h-60 overflow-y-auto">
                      {isLoadingLecturers ? (
                        <div className="px-4 py-6 text-center text-sm text-slate-500">
                          Đang tải danh sách giảng viên...
                        </div>
                      ) : filteredLecturers.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-slate-500">
                          {lecturers.length === 0
                            ? 'Hiện không có giảng viên nào còn chỉ tiêu trong học kỳ này.'
                            : 'Không tìm thấy giảng viên phù hợp.'}
                        </div>
                      ) : (
                        filteredLecturers.map((lecturer) => {
                          const isSelected =
                            lecturer.teacherPublicId === selectedId

                          return (
                            <button
                              key={lecturer.teacherPublicId}
                              type="button"
                              onClick={() =>
                                handleSelectLecturer(lecturer)
                              }
                              className={`flex w-full items-center justify-between gap-3 border-b border-slate-50 px-4 py-3 text-left transition last:border-b-0 hover:bg-blue-50 ${
                                isSelected ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-semibold text-slate-800">
                                    {lecturer.teacherName}
                                  </span>

                                  <span className="text-xs text-slate-400">
                                    ({lecturer.teacherCode})
                                  </span>
                                </div>

                                <div className="mt-1 text-xs text-slate-500">
                                  {lecturer.academicTitle && (
                                    <span>
                                      {lecturer.academicTitle}
                                    </span>
                                  )}

                                  {lecturer.organization && (
                                    <span>
                                      {lecturer.academicTitle
                                        ? ' · '
                                        : ''}
                                      {lecturer.organization}
                                    </span>
                                  )}
                                </div>

                                <div className="mt-1 text-xs font-medium text-emerald-600">
                                  Còn {lecturer.remainingSlots} chỉ tiêu
                                </div>
                              </div>

                              {isSelected && (
                                <span className="shrink-0 text-sm font-bold text-blue-600">
                                  ✓
                                </span>
                              )}
                            </button>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Cảnh báo khi GVHD cũ không còn trong danh sách */}
              {needsNewLecturer && (
                <p className="mt-2 text-xs font-medium leading-5 text-rose-600">
                  Giảng viên bạn đã đăng ký trước đó không còn trong danh
                  sách giảng viên còn chỉ tiêu của học kỳ này. Vui lòng
                  chọn giảng viên khác.
                </p>
              )}

              <p className="mt-2 text-xs text-slate-400">
                Danh sách chỉ hiển thị giảng viên được phân bổ trong học
                kỳ hiện tại và còn chỉ tiêu hướng dẫn.
              </p>
            </div>

            {/* Tên đề tài */}
            <div>
              <label
                htmlFor="topicName"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Tên đề tài
                <span className="ml-1 text-xs font-normal text-slate-400">
                  (Không bắt buộc)
                </span>
              </label>

              <textarea
                id="topicName"
                value={topicInput}
                onChange={(event) => {
                  setTopicInput(event.target.value)
                  setErrorMsg(null)
                }}
                maxLength={500}
                rows={3}
                disabled={isSubmitting}
                placeholder="Nhập tên đề tài nếu đã có (có thể để trống)..."
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
              />

              <div className="mt-1 flex justify-end">
                <span className="text-xs text-slate-400">
                  {topicInput.length}/500 ký tự
                </span>
              </div>
            </div>

            {/* Lỗi */}
            {(errorMsg || submitError) && (
              <div className="rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {errorMsg || submitError}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                isLoadingLecturers ||
                (!isEditing && lecturers.length === 0)
              }
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? 'Đang xử lý...'
                : isEditing
                  ? 'Cập nhật đăng ký'
                  : 'Gửi đăng ký'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RegistrationFormModal
