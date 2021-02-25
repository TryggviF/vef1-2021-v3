import express from 'express';
import passport from 'passport';

import { query } from './db.js';
import { ensureLoggedIn } from './users.js';

export const adminRouter = express.Router();

adminRouter.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }

  let message = '';

  if (req.session.messages && req.session.messages.length > 0) {
    message = req.session.messages.join(', ');
    req.session.messages = [];
  }

  return res.render('login', { page: 'login', title: 'Innskráning', message });
});

adminRouter.post(
  '/login',

  passport.authenticate('local', {
    failureMessage: 'Notandi eða lykilorð vitlaust.',
    failureRedirect: '/login',
  }),

  (req, res) => {
    res.redirect('/');
  },
);

adminRouter.post('/delete', ensureLoggedIn, async (req, res) => {
  const {
    id = '',
  } = req.body;
  const q = 'DELETE FROM SIGNATURES WHERE id = $1';
  await query(q, [id]);
  res.redirect('/');
});
