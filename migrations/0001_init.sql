-- DEEB D1 schema
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, telegram_id TEXT UNIQUE, username TEXT, first_name TEXT, balance REAL DEFAULT 0, total_mined REAL DEFAULT 0, level INTEGER DEFAULT 1, energy INTEGER DEFAULT 100, wallet TEXT, referrer_id TEXT, created_at INTEGER, last_seen INTEGER, banned INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS withdrawals (id TEXT PRIMARY KEY, user_id TEXT, wallet TEXT, amount REAL, fee REAL DEFAULT 7, receive REAL, status TEXT DEFAULT 'pending', created_at INTEGER, decided_at INTEGER);
CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, title TEXT, url TEXT, reward REAL DEFAULT 1, active INTEGER DEFAULT 1);
INSERT OR IGNORE INTO tasks VALUES ('channel','Telegram Channel','https://t.me/deebnetwork1',1,1),('group','Telegram Group','https://t.me/+VifpXn6GNNU5NThk',1,1),('youtube','YouTube','https://youtube.com/@deebnetwork',1,1),('twitter','X / Twitter','https://x.com/deebNetwork',1,1),('instagram','Instagram','https://instagram.com/deebnetwork',1,1),('react','React to Post','',5,1),('bio','Add DEEB to Bio','',5,1);
CREATE TABLE IF NOT EXISTS user_tasks (user_id TEXT, task_id TEXT, completed_at INTEGER, PRIMARY KEY(user_id,task_id));
CREATE TABLE IF NOT EXISTS referrals (id TEXT PRIMARY KEY, inviter_id TEXT, invited_id TEXT, earned REAL DEFAULT 0, created_at INTEGER);
CREATE TABLE IF NOT EXISTS admin_sessions (token TEXT PRIMARY KEY, method TEXT, created_at INTEGER, expires_at INTEGER, ip TEXT);
CREATE TABLE IF NOT EXISTS security_log (id TEXT PRIMARY KEY, method TEXT, telegram_id TEXT, username TEXT, status TEXT, ip TEXT, created_at INTEGER);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
INSERT OR IGNORE INTO settings VALUES ('min_withdraw','1000'),('withdraw_fee','7'),('tap_reward','0.0001'),('referral_percent','0.05');
