import { accountService } from './account.service'
import { semesterService } from './semester.service'
import { majorService } from './major.service'
import { systemService } from './system.service'

export * from './account.service'
export * from './semester.service'
export * from './major.service'
export * from './system.service'

/**
 * Facade pattern: tổng hợp các service con cho tiện ích gọi nhanh hoặc backward-compatibility
 */
export const adminService = {
  ...systemService,
  ...accountService,
  ...semesterService,
  ...majorService,
}
