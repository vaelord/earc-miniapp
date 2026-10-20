import { memo } from 'react'
import { Gamepad2, LockKeyhole, Sparkles, Trophy, UserRound, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { triggerHaptic } from '../lib/telegram'

export type AppTab = 'Referral' | 'Quests' | 'Game' | 'Leaderboard' | 'Profile'

const NAV_ITEMS: { label: AppTab; icon: LucideIcon }[] = [
  { label: 'Referral', icon: Users },
  { label: 'Quests', icon: Sparkles },
  { label: 'Game', icon: Gamepad2 },
  { label: 'Leaderboard', icon: Trophy },
  { label: 'Profile', icon: UserRound },
]

interface BottomNavProps {
  activeTab: AppTab
  onSelect: (tab: AppTab) => void
}

function BottomNavBase({ activeTab, onSelect }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {NAV_ITEMS.map(({ label, icon: Icon }) => {
        const active = activeTab === label
        const disabled = label !== 'Referral' && label !== 'Profile'
        return (
          <button
            key={label}
            className={`nav-item ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
            onClick={() => { if (disabled) return; triggerHaptic(); onSelect(label) }}
            aria-label={label}
            aria-disabled={disabled}
            disabled={disabled}
            aria-current={active ? 'page' : undefined}
          >
            <span className="nav-icon-wrap"><Icon size={19} strokeWidth={active ? 2 : 1.7} />{disabled && <span className="nav-lock"><LockKeyhole size={8} /></span>}</span>
            <span className="nav-label">{label}</span>
            {active && <span className="active-indicator" />}
          </button>
        )
      })}
    </nav>
  )
}

export const BottomNav = memo(BottomNavBase)
BottomNav.displayName = 'BottomNav' 