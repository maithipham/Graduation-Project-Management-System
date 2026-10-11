import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 1,
      staleTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
})

export const referenceDataQueryOptions = {
  staleTime: 30 * 60 * 1000, // 30 phút cache cho dữ liệu ít biến động
  refetchOnWindowFocus: false,
} as const
