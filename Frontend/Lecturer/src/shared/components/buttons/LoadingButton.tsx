import React from 'react'
import { Loader2 } from 'lucide-react'
import { Button, type ButtonProps } from '@/shared/components/ui/button'

export interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean
  loadingText?: string
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading = false,
  loadingText = 'Đang xử lý...',
  children,
  disabled,
  ...props
}) => {
  return (
    <Button
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </Button>
  )
}
