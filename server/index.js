import 'dotenv/config'
import express from 'express'
import { readStore, writeStore, ensureUser, registerInviteLink, creditReferral } from './store.js'
import { isMemberStatus, telegramApi, validateTelegramInitData } from './telegram.js'

const app = express()
const port = Number(process.env.API_PORT || 3001)
const botToken = process.env.TELEGRAM_BOT_TOKEN
const groupChatId = process.env.TG_COMMUNITY_CHAT_ID || process.env.TG_COMMUNITY_CHAT_USERNAME || '@EtherArchiveOfficial'
const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET
const pointsPerReferral = Math.max(0, Number.parseInt(process.env.REFERRAL_POINTS_PER_JOIN || '0', 10) || 0)

app.use(express.json({ limit: '1mb' }))

function authenticateMiniApp(req, res, next) {
  try {
    const authorization = req.get('authorization') || ''
    const match = authorization.match(/^tma\s+(.+)$/)
    if (!match) return res.status(401).json({ error: 'Open this Mini App from Telegram to continue.' })
    req.telegramUser = validateTelegramInitData(match[1], botToken)
    next()
  } catch (error) {
    return res.status(401).json({ error: error.message || 'Telegram authentication failed.' })
  }
}

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'ether-archive-referrals' }))

app.get('/api/referral/me', authenticateMiniApp, async (req, res) => {
  try {
    if (!botToken) return res.status(503).json({ error: 'Set TELEGRAM_BOT_TOKEN in the server .env file.' })
    if (!groupChatId) return res.status(503).json({ error: 'Set TG_COMMUNITY_CHAT_ID or TG_COMMUNITY_CHAT_USERNAME in the server .env file.' })

    const store = readStore()
    const user = ensureUser(store, req.telegramUser)
    if (!user.inviteLink) {
      const invite = await telegramApi('createChatInviteLink', {
        chat_id: groupChatId,
        name: user.userId,
        creates_join_request: false,
      }, botToken)
      registerInviteLink(store, user, invite.invite_link)
    }
    writeStore(store)
    return res.json({
      userId: user.userId,
      invitedCount: user.invitedCount,
      rewardPoolPoints: user.rewardPoolPoints,
      inviteLink: user.inviteLink,
      firstName: user.firstName,
    })
  } catch (error) {
    console.error('[referral/me]', error.message)
    const message = /chat not found|not enough rights|administrator/i.test(error.message)
      ? 'The bot must be an administrator in the Ether Archive community group with permission to invite users.'
      : error.message || 'Could not create your personal invite link.'
    return res.status(502).json({ error: message })
  }
})

app.post('/api/telegram/webhook', (req, res) => {
  if (webhookSecret && req.get('x-telegram-bot-api-secret-token') !== webhookSecret) {
    return res.sendStatus(403)
  }

  // Telegram expects a quick 200; process the small update synchronously afterwards.
  res.sendStatus(200)
  try {
    const update = req.body
    const event = update?.chat_member
    if (!event) return
    if (isMemberStatus(event.old_chat_member) || !isMemberStatus(event.new_chat_member)) return

    const inviteLink = event.invite_link?.invite_link
    if (!inviteLink) return

    const store = readStore()
    const inviterTelegramId = store.inviteLinks[inviteLink]
    if (!inviterTelegramId) return
    const joinedUser = event.new_chat_member.user
    if (!joinedUser?.id) return

    const credited = creditReferral(store, inviterTelegramId, joinedUser, pointsPerReferral)
    if (credited) {
      writeStore(store)
      console.log(`[referral] ${joinedUser.id} joined through ${store.users[inviterTelegramId]?.userId}; +1 invite, +${pointsPerReferral} points`)
    }
  } catch (error) {
    console.error('[telegram/webhook]', error.message)
  }
})

app.listen(port, '0.0.0.0', () => {
  console.log(`Ether Archive referral API listening on http://localhost:${port}`)
  if (!botToken) console.warn('Set TELEGRAM_BOT_TOKEN in .env before testing Telegram referrals.')
  if (!webhookSecret) console.warn('Set TELEGRAM_WEBHOOK_SECRET in .env before registering the webhook.')
})
