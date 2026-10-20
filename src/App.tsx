import { useCallback, useEffect, useState } from 'react'
import { BackgroundEffects } from './components/BackgroundEffects'
import { BottomNav, type AppTab } from './components/BottomNav'
import { Hero } from './components/Hero'
import { ReferralCard } from './components/ReferralCard'
import { ProfileSection } from './components/ProfileSection'
import { Toast } from './components/Toast'
import { TopBar } from './components/TopBar'
import { useTelegramApp } from './hooks/useTelegramApp'
import { openDeviceShare, triggerHaptic, getTelegramWebApp } from './lib/telegram'
import { Onboarding } from './components/Onboarding'

type ReferralProfile = {
  userId: string
  invitedCount: number
  rewardPoolPoints: number
  inviteLink: string
  firstName: string
}

function App() {
  const [showOnboarding, setShowOnboarding] = useState(() => {
  return localStorage.getItem('earc_onboarding_completed') !== 'true'
})
  const [activeTab, setActiveTab] = useState<AppTab>('Referral')
  const [copied, setCopied] = useState(false)
  const [notice, setNotice] = useState('')
  const [profile, setProfile] = useState<ReferralProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const { initData } = useTelegramApp()
  const referralLink = profile?.inviteLink ?? ''

  useEffect(() => {
    const blockContextMenu = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target?.closest('.link-field')) event.preventDefault()
    }
    const blockInspectionShortcuts = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const blocked = event.key === 'F12' ||
        (event.ctrlKey && event.shiftKey && ['i', 'j', 'c'].includes(key)) ||
        (event.ctrlKey && ['u'].includes(key)) ||
        (event.metaKey && event.altKey && ['i', 'j', 'c'].includes(key))
      if (blocked) { event.preventDefault(); event.stopPropagation() }
    }
    document.addEventListener('contextmenu', blockContextMenu)
    document.addEventListener('keydown', blockInspectionShortcuts, true)
    return () => {
      document.removeEventListener('contextmenu', blockContextMenu)
      document.removeEventListener('keydown', blockInspectionShortcuts, true)
    }
  }, [])

  useEffect(() => {
    if (!notice) return
    const timeoutId = window.setTimeout(() => setNotice(''), 3200)
    return () => window.clearTimeout(timeoutId)
  }, [notice])

  useEffect(() => {
    if (!copied) return
    const timeoutId = window.setTimeout(() => setCopied(false), 1800)
    return () => window.clearTimeout(timeoutId)
  }, [copied])

  useEffect(() => {
    let cancelled = false
    async function loadReferralProfile() {
      setLoading(true)
      setApiError('')
      if (!initData) {
        setLoading(false)
        setApiError('Open this Mini App from Telegram to generate your personal invite link.')
        return
      }
      try {
        const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
        const response = await fetch(`${apiBaseUrl}/api/referral/me`, {
          headers: { Authorization: `tma ${initData}` },
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Could not load your referral profile.')
        if (!cancelled) setProfile(result as ReferralProfile)
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Could not load your referral profile.'
          setApiError(message)
          setNotice(message)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void loadReferralProfile()
    return () => { cancelled = true }
  }, [initData])

  const handleCopy = useCallback(async () => {
    triggerHaptic()
    if (!referralLink) {
      setNotice(apiError || 'Your personal referral link is not ready yet.')
      return
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(referralLink)
      } else {
        const input = document.createElement('textarea')
        input.value = referralLink
        input.setAttribute('readonly', '')
        input.style.position = 'fixed'
        input.style.opacity = '0'
        document.body.appendChild(input)
        input.select()
        const success = document.execCommand('copy')
        document.body.removeChild(input)
        if (!success) throw new Error('Copy command failed')
      }
      setCopied(true)
      setNotice('Personal invite link copied')
      getTelegramWebApp()?.HapticFeedback?.notificationOccurred('success')
    } catch {
      setNotice('Copy unavailable. Use Invite Friends instead.')
    }
  }, [referralLink, apiError])

  const handleInvite = useCallback(() => {
    triggerHaptic()
    if (!referralLink) {
      setNotice(apiError || 'Your personal referral link is not ready yet.')
      return
    }

    void openDeviceShare(referralLink, 'Join the Ether Archive community. Your next chapter starts here.')
      .then((result) => {
        if (result === 'copied') setNotice('Sharing is unavailable. Invite text copied to clipboard.')
      })
      .catch(() => setNotice('Sharing is unavailable on this device. Please copy your invite link instead.'))
  }, [referralLink, apiError])

  const handleTabSelect = useCallback((tab: AppTab) => {
    if (tab === 'Quests' || tab === 'Game' || tab === 'Leaderboard') {
      setNotice(`${tab} is coming soon`)
      return
    }
    setActiveTab(tab)
    setApiError('')
  }, [])

if (showOnboarding) {
  return (
    <Onboarding
      onComplete={() => {
        localStorage.setItem('earc_onboarding_completed', 'true')
        setShowOnboarding(false)
      }}
    />
  )
}

  if (loading) {
    return (
      <main className="loading-screen" role="status" aria-label="Loading Ether Archive">
        <div className="loading-brand">
          <span className="loading-ring" aria-hidden="true" />
          <img src="/assets/ether-archive-mark.svg" alt="Ether Archive" className="loading-logo" />
        </div>
        <span className="loading-caption">OPENING THE ARCHIVE</span>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <BackgroundEffects />
      <TopBar />
      <div className={`content-stack ${activeTab === 'Profile' ? 'profile-view' : 'referral-view'}`}>
        {activeTab === 'Referral' ? (
          <>
            <Hero />
            <ReferralCard
              referralLink={referralLink}
              userId={profile?.userId ?? ''}
              copied={copied}
              disabled={loading || !referralLink}
              onInvite={handleInvite}
              onCopy={handleCopy}
            />
            {apiError && <p className="api-status" role="status">{apiError}</p>}
          </>
        ) : (
          <ProfileSection
            firstName={profile?.firstName ?? 'ARCHIVIST'}
            userId={profile?.userId ?? ''}
            invitedCount={profile?.invitedCount ?? 0}
            rewardPoolPoints={profile?.rewardPoolPoints ?? 0}
            loading={loading}
          />
        )}
      </div>
      <BottomNav activeTab={activeTab} onSelect={handleTabSelect} />
      <Toast message={notice} />
    </main>
  )
}

export default App
