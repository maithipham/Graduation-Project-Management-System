// Hook lưu lại cho phần Hội đồng chấm bảo vệ đồ án (Bước 13/14)
import { useDefenseManagementStore } from '../store/defenseManagement.store'

export function useDefenseManagement() {
  const { defenseCouncils, defenseReviews } = useDefenseManagementStore()

  return {
    defenseCouncils,
    defenseReviews,
  }
}
