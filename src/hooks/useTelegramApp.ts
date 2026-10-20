import { useEffect, useMemo } from 'react'
import { getTelegramWebApp } from '../lib/telegram'

export function useTelegramApp() {
  const webApp = getTelegramWebApp()
  const user = webApp?.initDataUnsafe?.user

  useEffect(() => {
    webApp?.ready()
    webApp?.expand()
    webApp?.requestFullscreen?.()
  }, [webApp])

  const initData = webApp?.initData ?? ''

  const referralLink = useMemo(() => {
    // The actual personal invite link is created server-side after Telegram identity is verified.
    return ''
  }, [])

  return {
    user,
    initData,
    displayName: user?.first_name ?? 'ARCHIVIST',
    referralLink,
  }
}