import { ScoreResultCard } from '../components/ScoreResultCard'
import { useScoreManagement } from '../hooks/useScoreManagement'

export default function StudentResultsPage() {
  const { results } = useScoreManagement()

  return (
    <div className="max-w-7xl w-full mx-auto space-y-6">
      {results.map((item) => (
        <ScoreResultCard key={item.semesterKey} item={item} />
      ))}
    </div>
  )
}
