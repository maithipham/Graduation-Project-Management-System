import { useQuery } from '@tanstack/react-query'
import { semesterService } from '../services/semester.service'

export function useCurrentSemester() {
  return useQuery({
    queryKey: ['current-semester'],
    queryFn: () => semesterService.getCurrent(),
    staleTime: 30 * 60 * 1000,
  })
}