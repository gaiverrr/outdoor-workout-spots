/**
 * Migrate spots data from JSON to Turso with batch transactions
 */

import { db } from '@/lib/db';
import spotsData from '../data/spots.json';
import type { CalisthenicsParksDataset, CalisthenicsSpot } from '@/data/calisthenics-spots.types';

const BATCH_SIZE = 500; // Larger batches with transactions
const MAX_RETRIES = 3;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function insertBatchWithRetry(batch: CalisthenicsSpot[], batchNum: number, retries = 0): Promise<boolean> {
  try {
    // Use batch execute for better performance with upsert
    const statements = batch.map(spot => ({
      sql: `INSERT OR REPLACE INTO spots (
        id, title, name, lat, lon, address, equipment, disciplines,
        description, features_type, images, rating
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        spot.id,
        spot.title || spot.name || `Spot #${spot.id}`,
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
    }));

    // Execute batch
    await db.batch(statements);
    return true;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ETIMEDOUT' && retries < MAX_RETRIES) {
      console.log(`\n⚠️  Timeout on batch ${batchNum}, retrying (${retries + 1}/${MAX_RETRIES})...`);
      await sleep(2000 * (retries + 1)); // Exponential backoff
      return insertBatchWithRetry(batch, batchNum, retries + 1);
    }
    throw error;
  }
}

async function migrate() {
  console.log('🚀 Starting migration to Turso...\n');

  const dataset = spotsData as CalisthenicsParksDataset;
  const spots = dataset.spots;

  console.log(`📊 Total spots to migrate: ${spots.length}`);
  console.log(`📦 Batch size: ${BATCH_SIZE} spots per transaction`);
  console.log(`♻️  Using INSERT OR REPLACE (upsert) - duplicates will be updated\n`);

  // Migrate in batches with transactions
  let migrated = 0;
  const startTime = Date.now();
  const totalBatches = Math.ceil(spots.length / BATCH_SIZE);

  for (let i = 0; i < spots.length; i += BATCH_SIZE) {
    const batch = spots.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    await insertBatchWithRetry(batch, batchNum);

    migrated += batch.length;
    const percent = ((migrated / spots.length) * 100).toFixed(1);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    process.stdout.write(`\r   Progress: ${migrated}/${spots.length} (${percent}%) - Batch ${batchNum}/${totalBatches} - ${elapsed}s elapsed`);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\n✅ Migration complete in ${duration}s!`);

  // Verify
  const result = await db.execute('SELECT COUNT(*) as count FROM spots');
  const count = result.rows[0]?.count || 0;

  console.log(`\n📊 Final count: ${count} spots`);

  if (count !== spots.length) {
    console.log(`⚠️  Warning: Expected ${spots.length} but got ${count}`);
  } else {
    console.log(`✅ All spots migrated successfully!`);
  }
}

migrate().catch(console.error);
