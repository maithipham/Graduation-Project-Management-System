import { describe, expect, it } from 'vitest'
import { mockSuccessResponse, mockErrorResponse, mockPaginatedResponse, mockApiHandlers } from '../mocks'
import { mockTopics } from '../mocks/fixtures'

describe('Mock API Handlers', () => {
  it('mockSuccessResponse returns valid ApiResponse format', async () => {
    const res = await mockSuccessResponse({ message: 'OK' })
    expect(res.success).toBe(true)
    expect(res.data.message).toBe('OK')
    expect(res.timestamp).toBeDefined()
  })

  it('mockErrorResponse throws error with status', async () => {
    await expect(mockErrorResponse(401, 'Unauthorized')).rejects.toThrow('Unauthorized')
  })

  it('mockPaginatedResponse calculates pages correctly', () => {
    const res = mockPaginatedResponse(mockTopics, 1, 2)
    expect(res.items.length).toBe(2)
    expect(res.page).toBe(1)
    expect(res.pageSize).toBe(2)
    expect(res.total).toBe(3)
    expect(res.totalPages).toBe(2)
  })

  it('mockApiHandlers returns student overview data', async () => {
    const res = await mockApiHandlers.getStudentOverview()
    expect(res.data.student.studentCode).toBe('2251061234')
    expect(res.data.currentTopic.code).toBe('DATN-26-0148')
  })
})
