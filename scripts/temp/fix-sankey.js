const fs = require('fs');
let content = fs.readFileSync('all-chart.md', 'utf8');

// Use regex to quote sankey data
// e.g. Khởi tạo Profile, Proxy Mạng, 10000 -> "Khởi tạo Profile", "Proxy Mạng", 10000
content = content.replace(/sankey-beta\n([\s\S]*?)```/g, (match, body) => {
    let newBody = body.split('\n').map(line => {
        let parts = line.split(',');
        if (parts.length >= 3) {
            let val = parts.pop().trim();
            let p2 = parts.pop().trim();
            let p1 = parts.join(',').trim(); // in case there are other commas
            // Only quote if not already quoted
            if (!p1.startsWith('"')) p1 = `"${p1}"`;
            if (!p2.startsWith('"')) p2 = `"${p2}"`;
            return `    ${p1}, ${p2}, ${val}`;
        }
        return line;
    }).join('\n');
    return `sankey-beta\n${newBody}\`\`\``;
});

fs.writeFileSync('all-chart.md', content);
