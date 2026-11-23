import { useQuery } from '@tanstack/react-query'
import {
  supervisorRegistrationService,
  useLecturerCurrentSemester,
} from '@/features/lecturer/supervisor_registration'
import { topicProposalService } from '@/features/lecturer/topic_proposal'
import { outlineReviewService } from '@/features/lecturer/outline_review'
import { reportCheckService } from '@/features/lecturer/report_check'
import type { LecturerNavBadgeKey } from '../components/lecturerNav.config'

const REFRESH_MS = 60 * 1000

/**
 * Số việc đang chờ xử lý hiển thị trên menu, lấy từ API thật của học kỳ hiện tại.
 * Mục chưa có API đếm (bảo vệ) trả 0 nên không hiện huy hiệu.
 */
export function useLecturerNavBadges(): (key?: LecturerNavBadgeKey) => number {
  const { data: semester } = useLecturerCurrentSemester()
  const semesterId = semester?.publicId
  const enabled = Boolean(semesterId)

  const requests = useQuery({
    queryKey: ['lecturer', 'nav-badge', 'supervisor-requests', semesterId],
    queryFn: () =>
      supervisorRegistrationService.getRequests({
        semesterPublicId: semesterId!,
        status: 'pending',
        keyword: '',
      }),
    enabled,
    staleTime: REFRESH_MS,
    retry: false,
  })

  const topics = useQuery({
    queryKey: ['lecturer', 'nav-badge', 'topic-title', semesterId],
    queryFn: () => topicProposalService.getRequestsForSupervisor({ semesterId, status: 'PENDING' }),
    enabled,
    staleTime: REFRESH_MS,
    retry: false,
  })

  const outlines = useQuery({
    queryKey: ['lecturer', 'nav-badge', 'outline', semesterId],
    queryFn: () => outlineReviewService.getSupervisorList({ semesterId, status: 'PENDING' }),
    enabled,
    staleTime: REFRESH_MS,
    retry: false,
  })

  const reports = useQuery({
    queryKey: ['lecturer', 'nav-badge', 'report', semesterId],
    queryFn: () => reportCheckService.getSupervisorFinalReports({ semesterId, status: 'PENDING' }),
    enabled,
    staleTime: REFRESH_MS,
    retry: false,
  })

  const supervisorRequests = requests.data?.counts.pending ?? 0
  const topicProposals = topics.data?.length ?? 0
  const outlineCount = outlines.data?.length ?? 0
  const reportCount = reports.data?.length ?? 0

  return (key) => {
    switch (key) {
      case 'supervisorRequests':
        return supervisorRequests
      case 'topicProposals':
        return topicProposals
      case 'outlines':
        return outlineCount
      case 'reports':
        return reportCount
      case 'topicAssignmentGroup':
        return supervisorRequests + topicProposals + outlineCount
      case 'thesisExecutionGroup':
        return reportCount
      default:
        return 0
    }
  }
}
