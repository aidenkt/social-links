// Pins the KT Accounts kit to an exact build: writes src/lib/kt-kit-pin.json with the hashed
// file names and SHA-384 from the kit manifest (same as the Garden's kit:pin).
//
//   npm run kit:pin                                                   https://accounts.aidenkt.com/kit/manifest.json
//   KT_KIT_MANIFEST=/path/to/kt-accounts/public/kit/manifest.json npm run kit:pin    a local kt-accounts build
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const KIT_ORIGIN = 'https://accounts.aidenkt.com'
const PIN = path.resolve(import.meta.dirname, '../src/lib/kt-kit-pin.json')
const FILE = { js: /^kit\.[0-9a-f]{10}\.js$/, css: /^kit\.[0-9a-f]{10}\.css$/ }
const SRI = /^sha384-[A-Za-z0-9+/]{64}$/

const src = process.env.KT_KIT_MANIFEST || `${KIT_ORIGIN}/kit/manifest.json`
const remote = /^https:\/\//.test(src)
const get = async (name) => {
  if (!remote) return fs.readFileSync(path.join(path.dirname(path.resolve(src)), name))
  const r = await fetch(new URL(name, src), { redirect: 'error' })
  if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`)
  return Buffer.from(await r.arrayBuffer())
}
const manifest = JSON.parse((await get(path.basename(remote ? new URL(src).pathname : src))).toString('utf8'))
if (manifest.dev !== false) throw new Error('development build of the kit; refusing to pin it')
const pin = {}
for (const k of ['js', 'css']) {
  const { file, integrity } = manifest[k] ?? {}
  if (!FILE[k].test(file ?? '') || !SRI.test(integrity ?? '')) throw new Error(`manifest: bad ${k} entry`)
  const actual = 'sha384-' + crypto.createHash('sha384').update(await get(file)).digest('base64')
  if (actual !== integrity) throw new Error(`${file}: SHA-384 does not match the manifest`)
  pin[k] = { file, integrity }
}
const js = (await get(pin.js.file)).toString('utf8')
if (!js.includes(pin.css.file)) throw new Error('the kit script does not load the pinned stylesheet')
if (!js.includes('supply')) throw new Error('this kit has no supplied-session mode; deploy KT Accounts first')
const before = fs.existsSync(PIN) ? fs.readFileSync(PIN, 'utf8') : ''
const after = JSON.stringify({ origin: KIT_ORIGIN, from: remote ? src : 'local build', ...pin }, null, 2) + '\n'
fs.writeFileSync(PIN, after)
console.log(`${before === after ? 'unchanged' : 'pinned'}: ${pin.js.file} ${pin.css.file}`)
