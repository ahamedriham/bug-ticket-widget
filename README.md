# BugTicket — floating support widget

A single-file, dependency-free (Vue 3 is auto-loaded from cdnjs) support widget for any website or web app:

- **Floating button** — draggable, remembers its position, auto-fades when idle, badge, pulse ring.
- **Report an issue** by default — one click opens the report form. Optional panel menu with *Rate your experience*, *Send an idea* and your own items.
- **Bug reports** — screenshot an area / the page / the broken element, native screenshot, screen recording, paste/drop images, markup editor (box, arrow, pencil, text, blur, crop), file attachments.
- **Diagnostics** — console errors, failed/recent network requests, user action breadcrumbs, URL, viewport, browser, timezone, performance timings.
- **Delivery** — JSON or multipart POST with upload progress, or your own `onSubmit`. Drafts survive reloads.
- **Built-in English and Arabic (RTL)**, dark mode, keyboard accessible, Shadow-DOM isolated so your CSS and the widget never collide.

---

## 1. Install

### npm (Vite, webpack, Nuxt, Laravel Mix…)

```bash
npm i bug-ticket-widget vue
```

```js
import BugTicket from 'bug-ticket-widget';
BugTicket.init({ endpoint: '/api/feedback', brand: { name: 'onlingo' } });
```

Vue 3 is a peer dependency and is bundled by your build — nothing is fetched from a CDN. Not a Vue app? That's fine, Vue is used internally only (≈ 60 kB gzipped once).

**Vue 3 plugin / composable**

```js
import { createApp } from 'vue';
import { BugTicketPlugin } from 'bug-ticket-widget';
createApp(App).use(BugTicketPlugin, { endpoint: '/api/feedback' }).mount('#app');
// in components: this.$bugTicket.openBug()   or   const bt = useBugTicket(); bt.setReporter(user)
```

**React / Angular / Svelte / anything**

```js
import { init, setReporter, openBug } from 'bug-ticket-widget';
useEffect(() => { init({ endpoint: '/api/feedback' }); return () => destroy(); }, []);
```

**TypeScript** types ship with the package (`Options`, `Payload`, `MenuItem`, `BugTicketAPI`).

### `<script>` tag (no build step)

```html
<script src="https://cdn.jsdelivr.net/npm/bug-ticket-widget/dist/bug-ticket.umd.js"></script>
<script>BugTicket.init({ endpoint: '/api/feedback', brand: { name: 'onlingo' } });</script>
```

The UMD build uses `window.Vue` if your page already has it, otherwise loads Vue 3 from cdnjs on first init.

That is a complete setup: the floating button opens the bug report form directly. **Ctrl+Shift+B** opens and closes the panel (with only *Report an issue* enabled, that is the report form).

Want the full support menu (rate / ideas / report)? Enable the built-ins:

```js
BugTicket.init({ endpoint: '/api/feedback', brand: { name: 'onlingo' },
                 menu: [{ id: 'rate', show: true }, { id: 'idea', show: true }] });
```

Works with Laravel Blade, Vue, React, Angular, plain HTML — it only needs a `<body>`. For SPAs call `BugTicket.init()` once; call `BugTicket.destroy()` if you need to unmount.

**Requirements:** HTTPS (or `localhost`) for native screenshots and screen recording. Everything else works on HTTP.

---

## 2. What gets posted

Every submission is a JSON object with a `type`, so one endpoint can handle everything:

