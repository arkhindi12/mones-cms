const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { generateHTML } = require('../utils/generator');

const CONTENT_FILE = path.join(__dirname, '..', 'data', 'content.json');
const UPLOAD_DIR = '/var/www/mones.arzastore.com/media';

function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '-'))
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

function readContent(){ return JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8')); }
function writeContent(data){ fs.writeFileSync(CONTENT_FILE, JSON.stringify(data, null, 2)); }
function id(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }

router.get('/content', requireAuth, (req,res)=>res.json(readContent()));
router.post('/content', requireAuth, (req,res)=>{ writeContent(req.body); res.json({success:true}); });

router.post('/upload', requireAuth, upload.single('media'), (req,res)=>{
  if(!req.file) return res.status(400).json({error:'No file'});
  res.json({success:true, url:'/media/'+req.file.filename});
});

router.post('/section-order', requireAuth, (req,res)=>{
  const data=readContent();
  data.sections=req.body.sections.map((s,i)=>({...s, order:i+1}));
  writeContent(data); res.json({success:true});
});

router.post('/items-order/:type', requireAuth, (req,res)=>{
  const data = readContent();
  const type = req.params.type;
  if(!Array.isArray(data[type])) return res.status(400).json({error:'Invalid type'});
  const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
  const byId = new Map(data[type].map(item => [item.id, item]));
  const ordered = ids.map(id => byId.get(id)).filter(Boolean);
  const seen = new Set(ordered.map(item => item.id));
  const rest = data[type].filter(item => !seen.has(item.id));
  data[type] = [...ordered, ...rest];
  writeContent(data);
  res.json({success:true, items:data[type]});
});

router.post('/items/:type', requireAuth, (req,res)=>{
  const data=readContent(); const type=req.params.type;
  if(!Array.isArray(data[type])) return res.status(400).json({error:'Invalid type'});
  data[type].push({id:id(), ...req.body}); writeContent(data); res.json({success:true, items:data[type]});
});
router.put('/items/:type/:id', requireAuth, (req,res)=>{
  const data=readContent(); const arr=data[req.params.type];
  const i=arr.findIndex(x=>x.id===req.params.id); if(i<0) return res.status(404).json({error:'Not found'});
  arr[i]={...arr[i], ...req.body}; writeContent(data); res.json({success:true, item:arr[i]});
});
router.delete('/items/:type/:id', requireAuth, (req,res)=>{
  const data=readContent(); data[req.params.type]=data[req.params.type].filter(x=>x.id!==req.params.id);
  writeContent(data); res.json({success:true});
});

router.post('/generate', requireAuth, (req,res)=>{
  const data=readContent();
  const html=generateHTML(data);
  const target = '/var/www/mones.arzastore.com/index.html';
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  if (fs.existsSync(target)) {
    fs.copyFileSync(target, path.join(backupDir, 'index.' + Date.now() + '.html'));
  }
  fs.writeFileSync(target, html);
  res.json({success:true, path:target, backup:true});
});

router.post('/password', requireAuth, (req,res)=>{
  const bcrypt = require('bcrypt');
  const usersFile = path.join(__dirname, '..', 'data', 'users.json');
  const { username, password } = req.body;
  if(!username || !password || password.length < 6) return res.status(400).json({error:'Username and password min 6 chars required'});
  const users = [{ username, passwordHash: bcrypt.hashSync(password, 10) }];
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  res.json({success:true});
});

router.get('/media', requireAuth, (req,res)=>{
  const files = fs.readdirSync(UPLOAD_DIR)
    .filter(f => /\.(jpg|jpeg|png|webp|gif|mp4|webm)$/i.test(f))
    .map(f => ({ name:f, url:'/media/'+f, size:fs.statSync(path.join(UPLOAD_DIR,f)).size }))
    .sort((a,b)=>a.name.localeCompare(b.name));
  res.json({success:true, files});
});

router.delete('/media/:name', requireAuth, (req,res)=>{
  const name = req.params.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
  const file = path.join(UPLOAD_DIR, name);
  if(fs.existsSync(file)) fs.unlinkSync(file);
  res.json({success:true});
});

router.post('/contact', requireAuth, (req,res)=>{
  const data=readContent();
  data.contact = req.body;
  writeContent(data);
  res.json({success:true, contact:data.contact});
});

router.post('/brand', requireAuth, (req,res)=>{
  const data=readContent();
  data.brand = req.body;
  writeContent(data);
  res.json({success:true, brand:data.brand});
});

router.post('/hero', requireAuth, (req,res)=>{
  const data=readContent();
  data.hero = req.body;
  writeContent(data);
  res.json({success:true, hero:data.hero});
});

module.exports = router;
