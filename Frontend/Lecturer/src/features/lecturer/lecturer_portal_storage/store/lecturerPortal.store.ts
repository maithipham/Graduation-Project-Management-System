import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  LecturerNavBadges,
  LecturerPortalState,
} from '../types/lecturerPortal.types'
import type { SupervisorRequestItem } from '@/features/lecturer/supervisor_registration/types/supervisorRegistration.types'
import type { TopicProposalItem } from '@/features/lecturer/topic_proposal/types/topicProposal.types'
import type { OutlineReviewItem } from '@/features/lecturer/outline_review/types/outlineReview.types'
import type { ReportCheckItem } from '@/features/lecturer/report_check/types/reportCheck.types'
import {
  DEFAULT_TEACHER_PROFILE,
  INITIAL_DEFENSE_COUNCILS,
  INITIAL_DEFENSE_REVIEWS,
  INITIAL_DOCUMENT_TEMPLATES,
  INITIAL_GUIDING_SCORES,
  INITIAL_OUTLINES,
  INITIAL_REPORTS,
  INITIAL_SUPERVISOR_REQUESTS,
  INITIAL_TOPIC_PROPOSALS,
  INITIAL_TRACKING_SHEETS,
} from '../services/lecturerMockData'

const READ_OUTLINE_SESSION_KEY = 'tlu_read_outline_ids_v4'

function getNowFormatted(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function loadSessionReadOutlineIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.sessionStorage.getItem(READ_OUTLINE_SESSION_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.map((id) => String(id))
    }
  } catch {
    // Ignore storage access issues in restricted environments
  }
  return []
}

function saveSessionReadOutlineIds(ids: string[]): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(READ_OUTLINE_SESSION_KEY, JSON.stringify(ids))
  } catch {
    // Ignore storage access issues in restricted environments
  }
}

