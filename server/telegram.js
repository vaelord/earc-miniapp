import crypto from 'node:crypto'

export function validateTelegramInitData(initData, botToken, maxAgeSeconds = 86400) {
  if (!initData || !botToken) throw new Error('Telegram authentication is not configured.')
  const params = new URLSearchParams(initData)
  const receivedHash = params.get('hash')
  if (!receivedHash || !/^[a-f0-9]{64}$/i.test(receivedHash)) throw new Error('Invalid Telegram initData hash.')

  params.delete('hash')
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest()
  const expectedHash = Buffer.from(receivedHash, 'hex')
  if (expectedHash.length !== calculatedHash.length || !crypto.timingSafeEqual(expectedHash, calculatedHash)) {
    throw new Error('Telegram identity verification failed.')
  }

  const authDate = Number(params.get('auth_date'))
  if (!Number.isFinite(authDate) || authDate <= 0) throw new Error('Missing Telegram auth date.')
  const age = Math.floor(Date.now() / 1000) - authDate
  if (age < -60 || age > maxAgeSeconds) throw new Error('Telegram session expired. Reopen the Mini App.')

  let user
  try { user = JSON.parse(params.get('user') ?? 'null') } catch { user = null }
  if (!user || !Number.isSafeInteger(user.id)) throw new Error('Telegram user data is missing.')
  return user
}

export async function telegramApi(method, payload, botToken) {
  if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN is not configured.')
  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const result = await response.json()
  if (!response.ok || !result.ok) {
    throw new Error(result.description ?? `Telegram API ${method} failed.`)
  }
  return result.result
}

export function isMemberStatus(member) {
  if (!member) return false
  if (['creator', 'administrator', 'member'].includes(member.status)) return true
  return member.status === 'restricted' && member.is_member === true
}
