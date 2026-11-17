// DEEB Backend - Cloudflare Worker + D1 + Telegram Bot
// Routes: /api/config, /api/user, /api/tap, /api/tasks, /api/withdraw, /api/admin/*, /api/auth/*, /webhook
import { createHmac } from 'node:crypto';

const CORS = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization'};
const json=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'Content-Type':'application/json',...CORS}});
const uid=()=>Math.random().toString(36).slice(2)+Date.now().toString(36);

// Verify Telegram initData (HMAC SHA256) - real security
async function verifyInitData(initData, botToken){
  try{
    const p=new URLSearchParams(initData); const hash=p.get('hash'); p.delete('hash');
    const check=[...p.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([k,v])=>`${k}=${v}`).join('\n');
    const enc=new TextEncoder();
    const key=await crypto.subtle.importKey('raw',enc.encode('WebAppData'),{name:'HMAC',hash:'SHA-256'},false,['sign']);
    const sk=await crypto.subtle.sign('HMAC',key,enc.encode(botToken));
    const key2=await crypto.subtle.importKey('raw',sk,{name:'HMAC',hash:'SHA-256'},false,['sign']);
    const sig=await crypto.subtle.sign('HMAC',key2,enc.encode(check));
    const hex=[...new Uint8Array(sig)].map(b=>b.toString(16).padStart(2,'0')).join('');
    if(hex!==hash) return null;
    const u=JSON.parse(p.get('user')||'null'); return u;
  }catch(e){ return null; }
}
async function sendTelegram(env, chatId, text){
  if(!env.BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:chatId,text,parse_mode:'HTML'})});
}
function getToken(req){ const h=req.headers.get('Authorization')||''; return h.replace('Bearer ',''); }
async function requireAdmin(env, req){
  const t=getToken(req); if(!t) return false;
  const s=await env.DB.prepare('SELECT * FROM admin_sessions WHERE token=? AND expires_at>?').bind(t,Date.now()).first();
  return !!s;
}
function logSec(env, method, status, telegramId='', username='', ip=''){
  return env.DB.prepare('INSERT INTO security_log (id,method,telegram_id,username,status,ip,created_at) VALUES (?,?,?,?,?,?,?)').bind(uid(),method,telegramId,username,status,ip,Date.now()).run().catch(()=>{});
}
async function logActivity(env, telegramId, username, action, detail){
  try{
    await env.DB.prepare('CREATE TABLE IF NOT EXISTS activity_log (id TEXT PRIMARY KEY, telegram_id TEXT, username TEXT, action TEXT, detail TEXT, created_at INTEGER)').run();
    await env.DB.prepare('INSERT INTO activity_log VALUES (?,?,?,?,?,?)').bind(uid(),String(telegramId||''),username||'',action,detail||'',Date.now()).run();
  }catch(e){}
}

// حفظ التفاعلات - البوت بيستقبلها من تليجرام
let reactedUsers = new Map(); // userId -> وقت التفاعل

async function handleUpdate(update){
  if(update.message_reaction){
    let uid = update.message_reaction.user.id;
    reactedUsers.set(Number(uid), Date.now());
  }
}

