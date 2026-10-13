import { defineConfig } from 'vite';

function inlineCssPlugin() {
  return {
    name: 'inline-css-plugin',
    enforce: 'post',
    apply: 'build',
    transformIndexHtml(html, { bundle }) {
      if (!bundle) return html;
      let css = '';
      for (const [key, chunk] of Object.entries(bundle)) {
        if (key.endsWith('.css') && chunk.type === 'asset') {
          css += chunk.source + '\n';
        }
      }
      if (css) {
        // Strip the render-blocking stylesheet link for styles.css from the generated HTML
        html = html.replace(/<link[^>]+rel="stylesheet"[^>]+styles\.css[^>]*>/, '');
        // Inject inline style into <head>
        html = html.replace('</head>', `<style>${css}</style></head>`);
      }
      return html;
    }
  };
}

export default defineConfig({
  plugins: [inlineCssPlugin()],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'script.js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) return 'styles.css';
          return 'assets/[name]-[hash][extname]';
        },
      }
    }
  }
});

