import type React from 'react'

export const Feature2Card: React.FC<{ name: string; description?: string }> = ({
  name,
  description,
}) => {
  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
      <h4 className="font-semibold text-slate-800">{name}</h4>
      {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
    </div>
  )
}
