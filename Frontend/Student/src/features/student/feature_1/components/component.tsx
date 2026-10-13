import type React from 'react'

export const Feature1Card: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200">
      <h4 className="font-semibold text-slate-800">{title}</h4>
    </div>
  )
}
