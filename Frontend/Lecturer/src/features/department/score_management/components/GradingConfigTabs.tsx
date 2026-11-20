import { Scale } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import type { GradingConfigTab } from '../types'
import { RUBRIC_ROLE_TABS } from '../utils/rubricHelpers'

interface GradingConfigTabsProps {
  value: GradingConfigTab
  onChange: (tab: GradingConfigTab) => void
}

/** Thanh 3 tab rubric (Hướng dẫn / Phản biện / Hội đồng) + nút "Trọng số" đứng riêng bên cạnh */
export function GradingConfigTabs({ value, onChange }: GradingConfigTabsProps) {
  const weightActive = value === 'weight'
  return (
    <div className="flex flex-1 items-center gap-3">
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

      <button
        type="button"
        aria-pressed={weightActive}
        onClick={() => onChange('weight')}
        className={cn(
          'inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-5 text-[13px] transition-all',
          weightActive
            ? 'border-[#1565C0] bg-blue-50 font-bold text-[#1565C0] shadow-xs'
            : 'border-slate-300/70 bg-white font-medium text-slate-600 hover:border-[#1565C0] hover:text-[#1565C0]',
        )}
      >
        <Scale className="h-4 w-4" />
        Trọng số
      </button>
    </div>
  )
}