```jsonc
{
  "type": "bug",                       // "rating" | "feedback" | "bug" | your custom types
  "itemId": "bug",                     // menu item id
  "title": "Total is wrong after coupon",
  "severity": "Major",
  "area": "Checkout",
  "steps": "1. …", "expected": "…", "actual": "…",
  "rating": 4,                         // rating items only
  "text": "…",                         // rating / feedback items
  "screenshots": [{ "name": "area-capture.png", "caption": "", "width": 800, "height": 500, "dataUrl": "data:image/png;base64,…" }],
  "recordings":  [{ "name": "recording-….webm", "type": "video/webm", "size": 812331, "duration": 12, "dataUrl": "…" }],
  "attachments": [{ "name": "log.txt", "type": "text/plain", "size": 2048, "dataUrl": "…" }],
  "element": { "selector": "#pay-btn", "tag": "button", "text": "Pay", "html": "<button …>", "rect": {…}, "styles": {…} },
  "reporter": { "name": "Ahamed", "email": "a@x.com", "source": "app" },   // source: app | user | anonymous
  "context": {
    "url": "https://…", "referrer": "…", "title": "…", "timestamp": "2026-11-03T07:55:00Z", "timezone": "Asia/Riyadh",
    "userAgent": "…", "language": "en", "platform": "Win32", "online": true,
    "viewport": { "width": 1440, "height": 900, "dpr": 2, "scrollX": 0, "scrollY": 320 }, "screen": { "width": 2560, "height": 1440 },
    "connection": { "type": "4g", "downlink": 10 }, "memory": { "usedMB": 54 }, "performance": { "domContentLoaded": 812, "load": 1430 },
    "console":     [{ "t": 1762154100000, "level": "error", "msg": "TypeError: … (app.js:120)" }],
    "network":     [{ "t": …, "method": "POST", "url": "/api/pay", "status": 500, "ok": false, "ms": 220 }],
    "breadcrumbs": [{ "t": …, "type": "click", "target": "#pay-btn", "text": "Pay" }, { "t": …, "type": "navigate", "url": "…" }]
  },
  "meta": { "userId": 42, "tenant": "acme", "appVersion": "2.3.1" },   // whatever you pass in `meta`
  "plugin": "BugTicket/4.3.0"
}
```

### Multipart (recommended once screenshots/recordings are on)

```js
BugTicket.init({ endpoint: '/api/feedback', format: 'multipart' });
```

Fields: `ticket` (the JSON above without `dataUrl`s), `screenshots[]`, `recordings[]`, `attachments[]` as real files. Raise your server's upload limit (`post_max_size`, `upload_max_filesize`, nginx `client_max_body_size`) — a 60 s recording is 3–10 MB.

### Response

Return JSON. `id` (or `ticketId` / `key`) and `url` (or `link`) are shown on the success screen; map anything else with `successLink: res => res.data.permalink`.

### Laravel example

```php
Route::post('/api/feedback', function (Request $r) {
    $ticket = $r->isJson() ? $r->all() : json_decode($r->input('ticket'), true);
    $t = Feedback::create([
        'type' => $ticket['type'], 'title' => $ticket['title'] ?? null, 'severity' => $ticket['severity'] ?? null,
        'rating' => $ticket['rating'] ?? null, 'text' => $ticket['text'] ?? $ticket['steps'] ?? null,
        'reporter' => $ticket['reporter'], 'context' => $ticket['context'], 'meta' => $ticket['meta'],
        'user_id' => $r->user()?->id,
    ]);
    foreach ($r->file('screenshots', []) as $f) $t->files()->create(['path' => $f->store("feedback/{$t->id}"), 'kind' => 'screenshot']);
    foreach ($r->file('recordings', [])  as $f) $t->files()->create(['path' => $f->store("feedback/{$t->id}"), 'kind' => 'recording']);
    return ['id' => "SUP-{$t->id}", 'url' => route('feedback.show', $t)];
});
```

---

## 3. Options

All options are optional. Nested objects are merged with the defaults, so you only pass what you change.

### Delivery

| Option | Default | Description |
|---|---|---|
| `endpoint` | `null` | URL to POST to. |
| `headers` | `{}` | Extra request headers (auth, CSRF). |
| `format` | `'json'` | `'json'` or `'multipart'`. |
| `onSubmit(payload, item)` | — | Called instead of / before `endpoint`. May return the response object. |
| `onSuccess(res, payload)` / `onError(err, payload)` | — | Hooks. |
| `successLink(res)` | — | Return a URL for the success screen. |
| `meta` | `null` | Object or function → merged into every payload. |

### Reporter (who is sending)

