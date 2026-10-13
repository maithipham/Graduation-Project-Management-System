import { useState, useEffect } from 'react'
import { feature1Service } from '../services'
import { useFeature1Store } from '../store'

export function useFeature1() {
  const [loading, setLoading] = useState(true)
  const { items, setItems } = useFeature1Store()

  useEffect(() => {
    let mounted = true
    feature1Service.getItems().then((data) => {
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
