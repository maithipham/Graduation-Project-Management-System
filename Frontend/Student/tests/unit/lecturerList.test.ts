import { describe, expect, it, vi, beforeEach } from 'vitest'
import { apiClient } from '@/shared/api'
import {
  mapAdvisorToLecturer,
  normalizeDepartment,
  matchMajorToOption,
  isDepartmentMatch,
  lecturerService,
} from '@/features/lecturer_list/services/lecturer.service'
import type { SemesterAdvisorResponse } from '@/features/lecturer_list/types/lecturer.types'

describe('Lecturer List Feature', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('normalizeDepartment and matchMajorToOption', () => {
    it('normalizes department variations with accents and prefixes', () => {
      expect(normalizeDepartment('Bộ môn Kỹ thuật phần mềm')).toBe('ky thuat phan mem')
      expect(normalizeDepartment('Công nghệ phần mềm')).toBe('ky thuat phan mem')
      expect(normalizeDepartment('Ngành Hệ thống thông tin')).toBe('he thong thong tin')
      expect(normalizeDepartment('Khoa học máy tính')).toBe('khoa hoc may tinh')
    })

    it('matches student major to the corresponding dropdown option', () => {
      const options = [
        { value: '', label: 'Tất cả ngành' },
        { value: 'Kỹ thuật phần mềm', label: 'Kỹ thuật phần mềm' },
        { value: 'Hệ thống thông tin', label: 'Hệ thống thông tin' },
        { value: 'Khoa học máy tính', label: 'Khoa học máy tính' },
      ]

      expect(matchMajorToOption('Công nghệ phần mềm', options)).toBe('Kỹ thuật phần mềm')
      expect(matchMajorToOption('Kỹ thuật phần mềm', options)).toBe('Kỹ thuật phần mềm')
      expect(matchMajorToOption('Hệ thống thông tin', options)).toBe('Hệ thống thông tin')
      expect(matchMajorToOption('Khoa học máy tính', options)).toBe('Khoa học máy tính')
      expect(matchMajorToOption('', options)).toBe('')
    })

    it('matches departments flexibly with isDepartmentMatch', () => {
      expect(isDepartmentMatch('Kỹ thuật phần mềm', '')).toBe(true)
      expect(isDepartmentMatch('Kỹ thuật phần mềm', 'Kỹ thuật phần mềm')).toBe(true)
      expect(isDepartmentMatch('Công nghệ phần mềm', 'Kỹ thuật phần mềm')).toBe(true)
      expect(isDepartmentMatch('Bộ môn Hệ thống thông tin', 'Hệ thống thông tin')).toBe(true)
      expect(isDepartmentMatch('Khoa học máy tính', 'Hệ thống thông tin')).toBe(false)
    })
  })

  describe('mapAdvisorToLecturer', () => {
    it('transforms SemesterAdvisorResponse into Lecturer structure correctly', () => {
      const raw: SemesterAdvisorResponse = {
        id: 101,
        teacherPublicId: 'uuid-teacher-1',
        teacherCode: 'GV001',
        teacherName: 'Nguyễn Văn A',
        fullNameWithTitle: 'PGS.TS. Nguyễn Văn A',
        academicTitle: 'PGS.TS.',
        teacherEmail: 'anv@tlu.edu.vn',
        phone: '0901234567',
        majorName: 'Kỹ thuật phần mềm',
        organization: 'Trường Đại học Thủy lợi',
        isInternal: true,
        maxStudents: 5,
        currentStudents: 2,
      }

      const mapped = mapAdvisorToLecturer(raw, 0)
      expect(mapped.id).toBe(101)
      expect(mapped.name).toBe('PGS.TS. Nguyễn Văn A')
      expect(mapped.degree).toBe('PGS.TS.')
      expect(mapped.department).toBe('Kỹ thuật phần mềm')
      expect(mapped.origin).toBe('internal')
      expect(mapped.quota).toBe('2 / 5')
      expect(mapped.isAccepting).toBe(1)
      expect(mapped.email).toBe('anv@tlu.edu.vn')
    })

    it('handles external advisor correctly', () => {
      const raw: SemesterAdvisorResponse = {
        id: 102,
        teacherName: 'Trần Văn B',
        academicTitle: 'TS.',
        email: 'tranb@hust.edu.vn',
        organization: 'ĐH Bách Khoa Hà Nội',
        isInternal: false,
        maxStudents: 3,
        currentStudents: 3,
      }

      const mapped = mapAdvisorToLecturer(raw, 1)
      expect(mapped.origin).toBe('external')
      expect(mapped.unit).toBe('ĐH Bách Khoa Hà Nội')
      expect(mapped.quota).toBe('3 / 3')
      expect(mapped.isAccepting).toBe(0)
    })
  })

  describe('lecturerService.getSemesterAdvisors', () => {
    it('calls GET /semesters/{semesterId}/advisors and returns mapped lecturers', async () => {
      const mockAdvisors: SemesterAdvisorResponse[] = [
        {
          id: 1,
          name: 'Trần Quốc Bảo',
          fullNameWithTitle: 'PGS.TS. Trần Quốc Bảo',
          email: 'bao.tq@tlu.edu.vn',
          majorName: 'Kỹ thuật phần mềm',
          isInternal: true,
          maxStudents: 5,
          currentStudents: 3,
        },
      ]

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: {
          code: 1000,
          data: mockAdvisors,
          message: 'Success',
        },
      } as any)

      const result = await lecturerService.getSemesterAdvisors('sem-2024')
      expect(apiClient.get).toHaveBeenCalledWith('/semesters/sem-2024/advisors', {
        skipErrorToast: true,
      })
      expect(result.length).toBe(1)
      expect(result[0].name).toBe('PGS.TS. Trần Quốc Bảo')
      expect(result[0].department).toBe('Kỹ thuật phần mềm')
    })

    it('falls back to mock data when API call fails', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Network error'))

      const result = await lecturerService.getSemesterAdvisors('sem-fail')
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('lecturerService.getMajors', () => {
    it('calls GET /major and returns majors from BE without fake data fallback', async () => {
      const mockMajors = [
        { id: 1, name: 'Công nghệ thông tin' },
        { id: 2, name: 'Kỹ thuật phần mềm' },
      ]

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: {
          code: 1000,
          data: mockMajors,
        },
      } as any)

      const result = await lecturerService.getMajors()
      expect(apiClient.get).toHaveBeenCalledWith('/major', {
        skipErrorToast: true,
      })
      expect(result).toEqual(mockMajors)
    })

    it('returns default TLU majors when API call fails so dropdown is never empty', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Backend error'))

      const result = await lecturerService.getMajors()
      expect(result.length).toBeGreaterThan(0)
      expect(result.some((m) => m.name === 'Kỹ thuật phần mềm')).toBe(true)
    })
  })
})

