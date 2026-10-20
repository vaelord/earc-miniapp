import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(here, 'data')
const dataFile = path.join(dataDir, 'referrals.json')

function emptyStore() {
  return { users: {}, inviteLinks: {}, referredUsers: {} }
}

export function readStore() {
  fs.mkdirSync(dataDir, { recursive: true })
  if (!fs.existsSync(dataFile)) return emptyStore()
  try {
    const parsed = JSON.parse(fs.readFileSync(dataFile, 'utf8'))
    return {
      users: parsed.users ?? {},
      inviteLinks: parsed.inviteLinks ?? {},
      referredUsers: parsed.referredUsers ?? {},
    }
  } catch {
    throw new Error(`Referral data file is invalid: ${dataFile}`)
  }
}

export function writeStore(store) {
  fs.mkdirSync(dataDir, { recursive: true })
  const temporaryFile = `${dataFile}.${process.pid}.tmp`
  fs.writeFileSync(temporaryFile, JSON.stringify(store, null, 2), 'utf8')
  fs.renameSync(temporaryFile, dataFile)
}

function newCode(store) {
  let code
  const existing = new Set(Object.values(store.users).map((user) => user.userId))
  do {
    code = `EA-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
  } while (existing.has(code))
  return code
}

export function ensureUser(store, telegramUser) {
  const telegramId = String(telegramUser.id)
  let user = store.users[telegramId]
  if (!user) {
    const userId = newCode(store)
    user = {
      telegramId,
      userId,
      firstName: telegramUser.first_name ?? 'Archivist',
      username: telegramUser.username ?? null,
      inviteLink: null,
      invitedCount: 0,
      rewardPoolPoints: 0,
      createdAt: new Date().toISOString(),
    }
    store.users[telegramId] = user
  } else {
    user.firstName = telegramUser.first_name ?? user.firstName
    user.username = telegramUser.username ?? user.username
  }
  return user
}

export function registerInviteLink(store, user, inviteLink) {
  user.inviteLink = inviteLink
  store.inviteLinks[inviteLink] = user.telegramId
}

export function creditReferral(store, inviterTelegramId, referredTelegramUser, pointsPerReferral) {
  const referredTelegramId = String(referredTelegramUser.id)
  if (!inviterTelegramId || inviterTelegramId === referredTelegramId) return false
  if (store.referredUsers[referredTelegramId]) return false

  const inviter = store.users[inviterTelegramId]
  if (!inviter) return false

  ensureUser(store, referredTelegramUser)
  store.referredUsers[referredTelegramId] = {
    inviterTelegramId,
    joinedAt: new Date().toISOString(),
  }
  inviter.invitedCount += 1
  inviter.rewardPoolPoints += pointsPerReferral
  return true
}
