import { useScoreStore } from '../store/score.store'

export function useScoreManagement() {
  const { results, setResults } = useScoreStore()
  return {
    results,
    setResults,
  }
}
