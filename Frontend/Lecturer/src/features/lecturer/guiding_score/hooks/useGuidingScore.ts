import { useMemo, useState } from 'react'
import { toast } from '@/shared/components/feedback/toast.store'
import { useGuidingScoreStore } from '../store/guidingScore.store'
import type { GuidingScoreItem } from '../types/guidingScore.types'

export function useGuidingScore() {
  const { guidingScores, saveGuidingScore } = useGuidingScoreStore()

  const [searchStudent, setSearchStudent] = useState('')
  const [activeItem, setActiveItem] = useState<GuidingScoreItem | null>(null)

  const stats = useMemo(() => {
    const total = guidingScores.length
    const gradedCount = guidingScores.filter(
      (x) => x.score !== null && x.score !== undefined,
    ).length
    const ungradedCount = total - gradedCount
    return {
      total,
      gradedCount,
      ungradedCount,
    }
  }, [guidingScores])

  const filteredItems = useMemo(() => {
    const q = searchStudent.trim().toLowerCase()
    if (!q) return guidingScores
    return guidingScores.filter((item) => {
      const matchName = item.name.toLowerCase().includes(q)
      const matchMssv = item.mssv.toLowerCase().includes(q)
      const matchMajor = item.major ? item.major.toLowerCase().includes(q) : false
      const matchTopic = item.topic ? item.topic.toLowerCase().includes(q) : false
      return matchName || matchMssv || matchMajor || matchTopic
    })
  }, [guidingScores, searchStudent])

  const handleSaveGrading = (id: string, score: number, comment: string) => {
    const target = guidingScores.find((x) => x.id === id)
    saveGuidingScore(id, score, comment)
    toast.success(`Đã lưu điểm cho sinh viên ${target?.name ?? ''} thành công!`)
    setActiveItem(null)
  }

  return {
    guidingScores,
    searchStudent,
    setSearchStudent,
    activeItem,
    setActiveItem,
    stats,
    filteredItems,
    handleSaveGrading,
  }
}

