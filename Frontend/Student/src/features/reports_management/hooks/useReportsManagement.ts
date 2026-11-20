import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/shared/components/feedback/toast.store'
import { reportsService } from '../services/reports.service'

export const STUDENT_REPORT_KEYS = {
  all: ['student-report'] as const,
  mine: (semesterId?: string) => ['student-report', 'mine', semesterId] as const,
  detail: (publicId?: string) => ['student-report', 'detail', publicId] as const,
}

/** Lấy báo cáo Final hiện tại, lịch sử nộp (kèm kết quả đạo văn), phiếu tiến độ và hạn nộp từ Backend. */
export const useMyFinalReport = (semesterId?: string) => {
  return useQuery({
    queryKey: STUDENT_REPORT_KEYS.mine(semesterId),
    queryFn: () => reportsService.getMyReport(semesterId),
    staleTime: 30 * 1000,
  })
}

/** Xem chi tiết một Báo cáo Final theo `publicId`. */
export const useFinalReportDetail = (publicId?: string) => {
  return useQuery({
    queryKey: STUDENT_REPORT_KEYS.detail(publicId),
    queryFn: publicId ? () => reportsService.getReportDetail(publicId) : skipToken,
    staleTime: 30 * 1000,
  })
}

/** Sinh viên nộp mới hoặc nộp lại Báo cáo Final (`POST /report/submit`). */
export const useSubmitFinalReport = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => reportsService.submitReport(file),
    onSuccess: () => {
      toast.success('Nộp báo cáo Final thành công!')
      return queryClient.invalidateQueries({ queryKey: STUDENT_REPORT_KEYS.all })
    },
  })
}
