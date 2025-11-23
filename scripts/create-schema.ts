/**
 * Create Turso database schema
 */

import { db } from '../lib/db';

async function createSchema() {
  console.log('🗄️  Creating database schema...\n');

  try {
    // Create spots table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS spots (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        name TEXT,
        lat REAL,
        lon REAL,
        address TEXT,
        equipment TEXT,
        disciplines TEXT,
        description TEXT,
        features_type TEXT,
        images TEXT,
        rating INTEGER
      )
    `);

    console.log('✅ Created spots table');

    // Create indexes for fast queries
    await db.execute('CREATE INDEX IF NOT EXISTS idx_lat_lon ON spots(lat, lon)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_title ON spots(title)');

    console.log('✅ Created indexes');

    // Get stats
    const result = await db.execute('SELECT COUNT(*) as count FROM spots');
    const count = result.rows[0]?.count || 0;

    console.log(`\n📊 Database ready! Current spots: ${count}`);

  } catch (error) {
    console.error('❌ Error creating schema:', error);
    process.exit(1);
  }
}

createSchema();
