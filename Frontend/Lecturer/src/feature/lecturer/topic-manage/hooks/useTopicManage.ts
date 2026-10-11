import { useState, useEffect } from 'react'
import { lecturerTopicService } from '../services/topic.service'
import type { LecturerTopicDto } from '../types'

export function useTopicManage() {
  const [topics, setTopics] = useState<LecturerTopicDto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    lecturerTopicService.getManagedTopics().then((res) => {
      if (mounted) {
        setTopics(res)
        setIsLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  const createTopic = async (dto: LecturerTopicDto) => {
    const created = await lecturerTopicService.createTopic(dto)
    setTopics((prev) => [...prev, created])
    return created
  }

  const deleteTopic = async (id: string) => {
    await lecturerTopicService.deleteTopic(id)
    setTopics((prev) => prev.filter((t) => t.id !== id))
  }

  return { topics, isLoading, createTopic, deleteTopic }
}
