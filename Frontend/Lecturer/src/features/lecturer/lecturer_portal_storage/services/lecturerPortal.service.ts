import { useLecturerPortalStore } from '../store/lecturerPortal.store'

export const lecturerPortalService = {
  getState: () => useLecturerPortalStore.getState(),

  setAcademicFilter: (year: string, semester: string) => {
    useLecturerPortalStore.getState().setAcademicFilter(year, semester)
  },
}

