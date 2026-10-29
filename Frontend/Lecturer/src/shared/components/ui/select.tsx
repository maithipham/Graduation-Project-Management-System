import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /**
   * Class cho khung bọc ngoài (chứa cả mũi tên). Đặt độ rộng (`w-44`, `lg:w-60`) ở đây,
   * không đặt ở `className`: khung mặc định rộng 100% nên mũi tên sẽ nằm lệch khỏi ô
   */
  containerClassName?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, containerClassName, children, ...props }, ref) => {
    const isAuto = className?.includes('w-auto')
    return (
      <div
        className={cn('relative inline-block', isAuto ? 'w-auto' : 'w-full', containerClassName)}
      >
        <select
          ref={ref}
          className={cn(
            'flex h-9 w-full appearance-none rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 aria-invalid:border-[#DC2626] aria-invalid:focus-visible:ring-[#DC2626] disabled:cursor-not-allowed disabled:opacity-50 pr-8 text-slate-800 cursor-pointer',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      </div>
    )
  },
)
Select.displayName = 'Select'
