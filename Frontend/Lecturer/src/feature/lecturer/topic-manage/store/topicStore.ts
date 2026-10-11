import { create } from 'zustand'
import type { LecturerTopicDto } from '../types'

interface TopicState {
  topics: LecturerTopicDto[]
  selectedTopic: LecturerTopicDto | null
  setTopics: (topics: LecturerTopicDto[]) => void
  setSelectedTopic: (topic: LecturerTopicDto | null) => void
}

export const useTopicStore = create<TopicState>((set) => ({
  topics: [],
  selectedTopic: null,
  setTopics: (topics) => set({ topics }),
  setSelectedTopic: (topic) => set({ selectedTopic: topic }),
}))
