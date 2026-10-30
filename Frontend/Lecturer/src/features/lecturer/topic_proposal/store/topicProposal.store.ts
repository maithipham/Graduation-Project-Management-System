import { useLecturerPortalStore } from '@/features/lecturer/lecturer_portal_storage'
import type { TopicProposalItem } from '../types/topicProposal.types'

export const useTopicProposalStore = () => {
  const topicProposals = useLecturerPortalStore((s) => s.topicProposals)
  const approveTopicProposal = useLecturerPortalStore((s) => s.approveTopicProposal)
  const rejectTopicProposal = useLecturerPortalStore((s) => s.rejectTopicProposal)

  return {
    topicProposals: topicProposals as TopicProposalItem[],
    approveTopicProposal,
    rejectTopicProposal,
  }
}

