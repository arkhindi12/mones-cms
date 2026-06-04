const express = require('express');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3010;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use('/admin/static', express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'mones-cms-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Routes
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');

app.use('/admin', adminRoutes);
app.use('/admin/api', apiRoutes);

// Redirect root to admin
app.get('/', (req, res) => res.redirect('/admin/login'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mones CMS running on port ${PORT}`);
});
