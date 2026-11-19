import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from '@/shared/components/feedback/toast.store'
import { examinerReviewService } from '../services/examinerReview.service'
import type {
  AssignExaminersRequest,
  ExaminerEvaluationRequest,
  ScheduleExaminerReviewRequest,
} from '../types'

export const examinerReviewKeys = {
  all: ['lecturer', 'examiner-review'] as const,
  myCouncils: (semesterId?: string) =>
    [...examinerReviewKeys.all, 'councils', semesterId ?? 'all'] as const,
  board: (councilPublicId: string) =>
    [...examinerReviewKeys.all, 'board', councilPublicId] as const,
  allBoards: () => [...examinerReviewKeys.all, 'board'] as const,
  myAssignments: (semesterId?: string) =>
    [...examinerReviewKeys.all, 'assignments', semesterId ?? 'all'] as const,
  allAssignments: () => [...examinerReviewKeys.all, 'assignments'] as const,
  evaluation: (id: string) =>
    [...examinerReviewKeys.all, 'evaluation', id] as const,
}

// 1. Hook danh sách Hội đồng tôi tham gia
export function useMyCouncils(semesterId?: string) {
  return useQuery({
    queryKey: examinerReviewKeys.myCouncils(semesterId),
    queryFn: () => examinerReviewService.getMyCouncils(semesterId),
  })
}

// 2. Hook bảng phân công GVPB trong Hội đồng
export function useCouncilBoard(councilPublicId?: string) {
  return useQuery({
    queryKey: councilPublicId
      ? examinerReviewKeys.board(councilPublicId)
      : examinerReviewKeys.allBoards(),
    queryFn: councilPublicId
      ? () => examinerReviewService.getCouncilBoard(councilPublicId)
      : skipToken,
    enabled: Boolean(councilPublicId),
  })
}

// 3. Hook phân công GVPB
export function useAssignExaminers(councilPublicId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      defenseAssignmentPublicId,
      data,
    }: {
      defenseAssignmentPublicId: string
      data: AssignExaminersRequest
    }) =>
      examinerReviewService.assignExaminers(defenseAssignmentPublicId, data),
    onSuccess: () => {
      toast.success('Đã phân công giảng viên phản biện')
      void queryClient.invalidateQueries({
        queryKey: examinerReviewKeys.board(councilPublicId),
      })
      void queryClient.invalidateQueries({
        queryKey: examinerReviewKeys.allAssignments(),
      })
    },
  })
}

// 4. Hook danh sách sinh viên tôi được phân công phản biện
export function useMyExaminerAssignments(semesterId?: string) {
  return useQuery({
    queryKey: examinerReviewKeys.myAssignments(semesterId),
    queryFn: () => examinerReviewService.getMyAssignments(semesterId),
  })
}

// 5. Hook tạo / cập nhật lịch phản biện
export function useScheduleExaminerReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      examinerAssignmentPublicId,
      data,
    }: {
      examinerAssignmentPublicId: string
      data: ScheduleExaminerReviewRequest
    }) =>
      examinerReviewService.scheduleReview(examinerAssignmentPublicId, data),
    onSuccess: (_, variables) => {
      toast.success('Đã cập nhật lịch phản biện')
      void queryClient.invalidateQueries({
        queryKey: examinerReviewKeys.allAssignments(),
      })
      void queryClient.invalidateQueries({
        queryKey: examinerReviewKeys.evaluation(
          variables.examinerAssignmentPublicId,
        ),
      })
      void queryClient.invalidateQueries({
        queryKey: examinerReviewKeys.allBoards(),
      })
    },
  })
}

// 6. Hook chi tiết phiếu chấm phản biện & Rubric
export function useExaminerEvaluation(assignmentId?: string) {
  return useQuery({
    queryKey: assignmentId
      ? examinerReviewKeys.evaluation(assignmentId)
      : examinerReviewKeys.all,
    queryFn: assignmentId
      ? () => examinerReviewService.getEvaluation(assignmentId)
      : skipToken,
    enabled: Boolean(assignmentId),
  })
}

// 7. Hook lưu nháp / lưu chính thức phiếu phản biện
export function useSaveExaminerEvaluation(assignmentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ExaminerEvaluationRequest) =>
      examinerReviewService.saveEvaluation(assignmentId, data),
    onSuccess: (_, variables) => {
      toast.success(
        variables.submit
          ? 'Đã nộp phiếu phản biện'
          : 'Đã lưu nháp phiếu phản biện',
      )
      void queryClient.invalidateQueries({
        queryKey: examinerReviewKeys.allAssignments(),
      })
      void queryClient.invalidateQueries({
        queryKey: examinerReviewKeys.evaluation(assignmentId),
      })
      void queryClient.invalidateQueries({
        queryKey: examinerReviewKeys.allBoards(),
      })
    },
  })
}

// 8. Hook cập nhật quyết định riêng (APPROVED / REJECTED)
export function useUpdateExaminerDecision(assignmentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (decision: 'APPROVED' | 'REJECTED') =>
      examinerReviewService.updateDecision(assignmentId, decision),
    onSuccess: () => {
      toast.success('Đã cập nhật quyết định')
      void queryClient.invalidateQueries({
        queryKey: examinerReviewKeys.allAssignments(),
      })
      void queryClient.invalidateQueries({
        queryKey: examinerReviewKeys.evaluation(assignmentId),
      })
      void queryClient.invalidateQueries({
        queryKey: examinerReviewKeys.allBoards(),
      })
    },
  })
}

// 9. Hook upload file nhận xét phản biện
export function useUploadReviewFile(assignmentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) =>
      examinerReviewService.uploadReviewFile(assignmentId, file),
    onSuccess: () => {
      toast.success('Đã tải lên file nhận xét')
      void queryClient.invalidateQueries({
        queryKey: examinerReviewKeys.allAssignments(),
      })
      void queryClient.invalidateQueries({
        queryKey: examinerReviewKeys.evaluation(assignmentId),
      })
      void queryClient.invalidateQueries({
        queryKey: examinerReviewKeys.allBoards(),
      })
    },
  })
}
