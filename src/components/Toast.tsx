import { memo } from 'react'
import { Check } from 'lucide-react'

interface ToastProps { message: string }

function ToastBase({ message }: ToastProps) {
  if (!message) return null
  return <div className="toast" role="status"><Check size={15} /> {message}</div>
}

export const Toast = memo(ToastBase)
Toast.displayName = 'Toast' 