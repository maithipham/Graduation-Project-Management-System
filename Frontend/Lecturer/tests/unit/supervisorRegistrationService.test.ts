import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { supervisorDeadlineService } from '@/features/lecturer/supervisor_registration/services/supervisorDeadline.service'
import { supervisorRegistrationService } from '@/features/lecturer/supervisor_registration/services/supervisorRegistration.service'
import { apiClient } from '@/shared/api'
import { useToastStore } from '@/shared/components/feedback/toast.store'

let requests: InternalAxiosRequestConfig[] = []
let reply: unknown
let replyStatus = 200
const originalAdapter = apiClient.defaults.adapter

const fakeAdapter: AxiosAdapter = async (config) => {
  requests.push(config)
  if (replyStatus >= 400) {
    const error = Object.assign(new Error('Request failed'), {
      isAxiosError: true,
      config,
      response: {
        status: replyStatus,
        statusText: 'Error',
        headers: {},
        config,
        data: reply,
      },
    })
    throw error
  }
  return { data: reply, status: replyStatus, statusText: 'OK', headers: {}, config }
}

const sentUrl = (config: InternalAxiosRequestConfig) =>
  decodeURIComponent(apiClient.getUri({ ...config, baseURL: '' }))

const sampleRegistration = {
  registrationPublicId: '0195f3e2-8d44-7b21-9f0a-1a2b3c4d5e6f',
  studentPublicId: '0195f100-1111-7000-8000-000000000010',
  semesterPublicId: '0195f000-0000-7000-8000-000000000001',
  teacherPublicId: '0195f000-2222-7000-8000-000000000002',
  studentCode: '2151170555',
  studentName: 'Nguyễn Văn An',
  majorName: 'Kỹ thuật phần mềm',
  teacherCode: 'GV001',
  teacherName: 'TS. Nguyễn Văn A',
  topicName: 'Xây dựng hệ thống quản lý đồ án tốt nghiệp TLU',
  status: 'PENDING',
  statusDescription: 'Chờ giảng viên xác nhận',
  submittedAt: '2026-03-03T08:30:00',
  processedAt: null,
}

beforeEach(() => {
  requests = []
  replyStatus = 200
  apiClient.defaults.adapter = fakeAdapter
  useToastStore.getState().clearAll()
})

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter
})

