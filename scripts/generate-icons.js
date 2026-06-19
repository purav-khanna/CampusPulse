import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sourceFile = path.resolve('public/logo.png');
const outputDir = path.resolve('public');

const targets = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon.ico', size: 32 }, // simple fallback favicon
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 }
];

async function generate() {
  console.log(`Loading source icon from: ${sourceFile}`);
  if (!fs.existsSync(sourceFile)) {
    console.error('Source logo.png not found in public/ directory!');
    process.exit(1);
  }

  for (const target of targets) {
    const outputPath = path.join(outputDir, target.name);
    await sharp(sourceFile)
      .resize(target.size, target.size)
      .toFile(outputPath);
    console.log(`Generated: ${target.name} (${target.size}x${target.size})`);
  }

  console.log('All branding assets generated successfully!');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
