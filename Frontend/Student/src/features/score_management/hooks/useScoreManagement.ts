import { useQuery } from '@tanstack/react-query'
import { scoreService } from '../services/score.service'

export const studentScoreKeys = {
  all: ['student', 'my-score'] as const,
  myScore: (semesterId?: string) => [...studentScoreKeys.all, semesterId ?? 'current'] as const,
}

// Điểm đồ án của sinh viên đang đăng nhập (không truyền semesterId = học kỳ hiện tại)
export function useMyScore(semesterId?: string) {
  return useQuery({
    queryKey: studentScoreKeys.myScore(semesterId),
    queryFn: () => scoreService.getMyScore(semesterId),
    // Điểm có thể được tính lại khi GVHD nộp lại phiếu → tải lại khi quay lại tab
    refetchOnWindowFocus: true,
  })
}
