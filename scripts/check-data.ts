/**
 * Check data quality - find spots with missing required fields
 */

import spotsData from '../data/spots.json';
import type { CalisthenicsParksDataset } from '../data/calisthenics-spots.types';

const dataset = spotsData as CalisthenicsParksDataset;
const spots = dataset.spots;

console.log('📊 Checking data quality...\n');
console.log(`Total spots: ${spots.length}\n`);

// Check for missing titles
const missingTitle = spots.filter(s => !s.title || s.title.trim() === '');
console.log(`Spots with missing/empty title: ${missingTitle.length}`);
if (missingTitle.length > 0) {
  console.log('Sample spots with missing title:');
  missingTitle.slice(0, 5).forEach(s => {
    console.log(`  - ID: ${s.id}, Name: ${s.name || 'N/A'}, Address: ${s.address || 'N/A'}`);
  });
}

// Check for missing names
const missingName = spots.filter(s => !s.name || s.name.trim() === '');
console.log(`\nSpots with missing/empty name: ${missingName.length}`);

// Check for missing coordinates
const missingCoords = spots.filter(s => s.lat === null || s.lat === undefined || s.lon === null || s.lon === undefined);
console.log(`Spots with missing coordinates: ${missingCoords.length}`);

// Check for spots with both title and name missing
const missingBoth = spots.filter(s => (!s.title || s.title.trim() === '') && (!s.name || s.name.trim() === ''));
console.log(`\nSpots with BOTH title and name missing: ${missingBoth.length}`);
if (missingBoth.length > 0) {
  console.log('These spots need attention:');
  missingBoth.slice(0, 10).forEach(s => {
    console.log(`  - ID: ${s.id}, Address: ${s.address || 'N/A'}, Lat: ${s.lat}, Lon: ${s.lon}`);
  });
}
