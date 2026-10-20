import { memo } from 'react'
import { ReferralStats } from './ReferralStats'

interface ProfileSectionProps {
  firstName: string
  userId: string
  invitedCount: number
  rewardPoolPoints: number
  loading: boolean
}

function ProfileSectionBase({ firstName, userId, invitedCount, rewardPoolPoints, loading }: ProfileSectionProps) {
  return (
    <section className="profile-section" aria-labelledby="profile-title">
      <p className="card-kicker">ETHER ARCHIVE / MEMBER PROFILE</p>
      <h1 id="profile-title" className="profile-title">Your<br />archive</h1>
      <div className="profile-identity">
        <span className="profile-eyebrow">ARCHIVIST</span>
        <span className="profile-name">{firstName}</span>
        <span className="profile-id">{loading ? 'LOADING PROFILE…' : `ID ${userId || '—'}`}</span>
      </div>
      <ReferralStats invitedCount={invitedCount} rewardPoolPoints={rewardPoolPoints} />
    </section>
  )
}

export const ProfileSection = memo(ProfileSectionBase)
ProfileSection.displayName = 'ProfileSection'
