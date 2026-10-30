import { useOutlineStore } from '../store/outline.store'

export function useOutlineManagement() {
  const { outlineData, history, setOutlineData, setHistory } = useOutlineStore()
  return {
    outlineData,
    history,
    setOutlineData,
    setHistory,
  }
}
