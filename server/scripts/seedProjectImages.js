import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import pool from '../db.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const imageDir = path.join(scriptDir, '..', '..', 'public', 'project-images');

const projectImages = [
  'agi-robot-kiti',
  'mobil-donusum-kiti',
  'egitim-yapay-zeka-platformu',
  'ai-gimbal-asistan',
  'ai-kisisellestirilmis-uretim',
  'akilli-rehabilitasyon-platformu',
  'tasinabilir-solunum-rehabilitasyon-cihazi',
].map((slug) => ({
  slug,
  filename: `${slug}.webp`,
  imageUrl: `/project-images/${slug}.webp`,
}));

async function validateImages() {
  for (const image of projectImages) {
    const imagePath = path.join(imageDir, image.filename);
    await fs.access(imagePath);

    const metadata = await sharp(imagePath).metadata();
    if (metadata.format !== 'webp' || metadata.width !== 1600 || metadata.height !== 1000) {
      throw new Error(
        `${image.filename} must be a 1600x1000 WebP image; received ${metadata.width}x${metadata.height} ${metadata.format}`,
      );
    }
  }
}

async function seedProjectImages() {
  const client = await pool.connect();

  try {
    await validateImages();
    await client.query('BEGIN');

    const slugs = projectImages.map(({ slug }) => slug);
    const existing = await client.query(
      'SELECT slug FROM projects WHERE slug = ANY($1::text[])',
      [slugs],
    );
    const existingSlugs = new Set(existing.rows.map(({ slug }) => slug));
    const missingSlugs = slugs.filter((slug) => !existingSlugs.has(slug));

    if (missingSlugs.length > 0) {
      throw new Error(`Project records not found: ${missingSlugs.join(', ')}`);
    }

    for (const image of projectImages) {
      const result = await client.query(
        `UPDATE projects
         SET image_url = $1, updated_at = NOW()
         WHERE slug = $2`,
        [image.imageUrl, image.slug],
      );

      if (result.rowCount !== 1) {
        throw new Error(`Expected one project for slug "${image.slug}", updated ${result.rowCount}`);
      }
    }

    await client.query('COMMIT');
    console.log(`Seeded ${projectImages.length} project images.`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Project image seed failed:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seedProjectImages();
