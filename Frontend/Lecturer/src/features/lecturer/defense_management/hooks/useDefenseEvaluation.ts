import { useEffect, useMemo } from 'react'
import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { createStompClient } from '@/shared/api'
import { toast } from '@/shared/components/feedback/toast.store'
import { defenseEvaluationService } from '../services/defenseEvaluation.service'
import type {
  CouncilEvaluationRequest,
  CouncilScoreSummaryItem,
  DefenseMinutesRequest,
  DefenseRevisionReviewRequest,
  DefenseScoreBoard,
} from '../types'

export const defenseEvaluationKeys = {
  all: ['lecturer', 'defense-evaluation'] as const,
  gradingBoard: (councilPublicId: string) =>
    [...defenseEvaluationKeys.all, 'grading-board', councilPublicId] as const,
  evaluation: (defenseAssignmentPublicId: string) =>
    [...defenseEvaluationKeys.all, 'evaluation', defenseAssignmentPublicId] as const,
  scoreBoard: (defenseAssignmentPublicId: string) =>
    [...defenseEvaluationKeys.all, 'score-board', defenseAssignmentPublicId] as const,
  councilScores: (councilPublicId: string) =>
    [...defenseEvaluationKeys.all, 'council-scores', councilPublicId] as const,
  minutes: (defenseAssignmentPublicId: string) =>
    [...defenseEvaluationKeys.all, 'minutes', defenseAssignmentPublicId] as const,
  revision: (revisionPublicId: string) =>
    [...defenseEvaluationKeys.all, 'revision', revisionPublicId] as const,
}

// ===================== Query =====================

export function useCouncilGradingBoard(councilPublicId?: string) {
  return useQuery({
    queryKey: defenseEvaluationKeys.gradingBoard(councilPublicId ?? ''),
    queryFn: councilPublicId
      ? () => defenseEvaluationService.getGradingBoard(councilPublicId)
      : skipToken,
  })
}

export function useCouncilEvaluation(defenseAssignmentPublicId?: string) {
  return useQuery({
    queryKey: defenseEvaluationKeys.evaluation(defenseAssignmentPublicId ?? ''),
    queryFn: defenseAssignmentPublicId
      ? () => defenseEvaluationService.getCouncilEvaluation(defenseAssignmentPublicId)
      : skipToken,
  })
}

export function useDefenseScoreBoard(defenseAssignmentPublicId?: string) {
  return useQuery({
    queryKey: defenseEvaluationKeys.scoreBoard(defenseAssignmentPublicId ?? ''),
    queryFn: defenseAssignmentPublicId
      ? () => defenseEvaluationService.getScoreBoard(defenseAssignmentPublicId)
      : skipToken,
  })
}

export function useCouncilScoreSummary(councilPublicId?: string) {
  return useQuery({
    queryKey: defenseEvaluationKeys.councilScores(councilPublicId ?? ''),
    queryFn: councilPublicId
      ? () => defenseEvaluationService.getCouncilScoreBoards(councilPublicId)
      : skipToken,
  })
}

export function useDefenseMinutes(defenseAssignmentPublicId?: string) {
  return useQuery({
    queryKey: defenseEvaluationKeys.minutes(defenseAssignmentPublicId ?? ''),
    queryFn: defenseAssignmentPublicId
      ? () => defenseEvaluationService.getMinutes(defenseAssignmentPublicId)
      : skipToken,
  })
}

export function useDefenseRevisionDetail(revisionPublicId?: string | null) {
  return useQuery({
    queryKey: defenseEvaluationKeys.revision(revisionPublicId ?? ''),
    queryFn: revisionPublicId
      ? () => defenseEvaluationService.getRevision(revisionPublicId)
      : skipToken,
  })
}

// ===================== Mutation =====================

// Sau mỗi thao tác Bước 14: làm mới toàn bộ dữ liệu Hội đồng liên quan
function useInvalidateDefenseEvaluation() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: defenseEvaluationKeys.all })
}

export function useSaveCouncilEvaluation(defenseAssignmentPublicId: string) {
  const invalidate = useInvalidateDefenseEvaluation()
  return useMutation({
    mutationFn: (data: CouncilEvaluationRequest) =>
      defenseEvaluationService.saveCouncilEvaluation(defenseAssignmentPublicId, data),
    onSuccess: (_, data) => {
      toast.success(
        data.submit
          ? 'Đã lưu & gửi điểm chính thức thành công'
          : 'Đã lưu nháp phiếu chấm điểm',
      )
      void invalidate()
    },
  })
}

export function useSaveDefenseMinutes(defenseAssignmentPublicId: string) {
  const invalidate = useInvalidateDefenseEvaluation()
  return useMutation({
    mutationFn: (data: DefenseMinutesRequest) =>
      defenseEvaluationService.saveMinutes(defenseAssignmentPublicId, data),
    onSuccess: () => void invalidate(),
  })
}

