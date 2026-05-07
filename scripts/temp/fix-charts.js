const fs = require('fs');

let content = fs.readFileSync('all-chart.md', 'utf8');

// Fix Requirement Diagram
content = content.replace(/CORE_REQ contains CAPTCHA_REQ/g, "CORE_REQ - contains -> CAPTCHA_REQ");
content = content.replace(/CORE_REQ contains GA4_REQ/g, "CORE_REQ - contains -> GA4_REQ");
content = content.replace(/CORE_REQ contains PROXY_REQ/g, "CORE_REQ - contains -> PROXY_REQ");

// Fix C4Dynamic ContainerExt
content = content.replace(/ContainerExt\(/g, "Container_Ext(");

fs.writeFileSync('all-chart.md', content);
