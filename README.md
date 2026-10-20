# Ether Archive Telegram Mini App — Referral MVP

React + Vite Mini App with a small Express API for unique community invite links and join attribution.

## What it does

- Verifies Telegram Mini App `initData` on the server before using a Telegram user identity.
- Loads the official Telegram Web App JavaScript SDK in `index.html` so `window.Telegram.WebApp.initData` is available inside Telegram.
- Assigns each user a persistent internal ID such as `EA-8F3A19C2` and stores their Telegram ID privately.
- Creates one unique Telegram community invite link per user with Bot API `createChatInviteLink`.
- Counts a referral when a person joins the community through that link, using Telegram `chat_member` updates.
- Prevents duplicate credit for the same joined Telegram account.
- Returns the user's invite link, invited count, and points to the Mini App.

## Required Telegram setup

1. Add the same BotFather bot used by this Mini App to the **Ether Archive community group**.
2. Promote it to administrator and enable the permission to invite users/manage invite links. The group must be accessible to the bot. The default group username is `@EtherArchiveOfficial`.
3. In this folder, copy `.env.example` to `.env` and fill in:
   - `TELEGRAM_BOT_TOKEN`: bot token from BotFather. Keep it server-side; never use `VITE_` prefix.
   - `TG_COMMUNITY_CHAT_USERNAME=@EtherArchiveOfficial` or set the numeric `TG_COMMUNITY_CHAT_ID`.
   - `PUBLIC_BASE_URL`: the current HTTPS Cloudflare Quick Tunnel URL, with no trailing slash.
   - `TELEGRAM_WEBHOOK_SECRET`: a random secret containing letters, numbers, `_` or `-`.
   - `REFERRAL_POINTS_PER_JOIN`: the reward amount per verified referral. It defaults to `0` until the project owner decides the reward policy.
4. Start the app and API together:

   ```powershell
   npm install
   npm run dev
   ```

5. In a second PowerShell window, start the tunnel (keep it open):

   ```powershell
   & "C:\....\cloudflared-windows-amd64.exe" tunnel --url http://localhost:5173
   ```

6. Copy the new `https://....trycloudflare.com` URL into `.env` as `PUBLIC_BASE_URL`. If the URL changed, update it and restart the tunnel if necessary.
7. Register Telegram's webhook after the tunnel URL is correct:

   ```powershell
   npm run webhook:set
   ```

8. Keep both terminals open and open the Mini App from Telegram. The API is available through Vite's `/api` proxy.

## How counting works

The app creates a separate invite link for each user. When Telegram reports a transition from non-member to member and includes that invite link, the API credits the owner of that link once. The bot must be an administrator and Telegram must deliver `chat_member` updates. People who join using the general public group URL, an unrelated invite link, or a forwarded link not created for a user cannot be attributed to that user.

## Data and launch readiness

- Development data is saved to `server/data/referrals.json`; it persists across local restarts but is not appropriate for a multi-instance production deployment.
- Before public launch, move user/referral data to a managed database with backups and transactions. Keep bot tokens and webhook secrets in the hosting provider's server-side environment variables.
- Quick Tunnel URLs are temporary. When the URL changes, update `PUBLIC_BASE_URL` and rerun `npm run webhook:set`.
- `REFERRAL_POINTS_PER_JOIN` is intentionally 0 by default; set the actual campaign reward before launch.
- Test with a separate test account and confirm the bot receives `chat_member` updates before announcing the campaign.


## Latest visual update on dev (v6)
- Reverted the global 1.695 typography scaling.
- Doubled the gap between the headline and copy, and between the hero and referral area.
- Increased the logo size and set an explicit SVG fill so it remains visible.
- Reworked the static upper-right gradient and corrected its stacking layer so it renders behind content without hiding the logo.


## Latest UI update on dev (v8)
- Removed the global typography scaling variable and restored explicit type sizes.
- Increased the brand mark to 100px on standard screens, with responsive sizing for compact viewports.
- Added a responsive logo-to-headline spacing target (up to 3.5× the logo size where viewport height allows).
- Disabled ordinary text selection throughout the UI while keeping the personal invite link selectable.
- Added best-effort browser context-menu and DevTools shortcut blocking; this is a deterrent only and cannot securely prevent browser inspection.
- Enabled the Profile tab and moved Invited / Reward Pool Points into the Profile section.
- Kept Quests, Game, and Leaderboard disabled.