| Option | Default | Description |
|---|---|---|
| `reporter` | `null` | `{ name, email, editable:false }` or a function. Shown as "Reporting as …". `editable:true` adds a *Change* link. |
| `fields.reporter` | `'auto'` | `'auto'` = ask only when no reporter is passed · `true` = always show inputs · `false` = never. |
| `rememberReporter` | `true` | Name/email the user typed are remembered on the device. |

### Look & feel

| Option | Default | Description |
|---|---|---|
| `theme.primary` | `'#4F46E5'` | Brand colour. Hover, ring and soft tints are derived. |
| `theme.primaryHover` | derived | Override the hover colour. |
| `theme.radius` | `'16px'` | Corner radius for panel, modal, fields. |
| `theme.font` | `'Inter'` | Google Font name, auto-loaded (`theme.loadFont:false` to skip). |
| `theme.mode` | `'auto'` | `'auto'` follows `<html class="dark">` or OS · `'light'` · `'dark'`. |
| `theme.tokens` | `{}` | Any `--bt-*` CSS variable, e.g. `{ '--bt-panel-bg': '#101828', '--bt-z': 9999 }`. |
| `brand.name` | `'Support'` | Header title. |
| `brand.logo` | dot logo | URL, inline SVG/HTML, or `false`. |
| `brand.tagline` | — | Small text under the name. |
| `button.icon` | help icon | SVG/HTML/URL. |
| `button.label` | `'Support'` | Slides out on hover; `false` hides it. |
| `button.size` | `56` | Diameter in px. |
| `button.pulse` | `true` | Pulse ring animation. |
| `button.badge` | `null` | Number/text badge, cleared on open. |
| `button.draggable` | `true` | Drag anywhere; `rememberPosition:true` persists it. |
| `button.autoHide` / `autoHideDelay` | `true` / `3000` | Fade after inactivity. |
| `button.position` | `'bottom-right'` | Also `bottom-left`, `top-right`, `top-left`; `button.offset` = px from the edges. |
| `button.hidden` | `false` | No floating button; open the panel from your own UI with `BugTicket.open({ anchor: el })` / `toggle({ anchor: el })`. Without an anchor it opens at `button.position`. |
| `icons` | `{}` | Override built-in SVGs: `star, idea, bug, link, help, close, back, check, area, page, element, record, native, upload, attach`. |
| `stylesheets` | `[]` | Stylesheets loaded *inside* the widget, e.g. Font Awesome so `icon: '<i class="fa-solid fa-headset"></i>'` works. |
| `css` | `''` | Extra CSS scoped to the widget. Stable class names: `.bt-fab .bt-panel .bt-head .bt-item .bt-sheet .bt-modal .bt-field .bt-btn …` |

Available tokens: `--bt-primary --bt-primary-hover --bt-primary-ink --bt-primary-soft --bt-ring --bt-radius --bt-font --bt-bg --bt-panel-bg --bt-ink --bt-muted --bt-line --bt-field-bg --bt-danger --bt-ok --bt-shadow --bt-z --bt-size`.

### Menu

Three built-ins exist by id: **`rate`** (rating), **`idea`** (feedback), **`bug`** (bug report). **By default only `bug` is visible, so clicking the button opens the report form directly — no menu.** Enable the others with `show: true` and the panel menu appears. Pass `menu` to enable, override, reorder or add. Built-ins you don't mention are appended with their defaults (`menuDefaults:false` drops them).

```js
menu: [
  { id: 'rate', show: true },                                               // enable a hidden built-in
  { id: 'idea', show: true, title: 'Vote on new features' },                // enable + override
  { id: 'bug',  title: 'Something broke?', subtitle: 'We fix it fast' },    // override any field
  { id: 'help', type: 'link', title: 'Help centre', url: 'https://…' },     // add a link
  { id: 'chat', type: 'custom', title: 'Live chat', icon: '💬',
    onClick: (api, item) => Intercom('show'), show: () => user.isPro },     // add an action, conditional
  { id: 'nps',  type: 'rating', title: 'How likely are you to recommend us?', endpoint: '/api/nps' },
]
```

Item fields: `id, type ('rating'|'feedback'|'bug'|'link'|'custom'), title, subtitle, icon, show (bool | fn), url, target, onClick, endpoint, onSubmit, placeholder, titleField, submitLabel`.

