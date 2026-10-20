import 'dotenv/config'

const token = process.env.TELEGRAM_BOT_TOKEN
const publicBaseUrl = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '')
const secret = process.env.TELEGRAM_WEBHOOK_SECRET

if (!token) throw new Error('Missing TELEGRAM_BOT_TOKEN in .env')
if (!publicBaseUrl.startsWith('https://')) throw new Error('Set PUBLIC_BASE_URL to your current https://...trycloudflare.com URL in .env')
if (!secret || !/^[A-Za-z0-9_-]{1,256}$/.test(secret)) throw new Error('Set TELEGRAM_WEBHOOK_SECRET to 1-256 letters, numbers, underscores or hyphens in .env')

const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    url: `${publicBaseUrl}/api/telegram/webhook`,
    secret_token: secret,
    allowed_updates: ['chat_member'],
    drop_pending_updates: false,
  }),
})
const result = await response.json()
if (!response.ok || !result.ok) throw new Error(result.description || 'Telegram setWebhook failed')
console.log(`Telegram webhook configured: ${publicBaseUrl}/api/telegram/webhook`)
console.log('The bot must be an administrator in the community group and have permission to invite users.')
