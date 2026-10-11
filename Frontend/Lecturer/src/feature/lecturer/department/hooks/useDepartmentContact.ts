import { useState, useEffect } from 'react'
import { departmentContactService } from '../services/departmentContact.service'
import type { DepartmentInfo, DepartmentAnnouncement } from '../types'

export function useDepartmentContact() {
  const [info, setInfo] = useState<DepartmentInfo | null>(null)
  const [announcements, setAnnouncements] = useState<DepartmentAnnouncement[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    Promise.all([
      departmentContactService.getDepartmentInfo(),
      departmentContactService.getAnnouncements(),
    ]).then(([inf, ann]) => {
      if (mounted) {
        setInfo(inf)
        setAnnouncements(ann)
        setIsLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  return { info, announcements, isLoading }
}
