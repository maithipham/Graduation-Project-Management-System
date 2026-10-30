import { useReportsStore } from '../store/reports.store'

export function useReportsManagement() {
  const { reportHistory, setReportHistory } = useReportsStore()
  return {
    reportHistory,
    setReportHistory,
  }
}
