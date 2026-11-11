// Builds dist/ with esbuild.
//
// The widget template (src/core.js `TEMPLATE`) is compiled here into a render
// function, so the published builds work on Vue's runtime-only build — the one
// Vite, webpack and Nuxt give an app — and need no `unsafe-eval` in a CSP.
// src/core.js stays readable (it keeps the template string and still works
// unbuilt on a full Vue build, e.g. the global build from a CDN).
//
// The npm entry (src/index.js) gets explicit named imports from 'vue' (only
// what the core and the compiled render use) instead of `import * as Vue`,
// so the host app's bundler can still drop unused Vue code.
import { readFile, rm } from 'node:fs/promises';
import { build } from 'esbuild';
import { compile } from '@vue/compiler-dom';

const banner = { js: '/*! bug-ticket-widget — MIT */' };

const coreSrc = await readFile(new URL('./src/core.js', import.meta.url), 'utf8');
const m = /const TEMPLATE = `([\s\S]*?)`;\n/.exec(coreSrc);
if (!m) throw new Error('TEMPLATE not found in src/core.js');
if (m[1].includes('${')) throw new Error('TEMPLATE must not contain ${} interpolations');

const { code: renderCode } = compile(m[1], {
  mode: 'function',
  prefixIdentifiers: true,
  hoistStatic: true,
  cacheHandlers: true,
  onError: (e) => {
    throw e;
  },
});
// "const { a: _a, b: _b } = Vue" → the Vue functions the render needs.
const helperLine = /^const \{ ([^}]*) \} = Vue$/m.exec(renderCode);
const renderHelpers = helperLine ? helperLine[1].split(',').map((p) => p.split(':')[0].trim()) : [];
const coreHelpers = ['createApp', 'reactive', 'ref', 'computed', 'nextTick', 'watch', 'onMounted', 'onBeforeUnmount'];
const vueNames = [...new Set([...coreHelpers, ...renderHelpers])].sort();

const makeRender = `\nfunction __btMakeRender(Vue) {\n${renderCode}\n}\n`;

/** Swap the runtime template for the precompiled render, and `import *` for named imports. */
const precompile = {
  name: 'bt-precompile',
  setup(b) {
    b.onLoad({ filter: /src[\\/]core\.js$/ }, async () => {
      let src = coreSrc;
      if (!src.includes('template: TEMPLATE,')) throw new Error('`template: TEMPLATE,` not found');
      src = src.replace('template: TEMPLATE,', 'render: __btMakeRender(V),');
      src = src.replace(m[0], 'const TEMPLATE = null;\n');
      return { contents: src + makeRender, loader: 'js' };
    });
    b.onLoad({ filter: /src[\\/]index\.js$/ }, async (args) => {
      let src = await readFile(args.path, 'utf8');
      const star = "import * as Vue from 'vue';";
      if (!src.includes(star)) throw new Error('index.js: Vue import not found');
      src = src.replace(star, `import { ${vueNames.join(', ')} } from 'vue';\nconst Vue = { ${vueNames.join(', ')} };`);
      return { contents: src, loader: 'js', resolveDir: new URL('./src/', import.meta.url).pathname };
    });
  },
};

await rm(new URL('./dist', import.meta.url), { recursive: true, force: true });

const common = { bundle: true, banner, plugins: [precompile], target: ['es2020'], legalComments: 'none', logLevel: 'info' };

await Promise.all([
  build({ ...common, entryPoints: ['src/index.js'], format: 'esm', outfile: 'dist/bug-ticket.esm.js', external: ['vue'] }),
  build({ ...common, entryPoints: ['src/index.js'], format: 'cjs', outfile: 'dist/bug-ticket.cjs', external: ['vue'] }),
  build({ ...common, entryPoints: ['src/umd.js'], format: 'iife', outfile: 'dist/bug-ticket.umd.js', minify: true }),
]);

console.log(`render helpers: ${renderHelpers.length}, vue imports: ${vueNames.length}`);
