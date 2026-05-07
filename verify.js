const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:8080');
  
  const content = fs.readFileSync('all-chart.md', 'utf8');
  
  // Set content via playwright to the editor textarea
  await page.evaluate((md) => {
    document.querySelector('textarea.editor-textarea').value = md;
    document.querySelector('textarea.editor-textarea').dispatchEvent(new Event('input', { bubbles: true }));
  }, content);
  
  // Wait for rendering
  await page.waitForTimeout(2000);
  
  // Check for SVG elements in mermaid nodes
  const results = await page.evaluate(() => {
    const nodes = document.querySelectorAll('.mermaid');
    const status = [];
    nodes.forEach((node, i) => {
      const svg = node.querySelector('svg');
      const err = node.querySelector('.error-icon');
      status.push(`Diagram ${i+1}: ${svg ? 'OK' : 'FAILED'} ${err ? '- HAS ERROR' : ''}`);
    });
    return status;
  });
  
  console.log(results.join('\n'));
  await browser.close();
})();
