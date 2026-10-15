/**
 * dsha-ofm-fix — Host half.
 *
 * Deliberately empty. Every effect this plugin has lives in the browser half
 * (`client.js`), which appends one `<style>` element and removes it again on
 * dispose. It patches no file and touches no service, so it cannot break
 * dsh-our-free-model by being installed, updated, or removed.
 *
 * The row still has to exist: `dsh.client` binds the browser half to the bundle
 * row whose `name` is the bare package name (see ./cordis.patch.yml).
 */

export const name = 'dsha-ofm-fix'

/** No services are read; declaring none keeps the row free of ordering. */
export const inject = []

export function apply() {
  // Intentionally empty — see the module comment.
}
