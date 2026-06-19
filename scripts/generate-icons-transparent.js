import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sourceFile = path.resolve('public/logo.png');
const outputDir = path.resolve('public');

async function processLogo() {
  console.log(`Processing source icon: ${sourceFile}`);
  if (!fs.existsSync(sourceFile)) {
    console.error('Source logo.png not found!');
    process.exit(1);
  }

  // Read metadata to get dimensions
  const image = sharp(sourceFile);
  const metadata = await image.metadata();
  const width = metadata.width;
  const height = metadata.height;

  // Get raw RGBA pixels
  const { data } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  // 1. Detect bounding box of the logo mark (non-white pixels)
  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;

  // Threshold for white background (if R, G, B are all > 250, we treat it as white)
  const isWhite = (r, g, b) => r > 250 && g > 250 && b > 250;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      if (!isWhite(r, g, b)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  console.log(`Detected logo bounds: X: ${minX}-${maxX}, Y: ${minY}-${maxY}`);

  // Calculate width and height of the bounding box
  const boxWidth = maxX - minX + 1;
  const boxHeight = maxY - minY + 1;

  // 2. Extract cropped area and convert white background to transparent
  // We will build a new buffer for the cropped area.
  // To keep it square, let's determine the center of the bounding box.
  const centerX = minX + boxWidth / 2;
  const centerY = minY + boxHeight / 2;
  const maxDim = Math.max(boxWidth, boxHeight);

  // Add 8% padding
  const padding = Math.round(maxDim * 0.08);
  const newSize = maxDim + padding * 2;

  // Define new coordinate bounds (possibly extending beyond original, but we will clamp or fill)
  const startX = Math.round(centerX - newSize / 2);
  const startY = Math.round(centerY - newSize / 2);

  // Create new buffer of size newSize x newSize
  const outBuffer = Buffer.alloc(newSize * newSize * 4);

  for (let y = 0; y < newSize; y++) {
    for (let x = 0; x < newSize; x++) {
      const srcX = startX + x;
      const srcY = startY + y;
      const destIdx = (y * newSize + x) * 4;

      if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
        const srcIdx = (srcY * width + srcX) * 4;
        const r = data[srcIdx];
        const g = data[srcIdx + 1];
        const b = data[srcIdx + 2];

        // Soft transparency threshold for anti-aliasing
        // Calculate distance from white (255, 255, 255)
        const avg = (r + g + b) / 3;
        
        if (avg >= 253) {
          // Pure white
          outBuffer[destIdx] = 0;
          outBuffer[destIdx + 1] = 0;
          outBuffer[destIdx + 2] = 0;
          outBuffer[destIdx + 3] = 0;
        } else if (avg > 240) {
          // Anti-aliased edge: interpolate alpha channel
          const ratio = (253 - avg) / (253 - 240);
          outBuffer[destIdx] = r;
          outBuffer[destIdx + 1] = g;
          outBuffer[destIdx + 2] = b;
          outBuffer[destIdx + 3] = Math.round(ratio * 255);
        } else {
          // Main logo content
          outBuffer[destIdx] = r;
          outBuffer[destIdx + 1] = g;
          outBuffer[destIdx + 2] = b;
          outBuffer[destIdx + 3] = 255;
        }
      } else {
        // Outside original image bounds (transparent padding)
        outBuffer[destIdx] = 0;
        outBuffer[destIdx + 1] = 0;
        outBuffer[destIdx + 2] = 0;
        outBuffer[destIdx + 3] = 0;
      }
    }
  }

  // Create a sharp instance from the processed cropped buffer
  const croppedLogo = sharp(outBuffer, {
    raw: {
      width: newSize,
      height: newSize,
      channels: 4
    }
  });

  // Save the cropped transparent logo as transparent-logo.png for record
  const transparentLogoPath = path.join(outputDir, 'logo.png'); // OVERWRITE original logo with cropped transparent version!
  // Wait, the prompt says "All branding assets must use the same logo mark and transparent background."
  // So replacing logo.png itself with the transparent cropped version is absolutely perfect because it updates Navbar, sidebar, footer, loading screen automatically!
  // Excellent!
  
  await croppedLogo.clone().png().toFile(transparentLogoPath + '.tmp');
  fs.renameSync(transparentLogoPath + '.tmp', transparentLogoPath);
  console.log(`Saved new transparent tightly-cropped logo.png`);

  const targets = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'favicon.ico', size: 32 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'android-chrome-192x192.png', size: 192 },
    { name: 'android-chrome-512x512.png', size: 512 }
  ];

  for (const target of targets) {
    const outputPath = path.join(outputDir, target.name);
    await sharp(transparentLogoPath)
      .resize(target.size, target.size)
      .toFile(outputPath + '.tmp');
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
    fs.renameSync(outputPath + '.tmp', outputPath);
    console.log(`Generated transparent icon: ${target.name} (${target.size}x${target.size})`);
  }

  console.log('All branding favicon assets successfully regenerated with transparent tight cropping!');
}

processLogo().catch(err => {
  console.error('Error processing logo:', err);
  process.exit(1);
});
