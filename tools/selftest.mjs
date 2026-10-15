/**
 * Self-test: runs the browser half against a fake ModuleLoader + DOM.
 *
 * It asserts the three things that would silently break the plugin in the real
 * shell: the registration id must equal the package name (the loader matches
 * them), the module face must expose `apply`/`inject`/`name`, and `apply` must
 * append exactly one style element carrying every selector the README promises —
 * and remove it again on dispose.
 *
 * Run: node tools/selftest.mjs   (or: npm test)
 */

import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const here = new URL('.', import.meta.url)
const read = name => readFileSync(new URL('../' + name, here), 'utf8')

// ── fake host ────────────────────────────────────────────────────────────────
const registrations = []
const appended = []
const fakeWindow = { __ModuleLoader__: { load: registration => registrations.push(registration) } }
const fakeDocument = {
  createElement: () => ({
    attrs: {},
    textContent: '',
    setAttribute(key, value) { this.attrs[key] = value },
    remove() { this.removed = true },
  }),
  head: { appendChild: node => appended.push(node) },
}

new Function('window', 'document', read('client.js'))(fakeWindow, fakeDocument)

// ── registration contract ────────────────────────────────────────────────────
const pkg = JSON.parse(read('package.json'))
assert.equal(registrations.length, 1, 'client.js must register exactly one module')
const registration = registrations[0]
assert.equal(registration.id, pkg.name, 'ModuleLoader id must equal the package name')
assert.equal(typeof registration.factory, 'function')

let required = []
const moduleFace = registration.factory(specifier => { required.push(specifier); throw new Error(specifier) })
assert.deepEqual(required, [], 'the browser half must not require external modules')
assert.equal(typeof moduleFace.apply, 'function', 'exports.apply is required by the shell')
assert.ok(Array.isArray(moduleFace.inject), 'exports.inject must be an array')
assert.equal(typeof moduleFace.name, 'string', 'exports.name must be a string')

// ── apply() injects one style, dispose removes it ─────────────────────────────
let dispose
moduleFace.apply({ effect: fn => { dispose = fn() } })
assert.equal(appended.length, 1, 'apply() must append exactly one style element')
const style = appended[0]
assert.equal(style.attrs['data-plugin'], pkg.name, 'the style must be tagged for debuggability')

// ── the CSS actually carries the promised overrides ──────────────────────────
const css = style.textContent
const SELECTORS = [
  '.ofm_glass', '.ofm_nav', '.ofm_toast', '.ofm_scrim',
  '.ofm_root .ofm_hero', '.ofm_root .ofm_panel', '.ofm_root .ofm_ann', '.ofm_root .ofm_modal',
  '.ofm_aurora',
]
for (const selector of SELECTORS) {
  assert.ok(css.includes(selector), `CSS must target ${selector}`)
}
for (const declaration of [
  'backdrop-filter: none !important',
  '-webkit-backdrop-filter: none !important',
  'var(--dsw-alias-bg-layer-2',
]) {
  assert.ok(css.includes(declaration), `CSS must carry "${declaration}"`)
}
assert.ok(css.includes('display: none !important'), 'the aurora must be hidden')
assert.ok(css.includes('data-ofm-aurora="keep"'), 'the aurora opt-out must be documented in CSS')

// ── the package declares the two halves the loader needs ────────────────────
assert.equal(typeof pkg.dsh.client.platform, 'string')
assert.equal(pkg.exports['./client'], './client.js')

dispose()
assert.equal(style.removed, true, 'dispose must remove the injected style')

console.log('dsha-ofm-fix selftest: ok')
