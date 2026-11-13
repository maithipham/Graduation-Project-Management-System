import { create } from 'zustand'
import type { TopicProposalTabStatus } from '../types/topicProposal.types'

interface TopicProposalUiState {
  selectedSemesterId: string
  tabStatus: TopicProposalTabStatus
  searchQuery: string
  setSelectedSemesterId: (id: string) => void
  setTabStatus: (status: TopicProposalTabStatus) => void
  setSearchQuery: (query: string) => void
}

export const useTopicProposalStore = create<TopicProposalUiState>((set) => ({
  selectedSemesterId: '',
  tabStatus: 'PENDING',
  searchQuery: '',
  setSelectedSemesterId: (id) => set({ selectedSemesterId: id }),
  setTabStatus: (status) => set({ tabStatus: status }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}))
