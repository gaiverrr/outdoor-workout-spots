/**
 * Migrate spots data from JSON to Turso
 */

import { db } from '../lib/db';
import spotsData from '../data/spots.json';
import type { CalisthenicsParksDataset } from '../data/calisthenics-spots.types';

const BATCH_SIZE = 100;

async function migrate() {
  console.log('🚀 Starting migration to Turso...\n');

  const dataset = spotsData as CalisthenicsParksDataset;
  const spots = dataset.spots;

  console.log(`📊 Total spots to migrate: ${spots.length}`);

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await db.execute('DELETE FROM spots');

  // Migrate in batches
  let migrated = 0;
  const startTime = Date.now();

  for (let i = 0; i < spots.length; i += BATCH_SIZE) {
    const batch = spots.slice(i, i + BATCH_SIZE);

    // Insert each spot using prepared statements
    for (const spot of batch) {
      await db.execute({
        sql: `INSERT INTO spots (
          id, title, name, lat, lon, address, equipment, disciplines,
          description, features_type, images, rating
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          spot.id,
          spot.title,
          spot.name || null,
          spot.lat ?? null,
          spot.lon ?? null,
          spot.address || null,
          spot.details?.equipment ? JSON.stringify(spot.details.equipment) : null,
          spot.details?.disciplines ? JSON.stringify(spot.details.disciplines) : null,
          spot.details?.description || null,
          spot.details?.features?.type || null,
          spot.details?.images ? JSON.stringify(spot.details.images) : null,
          spot.details?.rating ?? null,
        ]
      });

      migrated++;
    }

    process.stdout.write(`\r   Progress: ${migrated}/${spots.length} (${((migrated / spots.length) * 100).toFixed(1)}%)`);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\n✅ Migration complete in ${duration}s!`);

  // Verify
  const result = await db.execute('SELECT COUNT(*) as count FROM spots');
  const count = result.rows[0]?.count || 0;

  console.log(`\n📊 Final count: ${count} spots`);

  if (count !== spots.length) {
    console.log(`⚠️  Warning: Expected ${spots.length} but got ${count}`);
  }
}

migrate().catch(console.error);
