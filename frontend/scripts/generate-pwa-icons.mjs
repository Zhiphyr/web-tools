import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(root, '..', 'public')
const svg = readFileSync(path.join(publicDir, 'favicon.svg'))

const BG = '#facc15'

async function plain(size, outName) {
  await sharp(svg).resize(size, size).png().toFile(path.join(publicDir, outName))
}

// Maskable icons get cropped to a circle/rounded-square by the OS, so the
// artwork needs to sit inside a safe zone (~80% of the canvas) with solid
// background padding around it.
async function maskable(size, outName) {
  const artSize = Math.round(size * 0.7)
  const art = await sharp(svg).resize(artSize, artSize).png().toBuffer()
  await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: art, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, outName))
}

await plain(192, 'pwa-192x192.png')
await plain(512, 'pwa-512x512.png')
await plain(180, 'apple-touch-icon.png')
await maskable(512, 'pwa-maskable-512x512.png')

console.log('PWA icons generated in public/')
