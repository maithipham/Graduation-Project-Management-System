import * as React from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

export interface SearchableSelectOption {
  value: string
  label: string
  description?: string
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  id?: string
  allowClear?: boolean
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value = '',
  onChange,
  placeholder = '-- Chọn --',
  searchPlaceholder = 'Tìm kiếm...',
  emptyText = 'Không tìm thấy kết quả phù hợp',
  disabled = false,
  className,
  id,
  allowClear = true,
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState('')
  const containerRef = React.useRef<HTMLDivElement>(null)
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  const selectedOption = React.useMemo(
    () => options.find((opt) => String(opt.value) === String(value)),
    [options, value],
  )

  const filteredOptions = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return options
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(term) ||
        (opt.description && opt.description.toLowerCase().includes(term)),
    )
  }, [options, searchTerm])

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev
      if (next) setSearchTerm('')
      return next
    })
  }

  const handleSelect = (val: string) => {
    onChange(val)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50 text-left',
          !selectedOption && 'text-slate-400',
          disabled && 'bg-slate-50',
        )}
      >
        <span className="truncate pr-2 text-slate-800">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {allowClear && selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleClear(e as unknown as React.MouseEvent)
                }
              }}
              className="p-0.5 hover:text-slate-600 rounded transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown
            className={cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-full min-w-[220px] rounded-md border border-slate-200 bg-white p-1.5 shadow-lg animate-in fade-in-0 zoom-in-95 duration-100">
          <div className="relative mb-1.5">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-8 w-full rounded border border-slate-200 bg-slate-50 pl-8 pr-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="max-h-56 overflow-y-auto pr-0.5 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value)
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      'flex w-full items-center justify-between rounded px-2.5 py-1.5 text-xs text-left transition-colors',
                      isSelected
                        ? 'bg-blue-50 font-semibold text-blue-700'
                        : 'text-slate-700 hover:bg-slate-100',
                    )}
                  >
                    <div className="flex flex-col truncate pr-2">
                      <span className="truncate">{opt.label}</span>
                      {opt.description && (
                        <span className="text-[11px] font-normal text-slate-400 truncate">
                          {opt.description}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