// التحقق من المهمتين
async function verifyTask(userId, taskId, env){
  if(taskId === 'react'){
    // هل اتفاعل ولا لأ؟
    let t = reactedUsers.get(Number(userId));
if(t && Date.now() - t < 10*60*1000) return { ok: true };
return { ok: false, reason: 'react_first' };
  }
  if(taskId === 'bio'){
    // هات اسم المستخدم الحالي من تليجرام
    let r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/getChat?chat_id=${userId}`);
    let j = await r.json();
    let name = (j.result?.first_name || '') + ' ' + (j.result?.last_name || '');
    if(name.includes('🐺deeb') || name.includes('🐺 deeb')){
      return { ok: true };
    }
    return { ok: false, reason: 'no_bio' };
  }
  return { ok: false };
}
export default {
 async fetch(req, env, ctx){
  const url=new URL(req.url);
  if(req.method==='OPTIONS') return new Response(null,{headers:CORS});
  const path=url.pathname;

   if(path==='/webhook' && req.method==='POST'){
  const update = await req.json().catch(()=>({}));
  await handleUpdate(update);
  return json({ ok: true });
   }
  // --- PUBLIC CONFIG ---
  if(path==='/api/config') return json({contract:env.TOKEN_CONTRACT,poolWallet:env.POOL_WALLET,ownerWallet:env.OWNER_WALLET,bot:'@'+(env.BOT_USERNAME||'DEEB_Desert_Bot'),channel:'https://t.me/deebnetwork1',group:'https://t.me/+VifpXn6GNNU5NThk',youtube:'https://youtube.com/@deebnetwork',twitter:'https://x.com/deebNetwork',minWithdraw:1000,fee:7,tapReward:0.0001,referralPercent:0.05,price:0.0000075});

  // --- AUTH: TELEGRAM (owner only) ---
  if(path==='/api/auth/telegram' && req.method==='POST'){
    const {telegramId, initData} = await req.json().catch(()=>({}));
    let user=null;
    if(initData && env.BOT_TOKEN) user=await verifyInitData(initData, env.BOT_TOKEN);
    const tid = user?.id ? String(user.id) : String(telegramId||'');
    const ok = tid===String(env.OWNER_ID||'6917028432');
    await logSec(env,'telegram', ok?'success':'failed', tid, user?.username||'', req.headers.get('CF-Connecting-IP')||'');
    if(!ok) return json({error:'Access denied - not owner'},403);
    const token=uid()+uid(); const exp=Date.now()+2*3600*1000;
    await env.DB.prepare('INSERT INTO admin_sessions VALUES (?,?,?,?,?)').bind(token,'telegram',Date.now(),exp,req.headers.get('CF-Connecting-IP')||'').run();
    return json({token, method:'telegram', expiresAt:exp});
  }
  // --- AUTH: WEB + 2FA ---
  if(path==='/api/auth/login' && req.method==='POST'){
    const {username,password,code} = await req.json().catch(()=>({}));
    // In production: compare bcrypt hash from env.ADMIN_PASSWORD_HASH and TOTP from env.TWO_FA_SECRET
    // Demo check matches admin.html demo values - REPLACE in production
    const ok = username===(env.ADMIN_USERNAME||'admin') && password===(env.ADMIN_PASSWORD||'deeb-admin-2026') && code==='123456';
    await logSec(env,'web', ok?'success':'failed','',username,req.headers.get('CF-Connecting-IP')||'');
    if(!ok) return json({error:'Invalid credentials or 2FA'},401);
    const token=uid()+uid(); const exp=Date.now()+2*3600*1000;
    await env.DB.prepare('INSERT INTO admin_sessions VALUES (?,?,?,?,?)').bind(token,'web',Date.now(),exp,req.headers.get('CF-Connecting-IP')||'').run();
    return json({token, method:'web', expiresAt:exp});
  }
  if(path==='/api/auth/me'){
    const ok=await requireAdmin(env,req); return json({admin:ok});
  }
  // --- USER: get or create ---
  if(path==='/api/user' && req.method==='POST'){
    const {telegramId, username, firstName, referrer} = await req.json().catch(()=>({}));
    if(!telegramId) return json({error:'telegramId required'},400);
    let u=await env.DB.prepare('SELECT * FROM users WHERE telegram_id=?').bind(String(telegramId)).first();
    if(!u){
      await env.DB.prepare('INSERT INTO users (id,telegram_id,username,first_name,created_at,last_seen,referrer_id) VALUES (?,?,?,?,?,?,?)').bind(uid(),String(telegramId),username||'',firstName||'',Date.now(),Date.now(),referrer||null).run();
      if(referrer) await env.DB.prepare('INSERT INTO referrals (id,inviter_id,invited_id,created_at) VALUES (?,?,?,?)').bind(uid(),String(referrer),String(telegramId),Date.now()).run();
      u=await env.DB.prepare('SELECT * FROM users WHERE telegram_id=?').bind(String(telegramId)).first();
    }
    // offline catch-up: 0.0001/sec, cap 4h
    const elapsed=Math.min(4*3600, Math.floor((Date.now()-(u.last_seen||Date.now()))/1000));
    const bonus=elapsed*0.0001;
    if(bonus>0) await env.DB.prepare('UPDATE users SET balance=balance+?, total_mined=total_mined+?, last_seen=? WHERE telegram_id=?').bind(bonus,bonus,Date.now(),String(telegramId)).run();
    else await env.DB.prepare('UPDATE users SET last_seen=? WHERE telegram_id=?').bind(Date.now(),String(telegramId)).run();
    u=await env.DB.prepare('SELECT * FROM users WHERE telegram_id=?').bind(String(telegramId)).first();    await logActivity(env, telegramId, username, 'open', 'دخل البوت / فتح التطبيق');
    return json({user:u, offlineBonus:bonus});
  }
  // --- TAP ---
  if(path==='/api/tap' && req.method==='POST'){
    const {telegramId} = await req.json().catch(()=>({}));
    if(!telegramId) return json({error:'telegramId'},400);
    await env.DB.prepare('UPDATE users SET balance=balance+0.0001, total_mined=total_mined+0.0001 WHERE telegram_id=?').bind(String(telegramId)).run();
    // referral 5% to inviter
    const u=await env.DB.prepare('SELECT * FROM users WHERE telegram_id=?').bind(String(telegramId)).first();
    if(u?.referrer_id){
      await env.DB.prepare('UPDATE users SET balance=balance+0.000005 WHERE telegram_id=?').bind(u.referrer_id).run();
      await env.DB.prepare('UPDATE referrals SET earned=earned+0.000005 WHERE invited_id=?').bind(String(telegramId)).run();
    }
        await logActivity(env, telegramId, '', 'tap', 'داس Tap +0.0001');
    return json({ok:true, reward:0.0001});
  }
  // --- TASKS ---
  if(path==='/api/tasks') {
    const r=await env.DB.prepare('SELECT * FROM tasks WHERE active=1').all(); return json({tasks:r.results});
  }
  if(path==='/api/tasks/complete' && req.method==='POST'){
    const {telegramId, taskId} = await req.json().catch(()=>({}));
    const t=await env.DB.prepare('SELECT * FROM tasks WHERE id=?').bind(taskId).first();
    // لو المهمة دي react أو bio، لازم يتأكد الأول
if(taskId==='react' || taskId==='bio'){
  const v = await verifyTask(telegramId, taskId, env);
  if(!v.ok) return json(v, 403);
}
    if(!t) return json({error:'task not found'},404);
    const done=await env.DB.prepare('SELECT * FROM user_tasks WHERE user_id=? AND task_id=?').bind(String(telegramId),taskId).first();
    if(done) return json({error:'already claimed'},400);
    await env.DB.prepare('INSERT INTO user_tasks VALUES (?,?,?)').bind(String(telegramId),taskId,Date.now()).run();
    await env.DB.prepare('UPDATE users SET balance=balance+?, total_mined=total_mined+? WHERE telegram_id=?').bind(t.reward,t.reward,String(telegramId)).run();
        await logActivity(env, telegramId, '', 'task', 'خلص مهمة ' + taskId);
    return json({ok:true, reward:t.reward});
  }
   if(path==='/api/tasks/verify' && req.method==='POST'){
  const { userId, taskId } = await req.json().catch(()=>({}));
  const v = await verifyTask(userId, taskId, env);
  if(!v.ok) return json(v, 403);
  return json({ ok: true });
   }
  // --- WITHDRAW ---
  if(path==='/api/withdraw' && req.method==='POST'){
    const {telegramId, wallet, amount} = await req.json().catch(()=>({}));
    if(!wallet || !amount) return json({error:'wallet and amount required'},400);
    if(amount<1000) return json({error:'Minimum 1000 DEEB'},400);
    const u=await env.DB.prepare('SELECT * FROM users WHERE telegram_id=?').bind(String(telegramId)).first();
    if(!u) return json({error:'user not found'},404);
    if(u.balance < amount) return json({error:'Insufficient balance'},400);
    const fee=7, receive=amount-fee;
    await env.DB.prepare('UPDATE users SET balance=balance-? WHERE telegram_id=?').bind(amount,String(telegramId)).run();
    const id=uid();
    await env.DB.prepare('INSERT INTO withdrawals (id,user_id,wallet,amount,fee,receive,status,created_at) VALUES (?,?,?,?,?,?,?,?)').bind(id,String(telegramId),wallet,amount,fee,receive,'pending',Date.now()).run();
    await sendTelegram(env, env.OWNER_ID, `🧾 <b>New Withdrawal</b>\nUser: ${u.username||''} (${telegramId})\nWallet: <code>${wallet}</code>\nAmount: ${amount} DEEB\nFee: ${fee}\nReceive: ${receive}`);
        await logActivity(env, telegramId, '', 'withdraw', 'طلب سحب ' + amount + ' DEEB');
    return json({ok:true, id, receive});

      if(path==='/api/ads/view' && req.method==='POST'){
    const {telegramId, adType} = await req.json().catch(()=>({}));
    if(!telegramId) return json({error:'telegramId'},400);
    await env.DB.prepare('CREATE TABLE IF NOT EXISTS ads_views (id TEXT PRIMARY KEY, telegram_id TEXT, ad_type TEXT, reward REAL, created_at INTEGER)').run().catch(()=>{});
    await env.DB.prepare('INSERT INTO ads_views VALUES (?,?,?,?,?)').bind(uid(),String(telegramId),adType||'binocular',1,Date.now()).run();
    await env.DB.prepare('UPDATE users SET balance=balance+1, total_mined=total_mined+1 WHERE telegram_id=?').bind(String(telegramId)).run();
    await logActivity(env, telegramId, '', 'ad', 'شاف إعلان ' + (adType||'binocular'));
    return json({ok:true, reward:1});
                          }
  }
  if(path==='/api/withdrawals'){
    const telegramId=url.searchParams.get('telegramId');
    const r=await env.DB.prepare('SELECT * FROM withdrawals WHERE user_id=? ORDER BY created_at DESC').bind(String(telegramId)).all();
    return json({withdrawals:r.results});
  }
  // --- ADMIN (protected) ---
  if(path.startsWith('/api/admin')){
    if(!(await requireAdmin(env,req))) return json({error:'unauthorized'},401);
    if(path==='/api/admin/stats'){
      const users=await env.DB.prepare('SELECT COUNT(*) c FROM users').first();
      const mined=await env.DB.prepare('SELECT COALESCE(SUM(total_mined),0) s FROM users').first();
      const pend=await env.DB.prepare("SELECT COUNT(*) c FROM withdrawals WHERE status='pending'").first();
      return json({totalUsers:users.c, totalMined:mined.s, pendingWithdrawals:pend.c});
    }
    if(path==='/api/admin/users'){
      const r=await env.DB.prepare('SELECT * FROM users ORDER BY created_at DESC LIMIT 100').all(); return json({users:r.results});
    }
    if(path==='/api/admin/withdrawals'){
      const r=await env.DB.prepare('SELECT * FROM withdrawals ORDER BY created_at DESC LIMIT 100').all(); return json({withdrawals:r.results});
    }
    if(path==='/api/admin/security-log'){
      const r=await env.DB.prepare('SELECT * FROM security_log ORDER BY created_at DESC LIMIT 50').all(); return json({log:r.results});
    }
    if(path==='/api/admin/referrals'){
  const r=await env.DB.prepare('SELECT inviter_id, COUNT(*) AS total, SUM(earned) AS total_earned FROM referrals GROUP BY inviter_id').all();
  return json({ referrals: r.results });
    }
        if(path==='/api/admin/activity'){
      const r=await env.DB.prepare('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 100').all().catch(()=>({results:[]})); return json({activity:r.results||[]});
        }
        if(path==='/api/admin/tasks'){
      const r=await env.DB.prepare('SELECT * FROM user_tasks ORDER BY completed_at DESC LIMIT 200').all().catch(()=>({results:[]})); return json({tasks:r.results||[]});
    }
    if(path==='/api/admin/ads'){
      const r=await env.DB.prepare('SELECT * FROM ads_views ORDER BY created_at DESC LIMIT 200').all().catch(()=>({results:[]})); return json({ads:r.results||[]});
    }
    if(path==='/api/admin/withdrawals/approve' && req.method==='POST'){
      const {id}=await req.json().catch(()=>({})); await env.DB.prepare("UPDATE withdrawals SET status='completed', decided_at=? WHERE id=?").bind(Date.now(),id).run(); return json({ok:true});
    }
    if(path==='/api/admin/withdrawals/reject' && req.method==='POST'){
      const {id}=await req.json().catch(()=>({})); const w=await env.DB.prepare('SELECT * FROM withdrawals WHERE id=?').bind(id).first();
      if(w) await env.DB.prepare('UPDATE users SET balance=balance+? WHERE telegram_id=?').bind(w.amount,w.user_id).run();
      await env.DB.prepare("UPDATE withdrawals SET status='rejected', decided_at=? WHERE id=?").bind(Date.now(),id).run(); return json({ok:true});
    }
    if(path==='/api/admin/users/ban' && req.method==='POST'){
      const {telegramId, banned}=await req.json().catch(()=>({})); await env.DB.prepare('UPDATE users SET banned=? WHERE telegram_id=?').bind(banned?1:0,String(telegramId)).run(); return json({ok:true});
    }
    if(path==='/api/admin/settings' && req.method==='POST'){
      const body=await req.json().catch(()=>({})); for(const k in body) await env.DB.prepare('INSERT OR REPLACE INTO settings VALUES (?,?)').bind(k,String(body[k])).run(); return json({ok:true});
    }
    return json({error:'admin route not found'},404);
  }
  // --- TELEGRAM WEBHOOK ---
  if(path==='/webhook' && req.method==='POST'){
    const upd=await req.json().catch(()=>({}));
    const msg=upd.message; if(msg?.text?.startsWith('/start')){
      const ref=msg.text.split(' ')[1]||'';
      await sendTelegram(env, msg.chat.id, `🐺 Welcome to DEEB Desert Wolf!\nMine DEEB, invite friends (5%), complete tasks.\nOpen the app from the menu button.`);
      if(ref.startsWith('ref_')){ /* referral recorded on first /api/user call */ }
    }
    return json({ok:true});
  }
  return json({error:'not found', path},404);
 }
};
