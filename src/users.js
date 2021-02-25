import bcrypt from 'bcrypt';
import { query } from './db.js';

export async function findByUsername(user) {
  const q = 'SELECT * FROM admins WHERE name = $1';
  const result = await query(q, [user]);
  if (result.rowCount === 1) {
    return result.rows[0];
  }
  return null;
}
export async function findById(id) {
  const q = 'SELECT * FROM admins WHERE id = $1';

  const result = await query(q, [id]);

  if (result.rowCount === 1) {
    return result.rows[0];
  }

  return null;
}

export async function userStrategy(username, password, done) {
  try {
    const user = await findByUsername(username);
    if (!user) {
      return done(null, false);
    }

    const passwordsMatch = await bcrypt.compare(password, user.password);

    if (passwordsMatch) {
      return done(null, user);
    }
  } catch (err) {
    console.error(err);
    return done(err);
  }

  return done(null, false);
}

export function serializeUser(user, done) {
  done(null, user.id);
}

export async function deserializeUser(id, done) {
  try {
    const user = await findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
}

export async function users() {
  const q = 'SELECT * FROM admins;';

  const result = await query(q);

  return result.rows;
}

export function ensureLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  return res.redirect('/login');
}
