# Deploy Ether Archive Referral Worker

The frontend stays on Vercel. This Worker serves the referral API and Telegram webhook. The D1 binding must be named `DB` and point to `DB-REFERRAL`.

## 1. Worker code

In Cloudflare Dashboard, open Workers & Pages → `ether-archive-referral-api` → Edit code. Replace the starter code with the contents of `worker.js`, then Save and Deploy.

## 2. D1 binding

Settings → Bindings must show D1 database binding:
- Variable name: `DB`
- D1 database: `DB-REFERRAL`

## 3. Variables and secrets

Under Settings → Variables and Secrets, add these server-side values:
- Secret `TELEGRAM_BOT_TOKEN`: token from BotFather
- Secret `TELEGRAM_WEBHOOK_SECRET`: 1–256 characters using letters, numbers, `_` or `-`; use a new random value
- Variable `TG_COMMUNITY_CHAT_USERNAME`: `@EtherArchiveOfficial` (or use `TG_COMMUNITY_CHAT_ID` with the numeric group ID instead)
- Variable `REFERRAL_POINTS_PER_JOIN`: `0` until the reward policy is confirmed
- Variable `FRONTEND_ORIGIN`: exact Vercel deployment origin, e.g. `https://your-project.vercel.app` (no path or trailing slash). For a custom domain, add that origin too, comma-separated.

Save and deploy after changing variables/secrets. Never put bot token in Vercel or a `VITE_` variable.

## 4. Test Worker

Open `https://ether-archive-referral-api.e-gndz-33.workers.dev/api/health`. Expected response: `{"ok":true,"service":"ether-archive-referrals"}`.

## 5. Frontend on Vercel

In Vercel → Project → Settings → Environment Variables, set:
- `VITE_API_BASE_URL` = `https://ether-archive-referral-api.e-gndz-33.workers.dev`
- `VITE_COMMUNITY_GROUP_URL` = `https://t.me/EtherArchiveOfficial` only if the existing UI reads it.

Set `VITE_API_BASE_URL` for Production (and Preview only if you want preview deployments to use this Worker). Redeploy the frontend after saving. This source now reads `VITE_API_BASE_URL` when requesting `/api/referral/me`.

## 6. Register Telegram webhook

After the Worker code and secrets are deployed, from a trusted terminal run the following request, substituting the real token and exact same webhook secret. Do not paste token into chat or commit it to GitHub:

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://ether-archive-referral-api.e-gndz-33.workers.dev/api/telegram/webhook","secret_token":"<TELEGRAM_WEBHOOK_SECRET>","allowed_updates":["chat_member"],"drop_pending_updates":false}'
```

Telegram requires the bot to be an administrator in the group and to have permission to manage invite links. The secret token must exactly match the Worker secret.

## 7. Validate end-to-end

- `/api/health` responds successfully.
- Open the Vercel Mini App from Telegram (ordinary browser requests will fail Telegram `initData` authentication by design).
- Check that a personal invite link is generated.
- Join using a test Telegram account and that invite link; check the inviter count once.
- Check Telegram `getWebhookInfo` for webhook errors.

## Important

- D1 tables should already exist from the SQL run in the Cloudflare D1 Console. `schema.sql` is provided for reference/fresh databases.
- This Worker only processes `chat_member` events that include the per-user invite link. General group joins cannot be attributed.
- Referral points are `0` by default; set the actual reward policy before launch.
- This Worker does not migrate local `server/data/referrals.json`; export/import any test data separately only if required.
