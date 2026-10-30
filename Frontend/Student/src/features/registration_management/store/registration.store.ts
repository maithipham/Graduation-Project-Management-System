import { create } from 'zustand'
import type { SupervisorRegistrationItem } from '../types/registration.types'

interface RegistrationState {
  mentor: string
  topic: string
  assignedByTbm: boolean
  requests: SupervisorRegistrationItem[]
  setMentor: (mentor: string) => void
  setTopic: (topic: string) => void
  setAssignedByTbm: (assigned: boolean) => void
  setRequests: (
    requests:
      | SupervisorRegistrationItem[]
      | ((prev: SupervisorRegistrationItem[]) => SupervisorRegistrationItem[]),
  ) => void
}

export const useRegistrationStore = create<RegistrationState>((set) => ({
  mentor: '',
  topic: '',
  assignedByTbm: false,
  requests: [],
  setMentor: (mentor) => set({ mentor }),
  setTopic: (topic) => set({ topic }),
  setAssignedByTbm: (assignedByTbm) => set({ assignedByTbm }),
  setRequests: (requests) =>
    set((state) => ({
      requests:
        typeof requests === 'function' ? requests(state.requests) : requests,
    })),
}))