describe('supervisorRegistrationService', () => {
  it('getRequests: gửi đúng query params và bóc ApiResponse.data', async () => {
    reply = {
      code: 1000,
      data: {
        registrations: [sampleRegistration],
        pendingCount: 3,
        approvedCount: 2,
        rejectedCount: 1,
        totalCount: 6,
      },
    }

    const result = await supervisorRegistrationService.getRequests({
      semesterPublicId: 'sem-1',
      status: 'pending',
      keyword: '  An ',
    })

    expect(sentUrl(requests[0])).toBe(
      '/api/teacher/advisor-registrations?semesterPublicId=sem-1&status=PENDING&keyword=An',
    )
    expect(result.counts).toEqual({
      pending: 3,
      approved: 2,
      rejected: 1,
      all: 6,
    })
    expect(result.items).toEqual([
      {
        id: '0195f3e2-8d44-7b21-9f0a-1a2b3c4d5e6f',
        mssv: '2151170555',
        name: 'Nguyễn Văn An',
        major: 'Kỹ thuật phần mềm',
        topic: 'Xây dựng hệ thống quản lý đồ án tốt nghiệp TLU',
        submittedDate: '2026-03-03T08:30:00',
        processedAt: undefined,
        status: 'pending',
        apiStatus: 'PENDING',
        statusDescription: 'Chờ giảng viên xác nhận',
      },
    ])
  })

  it('getRequests: tab approved lọc TEACHER_APPROVED và HOD_APPROVED; tab rejected lọc REJECTED và HOD_REJECTED; tab all không lọc', async () => {
    reply = {
      code: 1000,
      data: {
        registrations: [
          sampleRegistration,
          { ...sampleRegistration, registrationPublicId: 'reg-ta', status: 'TEACHER_APPROVED' },
          { ...sampleRegistration, registrationPublicId: 'reg-ha', status: 'HOD_APPROVED' },
          { ...sampleRegistration, registrationPublicId: 'reg-as', status: 'ASSIGNED_BY_HOD' },
          { ...sampleRegistration, registrationPublicId: 'reg-rj', status: 'REJECTED' },
          { ...sampleRegistration, registrationPublicId: 'reg-hr', status: 'HOD_REJECTED' },
        ],
        pendingCount: 1,
        approvedCount: 2,
        rejectedCount: 2,
        totalCount: 6,
      },
    }

    const approvedResult = await supervisorRegistrationService.getRequests({
      semesterPublicId: 'sem-1',
      status: 'approved',
      keyword: '   ',
    })
    expect(sentUrl(requests[0])).toBe(
      '/api/teacher/advisor-registrations?semesterPublicId=sem-1',
    )
    expect(approvedResult.items.map((item) => [item.id, item.apiStatus])).toEqual([
      ['reg-ta', 'TEACHER_APPROVED'],
      ['reg-ha', 'HOD_APPROVED'],
    ])

    const rejectedResult = await supervisorRegistrationService.getRequests({
      semesterPublicId: 'sem-1',
      status: 'rejected',
    })
    expect(sentUrl(requests[1])).toBe(
      '/api/teacher/advisor-registrations?semesterPublicId=sem-1',
    )
    expect(rejectedResult.items.map((item) => [item.id, item.apiStatus, item.status])).toEqual([
      ['reg-rj', 'REJECTED', 'rejected'],
      ['reg-hr', 'HOD_REJECTED', 'rejected'],
    ])

    const allResult = await supervisorRegistrationService.getRequests({
      semesterPublicId: 'sem-1',
      status: '',
    })
    expect(sentUrl(requests[2])).toBe(
      '/api/teacher/advisor-registrations?semesterPublicId=sem-1',
    )
    expect(allResult.items).toHaveLength(6)
  })

  it('getRequestDetail: gửi GET /api/teacher/advisor-registrations/{id} và bóc data', async () => {
    reply = { code: 1000, data: sampleRegistration }

    const detail = await supervisorRegistrationService.getRequestDetail('reg-1')

    expect(requests[0].method?.toLowerCase()).toBe('get')
    expect(sentUrl(requests[0])).toBe('/api/teacher/advisor-registrations/reg-1')
    expect(detail.teacherPublicId).toBe('0195f000-2222-7000-8000-000000000002')
    expect(detail.studentName).toBe('Nguyễn Văn An')
  })

  it('approveRequest: gửi PATCH .../approve và bóc data', async () => {
    reply = {
      code: 1000,
      message: 'Duyệt đơn đăng ký giảng viên hướng dẫn thành công',
      data: {
        ...sampleRegistration,
        status: 'TEACHER_APPROVED',
        statusDescription: 'Giảng viên đã đồng ý hướng dẫn',
        processedAt: '2026-03-04T14:20:00',
      },
    }

    const updated = await supervisorRegistrationService.approveRequest('reg-1')

    expect(requests[0].method?.toLowerCase()).toBe('patch')
    expect(sentUrl(requests[0])).toBe(
      '/api/teacher/advisor-registrations/reg-1/approve',
    )
    expect(updated.status).toBe('TEACHER_APPROVED')
  })

  it('rejectRequest: gửi PATCH .../reject và bóc data', async () => {
    reply = {
      code: 1000,
      message: 'Từ chối đơn đăng ký giảng viên hướng dẫn thành công',
      data: {
        ...sampleRegistration,
        status: 'REJECTED',
        statusDescription: 'Đơn đăng ký đã bị từ chối',
        processedAt: '2026-03-04T14:25:00',
      },
    }

    const updated = await supervisorRegistrationService.rejectRequest('reg-1')

    expect(requests[0].method?.toLowerCase()).toBe('patch')
    expect(sentUrl(requests[0])).toBe(
      '/api/teacher/advisor-registrations/reg-1/reject',
    )
    expect(updated.status).toBe('REJECTED')
  })

  it('lỗi quota 400: reject ApiError và interceptor hiện đúng 1 toast lỗi', async () => {
    replyStatus = 400
    reply = {
      code: 4000,
      message: 'Giảng viên đã đủ số lượng sinh viên hướng dẫn, không thể duyệt đơn',
      data: null,
    }

    await expect(
      supervisorRegistrationService.approveRequest('reg-1'),
    ).rejects.toMatchObject({
      code: 4000,
      status: 400,
      message: 'Giảng viên đã đủ số lượng sinh viên hướng dẫn, không thể duyệt đơn',
    })

    expect(useToastStore.getState().toasts).toHaveLength(1)
    expect(useToastStore.getState().toasts[0]).toMatchObject({
      type: 'error',
      message: 'Giảng viên đã đủ số lượng sinh viên hướng dẫn, không thể duyệt đơn',
    })
  })
})

describe('supervisorDeadlineService', () => {
  it('getRegistrationDeadline: gửi GET .../deadline?semesterPublicId=... và bóc data', async () => {
    const deadlineData = {
      semesterPublicId: 'sem-1',
      name: 'Đăng ký giảng viên hướng dẫn',
      startDate: '2026-03-01T00:00:00',
      endDate: '2026-03-15T23:59:59',
      isActive: true,
      status: 'OPEN',
    }
    reply = { code: 1000, data: deadlineData }

    const result = await supervisorDeadlineService.getRegistrationDeadline('sem-1')

    expect(requests[0].method?.toLowerCase()).toBe('get')
    expect(sentUrl(requests[0])).toBe(
      '/api/teacher/advisor-registrations/deadline?semesterPublicId=sem-1',
    )
    expect(result).toEqual(deadlineData)
  })
})

