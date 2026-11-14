import { useLecturerPortalStore } from '@/features/lecturer/lecturer_portal_storage'
import type {
  TopicProposalItem,
  TopicProposalCounts,
} from '../types/topicProposal.types'

export const topicProposalService = {
  getProposals: (): TopicProposalItem[] => {
    return useLecturerPortalStore.getState().topicProposals
  },

  approveProposal: (id: string): void => {
    useLecturerPortalStore.getState().approveTopicProposal(id)
  },

  rejectProposal: (id: string, reason?: string): void => {
    useLecturerPortalStore.getState().rejectTopicProposal(id, reason)
  },

  getCounts: (items: TopicProposalItem[]): TopicProposalCounts => {
    return {
      pending: items.filter((p) => p.status === 'pending').length,
      approved: items.filter((p) => p.status === 'approved').length,
      rejected: items.filter((p) => p.status === 'rejected').length,
      all: items.length,
    }
  },
}

