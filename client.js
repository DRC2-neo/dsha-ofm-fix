/**
 * dsha-ofm-fix — browser half.
 *
 * One `<style>` element, appended to `document.head` and removed again when the
 * plugin is disposed. No component is replaced, no module of the target plugin
 * is read, and nothing is written to disk: the whole plugin is a CSS overlay
 * that outranks the target's own rules with `!important`.
 *
 * Target: the settings surface of `dsh-our-free-model` (its classes are prefixed
 * `ofm_`). Upstream changes a class name, this file changes one selector.
 *
 * The scroll-phase rewrite — what actually turns a frosted surface solid:
 *   backdrop-filter: none        the blur, which *is* the frosted effect
 *   background: layer-2          the theme's opaque surface colour, so the
 *                                card no longer depends on what is behind it
 *   .ofm_aurora display:none     the fixed colour blobs the blur used to sample;
 *                                without the blur they only tint text
 */

const CSS = `
/* ── dsha-ofm-fix ──────────────────────────────────────────────────────
   毛玻璃表面 → 实底。上游若改类名，改这里的选择器即可。 */
.ofm_glass,
.ofm_nav,
.ofm_toast,
.ofm_root .ofm_hero,
.ofm_root .ofm_panel,
.ofm_root .ofm_ann,
.ofm_root .ofm_modal {
  -webkit-backdrop-filter: none !important;
  backdrop-filter: none !important;
  background: var(--dsw-alias-bg-layer-2, #fff) !important;
}

/* 弹窗遮罩本来就该是半透明压暗：只去模糊，保留调色与压暗。 */
.ofm_scrim {
  -webkit-backdrop-filter: none !important;
  backdrop-filter: none !important;
}

/* 背景光晕：毛玻璃关掉后它只是让文字发花，默认一起收掉。
   想留着的话，在 <html> 上加 data-ofm-aurora="keep"。 */
.ofm_aurora { display: none !important; }
html[data-ofm-aurora="keep"] .ofm_aurora { display: block !important; }
`

function apply(ctx) {
  ctx.effect(() => {
    const style = document.createElement('style')
    style.setAttribute('data-plugin', 'dsha-ofm-fix')
    style.textContent = CSS
    document.head.appendChild(style)
    return () => style.remove()
  }, 'dsha-ofm-fix: styles')
}

window.__ModuleLoader__.load({
  id: 'dsha-ofm-fix',
  factory: require => {
    const module = { exports: {} }
    const exports = module.exports

    exports.apply = apply
    exports.inject = []
    exports.name = 'dsha-ofm-fix'

    return module.exports
  },
})
