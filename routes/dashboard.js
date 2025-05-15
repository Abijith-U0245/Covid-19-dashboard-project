const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

router.get('/', async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(403).render('error', { message: 'Unauthorized access' });

  res.render('dashboard', { user: { email } });
});

module.exports = router;
