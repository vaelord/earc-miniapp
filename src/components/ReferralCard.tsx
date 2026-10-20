import { memo } from 'react'
import { ArrowUpRight, Check, Copy, Share2 } from 'lucide-react'

interface ReferralCardProps {
  referralLink: string
  userId: string
  copied: boolean
  disabled?: boolean
  onInvite: () => void
  onCopy: () => void
}

function ReferralCardBase({ referralLink, userId, copied, disabled = false, onInvite, onCopy }: ReferralCardProps) {
  return (
    <section className="referral-card" aria-labelledby="referral-title">
      <div className="referral-heading">
        <h2 id="referral-title" className="card-kicker">YOUR REFERRAL LINK</h2>
        <span className="user-id">ID {userId || '—'}</span>
      </div>
      <div className="link-field-wrap">
        <input
          aria-label="Your personal community invite link"
          className="link-field"
          value={referralLink}
          placeholder="Your personal invite link will appear here"
          readOnly
          onFocus={(event) => event.currentTarget.select()}
          onClick={(event) => event.currentTarget.select()}
        />
      </div>
      <div className="action-grid">
        <button className="button-primary" onClick={onInvite} disabled={disabled}><Share2 size={16} strokeWidth={2} /> INVITE FRIENDS <ArrowUpRight size={15} /></button>
        <button className={`button-secondary ${copied ? 'is-copied' : ''}`} onClick={onCopy} disabled={disabled}>{copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'COPIED' : 'COPY LINK'}</button>
      </div>
    </section>
  )
}

export const ReferralCard = memo(ReferralCardBase)
ReferralCard.displayName = 'ReferralCard'
