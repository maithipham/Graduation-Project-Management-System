import { useQuery } from '@tanstack/react-query'
import { semesterService } from '../services/semester.service'

export function useSemesters() {
  return useQuery({
    queryKey: ['semesters'],
    queryFn: () => semesterService.getAll(),
    staleTime: 30 * 60 * 1000,
  })
}