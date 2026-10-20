import { useEffect, useState } from 'react'
import './Onboarding.css'

type OnboardingProps = {
  onComplete: () => void
}

const slides = [
  {
    image: '/images/onboarding-referral.jpg',
    eyebrow: 'GROW THE ARCHIVE',
    title: 'Invite. Connect. Earn.',
    description:
      'Share your personal referral link, invite friends, and help grow the Ether Archive community.',
  },
  {
    image: '/images/onboarding-profile.jpg',
    eyebrow: 'YOUR JOURNEY',
    title: 'Your Archive Profile',
    description:
      'Track your invitations, view your referral stats, and follow your progress in the community.',
  },
  {
    image: '/images/onboarding-coming-soon.jpg',
    eyebrow: 'THIS IS JUST THE BEGINNING',
    title: 'More Is Coming.',
    description:
      'New quests, games, leaderboards, and more ways to explore Ether Archive are on the way.',
  },
]

export function Onboarding({ onComplete }: OnboardingProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [isCompleting, setIsCompleting] = useState(false)

  useEffect(() => {
    // Preload the artwork so a newly selected slide is less likely to flash while loading.
    slides.forEach(({ image }) => {
      const img = new Image()
      img.src = image
    })
  }, [])

  const goTo = (nextIndex: number) => {
    if (isCompleting || nextIndex < 0 || nextIndex >= slides.length || nextIndex === activeIndex) return
    setDirection(nextIndex > activeIndex ? 'next' : 'prev')
    setActiveIndex(nextIndex)
  }

  const finish = () => {
    if (isCompleting) return
    setIsCompleting(true)
    // No timeout or animation-completion dependency: entering the app is immediate.
    onComplete()
  }

  const slide = slides[activeIndex]
  const isLast = activeIndex === slides.length - 1

  return (
    <main className="onboarding" aria-label="Ether Archive introduction">
      <button className="onboarding__skip" onClick={finish} type="button">
        Skip
      </button>

      <div className="onboarding__viewport">
        <section
          key={activeIndex}
          className={`onboarding__panel onboarding__panel--${direction}`}
          aria-live="polite"
        >
          <img
            className="onboarding__image"
            src={slide.image}
            alt=""
            decoding="async"
            fetchPriority="high"
          />
          <div className="onboarding__image-shade" aria-hidden="true" />

          <div className="onboarding__content">
            <div className="onboarding__progress" aria-label={`Slide ${activeIndex + 1} of ${slides.length}`}>
              {slides.map((item, index) => (
                <span
                  key={item.image}
                  className={`onboarding__progress-track${index <= activeIndex ? ' is-filled' : ''}`}
                />
              ))}
            </div>

            <p className="onboarding__eyebrow">{slide.eyebrow}</p>
            <h1 className="onboarding__title">{slide.title}</h1>
            <p className="onboarding__description">{slide.description}</p>

<div className="onboarding__actions">
  {activeIndex > 0 && (
    <button
      className="onboarding__back"
      onClick={() => goTo(activeIndex - 1)}
      type="button"
    >
      <span aria-hidden="true">←</span> Back
    </button>
  )}

  <button
    className={`onboarding__next ${activeIndex === 0 ? 'onboarding__next--full' : ''}`}
    onClick={isLast ? finish : () => goTo(activeIndex + 1)}
    type="button"
  >
    {isLast ? 'Enter Archive' : 'Continue'}
    <span aria-hidden="true">{isLast ? '↗' : '→'}</span>
  </button>
</div>
          </div>
        </section>
      </div>
    </main>
  )
}
