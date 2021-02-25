import pg from 'pg';
import dotenv from 'dotenv';
import { readFile } from 'fs/promises';
import faker from 'faker';

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

async function query(q, values = []) {
  const client = await pool.connect();
  let result = '';
  try {
    result = await client.query(q, values);
  } finally {
    await client.release();
  }
  return result;
}

function makeID() {
  let id = '';
  for (let i = 0; i < 10; i += 1) {
    id += Math.floor(Math.random() * 10);
  }
  return id;
}
async function setup() {
  const createTable = await readFile('./sql/schema.sql');
  try {
    const tData = createTable.toString('utf-8');
    await query(tData);
  } catch (e) {
    return 0;
  }
  const uname = 'admin';
  const password = '$2a$11$pgj3.zySyFOvIQEpD7W6Aund1Tw.BFarXxgLJxLbrzIv/4Nteisii';
  const u = 'INSERT INTO admins (name, password) VALUES ($1, $2);';
  const inputs = Math.floor(Math.random() * 100 + 500);
  let result = '';
  try {
    await query(u, [uname, password]);
  } catch (e) {
    console.info('It failed', e);
    return 0;
  }
  const q = 'INSERT INTO SIGNATURES (name, NationalId, comment, anonymous, signed) VALUES ($1, $2, $3, $4, $5);';
  for (let i = 0; i < inputs; i += 1) {
    const name = faker.name.findName();
    const nationalID = makeID();
    const ath = (Math.random() < 0.5) ? faker.lorem.sentence() : '';
    const anon = (Math.random() < 0.5);
    const date = faker.date.between('2021-02-28', '2021-02-14');
    try {
      result = await query(q, [name, nationalID, ath, anon, date]);
    } catch (e) {
      return 0;
    }
    console.info(`:>> Entry inserted ${i}`);
  }
  return result;
}

setup();
