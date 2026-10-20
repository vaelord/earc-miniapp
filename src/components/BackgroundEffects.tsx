import { memo } from 'react'

function BackgroundEffectsBase() {
  return <div className="background-effects" aria-hidden="true" />
}

export const BackgroundEffects = memo(BackgroundEffectsBase)
BackgroundEffects.displayName = 'BackgroundEffects'
