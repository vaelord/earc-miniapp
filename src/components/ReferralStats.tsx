import { memo } from 'react'

interface ReferralStatsProps {
  invitedCount: number
  rewardPoolPoints: number
}

function ReferralStatsBase({ invitedCount, rewardPoolPoints }: ReferralStatsProps) {
  return (
    <section className="stats-section" aria-label="Referral statistics">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">INVITED</div>
          <div className="stat-value">{invitedCount.toLocaleString('en-US')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">REWARD POOL POINTS</div>
          <div className="stat-value">{rewardPoolPoints.toLocaleString('en-US')}</div>
        </div>
      </div>
    </section>
  )
}

export const ReferralStats = memo(ReferralStatsBase)
ReferralStats.displayName = 'ReferralStats'
