import { memo } from 'react'

function TopBarBase() {
  return (
    <header className="topbar" aria-label="Ether Archive">
      <div className="brand-lockup" aria-label="Ether Archive logo">
        <img className="brand-mark" src="/assets/ether-archive-mark.svg" alt="Ether Archive" />
      </div>
    </header>
  )
}

export const TopBar = memo(TopBarBase)
TopBar.displayName = 'TopBar'
