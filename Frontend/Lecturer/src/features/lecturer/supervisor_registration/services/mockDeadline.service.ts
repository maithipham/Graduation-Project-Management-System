export interface RegistrationDeadline {
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

export const mockDeadlineService = {
  getRegistrationDeadline: async (): Promise<RegistrationDeadline> => {
    return {
      name: 'Đăng ký GVHD',
      startDate: '2026-11-01',
      endDate: '2026-11-15',
      isActive: true,
    }
  },
}