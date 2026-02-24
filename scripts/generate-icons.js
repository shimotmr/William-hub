const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const iconsDir = path.join(projectRoot, 'public', 'icons');

// Create SVG for the icon (a simple "W" logo)
const createSvg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4F46E5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7C3AED;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#grad)"/>
  <text x="50%" y="55%" font-family="Arial, sans-serif" font-weight="bold" font-size="${size * 0.5}" fill="white" text-anchor="middle" dominant-baseline="middle">W</text>
</svg>
`;

// Sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  for (const size of sizes) {
    const svg = Buffer.from(createSvg(size));
    const filename = `icon-${size}x${size}.png`;
    
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(path.join(iconsDir, filename));
    
    console.log(`Generated: ${filename}`);
  }

  // Also generate a favicon.ico (using 32x32)
  const faviconSvg = Buffer.from(createSvg(32));
  const faviconDir = path.join(projectRoot, 'public');
  await sharp(faviconSvg)
    .resize(32, 32)
    .png()
    .toFile(path.join(faviconDir, 'favicon.ico.png'));
  
  // Copy as favicon.ico (browsers accept PNG as favicon too)
  fs.copyFileSync(
    path.join(faviconDir, 'favicon.ico.png'),
    path.join(faviconDir, 'favicon.ico')
  );
  fs.unlinkSync(path.join(faviconDir, 'favicon.ico.png'));
  
  console.log('Generated: favicon.ico');
  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
