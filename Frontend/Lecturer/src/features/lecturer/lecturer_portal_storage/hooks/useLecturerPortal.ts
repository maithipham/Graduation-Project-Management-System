import {
  useLecturerPortalStore,
  computeLecturerBadges,
} from '../store/lecturerPortal.store'

export function useLecturerPortal() {
  const academicYear = useLecturerPortalStore((s) => s.academicYear)
  const semester = useLecturerPortalStore((s) => s.semester)
  const teacher = useLecturerPortalStore((s) => s.teacher)
  const setAcademicFilter = useLecturerPortalStore((s) => s.setAcademicFilter)

  const supervisorRequests = useLecturerPortalStore((s) => s.supervisorRequests)
  const topicProposals = useLecturerPortalStore((s) => s.topicProposals)
  const outlines = useLecturerPortalStore((s) => s.outlines)
  const reports = useLecturerPortalStore((s) => s.reports)

  const badges = computeLecturerBadges({
    supervisorRequests,
    topicProposals,
    outlines,
    reports,
  })

  return {
    academicYear,
    semester,
    teacher,
    setAcademicFilter,
    badges,
  }
}

