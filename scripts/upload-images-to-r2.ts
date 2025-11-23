/**
 * Upload images to Cloudflare R2
 *
 * This script uploads all images from real-data/images to Cloudflare R2
 * and creates a mapping file for transforming the spots JSON.
 *
 * Prerequisites:
 * 1. Create R2 bucket in Cloudflare dashboard
 * 2. Create API token with R2 permissions
 * 3. Set environment variables in .env.local:
 *    - R2_ACCOUNT_ID
 *    - R2_ACCESS_KEY_ID
 *    - R2_SECRET_ACCESS_KEY
 *    - R2_BUCKET_NAME
 *    - R2_PUBLIC_URL (e.g., https://pub-xxx.r2.dev or your custom domain)
 *
 * Usage:
 *   npx tsx scripts/upload-images-to-r2.ts
 */

import dotenv from 'dotenv';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import path from 'path';
import pLimit from 'p-limit';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const IMAGES_DIR = path.join(process.cwd(), 'real-data', 'images');
const MAPPING_FILE = path.join(process.cwd(), 'real-data', 'r2-mapping.json');
const CONCURRENCY = 100; // Upload 100 images simultaneously
const SAVE_INTERVAL = 50; // Save progress every 50 uploads
const MAX_RETRIES = 3;

interface ImageMapping {
  [localPath: string]: string; // local path -> R2 URL
}

interface UploadProgress {
  totalImages: number;
  uploaded: number;
  failed: string[];
  mapping: ImageMapping;
}

// Initialize R2 client
function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing R2 credentials. Check .env.local file.');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

async function getAllImageFiles(): Promise<string[]> {
  const images: string[] = [];
  const spotDirs = await fs.readdir(IMAGES_DIR);

  console.log(`📂 Found ${spotDirs.length} spot directories`);

  for (const spotDir of spotDirs) {
    const spotPath = path.join(IMAGES_DIR, spotDir);
    const stat = await fs.stat(spotPath);

    if (stat.isDirectory()) {
      const files = await fs.readdir(spotPath);
      for (const file of files) {
        if (file.endsWith('.webp')) {
          images.push(path.join('images', spotDir, file));
        }
      }
    }
  }

  return images;
}

async function loadProgress(): Promise<UploadProgress> {
  try {
    const content = await fs.readFile(MAPPING_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {
      totalImages: 0,
      uploaded: 0,
      failed: [],
      mapping: {}
    };
  }
}

async function saveProgress(progress: UploadProgress): Promise<void> {
  await fs.writeFile(MAPPING_FILE, JSON.stringify(progress, null, 2));
}

async function uploadImage(
  client: S3Client,
  localPath: string,
  bucketName: string,
  publicUrl: string,
  retries = MAX_RETRIES
): Promise<string | null> {
  const fullPath = path.join(process.cwd(), 'real-data', localPath);

  try {
    const fileBuffer = await fs.readFile(fullPath);

    // Upload to R2 with public-read ACL
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: localPath,
      Body: fileBuffer,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
    });

    await client.send(command);

    // Construct public URL
    const url = `${publicUrl}/${localPath}`;
    return url;
  } catch (error) {
    if (retries > 0) {
      console.log(`⚠️  Retry ${MAX_RETRIES - retries + 1}/${MAX_RETRIES} for ${localPath}`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
      return uploadImage(client, localPath, bucketName, publicUrl, retries - 1);
    }

    console.error(`❌ Failed to upload ${localPath}:`, error);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting Cloudflare R2 upload...\n');

  // Check environment variables
  const requiredEnvVars = [
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME',
    'R2_PUBLIC_URL'
  ];

  const missing = requiredEnvVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.log('\nPlease add them to .env.local file.');
    console.log('See scripts/R2_SETUP.md for setup instructions.\n');
    process.exit(1);
  }

  const bucketName = process.env.R2_BUCKET_NAME!;
  const publicUrl = process.env.R2_PUBLIC_URL!.replace(/\/$/, ''); // Remove trailing slash

  // Initialize R2 client
  let client: S3Client;
  try {
    client = getR2Client();
    console.log('✅ Connected to Cloudflare R2\n');
  } catch (error) {
    console.error('❌ Failed to connect to R2:', error);
    process.exit(1);
  }

  // Get all images
  console.log('📊 Scanning for images...');
  const allImages = await getAllImageFiles();
  console.log(`✅ Found ${allImages.length} images\n`);

  // Load progress
  const progress = await loadProgress();
  progress.totalImages = allImages.length;

  // Filter out already uploaded
  const remainingImages = allImages.filter(img => !progress.mapping[img]);

  if (remainingImages.length === 0) {
    console.log('✨ All images already uploaded!');
    console.log(`📊 Total uploaded: ${Object.keys(progress.mapping).length}`);
    return;
  }

  console.log(`📤 Uploading ${remainingImages.length} remaining images...`);
  console.log(`   Using ${CONCURRENCY} concurrent uploads`);
  console.log(`   (${progress.uploaded} already uploaded)\n`);

  const startTime = Date.now();
  let lastSave = 0;

  // Create concurrency limiter
  const limit = pLimit(CONCURRENCY);

  // Upload all images in parallel with concurrency limit
  const uploads = remainingImages.map((imagePath) =>
    limit(async () => {
      const url = await uploadImage(client, imagePath, bucketName, publicUrl);

      if (url) {
        progress.mapping[imagePath] = url;
        progress.uploaded++;
        process.stdout.write('.');
      } else {
        progress.failed.push(imagePath);
        process.stdout.write('✗');
      }

      // Save progress periodically
      if (progress.uploaded - lastSave >= SAVE_INTERVAL) {
        lastSave = progress.uploaded;
        await saveProgress(progress);

        // Show progress with speed
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = (progress.uploaded / elapsed).toFixed(1);
        const percentage = ((progress.uploaded / progress.totalImages) * 100).toFixed(1);
        console.log(`\n   Progress: ${progress.uploaded}/${progress.totalImages} (${percentage}%) - ${speed} img/s`);
      }
    })
  );

  await Promise.all(uploads);
  console.log('\n');

  // Final save
  await saveProgress(progress);

  // Calculate total time
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  const avgSpeed = (progress.uploaded / parseFloat(totalTime)).toFixed(1);

  // Final summary
  console.log('✅ Upload complete!\n');
  console.log('📊 Summary:');
  console.log(`   Total images: ${progress.totalImages}`);
  console.log(`   Uploaded: ${progress.uploaded}`);
  console.log(`   Failed: ${progress.failed.length}`);
  console.log(`   Time: ${totalTime}s`);
  console.log(`   Average speed: ${avgSpeed} images/second`);

  if (progress.failed.length > 0) {
    console.log('\n❌ Failed uploads:');
    progress.failed.slice(0, 10).forEach(path => console.log(`   - ${path}`));
    if (progress.failed.length > 10) {
      console.log(`   ... and ${progress.failed.length - 10} more`);
    }
  }

  console.log(`\n💾 Mapping saved to: ${MAPPING_FILE}`);
  console.log('\n🎯 Next steps:');
  console.log('   1. Make sure R2 bucket has public access enabled');
  console.log('   2. Run: npx tsx scripts/transform-spots-data.ts');
  console.log('   3. Test your app: npm run dev');
}

main().catch(console.error);
