import dotenv from 'dotenv';
import express from 'express';
import { body } from 'express-validator';
import xss from 'xss';
import { insertSignature, getSignatures } from './db.js';
import { router } from './registration.js';

dotenv.config();

const {
  PORT: port = 3000,
} = process.env;
// const nationalIdPattern = '^[0-9]{6}-?[0-9]{4}$';

export const app = express();
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.set('views', './views');
app.set('view engine', 'ejs');
app.locals.form = ['', '', '', ''];
app.locals.wrongfields = ['', '', ''];
// TODO setja upp rest af virkni!

app.get('/', async (_req, res) => {
  if (!app.locals.failed) {
    const signatures = await getSignatures();
    res.render('form', { signatures });
  } else {
    app.locals.failed = false;
    res.render('villa');
  }
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
