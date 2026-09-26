require('dotenv').config();
const express=require('express');
const session=require('express-session');
const Database=require('better-sqlite3');
const bcrypt=require('bcryptjs');
const crypto=require('crypto');
const path=require('path');
const app=express();
const db=new Database(process.env.DB_PATH || 'lsmd.db');
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,username TEXT UNIQUE,password_hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS applications(id INTEGER PRIMARY KEY AUTOINCREMENT,application_id TEXT UNIQUE NOT NULL,ic_name TEXT,status TEXT NOT NULL DEFAULT 'Eingegangen',data TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);`);
const adminUser=process.env.ADMIN_USER||'owner';
const adminPass=process.env.ADMIN_PASSWORD;
if(!adminPass){console.error('FEHLER: ADMIN_PASSWORD muss gesetzt sein.');process.exit(1);}
const existing=db.prepare('SELECT id FROM users WHERE username=?').get(adminUser);
const configuredHash=bcrypt.hashSync(adminPass,12);
if(!existing){
  db.prepare('INSERT INTO users(username,password_hash) VALUES(?,?)').run(adminUser,configuredHash);
}else{
  db.prepare('UPDATE users SET password_hash=? WHERE username=?').run(configuredHash,adminUser);
}
app.disable('x-powered-by');
app.use(express.json({limit:'1mb'}));
app.use(session({secret:process.env.SESSION_SECRET||crypto.randomBytes(32).toString('hex'),resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:8*60*60*1000}}));
app.use(express.static(path.join(__dirname,'public')));
function auth(req,res,next){if(req.session.userId)return next();res.sendStatus(401)}
app.post('/api/login',(req,res)=>{
  const username=String(req.body.username||'');
  const password=String(req.body.password||'');
  const u=db.prepare('SELECT * FROM users WHERE username=?').get(username);

  console.log('ADMIN LOGIN:', {
    eingegebenerBenutzer: username,
    benutzerGefunden: !!u,
    passwortKorrekt: u ? bcrypt.compareSync(password,u.password_hash) : false
  });

  if(!u || !bcrypt.compareSync(password,u.password_hash)){
    return res.sendStatus(401);
  }

  req.session.userId=u.id;
  res.json({ok:true});
});
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');

  console.log('[LOGIN] Versuch für Benutzer:', username);

  const u = db.prepare(
    'SELECT * FROM users WHERE username=?'
  ).get(username);

  if (!u) {
    console.log('[LOGIN] FEHLER: Benutzer nicht gefunden:', username);
    return res.status(401).json({
      ok: false,
      reason: 'USER_NOT_FOUND'
    });
  }

  const passwordCorrect = bcrypt.compareSync(
    password,
    u.password_hash
  );

  if (!passwordCorrect) {
    console.log('[LOGIN] FEHLER: Passwort stimmt nicht für:', username);
    return res.status(401).json({
      ok: false,
      reason: 'WRONG_PASSWORD'
    });
  }

  req.session.userId = u.id;

  console.log('[LOGIN] ERFOLGREICH:', username);

  res.json({ ok: true });
});
app.post('/api/applications',(req,res)=>{const data=req.body.data||{};let id;do{id='LSMD-'+new Date().getFullYear()+'-'+crypto.randomInt(100000,999999)}while(db.prepare('SELECT 1 FROM applications WHERE application_id=?').get(id));const name=data['Vor- und Nachname']||'';db.prepare('INSERT INTO applications(application_id,ic_name,data) VALUES(?,?,?)').run(id,name,JSON.stringify(data));res.status(201).json({application_id:id});});
app.get('/api/status/:id',(req,res)=>{const a=db.prepare('SELECT application_id,status FROM applications WHERE application_id=?').get(req.params.id.toUpperCase());if(!a)return res.sendStatus(404);res.json(a);});
app.get('/api/applications',auth,(req,res)=>{const rows=db.prepare('SELECT * FROM applications ORDER BY id DESC').all().map(a=>({...a,data:JSON.parse(a.data)}));res.json(rows);});
app.patch('/api/applications/:id',auth,(req,res)=>{const allowed=['Eingegangen','In Bearbeitung','Gespräch','Angenommen','Abgelehnt'];if(!allowed.includes(req.body.status))return res.sendStatus(400);db.prepare('UPDATE applications SET status=? WHERE id=?').run(req.body.status,req.params.id);res.json({ok:true});});
app.delete('/api/applications/:id',auth,(req,res)=>{db.prepare('DELETE FROM applications WHERE id=?').run(req.params.id);res.json({ok:true});});

app.get('/admin', (req,res) => {
  res.sendFile(require('path').join(__dirname,'public','admin.html'));
});

app.listen(process.env.PORT||3000,()=>console.log('LSMD Portal läuft auf Port '+(process.env.PORT||3000)));
