const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  await page.goto('http://localhost:5055');
  await page.waitForTimeout(1000);
  
  const plantumlType = await page.evaluate(() => typeof window.plantumlEncoder);
  console.log('window.plantumlEncoder type:', plantumlType);
  
  if (plantumlType === 'object') {
     const encodeType = await page.evaluate(() => typeof window.plantumlEncoder.encode);
     console.log('window.plantumlEncoder.encode type:', encodeType);
  }

  await page.fill('#markdown-editor', '```plantuml\n@startuml\nA -> B\n@enduml\n```');
  await page.waitForTimeout(1000);
  
  const html = await page.evaluate(() => document.getElementById('markdown-preview').innerHTML);
  console.log('Preview HTML:', html);
  
  await browser.close();
})();
