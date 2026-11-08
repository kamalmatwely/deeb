# DEEB - Desert Wolf 🐺

Telegram Mini App - DEEB Game

## Links
- Bot: [@DEEB_Desert_Bot](https://t.me/DEEB_Desert_Bot)
- Mini App: [t.me/DEEB_Desert_Bot/deeb_app](https://t.me/DEEB_Desert_Bot/deeb_app)

## Project Structure
```
deeb/
├── index.html          # Main page - Mini App
├── css/
│   └── style.css       # All styles - blue on black, wolf theme
├── js/
│   └── app.js          # All logic - mining, tasks, miners, profile, withdraw
├── assets/             # Images / logo (optional)
├── wrangler.toml       # Cloudflare Workers config
└── README.md
```

## Features
- Mine: Tap coin +0.0001, auto-mining +0.0001/sec (counts even when closed, catch-up on reopen)
- Tasks: 6 tasks, +1 DEEB each, 15s verify, 4h cooldown, 6x/day
- Miners: Lvl 1 - Lvl 21, up to 20,000 DEEB
- Friends: Invite link per user, referrals, team wallet
- Profile: User ID per user, Account Verification (Telegram + ID + Wallet), Assets (collected only, in cents), Withdraw min 1000 DEEB, fee 7 DEEB
- Withdraw: Modal like ATF, min 1000, red error if less, owner notification via sendData
- Energy: 100, when empty -> watch ad -> wait 2s -> refill full 100/100
- ONLINE: OFFLINE -> ONLINE after 1 min
- Bottom spacing on every page

## Deploy to Cloudflare Workers (from GitHub)
1. Push this repo to GitHub
2. Cloudflare Dashboard > Workers & Pages > Create > Workers > Import from GitHub
3. Select this repo, branch `main`
4. Deploy - no build command needed

## Deploy manually (Upload)
1. Zip this folder
2. Cloudflare > Workers > deeb-sira > Deployments > Upload assets

## BotFather Setup
- Bot: @DEEB_Desert_Bot
- Menu Button URL: https://deeb-sira.kamalmatwely.workers.dev
- Main App URL: same
- Launch Mode: Fullsize
