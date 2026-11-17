import { cn } from '@/shared/utils/cn'
import type { RubricRole } from '../types'
import { RUBRIC_ROLE_TABS } from '../utils/rubricHelpers'

interface RubricRoleTabsProps {
  value: RubricRole
  onChange: (role: RubricRole) => void
}

/** 3 tab vai trò: Hướng dẫn / Phản biện / Hội đồng */
export function RubricRoleTabs({ value, onChange }: RubricRoleTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Vai trò chấm điểm"
      className="flex h-10 flex-1 items-center gap-1 rounded-xl border border-slate-300/70 bg-[#E2E8F0] p-1 text-[13px]"
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
              'h-8 flex-1 cursor-pointer rounded-lg px-4 transition-all',
              active
                ? 'bg-white font-bold text-[#1565C0] shadow-xs'
                : 'font-medium text-slate-600 hover:text-slate-900',
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
