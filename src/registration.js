import express from 'express';
import { body, validationResult } from 'express-validator';
import xss from 'xss';
import { app } from './app.js';

// TODO skráningar virkni
const nationalIdPattern = '^[0-9]{6}-?[0-9]{4}$';
export const router = express.Router();
function specifyWrongFields(s) {
  let fields = ['', '', ''];
  fields = ['', '', '']; // eslint :o)
  if (s.length > 0) {
    for (let i = 0; i < s.length; i += 1) {
      if (s[i].indexOf('Nafn') !== -1) fields[0] = 'highlight';
      if (s[i].indexOf('Kennitala') !== -1) fields[1] = 'highlight';
      if (s[i].indexOf('Athugasemd') !== -1) fields[2] = 'highlight';
    }
  }
  return fields;
}

router.post(
  '/post',
  body('nafn')
    .isLength({ min: 1 })
    .withMessage('Nafn má ekki vera tómt'),
  body('kennitala')
    .isLength({ min: 1 })
    .withMessage('Kennitala má ekki vera tóm'),
  body('kennitala')
    .matches(new RegExp(nationalIdPattern))
    .withMessage('Kennitala verður að vera á formi 000000-0000 eða 0000000000'),
  body('ath')
    .isLength({ max: 400 })
    .withMessage('Athugasemd er of löng'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const {
        nafn = '',
        kennitala = '',
        ath = '',
        anon = '',
      } = req.body;
      app.locals.errors = errors.array().map((i) => i.msg);
      app.locals.wrongfields = specifyWrongFields(app.locals.errors);
      const check = anon.localeCompare('on') === 0 ? 'checked' : '';
      const safeNafn = xss(nafn);
      const safekt = xss(kennitala);
      const safeAth = xss(ath);
      app.locals.form = [safeNafn, safekt, safeAth, check];
      res.redirect(301, '/');
    } else {
      app.locals.errors = '';
      app.locals.form = ['', '', '', ''];
      app.locals.wrongfields = ['', '', ''];
      return next();
    }
    return 0;
  },
);
