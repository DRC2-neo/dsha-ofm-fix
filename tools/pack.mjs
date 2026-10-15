/**
 * Reproducible release archive.
 *
 * Packages exactly the git-tracked files (no `.git`, no `node_modules`, no
 * stray scratch) into `dist/<name>-<version>.zip`, with one top-level directory
 * so the archive matches what the DSH plugin manager's `extract_archive` and
 * GitHub's "Download ZIP" both expect. Entry timestamps are pinned to the HEAD
 * commit time, so the same commit always yields the same bytes — and the same
 * SHA-256 to publish beside the release.
 *
 * Run: node tools/pack.mjs   (or: npm run pack)
 */

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import zlib from 'node:zlib'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim()

const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
const folder = pkg.name
const dist = path.join(root, 'dist')
mkdirSync(dist, { recursive: true })
const out = path.join(dist, `${pkg.name}-${pkg.version}.zip`)

const files = git('ls-files').split('\n').filter(Boolean).sort()
if (files.length === 0) throw new Error('no tracked files: commit before packing')
const status = git('status', '--porcelain')
if (status !== '') throw new Error('working tree is dirty — commit first:\n' + status)

// DOS date/time of the HEAD commit (ZIP stores local wall-clock fields).
const committed = new Date(git('log', '-1', '--format=%cI'))
const dosTime = ((committed.getHours() << 11) | (committed.getMinutes() << 5) | (committed.getSeconds() >> 1)) & 0xffff
const dosDate = (((committed.getFullYear() - 1980) << 9) | ((committed.getMonth() + 1) << 5) | committed.getDate()) & 0xffff

// ── minimal ZIP writer (deflate + CRC32, no dependencies) ────────────────────
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = buffer => {
  let c = 0xffffffff
  for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

const local = []
const central = []
let offset = 0
for (const rel of files) {
  const name = Buffer.from(`${folder}/${rel}`, 'utf8')
  const raw = readFileSync(path.join(root, rel))
  const deflated = zlib.deflateRawSync(raw, { level: 9 })
  const crc = crc32(raw)

  const header = Buffer.alloc(30)
  header.writeUInt32LE(0x04034b50, 0)
  header.writeUInt16LE(20, 4)          // version needed
  header.writeUInt16LE(0x0800, 6)      // UTF-8 names
  header.writeUInt16LE(8, 8)           // deflate
  header.writeUInt16LE(dosTime, 10)
  header.writeUInt16LE(dosDate, 12)
  header.writeUInt32LE(crc, 14)
  header.writeUInt32LE(deflated.length, 18)
  header.writeUInt32LE(raw.length, 22)
  header.writeUInt16LE(name.length, 26)
  header.writeUInt16LE(0, 28)          // no extra field
  local.push(header, name, deflated)

  const entry = Buffer.alloc(46)
  entry.writeUInt32LE(0x02014b50, 0)
  entry.writeUInt16LE(0x031e, 4)       // made by unix, 0644
  entry.writeUInt16LE(20, 6)
  entry.writeUInt16LE(0x0800, 8)
  entry.writeUInt16LE(8, 10)
  entry.writeUInt16LE(dosTime, 12)
  entry.writeUInt16LE(dosDate, 14)
  entry.writeUInt32LE(crc, 16)
  entry.writeUInt32LE(deflated.length, 20)
  entry.writeUInt32LE(raw.length, 24)
  entry.writeUInt16LE(name.length, 28)
  entry.writeUInt32LE(0, 30)           // extra + comment lengths
  entry.writeUInt32LE((0o100644 << 16) >>> 0, 36)
  entry.writeUInt32LE(offset, 42)
  central.push(entry, name)

  offset += header.length + name.length + deflated.length
}

const centralBuffer = Buffer.concat(central)
const end = Buffer.alloc(22)
end.writeUInt32LE(0x06054b50, 0)
end.writeUInt16LE(files.length, 8)
end.writeUInt16LE(files.length, 10)
end.writeUInt32LE(centralBuffer.length, 12)
end.writeUInt32LE(offset, 16)

const zip = Buffer.concat([...local, centralBuffer, end])
writeFileSync(out, zip)

const sha256 = createHash('sha256').update(zip).digest('hex')
console.log(`${out}\n  files   ${files.length}\n  bytes   ${zip.length}\n  sha256  ${sha256}`)
