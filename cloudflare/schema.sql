-- These tables match the schema already created in DB-REFERRAL.
-- Run only if setting up a fresh D1 database; CREATE IF NOT EXISTS is safe.
CREATE TABLE IF NOT EXISTS users (
  telegram_id TEXT PRIMARY KEY,
  user_code TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL DEFAULT 'Archivist',
  username TEXT,
  invite_link TEXT UNIQUE,
  invited_count INTEGER NOT NULL DEFAULT 0,
  reward_pool_points INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS invite_links (
  invite_link TEXT PRIMARY KEY,
  inviter_telegram_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (inviter_telegram_id) REFERENCES users(telegram_id)
);
CREATE TABLE IF NOT EXISTS referrals (
  referred_telegram_id TEXT PRIMARY KEY,
  inviter_telegram_id TEXT NOT NULL,
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (inviter_telegram_id) REFERENCES users(telegram_id)
);
CREATE INDEX IF NOT EXISTS idx_referrals_inviter ON referrals(inviter_telegram_id);
