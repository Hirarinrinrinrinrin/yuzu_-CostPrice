import sharp from 'sharp';
import { join } from 'path';

const sourceIcon = 'C:/Users/thewi/.gemini/antigravity/brain/a165e2a1-3548-40a4-b6b6-1f1f491a7895/pwa_icon_1772178814390.png';

const sizes = [192, 512];

for (const size of sizes) {
    await sharp(sourceIcon)
        .resize(size, size)
        .png()
        .toFile(join('public', `pwa-${size}.png`));
    console.log(`Generated pwa-${size}.png`);
}

// Apple touch icon
await sharp(sourceIcon)
    .resize(180, 180)
    .png()
    .toFile(join('public', 'apple-touch-icon.png'));
console.log('Generated apple-touch-icon.png');
