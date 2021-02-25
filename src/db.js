import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const {
  DATABASE_URL: connectionString,
  NODE_ENV: nodeEnv = '',
} = process.env;

console.info('process.env :>> ', process.env.DATABASE_URL);

if (!connectionString) {
  console.error('Vantar DATABASE_URL!');
  process.exit(1);
}

// Notum SSL tengingu við gagnagrunn ef við erum *ekki* í development mode, þ.e.a.s. á local vél
const ssl = nodeEnv !== 'development' ? { rejectUnauthorized: false } : false;

const pool = new pg.Pool({ connectionString, ssl });

export async function select(offset = 0, limit = 10) {
  const client = await pool.connect();

  try {
    const q = 'SELECT * FROM signatures ORDER BY signed DESC OFFSET $1 LIMIT $2';
    const res = await client.query(q, [offset, limit]);
    return res;
  } catch (e) {
    console.error('Error selecting', e);
  } finally {
    client.release();
  }

  return [];
}

export async function insertSignature(name, natID, comment, anon) {
  const client = await pool.connect();
  const q = 'INSERT INTO signatures (name, nationalID, comment, anonymous) VALUES ($1,$2,$3,$4) returning *';
  const values = [name, natID, comment, anon];
  let result = '';
  try {
    result = await client.query(q, values).catch();
    console.info('Inserted row :>> ', result.rows);
  } catch (e) {
    return 0;
  } finally {
    client.release();
  }
  return result.rows;

  // await pool.end();
}

export async function getSignatures() {
  const client = await pool.connect();
  const q = 'SELECT * FROM signatures';
  let results = '';

  try {
    results = await client.query(q);
  } catch (e) {
    console.error('Error selecting', e);
  } finally {
    client.release();
  }
  // await pool.end();
  return results;
}

export async function query(q, values = []) {
  const client = await pool.connect();
  let result = '';
  try {
    result = await client.query(q, values);
  } finally {
    await client.release();
  }
  return result;
}
