# DEEB Deploy Checklist

## 1. Create D1
wrangler d1 create deeb-db
# خد الـ database_id وحطه في wrangler.toml
wrangler d1 migrations apply deeb-db --local
wrangler d1 migrations apply deeb-db --remote

## 2. Secrets (متحطهمش في GitHub)
wrangler secret put BOT_TOKEN
wrangler secret put OWNER_ID
wrangler secret put JWT_SECRET
wrangler secret put ADMIN_PASSWORD
wrangler secret put TWO_FA_SECRET

## 3. Deploy
wrangler deploy --name deeb-new-name
# خد الرابط وحطه في BotFather -> Menu Button -> Web App URL
# وخد نفس الرابط وحطه في frontend/admin.html في API Base URL

## 4. Webhook
curl https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<worker>/webhook

## 5. Test
- افتح البوت، جرب Tap، Task، Withdraw 1000
- افتح /admin.html، جرب دخول Telegram بـ 6917028432، وجرب Web بـ admin / deeb-admin-2026 / 123456
- غيّر الباسورد والـ 2FA في الحقيقي قبل ما تطلق

## Security Notes
- غيّر ADMIN_PASSWORD و JWT_SECRET و TWO_FA_SECRET فورا
- الـ 2FA في الكود الحالي demo 123456 - في الانتاج استخدم TOTP library
- متبعتش .dev.vars ولا BOT_TOKEN على GitHub