export const useLecturerPortalStore = create<LecturerPortalState>()(
  persist(
    (set) => ({
      academicYear: '2026-2027',
      semester: 'HK2',
      teacher: DEFAULT_TEACHER_PROFILE,
      supervisorRequests: INITIAL_SUPERVISOR_REQUESTS,
      topicProposals: INITIAL_TOPIC_PROPOSALS,
      outlines: INITIAL_OUTLINES,
      reports: INITIAL_REPORTS,
      trackingSheets: INITIAL_TRACKING_SHEETS,
      guidingScores: INITIAL_GUIDING_SCORES,
      defenseCouncils: INITIAL_DEFENSE_COUNCILS,
      defenseReviews: INITIAL_DEFENSE_REVIEWS,
      documentTemplates: INITIAL_DOCUMENT_TEMPLATES,
      readOutlineIds: loadSessionReadOutlineIds(),

      setAcademicFilter: (year, semester) =>
        set((state) => ({
          academicYear: year,
          semester,
          teacher: { ...state.teacher, year, semester },
        })),

      approveSupervisorRequest: (id) =>
        set((state) => {
          const target = state.supervisorRequests.find((r) => r.id === id)
          if (!target || target.status === 'approved') return state
          const now = getNowFormatted()
          return {
            supervisorRequests: state.supervisorRequests.map((r) =>
              r.id === id ? { ...r, status: 'approved', approvedAt: now } : r,
            ),
            teacher: {
              ...state.teacher,
              currentLoad: state.teacher.currentLoad + 1,
            },
          }
        }),

      rejectSupervisorRequest: (id, reason) =>
        set((state) => {
          const now = getNowFormatted()
          return {
            supervisorRequests: state.supervisorRequests.map((r) =>
              r.id === id
                ? {
                    ...r,
                    status: 'rejected',
                    rejectedAt: now,
                    rejectReason: reason?.trim() || r.rejectReason,
                  }
                : r,
            ),
          }
        }),

      approveTopicProposal: (id) =>
        set((state) => {
          const now = getNowFormatted()
          return {
            topicProposals: state.topicProposals.map((p) =>
              p.id === id ? { ...p, status: 'approved', approvedAt: now } : p,
            ),
          }
        }),

      rejectTopicProposal: (id, reason) =>
        set((state) => {
          const now = getNowFormatted()
          return {
            topicProposals: state.topicProposals.map((p) =>
              p.id === id
                ? {
                    ...p,
                    status: 'rejected',
                    rejectedAt: now,
                    rejectReason: reason?.trim() || p.rejectReason,
                  }
                : p,
            ),
          }
        }),

      markOutlineAsRead: (id) =>
        set((state) => {
          if (state.readOutlineIds.includes(id)) return state
          const next = [...state.readOutlineIds, id]
          saveSessionReadOutlineIds(next)
          return { readOutlineIds: next }
        }),

      approveOutline: (id) =>
        set((state) => {
          const now = getNowFormatted()
          return {
            outlines: state.outlines.map((o) => {
              if (o.id !== id) return o
              return {
                ...o,
                status: 'approved',
                isResubmitted: false,
                approvedAt: now,
                history: [
                  {
                    submitIndex: o.submitCount || 1,
                    submittedDate: o.submittedDate || now,
                    fileName: o.fileName || 'De-cuong.pdf',
                    status: 'Đã duyệt',
                    processedAt: now,
                    note: 'Đề cương đã được phê duyệt.',
                  },
                  ...o.history,
                ],
              }
            }),
          }
        }),

      rejectOutline: (id, feedback) =>
        set((state) => {
          const now = getNowFormatted()
          const trimmed = feedback.trim()
          return {
            outlines: state.outlines.map((o) => {
              if (o.id !== id) return o
              return {
                ...o,
                status: 'rejected',
                isResubmitted: false,
                feedback: trimmed,
                rejectedAt: now,
                history: [
                  {
                    submitIndex: o.submitCount || 1,
                    submittedDate: o.submittedDate || now,
                    fileName: o.fileName || 'De-cuong.pdf',
                    status: 'Từ chối',
                    processedAt: now,
                    note: trimmed || 'Yêu cầu chỉnh sửa lại đề cương.',
                  },
                  ...o.history,
                ],
              }
            }),
          }
        }),

      updateOutlineFeedback: (id, feedback) =>
        set((state) => {
          const trimmed = feedback.trim()
          return {
            outlines: state.outlines.map((o) => {
              if (o.id !== id) return o
              let updatedFirstRej = false
              const nextHistory = o.history.map((h) => {
                if (!updatedFirstRej && (h.status === 'Từ chối' || h.status === 'Đã từ chối')) {
                  updatedFirstRej = true
                  return { ...h, note: trimmed }
                }
                return h
              })
              return {
                ...o,
                feedback: trimmed,
                previousRejectReason:
                  o.previousRejectReason !== undefined ? trimmed : o.previousRejectReason,
                history: nextHistory,
              }
            }),
          }
        }),

      resetOutlines: () =>
        set(() => {
          saveSessionReadOutlineIds([])
          return { outlines: INITIAL_OUTLINES, readOutlineIds: [] }
        }),

      approveReport: (id) =>
        set((state) => {
          const now = getNowFormatted()
          return {
            reports: state.reports.map((r) =>
              r.id === id ? { ...r, status: 'approved', approvedAt: now } : r,
            ),
          }
        }),

      rejectReport: (id, comment) =>
        set((state) => {
          const now = getNowFormatted()
          return {
            reports: state.reports.map((r) =>
              r.id === id
                ? {
                    ...r,
                    status: 'rejected',
                    rejectedAt: now,
                    comment: comment?.trim() || 'Báo cáo chưa đạt yêu cầu, cần hoàn thiện lại.',
                  }
                : r,
            ),
          }
        }),

      submitPlagiarismResult: (id, fileName, rate) =>
        set((state) => ({
          reports: state.reports.map((r) =>
            r.id === id
              ? {
                  ...r,
                  plagiarismFile: fileName || `Ket-qua-trung-lap-${r.mssv}.pdf`,
                  plagiarismRate: rate,
                }
              : r,
          ),
        })),

      submitTrackingSheet: (id, customFileName) =>
        set((state) => {
          const now = getNowFormatted()
          return {
            trackingSheets: state.trackingSheets.map((t) =>
              t.id === id
                ? {
                    ...t,
                    status: 'submitted',
                    fileName:
                      customFileName?.trim() ||
                      `Phieu-theo-doi-${t.name.replace(/\s+/g, '-')}.pdf`,
                    submittedAt: now,
                  }
                : t,
            ),
          }
        }),

      saveGuidingScore: (id, score, comment) =>
        set((state) => ({
          guidingScores: state.guidingScores.map((s) =>
            s.id === id
              ? {
                  ...s,
                  score,
                  comment: comment.trim(),
                  status: score !== null ? 'scored' : 'unscored',
                }
              : s,
          ),
        })),

      updateDefenseReviewScore: (id, score) =>
        set((state) => ({
          defenseReviews: state.defenseReviews.map((rev) =>
            rev.id === id ? { ...rev, score } : rev,
          ),
        })),

      approveDefenseReview: (id) =>
        set((state) => ({
          defenseReviews: state.defenseReviews.map((rev) =>
            rev.id === id ? { ...rev, status: 'approved' } : rev,
          ),
        })),

      rejectDefenseReview: (id) =>
        set((state) => ({
          defenseReviews: state.defenseReviews.map((rev) =>
            rev.id === id ? { ...rev, status: 'rejected' } : rev,
          ),
        })),
    }),
    {
      name: 'gv_thesis_portal_react_v1',
      partialize: (state) => ({
        academicYear: state.academicYear,
        semester: state.semester,
        teacher: state.teacher,
        supervisorRequests: state.supervisorRequests,
        topicProposals: state.topicProposals,
        outlines: state.outlines,
        reports: state.reports,
        trackingSheets: state.trackingSheets,
        guidingScores: state.guidingScores,
        defenseCouncils: state.defenseCouncils,
        defenseReviews: state.defenseReviews,
      }),
    },
  ),
)

export function computeLecturerBadges(state: {
  supervisorRequests: SupervisorRequestItem[]
  topicProposals: TopicProposalItem[]
  outlines: OutlineReviewItem[]
  reports: ReportCheckItem[]
}): LecturerNavBadges {
  return {
    supervisorRequests: state.supervisorRequests.filter((r) => r.status === 'pending').length,
    topicProposals: state.topicProposals.filter((p) => p.status === 'pending').length,
    outlines: state.outlines.filter((o) => o.status === 'pending').length,
    reports: state.reports.filter((r) => r.status === 'pending').length,
  }
}

