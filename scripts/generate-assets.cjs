const fs = require('fs');
const path = require('path');
const playwright = require('/root/.bun/install/global/node_modules/playwright-core');

// Pure vector of Kura turtle mascot with transparent background
const kulaLogoMarkSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%" fill="none">
  <!-- Contact Shadow -->
  <ellipse cx="98" cy="162" rx="66" ry="9" fill="#2A382E" fill-opacity="0.12" />

  <!-- Tail -->
  <path d="M 44 135 C 32 136 26 130 24 122 C 32 124 38 128 44 132 Z" fill="#5FB86B" />

  <!-- Back Foot / Kaki Belakang -->
  <g id="back-foot">
    <ellipse cx="64" cy="148" rx="17" ry="12" fill="#5FB86B" transform="rotate(-6 64 148)" />
    <!-- Cream toe pads -->
    <ellipse cx="56" cy="154" rx="3" ry="2" fill="#FAF7F2" />
    <ellipse cx="64" cy="156" rx="3.2" ry="2" fill="#FAF7F2" />
    <ellipse cx="72" cy="154" rx="3" ry="2" fill="#FAF7F2" />
  </g>

  <!-- Front Foot / Kaki Depan -->
  <g id="front-foot">
    <ellipse cx="134" cy="148" rx="17" ry="12" fill="#5FB86B" transform="rotate(6 134 148)" />
    <!-- Cream toe pads -->
    <ellipse cx="126" cy="154" rx="3" ry="2" fill="#FAF7F2" />
    <ellipse cx="134" cy="156" rx="3.2" ry="2" fill="#FAF7F2" />
    <ellipse cx="142" cy="154" rx="3" ry="2" fill="#FAF7F2" />
  </g>

  <!-- Head & Neck / Kepala & Leher -->
  <g id="head">
    <path d="M 130 130 C 138 126 148 118 152 110 C 158 98 156 86 148 80 C 138 74 124 82 120 94" fill="#5FB86B" />
    <!-- Cute Rounded Head -->
    <circle cx="156" cy="100" r="26" fill="#5FB86B" />
    
    <!-- Big Glossy Eye -->
    <circle cx="164" cy="94" r="5" fill="#2B2A26" />
    <!-- Eye Catchlight / Glint -->
    <circle cx="162.5" cy="92.2" r="1.8" fill="#FFFFFF" />
    <circle cx="165.5" cy="95.5" r="0.8" fill="#FFFFFF" />

    <!-- Rosy Cheek Blush -->
    <ellipse cx="162" cy="107" rx="5" ry="3.5" fill="#E8825E" fill-opacity="0.8" />

    <!-- Sweet Smile -->
    <path d="M 166 104 C 170 108 174 107 176 102" stroke="#2B6B48" stroke-width="2" stroke-linecap="round" fill="none" />

    <!-- Cute Nostril Dot -->
    <circle cx="178" cy="96" r="1" fill="#2B6B48" opacity="0.6" />
  </g>

  <!-- Shell Base / Tempurung Dasar (Dark Sage #2B6B48) -->
  <path d="M 38 140 C 36 68 86 52 100 52 C 114 52 160 68 158 140 C 158 144 38 144 38 140 Z" fill="#2B6B48" />
  
  <!-- Shell Rim / Lingkar Bawah Tempurung -->
  <path d="M 36 138 C 50 144 146 144 160 138 C 158 145 38 145 36 138 Z" fill="#23583B" />

  <!-- Scutes / Petak Tempurung (Sage #3C9A5A) -->
  <!-- Top Center Hexagon -->
  <polygon points="100,64 117,74 117,94 100,104 83,94 83,74" fill="#3C9A5A" stroke="#2B6B48" stroke-width="2.5" stroke-linejoin="round" />
  
  <!-- Lower Left Scute -->
  <polygon points="65,92 81,101 81,121 65,131 49,121 49,101" fill="#3C9A5A" stroke="#2B6B48" stroke-width="2.5" stroke-linejoin="round" />

  <!-- Lower Right Scute -->
  <polygon points="135,92 151,101 151,121 135,131 119,121 119,101" fill="#3C9A5A" stroke="#2B6B48" stroke-width="2.5" stroke-linejoin="round" />

  <!-- Scute Highlights (subtle warm depth) -->
  <polygon points="100,67 114,75 114,92 100,100 86,92 86,75" fill="#4AA868" fill-opacity="0.35" />

  <!-- Sprout atop Shell / Tunas di atas Tempurung (Growth symbol) -->
  <g id="sprout">
    <!-- Curved Tender Stem -->
    <path d="M 100 52 C 99 40 102 32 100 22" stroke="#488F38" stroke-width="3.5" stroke-linecap="round" fill="none" />
    
    <!-- Left Leaf -->
    <ellipse cx="94" cy="24" rx="7.5" ry="4" fill="#B5E08A" transform="rotate(-30 94 24)" />
    <!-- Right Leaf -->
    <ellipse cx="106" cy="24" rx="7.5" ry="4" fill="#B5E08A" transform="rotate(30 106 24)" />
    
    <!-- Center Sprout Glow / Leaf vein -->
    <path d="M 100 25 C 100 22 101 19 100 17" stroke="#D8F5A2" stroke-width="1.5" stroke-linecap="round" fill="none" />
  </g>
</svg>`;

// Framed favicon SVG with squircle tile so it stands out cleanly in browser tabs and bookmark bars
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="tileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FAF7F2" />
      <stop offset="100%" stop-color="#F2ECE1" />
    </linearGradient>
  </defs>
  <!-- Rounded Squircle Tile -->
  <rect width="200" height="200" rx="46" fill="url(#tileGrad)" />
  <rect width="196" height="196" x="2" y="2" rx="44" stroke="#34634E" stroke-opacity="0.15" stroke-width="2" fill="none" />

  <g transform="translate(0, 2)">
    <!-- Contact Shadow -->
    <ellipse cx="98" cy="158" rx="62" ry="8" fill="#2A382E" fill-opacity="0.12" />

    <!-- Tail -->
    <path d="M 44 133 C 32 134 26 128 24 120 C 32 122 38 126 44 130 Z" fill="#5FB86B" />

    <!-- Back Foot -->
    <ellipse cx="64" cy="145" rx="16" ry="11" fill="#5FB86B" transform="rotate(-6 64 145)" />
    <ellipse cx="56" cy="151" rx="2.8" ry="1.8" fill="#FAF7F2" />
    <ellipse cx="64" cy="153" rx="3" ry="1.8" fill="#FAF7F2" />
    <ellipse cx="72" cy="151" rx="2.8" ry="1.8" fill="#FAF7F2" />

    <!-- Front Foot -->
    <ellipse cx="134" cy="145" rx="16" ry="11" fill="#5FB86B" transform="rotate(6 134 145)" />
    <ellipse cx="126" cy="151" rx="2.8" ry="1.8" fill="#FAF7F2" />
    <ellipse cx="134" cy="153" rx="3" ry="1.8" fill="#FAF7F2" />
    <ellipse cx="142" cy="151" rx="2.8" ry="1.8" fill="#FAF7F2" />

    <!-- Head -->
    <path d="M 130 128 C 138 124 148 116 152 108 C 158 96 156 84 148 78 C 138 72 124 80 120 92" fill="#5FB86B" />
    <circle cx="156" cy="98" r="25" fill="#5FB86B" />
    <circle cx="164" cy="92" r="4.8" fill="#2B2A26" />
    <circle cx="162.5" cy="90.5" r="1.6" fill="#FFFFFF" />
    <circle cx="165.5" cy="93.5" r="0.7" fill="#FFFFFF" />
    <ellipse cx="162" cy="105" rx="4.8" ry="3.2" fill="#E8825E" fill-opacity="0.8" />
    <path d="M 166 102 C 170 106 174 105 176 100" stroke="#2B6B48" stroke-width="2" stroke-linecap="round" fill="none" />

    <!-- Shell Base -->
    <path d="M 38 138 C 36 68 86 52 100 52 C 114 52 160 68 158 138 C 158 142 38 142 38 138 Z" fill="#2B6B48" />
    <path d="M 36 136 C 50 142 146 142 160 136 C 158 143 38 143 36 136 Z" fill="#23583B" />

    <!-- Scutes -->
    <polygon points="100,64 117,74 117,94 100,104 83,94 83,74" fill="#3C9A5A" stroke="#2B6B48" stroke-width="2.5" stroke-linejoin="round" />
    <polygon points="65,92 81,101 81,121 65,131 49,121 49,101" fill="#3C9A5A" stroke="#2B6B48" stroke-width="2.5" stroke-linejoin="round" />
    <polygon points="135,92 151,101 151,121 135,131 119,121 119,101" fill="#3C9A5A" stroke="#2B6B48" stroke-width="2.5" stroke-linejoin="round" />
    <polygon points="100,67 114,75 114,92 100,100 86,92 86,75" fill="#4AA868" fill-opacity="0.35" />

    <!-- Sprout -->
    <path d="M 100 52 C 99 40 102 32 100 22" stroke="#488F38" stroke-width="3.5" stroke-linecap="round" fill="none" />
    <ellipse cx="94" cy="24" rx="7.5" ry="4" fill="#B5E08A" transform="rotate(-30 94 24)" />
    <ellipse cx="106" cy="24" rx="7.5" ry="4" fill="#B5E08A" transform="rotate(30 106 24)" />
    <path d="M 100 25 C 100 22 101 19 100 17" stroke="#D8F5A2" stroke-width="1.5" stroke-linecap="round" fill="none" />
  </g>
</svg>`;

// Write the SVG files
fs.writeFileSync(path.resolve('src/assets/kula-logo-mark.svg'), kulaLogoMarkSvg.trim());
fs.writeFileSync(path.resolve('public/favicon.svg'), faviconSvg.trim());
console.log('SVGs generated successfully!');

async function generatePngs() {
  const browser = await playwright.chromium.launch({
    executablePath: '/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell',
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  // 1. favicon-32x32.png
  await page.setViewportSize({ width: 32, height: 32 });
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent;">${faviconSvg}</body></html>`);
  await page.screenshot({ path: path.resolve('public/favicon-32x32.png'), type: 'png', omitBackground: true });
  console.log('Generated favicon-32x32.png');

  // 2. apple-touch-icon.png (180x180)
  await page.setViewportSize({ width: 180, height: 180 });
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:#FAF7F2;">
    <div style="width:180px;height:180px;display:flex;align-items:center;justify-content:center;background:#FAF7F2;">
      <div style="width:150px;height:150px;">
        ${kulaLogoMarkSvg}
      </div>
    </div>
  </body></html>`);
  await page.screenshot({ path: path.resolve('public/apple-touch-icon.png'), type: 'png' });
  console.log('Generated apple-touch-icon.png');

  // 3. pwa-192x192.png (purpose: any)
  await page.setViewportSize({ width: 192, height: 192 });
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:#FAF7F2;">
    <div style="width:192px;height:192px;display:flex;align-items:center;justify-content:center;background:#FAF7F2;">
      <div style="width:156px;height:156px;">
        ${kulaLogoMarkSvg}
      </div>
    </div>
  </body></html>`);
  await page.screenshot({ path: path.resolve('public/pwa-192x192.png'), type: 'png' });
  console.log('Generated pwa-192x192.png');

  // 4. pwa-512x512.png (purpose: any)
  await page.setViewportSize({ width: 512, height: 512 });
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:#FAF7F2;">
    <div style="width:512px;height:512px;display:flex;align-items:center;justify-content:center;background:#FAF7F2;">
      <div style="width:416px;height:416px;">
        ${kulaLogoMarkSvg}
      </div>
    </div>
  </body></html>`);
  await page.screenshot({ path: path.resolve('public/pwa-512x512.png'), type: 'png' });
  console.log('Generated pwa-512x512.png');

  // 5. pwa-maskable-512x512.png (purpose: maskable - central safe zone diameter ~80% = ~400px)
  await page.setViewportSize({ width: 512, height: 512 });
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:#FAF7F2;">
    <div style="width:512px;height:512px;display:flex;align-items:center;justify-content:center;background:#FAF7F2;">
      <!-- Content scaled to 70% to strictly guarantee the maskable safe zone (Android squircle/circle cutout) -->
      <div style="width:340px;height:340px;">
        ${kulaLogoMarkSvg}
      </div>
    </div>
  </body></html>`);
  await page.screenshot({ path: path.resolve('public/pwa-maskable-512x512.png'), type: 'png' });
  console.log('Generated pwa-maskable-512x512.png');

  await browser.close();
  console.log('All icons generated successfully!');
}

generatePngs().catch(err => {
  console.error('Error generating pngs:', err);
  process.exit(1);
});
