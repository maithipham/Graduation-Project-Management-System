import { create } from 'zustand'
import type { GraduationDocument } from '../types'

interface DocumentState {
  documents: GraduationDocument[]
  setDocuments: (documents: GraduationDocument[]) => void
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  setDocuments: (documents) => set({ documents }),
}))
