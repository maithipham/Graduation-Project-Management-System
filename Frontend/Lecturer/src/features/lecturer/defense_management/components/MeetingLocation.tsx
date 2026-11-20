import React from 'react'
import { cn } from '@/shared/utils/cn'
import { extractMeetingUrl } from '../utils/defenseCalendar'

interface MeetingLocationProps {
  location: string | null | undefined
  fallback?: string
  className?: string
}

/**
 * Địa điểm lịch phản biện / bảo vệ: có link phòng họp trực tuyến thì bấm để mở link ở tab mới,
 * không có link thì hiện chữ thường.
 */
export const MeetingLocation: React.FC<MeetingLocationProps> = ({ location, fallback = '', className }) => {
  const url = extractMeetingUrl(location)
  if (!location) return <span className={className}>{fallback}</span>
  if (!url) return <span className={className}>{location}</span>
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      title="Mở link phòng họp trực tuyến"
      className={cn(className, 'text-[#1565C0] font-semibold hover:underline')}
    >
      {location}
    </a>
  )
}

export default MeetingLocation
