const DEFAULT_GROUP = '@EtherArchiveOfficial';

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...headers } });
}
function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.FRONTEND_ORIGIN || '').split(',').map((x) => x.trim()).filter(Boolean);
  const headers = { 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Authorization,Content-Type,X-Telegram-Bot-Api-Secret-Token', 'Vary': 'Origin' };
  if (allowed.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}
function toHex(buffer) { return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join(''); }
function fromHex(hex) { const out = new Uint8Array(hex.length / 2); for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16); return out; }
async function hmac(keyBytes, data) {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data)));
}
async function validateInitData(initData, token) {
  if (!initData || !token) throw new Error('Telegram authentication is not configured.');
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash || !/^[a-f0-9]{64}$/i.test(hash)) throw new Error('Invalid Telegram initData hash.');
  params.delete('hash');
  const check = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join('\n');
  const secret = await hmac(new TextEncoder().encode('WebAppData'), token);
  const calculated = await hmac(secret, check);
  const expected = fromHex(hash);
  if (expected.length !== calculated.length || !crypto.subtle) throw new Error('Telegram identity verification failed.');
  let diff = 0; for (let i = 0; i < expected.length; i++) diff |= expected[i] ^ calculated[i];
  if (diff !== 0) throw new Error('Telegram identity verification failed.');
  const authDate = Number(params.get('auth_date'));
  const age = Math.floor(Date.now() / 1000) - authDate;
  if (!Number.isFinite(authDate) || authDate <= 0 || age < -60 || age > 86400) throw new Error('Telegram session expired. Reopen the Mini App.');
  let user; try { user = JSON.parse(params.get('user') || 'null'); } catch { user = null; }
  if (!user || !Number.isSafeInteger(user.id)) throw new Error('Telegram user data is missing.');
  return user;
}
async function telegramApi(method, payload, token) {
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not configured.');
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(result.description || `Telegram API ${method} failed.`);
  return result.result;
}
function isMember(member) {
  if (!member) return false;
  return ['creator', 'administrator', 'member'].includes(member.status) || (member.status === 'restricted' && member.is_member === true);
}
function newUserCode() { const bytes = crypto.getRandomValues(new Uint8Array(4)); return `EA-${[...bytes].map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()}`; }
async function ensureUser(db, tgUser) {
  const telegramId = String(tgUser.id);
  let existing = await db.prepare('SELECT * FROM users WHERE telegram_id = ?').bind(telegramId).first();
  if (existing) {
    await db.prepare('UPDATE users SET first_name = ?, username = ? WHERE telegram_id = ?').bind(tgUser.first_name || existing.first_name || 'Archivist', tgUser.username || existing.username || null, telegramId).run();
    return { ...existing, first_name: tgUser.first_name || existing.first_name, username: tgUser.username || existing.username };
  }
  let code;
  for (let i = 0; i < 5; i++) {
    code = newUserCode();
    try {
      await db.prepare("INSERT INTO users (telegram_id, user_code, first_name, username) VALUES (?, ?, ?, ?)").bind(telegramId, code, tgUser.first_name || 'Archivist', tgUser.username || null).run();
      break;
    } catch (e) {
      if (i === 4) throw e;
    }
  }
  return await db.prepare('SELECT * FROM users WHERE telegram_id = ?').bind(telegramId).first();
}
async function handleMe(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const match = auth.match(/^tma\s+(.+)$/);
  if (!match) return json({ error: 'Open this Mini App from Telegram to continue.' }, 401);
  let tgUser;
  try { tgUser = await validateInitData(match[1], env.TELEGRAM_BOT_TOKEN); }
  catch (e) { return json({ error: e.message || 'Telegram authentication failed.' }, 401); }
  const group = env.TG_COMMUNITY_CHAT_ID || env.TG_COMMUNITY_CHAT_USERNAME || DEFAULT_GROUP;
  try {
    const user = await ensureUser(env.DB, tgUser);
    let inviteLink = user.invite_link;
    if (!inviteLink) {
      const invite = await telegramApi('createChatInviteLink', { chat_id: group, name: user.user_code, creates_join_request: false }, env.TELEGRAM_BOT_TOKEN);
      inviteLink = invite.invite_link;
      await env.DB.prepare('UPDATE users SET invite_link = ? WHERE telegram_id = ? AND invite_link IS NULL').bind(inviteLink, String(tgUser.id)).run();
      await env.DB.prepare('INSERT OR IGNORE INTO invite_links (invite_link, inviter_telegram_id) VALUES (?, ?)').bind(inviteLink, String(tgUser.id)).run();
      const latest = await env.DB.prepare('SELECT invite_link FROM users WHERE telegram_id = ?').bind(String(tgUser.id)).first();
      inviteLink = latest?.invite_link || inviteLink;
    }
    return json({ userId: user.user_code, invitedCount: user.invited_count || 0, rewardPoolPoints: user.reward_pool_points || 0, inviteLink, firstName: tgUser.first_name || user.first_name || 'Archivist' });
  } catch (e) {
    console.error('referral/me', e?.message);
    const message = /chat not found|not enough rights|administrator/i.test(e.message || '') ? 'The bot must be an administrator in the Ether Archive community group with permission to invite users.' : (e.message || 'Could not create your personal invite link.');
    return json({ error: message }, 502);
  }
}
async function handleWebhook(request, env) {
  const expected = env.TELEGRAM_WEBHOOK_SECRET;
  if (expected && request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== expected) return new Response('Forbidden', { status: 403 });
  let update; try { update = await request.json(); } catch { return new Response('Bad Request', { status: 400 }); }
  const event = update?.chat_member;
  if (!event || isMember(event.old_chat_member) || !isMember(event.new_chat_member)) return new Response('OK');
  const link = event.invite_link?.invite_link;
  const joined = event.new_chat_member?.user;
  if (!link || !joined?.id) return new Response('OK');
  try {
    const inviter = await env.DB.prepare('SELECT inviter_telegram_id FROM invite_links WHERE invite_link = ?').bind(link).first();
    if (!inviter || String(inviter.inviter_telegram_id) === String(joined.id)) return new Response('OK');
    const joinedId = String(joined.id);
    const inviterId = String(inviter.inviter_telegram_id);
    await ensureUser(env.DB, joined);
    const points = Math.max(0, Number.parseInt(env.REFERRAL_POINTS_PER_JOIN || '0', 10) || 0);
    const insert = await env.DB.prepare('INSERT OR IGNORE INTO referrals (referred_telegram_id, inviter_telegram_id) VALUES (?, ?)').bind(joinedId, inviterId).run();
    if (insert.meta?.changes) {
      await env.DB.prepare('UPDATE users SET invited_count = invited_count + 1, reward_pool_points = reward_pool_points + ? WHERE telegram_id = ?').bind(points, inviterId).run();
      console.log(`Credited referral ${joinedId} to ${inviterId}`);
    }
  } catch (e) { console.error('telegram/webhook processing failed', e?.message); }
  return new Response('OK');
}
export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (url.pathname === '/api/health' && request.method === 'GET') return json({ ok: true, service: 'ether-archive-referrals' }, 200, cors);
    if (url.pathname === '/api/referral/me' && request.method === 'GET') {
      const response = await handleMe(request, env);
      const headers = new Headers(response.headers); for (const [k, v] of Object.entries(cors)) headers.set(k, v);
      return new Response(response.body, { status: response.status, headers });
    }
    if (url.pathname === '/api/telegram/webhook' && request.method === 'POST') return handleWebhook(request, env);
    return json({ error: 'Not found' }, 404, cors);
  }
};
