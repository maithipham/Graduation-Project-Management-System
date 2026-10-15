import { describe, expect, it } from 'vitest'
import { mockSuccessResponse, mockErrorResponse, mockSpringPage, mockApiHandlers } from '../mocks'
import { mockTopics } from '../mocks/fixtures'

describe('Mock API Handlers', () => {
  it('mockSuccessResponse returns valid ApiResponse format', async () => {
    const res = await mockSuccessResponse({ message: 'OK' })
    expect(res.code).toBe(1000)
    expect(res.data.message).toBe('OK')
    expect(res.message).toBe('Thao tác thành công')
  })

  it('mockErrorResponse throws error with status', async () => {
    await expect(mockErrorResponse(401, 'Unauthorized')).rejects.toThrow('Unauthorized')
  })

  it('mockSpringPage returns Spring Page shape with 0-based page', () => {
    const first = mockSpringPage(mockTopics, 0, 2)
    expect(first.content.length).toBe(2)
    expect(first.number).toBe(0)
    expect(first.size).toBe(2)
    expect(first.totalElements).toBe(3)
    expect(first.totalPages).toBe(2)
    expect(first.first).toBe(true)
    expect(first.last).toBe(false)

    const second = mockSpringPage(mockTopics, 1, 2)
    expect(second.content.length).toBe(1)
    expect(second.numberOfElements).toBe(1)
    expect(second.last).toBe(true)
  })

  it('mockApiHandlers returns student overview data', async () => {
    const res = await mockApiHandlers.getStudentOverview()
    expect(res.data.student.studentCode).toBe('2251061234')
    expect(res.data.currentTopic.code).toBe('DATN-26-0148')
  })
})
