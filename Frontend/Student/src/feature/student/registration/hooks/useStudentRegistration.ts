import { useState, useEffect } from 'react'
import { studentRegistrationService } from '../services'
import type { StudentTopic, TopicRegistrationDto } from '../types'

export function useStudentRegistration() {
  const [currentTopic, setCurrentTopic] = useState<StudentTopic | null>(null)
  const [availableTopics, setAvailableTopics] = useState<StudentTopic[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    Promise.all([
      studentRegistrationService.getCurrentRegisteredTopic(),
      studentRegistrationService.getAvailableTopics(),
    ]).then(([curr, avail]) => {
      if (mounted) {
        setCurrentTopic(curr)
        setAvailableTopics(avail)
        setIsLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  const register = async (dto: TopicRegistrationDto) => {
    const res = await studentRegistrationService.registerTopic(dto)
    setCurrentTopic(res)
    return res
  }

  const cancel = async (id: string) => {
    const success = await studentRegistrationService.cancelRegistration(id)
    if (success) {
      setCurrentTopic(null)
    }
    return success
  }

  return { currentTopic, availableTopics, isLoading, register, cancel }
}
