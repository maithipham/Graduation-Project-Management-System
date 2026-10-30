import React, { useEffect, useState } from 'react'
import {
  STEPPER_STAGES,
  getTimelineStageIndex,
  useStudentSemester,
} from '@/shared/contexts'

export const StudentProgressStepper: React.FC = () => {
  const { term } = useStudentSemester()
  const [nowMs, setNowMs] = useState<number>(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now())
    }, 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const currentStageIndex = getTimelineStageIndex(term, nowMs)

  return (
    <div
      id="regStepper"
      className="bg-[#F1F5F9] px-4 sm:px-6 py-2 border-b border-slate-200/70 select-none cursor-default"
    >
      <div className="w-full overflow-x-auto">
        <div className="flex items-center min-w-[560px] gap-4 sm:gap-6 px-1 pointer-events-none select-none">
          {STEPPER_STAGES.map((stage, index) => {
            const isDone = index < currentStageIndex
            const isActive = index === currentStageIndex

            const textCls = isActive
              ? 'text-[#1565C0] font-bold'
              : isDone
                ? 'text-slate-800 font-semibold'
                : 'text-slate-600 font-semibold'

            const barCls = isDone || isActive ? 'bg-[#1565C0]' : 'bg-slate-300/90'

            return (
              <div key={stage.title} className="flex-1 text-center min-w-0 cursor-default">
                <div className="block">
                  <span
                    className={`block text-[12px] sm:text-[12.5px] ${textCls} truncate leading-tight`}
                  >
                    {stage.title}
                  </span>
                  <span className={`block h-[2.5px] w-full rounded-full ${barCls} mt-1.5`} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default StudentProgressStepper

