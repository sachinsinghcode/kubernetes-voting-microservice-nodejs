'use strict';

const express = require('express');
const cors    = require('cors');
const { Pool } = require('pg');

const app  = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 5432,
  database: process.env.DB_NAME     || 'votes',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

app.use(cors());
app.use(express.json());

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS votes (
      id         SERIAL PRIMARY KEY,
      option     VARCHAR(100) NOT NULL,
      created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
  `);
  console.log('[vote-service] DB ready');
}

// Health
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// GET /votes — return count per option
app.get('/votes', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT option, COUNT(*) AS count FROM votes GROUP BY option ORDER BY count DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /votes — cast a vote
app.post('/votes', async (req, res) => {
  const { option } = req.body;
  if (!option || typeof option !== 'string' || option.trim() === '') {
    return res.status(400).json({ error: '"option" is required' });
  }
  try {
    await pool.query('INSERT INTO votes (option) VALUES ($1)', [option.trim()]);
    res.status(201).json({ message: `Voted for "${option.trim()}"` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /votes — reset all votes
app.delete('/votes', async (_req, res) => {
  try {
    await pool.query('DELETE FROM votes');
    res.json({ message: 'All votes cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function start() {
  let retries = 10;
  while (retries-- > 0) {
    try { await initDB(); break; }
    catch (err) {
      console.warn(`DB not ready, retrying... (${retries} left)`);
      if (retries === 0) process.exit(1);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  app.listen(PORT, () => console.log(`[vote-service] listening on :${PORT}`));
}

start();
