import { useRegistrationStore } from '../store/registration.store'

export function useRegistrationManagement() {
  const {
    mentor,
    topic,
    assignedByTbm,
    requests,
    setMentor,
    setTopic,
    setAssignedByTbm,
    setRequests,
  } = useRegistrationStore()

  return {
    mentor,
    topic,
    assignedByTbm,
    requests,
    setMentor,
    setTopic,
    setAssignedByTbm,
    setRequests,
  }
}