`skipMenuWhenSingle` (default `true`): if only one item is visible, the button opens it directly.

### Bug report

| Option | Default | Description |
|---|---|---|
| `severities` | `['Blocker','Major','Minor','Trivial']` | Segmented control values. |
| `fields` | `{ area:true, expected:true, actual:true, attachments:true }` | Hide fields with `false`. |
| `capture` | `{ page, area, native, element, record }` all `true` | Capture methods offered. |
| `record` | `{ maxSeconds:60, mic:false, mimeType:null }` | Recording limits. `mic` is the starting state of the *Include microphone* checkbox the user sees. |
| `diagnostics` | `{ console:true, network:true, breadcrumbs:true, storage:false }` | What is collected (`storage` = localStorage/sessionStorage *key names* only). |
| `maxImageWidth` / `imageFormat` / `imageQuality` | `1600` / `'png'` / `0.9` | Screenshots larger than this are downscaled. |
| `saveDraft` | `true` | Text fields survive a reload. |
| `suggestTitle` | `true` | Prefill the title from a console error that happened in the last minute. |

### Misc

`locale` (`'en'` \| `'ar'`), `labels` (override any string, see the `I18N` table at the top of the file), `dir` (`'auto'|'ltr'|'rtl'`), `hotkey` (`'ctrl+shift+b'` or `false`; toggles the panel), `vueUrl`, `html2canvas` (the function — `import html2canvas from 'html2canvas'`; no CDN download) and `html2canvasUrl` (fallback script URL, default cdnjs).

---

## 4. Runtime API

```js
BugTicket.open()            // open the panel      BugTicket.open('bug')  // open a specific item
BugTicket.openBug()         // bug form directly   BugTicket.close()  BugTicket.toggle()
BugTicket.capture('area' | 'page' | 'element' | 'native')
BugTicket.record()  BugTicket.stopRecording()
BugTicket.setBadge(3)                 // null to clear
BugTicket.setReporter({ name, email })  // after login; null after logout
BugTicket.setMeta({ tenant: 'acme' })   // merged into payloads
BugTicket.setTheme({ primary: '#0f766e', radius: '8px', css: '.bt-fab{border-radius:12px}' })
BugTicket.getMenu()  addMenuItem(item, index)  updateMenuItem(id, patch)  removeMenuItem(id)  showMenuItem(id, bool)
BugTicket.resetPosition()  BugTicket.getContext()  BugTicket.destroy()

const off = BugTicket.on('success', (res, payload) => analytics.track('feedback', payload.type));
// events: open, close, submit, progress, success, error, screenshot, recording, drag
```

---

## 5. Recipes

**Logged-in app, locked identity**
```js
BugTicket.init({ endpoint: '/api/feedback', headers: { 'X-CSRF-TOKEN': csrf }, reporter: { name: user.name, email: user.email }, meta: () => ({ userId: user.id, route: router.currentRoute.value.name }) });
```

**Public marketing site** — omit `reporter`; the form asks for name/email and remembers them.

**No floating button, your own trigger**
```js
BugTicket.init({ endpoint: '/api/bugs', button: { hidden: true } });
document.querySelector('#report').onclick = () => BugTicket.openBug();
```

**Match an existing design system**
```js
BugTicket.init({ theme: { primary: '#0F766E', radius: '10px', font: 'Poppins', tokens: { '--bt-panel-bg': '#0B1220', '--bt-ink': '#E6EDF3', '--bt-line': '#1F2A3A' }, mode: 'dark' } });
```

**Font Awesome icons**
```js
BugTicket.init({ stylesheets: ['https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'],
  icons: { bug: '<i class="fa-solid fa-bug"></i>', star: '<i class="fa-regular fa-star"></i>', idea: '<i class="fa-regular fa-comment-dots"></i>' } });
```

**Send to Jira / GitHub via your backend** — post to your API with `format:'multipart'`, create the issue server-side, return `{ id: 'PROJ-123', url: issueUrl }`.

---

## 6. Behaviour notes

