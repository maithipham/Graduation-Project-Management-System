import { create } from 'zustand'
import type { DepartmentInfo, DepartmentAnnouncement } from '../types'

interface DepartmentContactState {
  info: DepartmentInfo | null
  announcements: DepartmentAnnouncement[]
  setInfo: (info: DepartmentInfo) => void
  setAnnouncements: (announcements: DepartmentAnnouncement[]) => void
}

export const useDepartmentContactStore = create<DepartmentContactState>((set) => ({
  info: null,
  announcements: [],
  setInfo: (info) => set({ info }),
  setAnnouncements: (announcements) => set({ announcements }),
}))
