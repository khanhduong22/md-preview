import fs from 'fs';
import path from 'path';
import https from 'https';

const vendorDir = path.resolve('public/vendor');

const filesToDownload = [
  // CSS
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css', dest: 'bootstrap.min.css' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.3.0/github-markdown.min.css', dest: 'github-markdown.min.css' },
  { url: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css', dest: 'bootstrap-icons.min.css' },
  { url: 'https://cdn.jsdelivr.net/npm/emoji-toolkit@9.0.1/extras/css/joypixels.min.css', dest: 'joypixels.min.css' },
  { url: 'https://cdn.jsdelivr.net/npm/driver.js@1.3.1/dist/driver.css', dest: 'driver.css' },

  // Fonts
  { url: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/fonts/bootstrap-icons.woff2', dest: 'fonts/bootstrap-icons.woff2' },
  { url: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/fonts/bootstrap-icons.woff', dest: 'fonts/bootstrap-icons.woff' },

  // JS
  { url: 'https://cdn.jsdelivr.net/npm/plantuml-encoder@1.4.0/dist/plantuml-encoder.min.js', dest: 'plantuml-encoder.min.js' },
  { url: 'https://viewer.diagrams.net/js/viewer-static.min.js', dest: 'viewer-static.min.js' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.6/marked.min.js', dest: 'marked.min.js' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js', dest: 'highlight.min.js' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.9/purify.min.js', dest: 'purify.min.js' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js', dest: 'FileSaver.min.js' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js', dest: 'html2pdf.bundle.min.js' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-mml-chtml.min.js', dest: 'tex-mml-chtml.min.js' },
  { url: 'https://cdn.jsdelivr.net/npm/mermaid@latest/dist/mermaid.min.js', dest: 'mermaid.min.js' },
  { url: 'https://cdn.jsdelivr.net/npm/emoji-toolkit@9.0.1/lib/js/joypixels.min.js', dest: 'joypixels.min.js' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', dest: 'jspdf.umd.min.js' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', dest: 'html2canvas.min.js' },
  { url: 'https://cdn.jsdelivr.net/npm/driver.js@1.3.1/dist/driver.js.iife.js', dest: 'driver.js.iife.js' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js', dest: 'pdfmake.min.js' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js', dest: 'vfs_fonts.js' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js', dest: 'pako.min.js' },
  { url: 'https://unpkg.com/panzoom@9.4.3/dist/panzoom.min.js', dest: 'panzoom.min.js' },
  { url: 'https://unpkg.com/diff@5.2.0/dist/diff.min.js', dest: 'diff.min.js' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/localforage/1.10.0/localforage.min.js', dest: 'localforage.min.js' },
  { url: 'https://cdn.jsdelivr.net/npm/minisearch@6.3.0/dist/umd/index.min.js', dest: 'minisearch.min.js' },
];

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    
    function get(requestUrl) {
      https.get(requestUrl, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          // Follow redirect
          get(response.headers.location);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to get '${requestUrl}' (${response.statusCode})`));
          return;
        }

        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      }).on('error', (err) => {
        fs.unlink(destPath, () => reject(err));
      });
    }

    get(url);
  });
}

async function main() {
  console.log('Starting downloading of CDN dependencies...');
  
  if (!fs.existsSync(vendorDir)) {
    fs.mkdirSync(vendorDir, { recursive: true });
  }
  
  const fontsDir = path.join(vendorDir, 'fonts');
  if (!fs.existsSync(fontsDir)) {
    fs.mkdirSync(fontsDir, { recursive: true });
  }

  for (const item of filesToDownload) {
    const destPath = path.join(vendorDir, item.dest);
    console.log(`Downloading: ${item.url} -> public/vendor/${item.dest}`);
    try {
      await downloadFile(item.url, destPath);
    } catch (err) {
      console.error(`Error downloading ${item.url}:`, err);
      process.exit(1);
    }
  }

  console.log('Successfully downloaded all vendor files.');
}

main();
