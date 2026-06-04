const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');
const CONTENT_FILE = path.join(__dirname, '..', 'data', 'content.json');

function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  res.redirect('/admin/login');
}

// Login page
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Login POST
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    if (username === users.admin.username) {
      const match = await bcrypt.compare(password, users.admin.password);
      if (match) {
        req.session.authenticated = true;
        req.session.username = username;
        return res.redirect('/admin/dashboard');
      }
    }
    res.render('login', { error: 'Username atau password salah' });
  } catch (e) {
    res.render('login', { error: 'Server error: ' + e.message });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// Dashboard
router.get('/dashboard', requireAuth, (req, res) => {
  const content = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
  res.render('dashboard', { content, username: req.session.username });
});

module.exports = router;
