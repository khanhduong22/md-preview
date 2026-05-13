const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  await page.goto('http://localhost:5055');
  await page.waitForTimeout(2000);
  
  const plantumlType = await page.evaluate(() => typeof window.plantumlEncoder);
  console.log('window.plantumlEncoder type:', plantumlType);
  
  await page.type('#markdown-editor', '```plantuml\n@startuml\nA -> B\n@enduml\n```');
  await page.waitForTimeout(2000);
  
  const html = await page.evaluate(() => document.getElementById('markdown-preview').innerHTML);
  console.log('Preview HTML:', html);
  
  await browser.close();
})();
