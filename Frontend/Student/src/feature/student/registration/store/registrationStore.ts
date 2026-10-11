import { create } from 'zustand'
import type { StudentTopic } from '../types'

interface RegistrationState {
  registeredTopic: StudentTopic | null
  availableTopics: StudentTopic[]
  setRegisteredTopic: (t: StudentTopic | null) => void
  setAvailableTopics: (topics: StudentTopic[]) => void
}

export const useRegistrationStore = create<RegistrationState>((set) => ({
  registeredTopic: null,
  availableTopics: [],
  setRegisteredTopic: (registeredTopic) => set({ registeredTopic }),
  setAvailableTopics: (availableTopics) => set({ availableTopics }),
}))