export function useFinalizeDefenseMinutes(defenseAssignmentPublicId: string) {
  const invalidate = useInvalidateDefenseEvaluation()
  return useMutation({
    mutationFn: () => defenseEvaluationService.finalizeMinutes(defenseAssignmentPublicId),
    onSuccess: () => void invalidate(),
  })
}

export function useCompleteDefense() {
  const invalidate = useInvalidateDefenseEvaluation()
  return useMutation({
    mutationFn: (defenseAssignmentPublicId: string) =>
      defenseEvaluationService.completeDefense(defenseAssignmentPublicId),
    onSuccess: () => void invalidate(),
  })
}

export function useReviewDefenseRevision() {
  const invalidate = useInvalidateDefenseEvaluation()
  return useMutation({
    mutationFn: ({
      revisionPublicId,
      data,
    }: {
      revisionPublicId: string
      data: DefenseRevisionReviewRequest
    }) => defenseEvaluationService.reviewRevision(revisionPublicId, data),
    onSuccess: (_, { data }) => {
      toast.success(
        data.decision === 'APPROVED'
          ? 'Đã duyệt bản sửa báo cáo sau bảo vệ'
          : 'Đã trả lại bản sửa báo cáo cho sinh viên',
      )
      void invalidate()
    },
  })
}

// ===================== Realtime (WebSocket STOMP) =====================

/**
 * Nghe bảng điểm bảo vệ realtime của các sinh viên và cập nhật thẳng vào cache TanStack.
 * - fullView = true (Chủ tịch / Thư ký): chỉ nghe kênh riêng /user/queue/defense-score/{id} (bản đầy đủ).
 * - fullView = false (Ủy viên): nghe topic chung /topic/defense-score/{id} (đã ẩn điểm khi chưa đủ 5/5).
 * Bản tin có version nhỏ hơn bản đang giữ thì bỏ qua. Kết nối (lại) thành công → tải lại bằng REST.
 */
export function useDefenseScoreRealtime(
  defenseAssignmentPublicIds: string[],
  fullView: boolean,
  councilPublicId?: string,
) {
  const queryClient = useQueryClient()
  // Khóa ổn định để không kết nối lại khi mảng id chỉ đổi tham chiếu
  const idsKey = useMemo(
    () => [...defenseAssignmentPublicIds].sort().join(','),
    [defenseAssignmentPublicIds],
  )

  useEffect(() => {
    const ids = idsKey ? idsKey.split(',') : []
    if (ids.length === 0) return

    // Bản tin realtime là bản chung (không có cờ "mine") → giữ cờ "phiếu của tôi" từ dữ liệu REST đang có
    const keepMine = (incoming: DefenseScoreBoard, current: DefenseScoreBoard | undefined): DefenseScoreBoard => {
      if (!current) return incoming
      const mineNames = new Set(current.council.filter((e) => e.mine).map((e) => `${e.role}|${e.teacherName}`))
      if (mineNames.size === 0) return incoming
      return {
        ...incoming,
        council: incoming.council.map((e) =>
          mineNames.has(`${e.role}|${e.teacherName}`) ? { ...e, mine: true } : e,
        ),
      }
    }

    const applyBoard = (incoming: DefenseScoreBoard) => {
      const key = defenseEvaluationKeys.scoreBoard(incoming.defenseAssignmentPublicId)
      const current = queryClient.getQueryData<DefenseScoreBoard>(key)
      const board = keepMine(incoming, current)
      if (!current || board.version >= current.version) {
        queryClient.setQueryData(key, board)
      }
      if (councilPublicId) {
        queryClient.setQueryData<CouncilScoreSummaryItem[]>(
          defenseEvaluationKeys.councilScores(councilPublicId),
          (items) =>
            items?.map((item) =>
              item.defenseAssignmentPublicId === board.defenseAssignmentPublicId &&
              board.version >= item.board.version
                ? { ...item, board }
                : item,
            ),
        )
      }
    }

    const client = createStompClient()
    client.onConnect = () => {
      ids.forEach((id) => {
        const destination = fullView
          ? `/user/queue/defense-score/${id}`
          : `/topic/defense-score/${id}`
        client.subscribe(destination, (message) => {
          try {
            applyBoard(JSON.parse(message.body) as DefenseScoreBoard)
          } catch {
            // Bản tin hỏng thì bỏ qua, lần tải lại kế tiếp sẽ đồng bộ
          }
        })
      })
      // Kết nối (lại) xong: tải lại snapshot bảng điểm để không lỡ cập nhật trong lúc mất kết nối
      void queryClient.invalidateQueries({
        queryKey: [...defenseEvaluationKeys.all, 'score-board'],
      })
      if (councilPublicId) {
        void queryClient.invalidateQueries({
          queryKey: defenseEvaluationKeys.councilScores(councilPublicId),
        })
      }
    }
    client.activate()
    return () => {
      void client.deactivate()
    }
  }, [idsKey, fullView, councilPublicId, queryClient])
}
