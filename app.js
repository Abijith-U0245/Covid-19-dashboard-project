const express = require('express');
const admin = require('firebase-admin');
const cookieParser = require('cookie-parser');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize Firebase Admin SDK with your service account key JSON file
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Middleware to check Firebase session cookie and authenticate user
async function checkAuth(req, res, next) {
  const sessionCookie = req.cookies.session || '';
  try {
    const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
    req.user = decodedClaims;
    next();
  } catch (error) {
    res.redirect('/login');
  }
}

// Routes

// GET /login - render login page
app.get('/login', (req, res) => {
  res.render('login', { errorMessage: null });
});

// POST /sessionLogin - Firebase ID token sent by client after login
app.post('/sessionLogin', async (req, res) => {
  const idToken = req.body.idToken;
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

  try {
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });
    const options = { maxAge: expiresIn, httpOnly: true, secure: false }; // Set secure: true on HTTPS
    res.cookie('session', sessionCookie, options);
    res.redirect('/dashboard');
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

// GET /dashboard - protected route
app.get('/dashboard', checkAuth, (req, res) => {
  res.render('dashboard', { user: req.user });
});

// GET /logout - clear session cookie and redirect to login
app.get('/logout', (req, res) => {
  res.clearCookie('session');
  res.redirect('/login');
});

// Root route redirect to dashboard or login
app.get('/', (req, res) => {
  const sessionCookie = req.cookies.session || '';
  admin.auth().verifySessionCookie(sessionCookie, true)
    .then(() => res.redirect('/dashboard'))
    .catch(() => res.redirect('/login'));
});

// 404 error page
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
