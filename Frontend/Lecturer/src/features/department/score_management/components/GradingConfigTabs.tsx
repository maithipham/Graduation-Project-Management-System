import { cn } from '@/shared/utils/cn'
import type { RubricRole } from '../types'
import { RUBRIC_ROLE_TABS } from '../utils/rubricHelpers'

interface GradingConfigTabsProps {
  value: RubricRole
  onChange: (role: RubricRole) => void
}

/** Thanh 3 tab rubric (Hướng dẫn / Phản biện / Hội đồng) */
export function GradingConfigTabs({ value, onChange }: GradingConfigTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Loại phiếu chấm"
      className="flex h-10 flex-1 items-stretch gap-1 rounded-xl border border-slate-300/70 bg-[#E2E8F0] p-1 text-[13px]"
    >
      {RUBRIC_ROLE_TABS.map((tab) => {
        const active = tab.role === value
        return (
          <button
            key={tab.role}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.role)}
            className={cn(
              'flex-1 cursor-pointer rounded-lg px-4 transition-all',
              active ? 'bg-white font-bold text-[#1565C0] shadow-xs' : 'font-medium text-slate-600 hover:text-slate-900',
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
