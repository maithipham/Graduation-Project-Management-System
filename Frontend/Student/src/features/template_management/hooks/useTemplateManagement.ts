import { useTemplateStore } from '../store/template.store'

export function useTemplateManagement() {
  const { documents, selectedIds, setSelectedIds } = useTemplateStore()
  return {
    documents,
    selectedIds,
    setSelectedIds,
  }
}
