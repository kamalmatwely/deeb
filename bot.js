// DEEB Desert Bot - Telegram Bot
// Run: BOT_TOKEN=xxx OWNER_ID=6917028432 node bot.js
// Needs: npm i telegraf
const { Telegraf } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const OWNER_ID = process.env.OWNER_ID || '6917028432';
const OWNER_WALLET = 'UQBfJAOxieOPI1tlo784ywL9jlo1Ez2enZtfP5MuJ7RW-r4D';
const POOL_WALLET = 'EQCSxMGBDrK7pprTSu4_vHFGmv9RWxZmFRH0D6JBeci9T6aK';
const TOKEN_CONTRACT = 'EQCk7OdnTdNQR1v5gn2yulD6ieTBte00SyJ9hqilOiRKDwXE';
const CHANNEL = 'https://t.me/deebnetwork1';
const GROUP = 'https://t.me/+VifpXn6GNNU5NThk';
const YOUTUBE = 'https://youtube.com/@deebnetwork?si=9o9ahaayAlMiRE7N';
const X_LINK = 'https://x.com/deebNetwork';
const WEBAPP_URL = 'https://t.me/DEEB_Desert_Bot/deeb_app';

if (!BOT_TOKEN) {
  console.log('ERROR: BOT_TOKEN missing. Set env BOT_TOKEN');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

function isAdmin(ctx) {
  return String(ctx.from?.id) === String(OWNER_ID);
}

bot.start(async (ctx) => {
  const userId = ctx.from.id;
  const payload = ctx.startPayload || '';
  // ref_<id> handling - referral is stored by Mini App via API, here we just greet
  const ref = payload.startsWith('ref_') ? payload.replace('ref_', '') : null;
  const name = ctx.from.first_name || 'Wolf';
  const text =
    `🐺 Welcome to DEEB Desert, ${name}!\n\n` +
    `Mine DEEB, complete tasks, upgrade miners, invite friends.\n\n` +
    `Contract: ${TOKEN_CONTRACT}\n` +
    `Pool: ${POOL_WALLET}\n` +
    (ref ? `\nYou were invited by: ${ref}\n` : '') +
    `\nTap Play to start mining.`;
  await ctx.reply(text, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '▶️ Play DEEB', web_app: { url: WEBAPP_URL } }],
        [{ text: '📢 Channel', url: CHANNEL }, { text: '💬 Group', url: GROUP }],
        [{ text: '▶️ YouTube', url: YOUTUBE }, { text: '𝕏 X', url: X_LINK }],
      ],
    },
  });
});

bot.command('help', async (ctx) => {
  await ctx.reply('Commands:\n/start - Start\n/play - Open Mini App\n/balance - Your balance is inside the Mini App\n/admin - Owner only\n/withdraw - Open Mini App > Profile > Withdraw');
});

bot.command('play', async (ctx) => {
  await ctx.reply('Tap to play:', {
    reply_markup: { inline_keyboard: [[{ text: '▶️ Play DEEB', web_app: { url: WEBAPP_URL } }]] },
  });
});

// Withdraw notification from Mini App -> send via bot API from frontend/backend
// Frontend calls: POST /api/withdraw -> backend sends Telegram message to OWNER_ID
// This handler is for manual / test notify: /notify <userId> <amount> <wallet>
bot.command('notify', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('Not allowed.');
  const parts = ctx.message.text.split(' ');
  if (parts.length < 4) return ctx.reply('Usage: /notify <userId> <amount> <wallet>');
  const [, uid, amount, wallet] = parts;
  const msg = `💰 New Withdraw Request\n\nUser ID: ${uid}\nAmount: ${amount} DEEB\nWallet: ${wallet}\nTime: ${new Date().toISOString()}`;
  await ctx.telegram.sendMessage(OWNER_ID, msg);
  await ctx.reply('Sent to owner.');
});

bot.command('admin', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('Not allowed.');
  await ctx.reply(
    `🛠 DEEB Admin\n\nOwner ID: ${OWNER_ID}\nOwner Wallet: ${OWNER_WALLET}\nPool: ${POOL_WALLET}\nContract: ${TOKEN_CONTRACT}\n\nUse Mini App Admin panel for: Users / Withdrawals / Broadcast / Settings.`
  );
});

// Handle web_app_data from Mini App (withdraw request sent via sendData)
bot.on('web_app_data', async (ctx) => {
  try {
    const data = JSON.parse(ctx.webAppData.data);
    if (data.type === 'withdraw') {
      const msg =
        `💰 New Withdraw Request\n\n` +
        `User: ${ctx.from.first_name || ''} (@${ctx.from.username || 'no_username'})\n` +
        `User ID: ${ctx.from.id}\n` +
        `Wallet: ${data.wallet}\n` +
        `Amount: ${data.amount} DEEB\n` +
        `Fee: ${data.fee} DEEB\n` +
        `You will receive: ${data.receive} DEEB\n` +
        `Time: ${new Date().toISOString()}`;
      await ctx.telegram.sendMessage(OWNER_ID, msg);
      await ctx.reply('✅ Withdraw request sent to owner. Status: Pending in History.');
    } else {
      await ctx.reply('Received.');
    }
  } catch (e) {
    console.error('web_app_data error', e);
    await ctx.reply('Error processing data.');
  }
});

bot.launch().then(() => console.log('DEEB Bot running...'));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
