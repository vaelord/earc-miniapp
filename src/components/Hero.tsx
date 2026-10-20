import { memo } from 'react'

function HeroBase() {
  return (
    <section className="hero">
      <h1>Bring your<br />people</h1>
      <p className="hero-copy">Every connection leaves a trace. Invite your people into the Ether Archive.</p>
    </section>
  )
}

export const Hero = memo(HeroBase)
Hero.displayName = 'Hero'
