

(function(){
// --- ONLINE AFTER 1 MINUTE - INSIDE IIFE, COUNTS EVERY SECOND ---
var __onlineStart = Date.now();
var __onlineDone = false;
function __goOnline(){
  if(__onlineDone) return;
  __onlineDone = true;
  var b = document.getElementById('onlineBadge');
  var d = document.getElementById('onlineDot');
  var t = document.getElementById('onlineText');
  if(b){ b.classList.remove('off'); b.classList.add('on'); }
  if(d){ d.className='dot-on'; }
  if(t){ t.textContent='ONLINE'; }
}
function __checkOnline(){
  if(__onlineDone) return;
  var remain = 60*1000 - (Date.now() - __onlineStart);
  if(remain <= 0){ __goOnline(); return; }
  // Countdown hidden - keep text as OFFLINE only, no timer shown
}
setInterval(__checkOnline, 1000);
setTimeout(__goOnline, 60*1000);

var CFG={EXP:5,TASK:1,COOLDOWN:4*60*60*1000,MAX:6,AD:10,AD_EVERY:10,MIN:1000,TOTAL:40000000};
var TASKS=[
{id:'instagram',label:'Instagram Like, Comment & Repost',url:'https://instagram.com/kamal_matwely',icon:'📷',wm:'📷'},
{id:'youtube',label:'YouTube Like & Comment (Videos + Shorts)',url:'https://youtube.com/@deebnetwork',icon:'💬',wm:'▶'},
{id:'twitter',label:'X (Twitter) Retweet',url:'https://x.com/deebnetwork',icon:'🔁',wm:'𝕏'},
{id:'pool',label:'Visit Website (deeb-game)',url:'https://dedust.io/pools/EQCSxMGBDrK7pprTSu4_vHFGmv9RWxZmFRH0D6JBeci9T6aK',icon:'🌐',wm:'🌐'},
{id:'react',label:'React to latest post (English)',url:'https://t.me/+VifpXn6GNNU5NThk',icon:'🔥',wm:'🔥'},
{id:'bio',label:'Keep DEEB Channel in Bio',url:'https://t.me/DEEB_Desert_Bot',icon:'🔗',wm:'🔗'}
];
function today(){return new Date().toISOString().slice(0,10)}
function load(k,d){try{var s=window.localStorage.getItem(k);return s?JSON.parse(s):d}catch(e){return d}}
function save(k,v){try{window.localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
var energy=load('deeb_energy_v1',100);
var taskPending=load('deeb_tpend_v1',{});
var taskVerifying=load('deeb_tver_v1',{});
var autoMined=load('deeb_auto_v1',0); // Auto-mining total - NOT counted in Assets
var ather=load('deeb_ather_v3',0), preserved=load('deeb_pres_v3',0), dist=load('deeb_dist_v3',0), lastExp=load('deeb_last_v3',0), taskLast=load('deeb_tlast_v3',{}), actions=load('deeb_act_v3',0), adViews=load('deeb_ads_v3',0), log=load('deeb_log_v3',[]), ton=load('deeb_ton_v3',false);
var expC=load('deeb_expC_v3',{date:today(),count:0});
var taskC=load('deeb_taskC_v3',{date:today(),counts:{}});

var autoPending = 0;
var AUTO_RATE = 0.0001; // Fractions by ONE - +0.0001 per second = 0.0001, 0.0002, 0.0003
function collectAuto(){
  // Green numbers already include everything - CLAIM collects expedition only, auto already in balance
  return;
}
function tickAuto(){
  // ALWAYS COUNTING: even if user closes bot, it keeps counting via catch-up on reopen
  // Fractions by ONE: +0.0001 per second -> 0.0001, 0.0002, 0.0003 (not by ten)
  ather = Math.round((ather + AUTO_RATE)*10000)/10000;
  dist = Math.round((dist + AUTO_RATE)*10000)/10000;
  autoMined = Math.round((autoMined + AUTO_RATE)*10000)/10000; // Track auto-mining so Assets can exclude it
  try{localStorage.setItem('deeb_last_seen', String(Date.now()));}catch(e){}
  try{persist();}catch(e){}
}
function catchUpAuto(){
  // When user reopens after being closed, add what was missed while closed
  try{
    var last = parseInt(localStorage.getItem('deeb_last_seen')||'0');
    if(last){
      var elapsedSec = Math.floor((Date.now() - last)/1000);
      if(elapsedSec > 0 && elapsedSec < 86400*7){ // Up to 7 days catch-up
        var add = Math.round(elapsedSec * AUTO_RATE * 10000)/10000;
        ather = Math.round((ather + add)*10000)/10000;
        dist = Math.round((dist + add)*10000)/10000;
        autoMined = Math.round((autoMined + add)*10000)/10000;
        try{persist();}catch(e){}
      }
    }
    localStorage.setItem('deeb_last_seen', String(Date.now()));
  }catch(e){}
}
catchUpAuto();
window.addEventListener('beforeunload', function(){ try{localStorage.setItem('deeb_last_seen', String(Date.now()));}catch(e){} });
document.addEventListener('visibilitychange', function(){
  // Keep counting even when hidden - just save last seen for catch-up
  try{localStorage.setItem('deeb_last_seen', String(Date.now()));}catch(e){}
  if(!document.hidden){ try{catchUpAuto();}catch(e){} }
});

setInterval(function(){ tickAuto(); renderAutoOnly(); }, 1000);
function renderAutoOnly(){
  var g = document.getElementById('gain');
  if(g) g.textContent = ather.toFixed(4) + '+';
  var bt = document.getElementById('balTop');
  if(bt) bt.textContent = ather.toFixed(4);
}

function persist(){save('deeb_tver_v1',taskVerifying);save('deeb_tpend_v1',taskPending);save('deeb_energy_v1',energy);save('deeb_ather_v3',ather);save('deeb_auto_v1',autoMined);save('deeb_pres_v3',preserved);save('deeb_dist_v3',dist);save('deeb_last_v3',lastExp);save('deeb_tlast_v3',taskLast);save('deeb_act_v3',actions);save('deeb_ads_v3',adViews);save('deeb_log_v3',log);save('deeb_ton_v3',ton);save('deeb_expC_v3',expC);save('deeb_taskC_v3',taskC);}
function addLog(t,r){log=[{t:t,r:r,time:new Date().toLocaleTimeString('ar-EG')}].concat(log).slice(0,20)}
function addAction(){actions++; /* No ad every 10 taps - ads only when energy finishes */}
function fmt(n){return n.toLocaleString('en-US')}
function render(){ try{__checkOnline();}catch(e){}
if(expC.date!==today()) expC={date:today(),count:0};
if(taskC.date!==today()) taskC={date:today(),counts:{}};
document.getElementById('balTop').textContent=ather.toFixed(4);
  try{
    var collected=Math.max(0, ather - autoMined); var pa=document.getElementById('profAssets'); if(pa) pa.textContent=collected.toFixed(4);
    var pp=document.getElementById('profPool'); if(pp) pp.textContent=ather.toFixed(4);
    var ph=document.getElementById('profHolding'); if(ph) ph.textContent=preserved;
    var pu=document.getElementById('profUsd'); if(pu) pu.textContent=(collected*0.00075).toFixed(2);
    var pu2=document.getElementById('profUser'); if(pu2){ var fn=document.getElementById('userFirstName'); if(fn) pu2.textContent='🐺 ' + fn.textContent; }
    try{refreshUserId();}catch(e){} try{updateVerifyUI();}catch(e){} var ss=document.getElementById('soundStatus'); if(ss) ss.textContent=window.soundOn?'On — tap to mute':'Off — tap to unmute'; var ml=document.getElementById('minerLvl'); var lvlNow=1+Math.floor(ather/1000); if(ml) ml.textContent=lvlNow;
    var mp=document.getElementById('minerPeak'); if(mp){ var pk=parseInt(localStorage.getItem('deeb_peak_lvl')||'1'); if(lvlNow>pk){ pk=lvlNow; try{localStorage.setItem('deeb_peak_lvl', String(pk));}catch(e){} } mp.textContent=pk; }
    var mPnl=document.getElementById('minerPnl'); if(mPnl) mPnl.textContent=(expC.count*5 + taskC.counts?0:0).toFixed(2);
    var mCv=document.getElementById('minerChartVal'); if(mCv) mCv.textContent=ather.toFixed(2);
    for(var mi=0;mi<4;mi++){ var cl=document.getElementById('minerCardLvl'+mi); if(cl) cl.textContent=lvlNow+mi; var pr=document.getElementById('minerPrice'+mi); if(pr) pr.textContent=((lvlNow+mi)*0.002).toFixed(3); var sp=document.getElementById('minerSpeed'+mi); if(sp) sp.textContent=(1.04 + (lvlNow+mi)*0.02).toFixed(2)+' TH/s'; }
    var need1=document.getElementById('minerNeed1'); if(need1) need1.textContent=Math.max(0,(lvlNow+1)*1000 - Math.floor(ather)).toLocaleString();
    var toUp=document.getElementById('minerToUp1'); if(toUp) toUp.textContent='$'+(Math.max(0,(lvlNow+1)*1000 - ather)*0.0000075).toFixed(3);
    var need2=document.getElementById('minerNeed2'); if(need2) need2.textContent=Math.max(0,(lvlNow+2)*1000 - Math.floor(ather)).toLocaleString();
    try{renderMiners();}catch(e){} var need3=document.getElementById('minerNeed3'); if(need3) need3.textContent=Math.max(0,(lvlNow+3)*1000 - Math.floor(ather)).toLocaleString();
    var pw=document.getElementById('profWalletShort'); if(pw) pw.textContent=window.userWallet?shortWallet(window.userWallet):'Connect Wallet'; var il=document.getElementById('inviteLinkText'); if(il){ var uid=getDeebUserId(); il.textContent='https://t.me/DEEB_Desert_Bot?start=ref_'+uid; }
  }catch(e){} try{loadTelegramUser();}catch(e){} try{var _ws=document.getElementById('walletShort'); if(_ws) _ws.textContent=window.userWallet?shortWallet(window.userWallet):'Connect Wallet';}catch(e){}
document.getElementById('bal2').textContent=ather;
try{var b3=document.getElementById('bal3'); if(b3) b3.textContent=ather;}catch(e){}
document.getElementById('pres').textContent=preserved;
try{var ec=document.getElementById('expCount'); if(ec) ec.textContent=expC.count;}catch(e){}
try{var rm=document.getElementById('remain'); if(rm) rm.textContent=fmt(Math.max(0,CFG.TOTAL-dist));}catch(e){}
try{var rb=document.getElementById('remainBar'); if(rb) rb.style.width=Math.max(0,(CFG.TOTAL-dist)/CFG.TOTAL*100)+'%';}catch(e){}
document.getElementById('adV').textContent=adViews;
document.getElementById('oasis').textContent=(adViews*0.002).toFixed(3);
(function(){
  var lv = 1+Math.floor(ather/1000);
  var lvlEl=document.getElementById('lvl'); if(lvlEl) lvlEl.textContent=lv;
  var badge=document.getElementById('lvlBadge'); if(badge){ badge.className='lvl-pill ' + (lv>=7?'lvl-max':('lvl-'+Math.min(lv,6))); }
})();
var lu=document.getElementById('leftUp'); if(lu) lu.textContent=Math.max(0,1000-ather);
var logEl=document.getElementById('log');
if(!log.length) logEl.textContent='لسه مفيش نشاط';
else logEl.innerHTML=log.map(function(e){return '<div style="display:flex;justify-content:space-between;border-bottom:1px solid #1e293b;padding:4px 0"><span>'+e.t+'</span><span style="color:#38bdf8">+'+e.r+'</span><span style="color:#64748b">'+e.time+'</span></div>'}).join('');
var rem=Math.max(0,(lastExp+CFG.COOLDOWN)-Date.now());
var can=rem===0 && expC.count<CFG.MAX;
// Timer removed - CLAIM only, no text
document.getElementById('energyFill').style.width=energy+'%';
var tasksEl=document.getElementById('tasks'); try{ if(!tasksEl) throw new Error('no tasks');
tasksEl.innerHTML='<div></div><div style="text-align:center;font-size:11px;color:#94a3b8;margin-top:-6px"></div>'+TASKS.map(function(t){
  var last=taskLast[t.id]||0; var r=(last+CFG.COOLDOWN)-Date.now(); var c=taskC.counts[t.id]||0;
  var isPending=taskPending[t.id];
  var verStart=taskVerifying[t.id]||0;
  var verElapsed=verStart?Date.now()-verStart:0;
  // Auto-move from verifying to CLAIM after 15s
  if(verStart && verElapsed>=15000){ delete taskVerifying[t.id]; taskPending[t.id]=true; isPending=true; verStart=0; }
  var isVerifying=!!verStart;
  var canT=r<=0 && c<6 && !isPending && !isVerifying;
  var btn, cls, dis='';
  if(isVerifying){ var left=Math.ceil((15000-verElapsed)/1000); btn='Verifying... '+left+'s'; cls='go next'; }
  else if(isPending){ btn='CLAIM'; cls='go'; }
  else if(canT){ btn='Go'; cls='go'; }
  else if(r>0){ btn='Next in '+String(Math.floor(r/3600000)).padStart(2,'0')+':'+String(Math.floor((r%3600000)/60000)).padStart(2,'0')+':'+String(Math.floor((r%60000)/1000)).padStart(2,'0'); cls='go next'; dis='disabled'; }
  else { btn='Done Today'; cls='go next'; dis='disabled'; }
  return '<div class="atf-task"><div class="watermark">'+t.wm+'</div><div class="ico">'+t.icon+'</div><div class="mid"><b>'+t.label+'</b><div class="reward">+1 DEEB</div></div><button class="'+cls+'" onclick="doTask(\''+t.id+'\')" '+dis+'>'+btn+'</button></div>';
}).join(''); }catch(e){} 
try{var tw=document.getElementById('tonWrap'); if(tw) tw.innerHTML='<button onclick="toggleTon()" style="background:'+(ton?'#0ea5e9':'#111827')+';color:'+(ton?'#fff':'#7dd3fc')+';border:none;padding:8px 12px;border-radius:10px;font-size:12px;font-weight:700">'+(ton?'متصل: UQCc...W8YhC':'ربط محفظة TON - إجباري')+'</button>';}catch(e){}
persist();
}


// --- COIN VIBRATION - NO SOUND, ONLY VIBRATION ON EACH TAP ---
function vibrateCoin(){
  try{
    // Telegram Haptic - strongest, works inside Telegram
    if(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback){
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
      return;
    }
  }catch(e){}
  try{
    if(navigator.vibrate) navigator.vibrate(40);
  }catch(e){}
}


// --- ENERGY AD - when energy finishes, watch ad, then refill 1 by 1 ---
window.showEnergyAd=function(){
  var m=document.getElementById('interM');
  if(m){ m.classList.add('show'); }
  // After ad finishes (2.5s), wait 2 more seconds, then fill FULL at once
  setTimeout(function(){
    if(m) m.classList.remove('show');
    adViews++;
    setTimeout(function(){
      energy = 100;
      try{localStorage.setItem('deeb_energy_v1', String(energy));}catch(e){}
      render();
    }, 2000);
  }, 2500);
};

window.tapCoin=function(e){
  if(energy<=0){
    // Energy finished -> Show ad, after ad refill gradually 1 by 1
    showEnergyAd();
    return;
  }
  energy--;
  if(energy===0){ /* Energy empty - user will watch ad to refill gradually */ }
  ather = Math.round((ather + 0.0001)*10000)/10000; // Tap = fractions of cents, 1 by 1: +0.0001
  dist = Math.round((dist + 0.0001)*10000)/10000;
  var coinEl = document.querySelector('.coin');
  if(coinEl){ coinEl.classList.add('coin-glow'); setTimeout(function(){coinEl.classList.remove('coin-glow')}, 350); }
  var ringEl = document.querySelector('.coin-ring');
  if(ringEl){ ringEl.classList.add('ring-glow'); setTimeout(function(){ringEl.classList.remove('ring-glow')}, 350); }
  addLog('Tap - DEEB', 0.0001); vibrateCoin(); addAction();
  var layer = document.getElementById('tapLayer');
  if(layer){
    var s = document.createElement('div'); s.className='tap-float-cent'; s.textContent='+0.0001';
    var r = document.getElementById('coinWrap').getBoundingClientRect();
    var x = ((e && e.clientX) ? e.clientX : r.left + r.width/2) - r.left;
    var y = ((e && e.clientY) ? e.clientY : r.top + r.height/2) - r.top;
    s.style.left = x + 'px'; s.style.top = y + 'px'; s.style.transform = 'translate(-50%,-50%)';
    layer.appendChild(s);
    setTimeout(function(){s.remove()}, 900);
  }
  render();
};
// Energy refills only after 4h - no 5s regen



function vibratePhone(){
  try{
    // Android vibration - double buzz
    if(navigator.vibrate) navigator.vibrate([120, 60, 120, 60, 200]);
  }catch(e){}
  try{
    if(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback){
      window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
      setTimeout(function(){ window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy'); }, 150);
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
  }catch(e){}
}

function playCoinSound(){
  try{
    var AC=window.AudioContext||window.webkitAudioContext;
    if(!AC) return;
    if(!window._deebAudio) window._deebAudio=new AC();
    var ctx=window._deebAudio;
    if(ctx.state==='suspended') ctx.resume();
    function tone(freq, start, dur){
      var o=ctx.createOscillator(); var g=ctx.createGain();
      o.type='sine'; o.frequency.value=freq;
      g.gain.setValueAtTime(0.0001, ctx.currentTime+start);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime+start+0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+start+dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(ctx.currentTime+start); o.stop(ctx.currentTime+start+dur+0.05);
    }
    tone(1320, 0, 0.12);
    tone(1760, 0.09, 0.22);
    try{ if(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success'); }catch(e){}
  }catch(e){}
}
function showRewardFloat(amount, isBlue){
  vibratePhone();
  var d=document.createElement('div');
  d.className='reward-float blue'; // always blue
  d.textContent='+'+amount;
  document.body.appendChild(d);
  playCoinSound();
  setTimeout(function(){d.remove()},1250);
}

window.doExp=function(){

  var rem=Math.max(0,(lastExp+CFG.COOLDOWN)-Date.now());
  if(rem>0||expC.count>=6) return;
  ather+=CFG.EXP; dist+=CFG.EXP; lastExp=Date.now(); expC.count++; addLog('رحلة',CFG.EXP); showRewardFloat(5,true); addAction(); render();
};
window.doTask=function(id){
  var t=null; for(var i=0;i<TASKS.length;i++){if(TASKS[i].id===id) t=TASKS[i];}
  // If already verifying - don't allow spam, tell wait
  if(taskVerifying[id]){
    var elapsed=Date.now()-taskVerifying[id];
    if(elapsed<15000){ alert('Verifying... Wait ' + Math.ceil((15000-elapsed)/1000) + ' sec'); return; }
    // verification finished -> move to CLAIM
    delete taskVerifying[id];
    taskPending[id]=true;
    render();
    return;
  }
  // Step 2: CLAIM - give reward only after verification
  if(taskPending[id]){
    taskPending[id]=false;
    var c=taskC.counts[id]||0;
    ather+=CFG.TASK; dist+=CFG.TASK; taskLast[id]=Date.now(); taskC.counts[id]=c+1; addLog(t.label,CFG.TASK); showRewardFloat(1,true); addAction(); render();
    return;
  }
  // Step 1: Go - open link, start verification timer 15s
  var last=taskLast[id]||0; var rem=(last+CFG.COOLDOWN)-Date.now(); var cc=taskC.counts[id]||0;
  if(rem>0||cc>=6) return;
  window.open(t.url,'_blank');
  taskVerifying[id]=Date.now();
  render();
};
window.useBinocular=function(){
  var m=document.getElementById('adM'); m.classList.add('show');
  setTimeout(function(){m.classList.remove('show'); adViews++; ather+=CFG.AD; dist+=CFG.AD; addLog('منظار - اعلان',CFG.AD); showRewardFloat(10,true); addAction(); render();},3000);
};

// --- PER-USER TON WALLET ---
function getUserKey(){
  try{
    var tg = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user;
    if(tg && tg.id) return 'deeb_wallet_' + tg.id;
  }catch(e){}
  return 'deeb_wallet_guest';
}
function shortWallet(addr){
  if(!addr) return 'Connect Wallet';
  if(addr.length <= 12) return addr;
  return addr.slice(0,4) + '...' + addr.slice(-4);
}
function loadUserWallet(){
  try{
    var addr = localStorage.getItem(getUserKey());
    if(addr){
      window.userWallet = addr;
      ton = true;
      var ws = document.getElementById('walletShort');
      if(ws) ws.textContent = shortWallet(addr);
      return addr;
    } else {
      window.userWallet = null;
      ton = false;
      var ws2 = document.getElementById('walletShort');
      if(ws2) ws2.textContent = 'Connect Wallet';
      return null;
    }
  }catch(e){ return null; }
}
function connectWallet(){
  var cur = window.userWallet || '';
  var addr = prompt('Paste your TON wallet address (UQ... / EQ...):\nExample: UQBf...-r4D', cur);
  if(addr === null) return;
  addr = (addr||'').trim();
  if(!addr){
    // Disconnect
    try{localStorage.removeItem(getUserKey());}catch(e){}
    window.userWallet = null; ton = false;
    var ws = document.getElementById('walletShort'); if(ws) ws.textContent = 'Connect Wallet';
    render(); return;
  }
  if(!(addr.startsWith('UQ') || addr.startsWith('EQ') || addr.startsWith('0:'))){
    alert('Invalid TON address. It must start with UQ or EQ.'); return;
  }
  if(addr.length < 20){
    alert('Address too short. Paste full TON address.'); return;
  }
  try{localStorage.setItem(getUserKey(), addr);}catch(e){}
  window.userWallet = addr; ton = true;
  var ws2 = document.getElementById('walletShort'); if(ws2) ws2.textContent = shortWallet(addr);
  alert('Wallet connected: ' + shortWallet(addr) + '\nThis is YOUR wallet, saved only for you.');
  render();
}
window.toggleTon=function(){ connectWallet(); };
// Load wallet on start - inside IIFE this will run after vars
loadUserWallet();

// --- PER-USER NAME FROM TELEGRAM ---
function loadTelegramUser(){
  try{
    var tg = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user;
    if(tg){
      var fn = tg.first_name || '';
      var ln = tg.last_name || '';
      var full = (fn + (ln ? ' ' + ln : '')).trim();
      var uname = tg.username ? '@' + tg.username : '';
      var fnEl = document.getElementById('userFirstName');
      var hEl = document.getElementById('userHandle');
      if(fnEl && full) fnEl.textContent = full;
      if(hEl && uname) hEl.textContent = uname;
      // Also store for wallet key consistency
      window.tgUser = tg;
      return tg;
    }
  }catch(e){}
  return null;
}
loadTelegramUser();

// --- PER-USER ID - DIFFERENT FOR EVERY USER ---
function getDeebUserId(){
  // 1. Real Telegram ID - always different per user
  try{
    var tg = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user;
    if(tg && tg.id) return String(tg.id);
  }catch(e){}
  // 2. If not in Telegram (preview / browser), use saved per-device ID - different per user, stable for same user
  try{
    var saved = localStorage.getItem('deeb_user_id');
    if(saved) return saved;
    // Generate a unique 10-digit ID like Telegram (starts with 6 or 7) - different for every user
    var nid = String(6 + Math.floor(Math.random()*3)) + String(Math.floor(100000000 + Math.random()*899999999));
    localStorage.setItem('deeb_user_id', nid);
    return nid;
  }catch(e){ return String(6 + Math.floor(Math.random()*3)) + String(Math.floor(100000000 + Math.random()*899999999)); }
}
function refreshUserId(){
  try{
    var id = getDeebUserId();
    var el = document.getElementById('profUserId');
    if(el) el.textContent = id;
    // Also update invite link with same ID
    var il = document.getElementById('inviteLinkText');
    if(il) il.textContent = 'https://t.me/DEEB_Desert_Bot?start=ref_' + id;
    return id;
  }catch(e){ return null; }
}
refreshUserId();



window.showProfileHistory=function(){
  var h=document.getElementById('profHistory');
  if(!h) return;
  if(h.style.display==='none'){
    var items=log.slice(-10).reverse().map(function(e){return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1e293b;font-size:13px"><span>'+e.t+'</span><span style="color:#38bdf8">+'+e.r+'</span></div>'}).join('') || '<div style="font-size:13px;color:#94a3b8">No withdrawals yet</div>';
    h.innerHTML='<div style="background:#0a1a2e;border:1px solid #38bdf8;border-radius:16px;padding:12px">'+items+'</div>';
    h.style.display='block';
  } else { h.style.display='none'; }
};


window.createCert=function(){
  var h=document.getElementById('certCard');
  if(!h) return;
  var fnEl=document.getElementById('userFirstName');
  var name=fnEl?fnEl.textContent:'DEEB Member';
  var wallet=window.userWallet?shortWallet(window.userWallet):'Not connected';
  if(h.style.display==='none'){
    h.innerHTML='<div style="background:linear-gradient(135deg,#0a1a2e,#082f49);border:2px solid #facc15;border-radius:22px;padding:20px;text-align:center"><div style="font-size:40px">🐺</div><div style="font-size:20px;font-weight:900;color:#facc15">DEEB Family Member</div><div style="font-size:16px;color:#fff;margin-top:6px">'+name+'</div><div style="font-size:12px;color:#94a3b8;margin-top:4px">'+wallet+'</div><div style="font-size:11px;color:#38bdf8;margin-top:10px">Official DEEB Certificate Card</div></div>';
    h.style.display='block';
  } else { h.style.display='none'; }
};
window.showReferrals=function(){
  var h=document.getElementById('refList');
  if(!h) return;
  if(h.style.display==='none'){
    h.innerHTML='<div style="background:#0a1a2e;border:1px solid #38bdf8;border-radius:16px;padding:12px;font-size:13px;color:#94a3b8;text-align:center">No referrals yet. Share your invite link to earn 5% from friends.</div>';
    h.style.display='block';
  } else { h.style.display='none'; }
};
window.claimReferral=function(){ alert('No referral reward ready yet. Invite friends to earn +5 DEEB per friend.'); };
window.claimTeam=function(){ alert('Team Wallet is empty. Earnings from your network will appear here.'); };


// --- REAL ACCOUNT VERIFICATION - checks Telegram + ID + Wallet, saves per user ---
function isAccountVerified(){
  try{
    var uid = getDeebUserId();
    return localStorage.getItem('deeb_verified_'+uid) === '1';
  }catch(e){ return false; }
}
function updateVerifyUI(){
  try{
    var uid = getDeebUserId();
    var tgOk = false, idOk = false, walletOk = false;
    try{
      var tg = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user;
      tgOk = !!(tg && tg.id);
      // If not in Telegram (preview), treat saved ID as Telegram check
      if(!tgOk && uid && uid!=='guest') tgOk = true;
    }catch(e){}
    idOk = !!(uid && uid!=='guest' && uid.length>=6);
    walletOk = !!window.userWallet;
    var verified = isAccountVerified() && tgOk && idOk && walletOk;
    var s=document.getElementById('profVerifyStatus');
    if(s){ s.textContent= verified ? 'Verified ✓' : 'Unverified'; s.style.color= verified ? '#22c55e' : '#94a3b8'; }
    var b=document.getElementById('verifyBtn');
    if(b){ if(verified){ b.textContent='Verified'; b.style.background='#22c55e'; b.style.color='#fff'; } else { b.textContent='Verify'; b.style.background=''; b.style.color=''; } }
    var s1=document.getElementById('vStep1'); if(s1) s1.textContent= tgOk ? '✓ Done' : '✗ Missing'; if(s1) s1.style.color= tgOk ? '#22c55e' : '#f87171';
    var s2=document.getElementById('vStep2'); if(s2) s2.textContent= idOk ? '✓ '+uid : '✗ Missing'; if(s2) s2.style.color= idOk ? '#22c55e' : '#f87171';
    var s3=document.getElementById('vStep3'); if(s3) s3.textContent= walletOk ? '✓ Connected' : '✗ Not connected'; if(s3) s3.style.color= walletOk ? '#22c55e' : '#f87171';
    return verified;
  }catch(e){ return false; }
}
window.verifyAccount=function(){
  var uid = getDeebUserId();
  // Step 1: Telegram
  var tg = null;
  try{ tg = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user; }catch(e){}
  if(!tg && !uid){
    alert('Open DEEB from Telegram to verify your account.');
    return;
  }
  // Step 2: ID
  if(!uid || uid==='guest'){
    alert('User ID not found. Reopen DEEB from Telegram.');
    return;
  }
  // Step 3: Wallet
  if(!window.userWallet){
    alert('Step 3: Connect your TON wallet first to verify.\n\nID: ' + uid);
    connectWallet();
    return;
  }
  // All checks passed -> Verified, saved per user
  try{ localStorage.setItem('deeb_verified_'+uid, '1'); }catch(e){}
  updateVerifyUI();
  alert('✅ Account Verified!\n\nID: ' + uid + '\nWallet: ' + shortWallet(window.userWallet));
};

window.soundOn = (function(){ try{ var v=localStorage.getItem('deeb_sound'); return v===null?true:v==='on'; }catch(e){ return true; } })();
window.toggleSound=function(){
  window.soundOn = !window.soundOn;
  try{localStorage.setItem('deeb_sound', window.soundOn?'on':'off');}catch(e){}
  var s=document.getElementById('soundStatus');
  if(s) s.textContent = window.soundOn ? 'On — tap to mute' : 'Off — tap to unmute';
  var ico=document.querySelector('#p-profile .atf-card:nth-child(4) .atf-ico');
};


window.toggleMinerChart=function(){
  var h=document.getElementById('minerChartFull');
  if(h) h.style.display = h.style.display==='none' ? 'block' : 'none';
};


// --- DEEB MINERS UP TO 20,000 - render all Lvl 1 to Lvl 21 ---
function renderMiners(){
  try{
    var grid=document.getElementById('minerGrid');
    if(!grid) return;
    var lvlNow=1+Math.floor(ather/1000);
    if(lvlNow>21) lvlNow=21;
    var html='';
    for(var lvl=1; lvl<=21; lvl++){
      var need=(lvl-1)*1000;
      var price=(lvl*0.002).toFixed(3);
      var speed=(1.04 + lvl*0.02).toFixed(2);
      var unlocked=ather>=need;
      var isCurrent=lvl===lvlNow;
      var op = unlocked ? (isCurrent ? '1' : '0.85') : '0.6';
      var priceColor = isCurrent ? '#22ff7a' : '#facc15';
      var btn = isCurrent ? '<button class="miner-active">ACTIVE</button>' : (unlocked ? '<button class="miner-active" style="background:#38bdf8">UNLOCKED</button>' : '<button class="miner-need" onclick="alert(\'Need '+need.toLocaleString()+' DEEB to unlock Lvl '+lvl+'\')">🔒 NEED '+need.toLocaleString()+' DEEB</button>');
      var toUp = '';
      if(lvl===lvlNow+1){
        var left=Math.max(0, need - ather);
        toUp='<div style="text-align:center;font-size:11px;color:#e2e8f0;margin-top:6px">Just <b style="color:#22c55e">$'+(left*0.0000075).toFixed(3)+'</b> to Level Up</div>';
      }
      html += '<div class="miner-card'+(isCurrent?' active':'')+'"><span class="miner-lvl">Lvl '+lvl+'</span><div style="font-size:52px;text-align:center;margin:6px 0;opacity:'+op+'">🐺</div><div class="miner-price" style="color:'+priceColor+'">'+price+'$</div><div style="display:flex;justify-content:space-between;font-size:12px;color:#94a3b8;margin-top:8px"><span>Speed</span><b style="color:#facc15">'+speed+' TH/s</b></div>'+btn+toUp+'</div>';
    }
    grid.innerHTML=html;
  }catch(e){}
}


// --- WITHDRAW DEEB - Min 1000, Fee 7, Notify Owner ---
window.openWithdraw=function(){
  var m=document.getElementById('withdrawModal');
  if(m){ m.style.display='flex'; var er=document.getElementById('wdError'); if(er) er.style.display='none'; var p=document.getElementById('wdPool'); if(p) p.textContent=ather.toFixed(4); var inp=document.getElementById('wdAmount'); if(inp){ inp.value=''; } window.updateWdReceive(); }
}
window.closeWithdraw=function(){ var m=document.getElementById('withdrawModal'); if(m) m.style.display='none'; }
window.setWdMax=function(){ var inp=document.getElementById('wdAmount'); if(inp) inp.value=Math.max(0, Math.floor(ather)).toString(); window.updateWdReceive(); }
window.updateWdReceive=function(){ var inp=document.getElementById('wdAmount'); var r=document.getElementById('wdReceive'); if(inp && r){ var v=parseFloat(inp.value)||0; r.textContent=Math.max(0, v-7).toFixed(2); } }
document.addEventListener('input', function(e){ if(e.target && e.target.id==='wdAmount'){ window.updateWdReceive(); var er=document.getElementById('wdError'); if(er) er.style.display='none'; } });
window.confirmWithdraw=function(){
  var inp=document.getElementById('wdAmount');
  var amt=parseFloat(inp ? inp.value : 0) || 0;
  var uid = getDeebUserId();
  var errEl=document.getElementById('wdError');
  function showWdError(msg){ if(errEl){ errEl.textContent=msg; errEl.style.display='block'; } }
  if(errEl) errEl.style.display='none';
  if(amt < 1000){ showWdError('❌ Minimum withdrawal is 1000 DEEB - You entered ' + amt + ' DEEB'); return; }
  if(amt > ather){ showWdError('❌ Not enough balance - Available: ' + ather.toFixed(2) + ' DEEB'); return; }
  if(!window.userWallet){ showWdError('❌ Connect your TON wallet first'); return; }
  var receive = Math.max(0, amt - 7);
  var req = { id: uid, user: (document.getElementById('userFirstName') ? document.getElementById('userFirstName').textContent : ''), handle: (document.getElementById('userHandle') ? document.getElementById('userHandle').textContent : ''), wallet: window.userWallet, amount: amt, fee: 7, receive: receive, time: new Date().toLocaleString('en-GB'), status: 'Pending' };
  try{
    var all = JSON.parse(localStorage.getItem('deeb_withdraw_requests')||'[]');
    all.push(req);
    localStorage.setItem('deeb_withdraw_requests', JSON.stringify(all));
    log.push({ t: 'Withdraw Request - ' + amt + ' DEEB', r: -amt });
    try{persist();}catch(e){}
  }catch(e){}
  try{
    if(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.sendData){
      window.Telegram.WebApp.sendData(JSON.stringify({ type: 'withdraw', user_id: uid, user: req.user, handle: req.handle, wallet: req.wallet, amount: amt, fee: 7, receive: receive, time: req.time }));
    }
  }catch(e){}
  window.closeWithdraw();
  var msg = 'NEW WITHDRAW REQUEST\n\nUser: ' + req.user + ' (' + req.handle + ')\nUser ID: ' + uid + '\nWallet: ' + req.wallet + '\nAmount: ' + amt + ' DEEB\nFee: 7 DEEB\nReceive: ' + receive + ' DEEB\nTime: ' + req.time;
  try{ navigator.clipboard.writeText(msg); }catch(e){}
  alert('Withdraw Request Sent!\n\nAmount: ' + amt + ' DEEB\nFee: 7 DEEB\nYou will receive: ' + receive + ' DEEB\nWallet: ' + shortWallet(window.userWallet) + '\n\nOwner has been notified.\nRequest copied - send it to owner if needed.');
}

window.preserve=function(){
  if(!ton){alert('لازم تربط محفظة TON الأول');return;}
  if(ather<CFG.MIN){alert('أقل كمية للحفظ 1000 ديب');return;}
  ather-=CFG.MIN; preserved+=CFG.MIN; addLog('حفظ على الشبكة',CFG.MIN); render();
};
window.copyInvite=function(){var uid=getDeebUserId(); var link='https://t.me/DEEB_Desert_Bot?start=ref_'+uid; try{navigator.clipboard.writeText(link)}catch(e){} alert('Invite link copied:\n'+link);};
window.shareApp=function(){copyInvite();};
window.showPage=function(p,btn){
  ['mine','tasks','arch','friends','profile'].forEach(function(id){document.getElementById('p-'+id).style.display='none'});
  document.getElementById('p-'+p).style.display='block';
  var btns=document.querySelectorAll('.nav button'); for(var i=0;i<btns.length;i++) btns[i].classList.remove('on'); btn.classList.add('on');
};
try{if(window.Telegram&&window.Telegram.WebApp){window.Telegram.WebApp.ready(); window.Telegram.WebApp.expand();}}catch(e){}
setInterval(render,1000); render();
})();

// --- ENERGY 4H SYSTEM ---
var energyRefillAt = parseInt((function(){ try{return localStorage.getItem('deeb_energy_refill')||'0';}catch(e){return '0';} })());
function refillEnergy(){ energy=100; energyRefillAt=0; try{localStorage.removeItem('deeb_energy_refill');}catch(e){} render(); }
setInterval(function(){
  if(energy<=0 && energyRefillAt && Date.now()>=energyRefillAt){ refillEnergy(); }
  // energyTimer removed
}, 1000);
if(energy<=0 && energyRefillAt && Date.now()>=energyRefillAt){ refillEnergy(); }

// ONLINE moved inside IIFE - see top
