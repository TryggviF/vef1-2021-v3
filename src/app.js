import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy } from 'passport-local';
import { body } from 'express-validator';
import xss from 'xss';

import { insertSignature, getSignatures, select } from './db.js';
import { router } from './registration.js';
import { deserializeUser, serializeUser, userStrategy } from './users.js';
import { adminRouter } from './admin.js';

dotenv.config();

const {
  PORT: port = 3000,
  SESSION_SECRET: sessionSecret,
} = process.env;
// const nationalIdPattern = '^[0-9]{6}-?[0-9]{4}$';

export const app = express();
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
}));

app.set('views', './views');
app.set('view engine', 'ejs');

app.locals.form = ['', '', '', ''];
app.locals.wrongfields = ['', '', ''];

passport.use(new Strategy(userStrategy));

passport.serializeUser(serializeUser);
passport.deserializeUser(deserializeUser);

app.use(passport.initialize());
app.use(passport.session());
// TODO setja upp rest af virkni!

app.use((req, res, next) => {
  // Látum `users` alltaf vera til fyrir view
  res.locals.user = req.isAuthenticated() ? req.user : null;

  next();
});

app.get('/login', adminRouter);
app.post('/login', adminRouter);
app.post('/delete', adminRouter);

app.get('/', async (req, res) => {
  if (!app.locals.failed) {
    const maxRows = await getSignatures();
    app.locals.totalRows = maxRows.rowCount;
    let { offset = 0, limit = 50 } = req.query;
    offset = Number(offset);
    limit = Number(limit);
    let start = true;
    let end = true;
    app.locals.pageCount = Math.ceil(maxRows.rowCount / limit);
    const signatures = await select(offset, limit);
    if ((maxRows.rowCount - (offset + limit)) > 0) {
      end = false;
    }
    if (offset !== 0) {
      start = false;
    }
    res.render('form', {
      signatures, end, start, offset, limit,
    });
  } else {
    app.locals.failed = false;
    res.render('villa');
  }
});

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

app.post('/post', router,
  body('nafn').trim().escape(),
  body('kennitala').blacklist('-'),
  body('ath').trim().escape(),
  async (req, res) => {
    const {
      nafn = '',
      kennitala = '',
      ath = '',
      anon = '',
    } = req.body;
    const safeNafn = xss(nafn);
    const safekt = xss(kennitala);
    const safeAth = xss(ath);
    const sec = anon.localeCompare('on') === 0;
    let result = 0;
    try {
      result = await insertSignature(safeNafn, safekt, safeAth, sec);
    } catch (e) {
      console.error('Error inserting', e);
      app.locals.failed = true;
      // res.redirect('/');
    }
    if (result === 0) {
      app.locals.failed = true;
      res.redirect('/');
    } else {
      app.locals.failed = false;
      res.redirect('/');
    }
  });

// Verðum að setja bara *port* svo virki á heroku
app.listen(port, () => {
  console.info(`Server running at http://localhost:${port}/`);
});
