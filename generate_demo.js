const fs = require('fs');
let content = fs.readFileSync('/Users/kido/md-preview/all-chart.md', 'utf8');

// Replacements
content = content.replace(/Organic Flow/gi, 'App Master');
content = content.replace(/OrganicFlow/gi, 'AppMaster');
content = content.replace(/SEO Marketer/gi, 'System Admin');
content = content.replace(/SEO Auto/gi, 'Task Worker');
content = content.replace(/TMProxy|Tinsoft Proxy/gi, 'Cloud API Service');
content = content.replace(/Proxy Provider/gi, 'Cloud Provider');
content = content.replace(/Proxy/gi, 'Service');
content = content.replace(/Playwright/gi, 'Engine');
content = content.replace(/Bypass Google Captcha|vượt Google Captcha/gi, 'Handle Auth');
content = content.replace(/CAPTCHA/gi, 'Auth');
content = content.replace(/Captcha/gi, 'Auth');
content = content.replace(/Bot Detection/gi, 'Security');

const jsContent = `const demo30ChartsMarkdown = \`${content.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;`;
fs.writeFileSync('/Users/kido/md-preview/demo-charts.js', jsContent);
