const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS transcripts (
        id UUID PRIMARY KEY,
        title TEXT NOT NULL DEFAULT 'Untitled',
        transcript TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'manual',
        status TEXT NOT NULL DEFAULT 'analyzing',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS analyses (
        id UUID PRIMARY KEY REFERENCES transcripts(id) ON DELETE CASCADE,
        title TEXT,
        source TEXT,
        summary TEXT,
        prospect JSONB,
        key_phrases JSONB DEFAULT '[]',
        objections JSONB DEFAULT '[]',
        opportunities JSONB DEFAULT '[]',
        modules_discussed JSONB DEFAULT '[]',
        messaging_themes JSONB DEFAULT '[]',
        marketing_suggestions JSONB DEFAULT '[]',
        next_steps JSONB DEFAULT '[]',
        deal_signals JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
    `);

    console.log('Database tables initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };
