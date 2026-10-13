import { useState, useEffect } from 'react'
import { feature2Service } from '../services'
import { useFeature2Store } from '../store'

export function useFeature2() {
  const [loading, setLoading] = useState(true)
  const { items, setItems } = useFeature2Store()

  useEffect(() => {
    let mounted = true
    feature2Service.getItems().then((data) => {
      if (mounted) {
        setItems(data)
        setLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [setItems])

  return { items, loading }
}
