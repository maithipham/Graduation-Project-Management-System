import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Search, SearchX, UserPlus, X } from 'lucide-react'
import {
  cleanDepartmentLabel,
  isLecturerQuotaFull,
  normalizeRegistrationText,
} from '../services/registration.service'
import type { RegistrationLecturerOption } from '../types/registration.types'
import { OriginBadge } from './RegistrationHistoryTable'

interface RegistrationFormModalProps {
  open: boolean
  isEditing: boolean
  lecturers: RegistrationLecturerOption[]
  initialLecturerId: number | null
  initialTopic: string
  onClose: () => void
  onSubmit: (lecturer: RegistrationLecturerOption, topic: string) => void
}

export const RegistrationFormModal: React.FC<RegistrationFormModalProps> = ({
  open,
  isEditing,
  lecturers,
  initialLecturerId,
  initialTopic,
  onClose,
  onSubmit,
}) => {
  const [selectedId, setSelectedId] = useState<number | null>(initialLecturerId)
  const [topicInput, setTopicInput] = useState<string>(initialTopic)
  const [pickerOpen, setPickerOpen] = useState<boolean>(false)
  const [pickerSearch, setPickerSearch] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string>('')

  const wrapperRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [prevModalState, setPrevModalState] = useState({
    open,
    initialLecturerId,
    initialTopic,
  })

  if (
    prevModalState.open !== open ||
    prevModalState.initialLecturerId !== initialLecturerId ||
    prevModalState.initialTopic !== initialTopic
  ) {
    setPrevModalState({ open, initialLecturerId, initialTopic })
    if (open) {
      setSelectedId(initialLecturerId)
      setTopicInput(initialTopic)
      setPickerOpen(false)
      setPickerSearch('')
      setErrorMsg('')
    }
  }

  useEffect(() => {
    if (!pickerOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (wrapperRef.current && !wrapperRef.current.contains(target)) {
        setPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [pickerOpen])

  useEffect(() => {
    if (pickerOpen) {
      const timer = window.setTimeout(() => {
        searchInputRef.current?.focus()
      }, 40)
      return () => window.clearTimeout(timer)
    }
  }, [pickerOpen])

  const selectedLecturer = useMemo(
    () => lecturers.find((l) => l.id === selectedId) ?? null,
    [lecturers, selectedId],
  )

  const filteredLecturers = useMemo(() => {
    const query = normalizeRegistrationText(pickerSearch)
    if (!query) return lecturers
    return lecturers.filter((l) => {
      const haystack = normalizeRegistrationText(
        [l.name, l.department, l.unit ?? '', l.field, l.email].join(' '),
      )
      return haystack.includes(query)
    })
  }, [lecturers, pickerSearch])

  if (!open) return null

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLecturer) {
      setErrorMsg('Vui lòng chọn một giảng viên hướng dẫn từ danh sách.')
      return
    }
    onSubmit(selectedLecturer, topicInput.trim())
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl flex flex-col overflow-visible relative">
        {/* Header popup */}
        <div className="px-7 pt-6 pb-2 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-blue-50 text-[#1565C0] flex items-center justify-center">
              <UserPlus size={20} />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {isEditing
                  ? 'Chỉnh sửa đơn đăng ký giảng viên hướng dẫn'
                  : 'Đơn đăng ký giảng viên hướng dẫn'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleFormSubmit} className="flex flex-col overflow-visible" noValidate>
          <div className="px-7 py-4 space-y-5 overflow-visible flex flex-col">
            {/* Phần 1: Chọn Giảng viên hướng dẫn */}
            <div className="relative" ref={wrapperRef}>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Giảng viên hướng dẫn <span className="text-rose-500">*</span>
                </label>
              </div>

              {/* Trigger mở dropdown */}
              <div
                onClick={() => setPickerOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-300 bg-white hover:border-slate-400 cursor-pointer transition shadow-2xs select-none"
              >
                {selectedLecturer ? (
                  <div className="flex items-center gap-2 text-xs sm:text-[13px] flex-wrap flex-1 min-w-0">
                    <OriginBadge origin={selectedLecturer.origin} />
                    <span className="text-slate-500 font-medium">
                      {cleanDepartmentLabel(selectedLecturer.department)}
                    </span>
                    <span className="text-slate-300">/</span>
                    <span className="font-bold text-slate-900">{selectedLecturer.name}</span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      ({selectedLecturer.email})
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 text-slate-400 text-xs sm:text-[13px] flex-1 min-w-0">
                    <Search size={16} className="text-slate-400 shrink-0" />
                    <span className="truncate">Tìm kiếm và chọn giảng viên hướng dẫn...</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {selectedLecturer && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedId(null)
                        setPickerSearch('')
                        setPickerOpen(true)
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Xóa để chọn lại"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform duration-200 ${
                      pickerOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Dropdown Popover có Search */}
              {pickerOpen && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-black/5">
                  <div className="p-3 border-b border-slate-100 bg-slate-50/80 shrink-0">
                    <div className="relative">
                      <Search
                        size={16}
                        className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                      />
                      <input
                        ref={searchInputRef}
                        type="text"
                        autoComplete="off"
                        value={pickerSearch}
                        onChange={(e) => setPickerSearch(e.target.value)}
                        placeholder="Tìm kiếm giảng viên, bộ môn, trường..."
                        className="w-full text-xs pl-9 pr-8 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1565C0]/30 focus:border-[#1565C0]"
                      />
                      {pickerSearch && (
                        <button
                          type="button"
                          onClick={() => {
                            setPickerSearch('')
                            searchInputRef.current?.focus()
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-60 sm:max-h-72 overflow-y-auto p-1.5 divide-y divide-slate-100">
                    {filteredLecturers.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        <SearchX size={32} className="text-slate-300 mx-auto mb-1.5" />
                        Không tìm thấy giảng viên nào
                        {pickerSearch ? (
                          <>
                            {' '}
                            khớp với &quot;<strong>{pickerSearch}</strong>&quot;
                          </>
                        ) : null}
                        .
                      </div>
                    ) : (
                      filteredLecturers.map((lecturer) => {
                        const full = isLecturerQuotaFull(lecturer)
                        const isSelected = lecturer.id === selectedId
                        return (
                          <div
                            key={lecturer.id}
                            onClick={() => {
                              if (!full) {
                                setSelectedId(lecturer.id)
                                setErrorMsg('')
                                setPickerOpen(false)
                              }
                            }}
                            className={`px-4 py-3 hover:bg-slate-50 transition flex items-center justify-between gap-4 ${
                              full
                                ? 'opacity-50 cursor-not-allowed bg-slate-50'
                                : isSelected
                                  ? 'bg-blue-50/70 font-semibold cursor-pointer'
                                  : 'cursor-pointer'
                            }`}
                          >
                            <span className="text-[13.5px] font-semibold text-slate-900 truncate">
                              {lecturer.name}
                              {full ? ' (Đã đủ chỉ tiêu)' : ''}
                            </span>
                            <span className="text-[13px] text-slate-700 font-normal shrink-0">
                              {cleanDepartmentLabel(lecturer.department)}
                            </span>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}

              {errorMsg && (
                <p className="text-[11px] text-rose-600 font-medium mt-1.5">{errorMsg}</p>
              )}
            </div>

            {/* Phần 2: Tên đề tài */}
            <div className="flex flex-col">
              <label
                htmlFor="regTopicInput"
                className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-2"
              >
                Tên đề tài
              </label>
              <textarea
                id="regTopicInput"
                rows={3}
                maxLength={300}
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="Nhập tên đề tài dự kiến..."
                className="w-full h-24 sm:h-28 text-xs sm:text-sm p-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#1565C0]/30 focus:border-[#1565C0] leading-relaxed resize-none transition-colors"
              />
            </div>
          </div>

          {/* Footer popup */}
          <div className="px-7 pt-2 pb-6 bg-white flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#1565C0] text-white hover:bg-[#0D47A1] transition-colors shadow-xs cursor-pointer"
            >
              <span>{isEditing ? 'Cập nhật đơn đăng ký' : 'Gửi đơn đăng ký'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