- Shadow DOM: your global CSS cannot style the widget by accident; use `theme`, `tokens`, `css`.
- Diagnostics wrap `console.error/warn`, `fetch`, `XMLHttpRequest` and `history.pushState` once per page; originals are still called. Disable any of them with `diagnostics: { … : false }`.
- Screenshots of the page use html2canvas (loaded on first use): cross-origin images without CORS headers render blank — offer *Native screenshot* for pixel-exact captures (requires a user gesture and HTTPS).
- Screen recording needs `getDisplayMedia` + `MediaRecorder` (Chrome, Edge, Firefox, Safari 14.1+; not in most WebViews). Output is WebM, or MP4 where WebM is unsupported.
- Keyboard: Esc backs out one layer at a time; in the editor B/A/P/T/U/C switch tools, Ctrl+Z undo, Enter done.
- Privacy: users can blur sensitive areas before sending; the widget never sends anything until the user presses Send.

### Content-Security-Policy

With the npm build and `html2canvas` passed as a function, the widget needs no third-party origin:

| Directive | Needed for |
|---|---|
| `img-src data: blob:` | Screenshots, thumbnails, the markup editor |
| `media-src blob:` | Previewing a screen recording |
| `style-src 'unsafe-inline'` | The widget's own `<style>` elements inside its Shadow DOM |
| `connect-src <your endpoint>` | Sending reports (when you use `endpoint`) |
| `script-src <html2canvas origin>` | Only if you use `html2canvasUrl` instead of `html2canvas` |
| `script-src cdnjs.cloudflare.com` | Only for the `<script>` (UMD) build when the page has no `window.Vue` (or set `vueUrl` to your own copy) |
| `font-src` / `style-src fonts.googleapis.com, fonts.gstatic.com` | Only with `theme.loadFont: true` (default) |

`Permissions-Policy`: `display-capture` for *Native screenshot* and recording, `microphone` for recordings with sound.

### Opening the panel from your own button

```js
BugTicket.init({ endpoint: '/api/feedback', button: { hidden: true } });
document.querySelector('#help').addEventListener('click', (e) => BugTicket.toggle({ anchor: e.currentTarget }));
```

---

## 7. Package layout

```
dist/bug-ticket.esm.js   ESM  (import … from 'bug-ticket-widget')      vue external
dist/bug-ticket.cjs      CJS  (require('bug-ticket-widget'))           vue external
dist/bug-ticket.umd.js   IIFE for <script>, exposes window.BugTicket    loads Vue from cdnjs if absent
src/core.js              the widget; accepts { vue } injection
src/index.js             npm entry + BugTicketPlugin / useBugTicket
types/index.d.ts         TypeScript definitions
```

`npm run build` (esbuild) regenerates `dist/`. It compiles the widget template into a render function, so the npm builds run on Vue's runtime-only build (what Vite / webpack / Nuxt give you) and never need `unsafe-eval`. Self-hosting html2canvas: pass `html2canvas` (the function) or `html2canvasUrl`.

## 8. Changelog

**1.1.0**
- All builds ship a precompiled render function: the widget now renders in Vite / webpack / Nuxt apps (Vue runtime-only build) and needs no `unsafe-eval`.
- The npm entry imports only the Vue functions it uses, so your bundler can still drop the rest.
- The panel has its own z-index, so app layouts with positioned, z-indexed elements no longer cover it.
- `button.hidden: true` keeps the panel: open it with `open({ anchor })` / `toggle({ anchor })`, or at `button.position`.
- New `html2canvas` option (pass the function) — no CDN download, works under a strict CSP.
- *Include microphone* checkbox next to *Record the screen*; a message when the microphone is refused.
- The success message mentions screenshots only when some were sent.
- README: Ctrl+Shift+B toggles the panel; Content-Security-Policy section.

## 9. Publishing

From GitHub (recommended): add the repository secret `NPM_TOKEN` (an npm granular access token with
read and write access to `bug-ticket-widget`), bump `version` in `package.json`, then create a GitHub
Release tagged `vX.Y.Z` with the same version. The *Publish to npm* workflow builds and publishes it
with provenance.

From your machine:

```bash
npm version patch && npm publish --access public
```
`prepublishOnly` builds `dist/` automatically.
