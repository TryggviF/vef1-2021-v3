import pg from 'pg';
import dotenv from 'dotenv';
import { readFile } from 'fs/promises';

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
    await client.end();
  }
  return result;
}

async function setup() {
  let result = '';
  let result2 = '';
  const dropped = await query('DROP TABLE IF EXISTS signatures');
  try {
    const createTable = await readFile('./sql/schema.sql');
    const tData = createTable.toString('utf-8');
    result = await query(tData);
    const insertData = await readFile('./sql/fake.sql');
    const iData = insertData.toString('utf-8');
    result2 = await query(iData);
  } catch (e) {
    console.error(e.message);
  }
  return [result, result2, dropped];
}

setup();
