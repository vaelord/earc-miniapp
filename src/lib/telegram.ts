export interface TelegramWebApp {
  ready: () => void
  expand: () => void
  requestFullscreen?: () => void
  initData?: string
  initDataUnsafe?: {
    user?: {
      id?: number
      username?: string
      first_name?: string
      last_name?: string
    }
  }
  openTelegramLink?: (url: string) => void
  openLink?: (url: string) => void
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
  }
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp }
  }
}

export function getTelegramWebApp() {
  return window.Telegram?.WebApp
}

export function triggerHaptic() {
  try {
    getTelegramWebApp()?.HapticFeedback?.impactOccurred('light')
  } catch {
    // Haptics are optional and unavailable in ordinary browsers.
  }
}

export type DeviceShareResult = 'shared' | 'copied' | 'cancelled'

/** Opens the device's native share sheet when available, regardless of host app. */
export async function openDeviceShare(url: string, text: string): Promise<DeviceShareResult> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: 'Ether Archive', text, url })
      return 'shared'
    } catch (error) {
      // Closing the native share sheet is a normal cancellation, not an error.
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
      // Fall back to copying if native sharing is unavailable or fails.
    }
  }

  const shareText = `${text}\n${url}`
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareText)
      return 'copied'
    }

    const input = document.createElement('textarea')
    input.value = shareText
    input.setAttribute('readonly', '')
    input.style.position = 'fixed'
    input.style.opacity = '0'
    document.body.appendChild(input)
    input.select()
    const success = document.execCommand('copy')
    document.body.removeChild(input)
    if (success) return 'copied'
  } catch {
    // Clipboard access can be unavailable in restricted webviews.
  }

  throw new Error('Device sharing and clipboard access are unavailable')
}
