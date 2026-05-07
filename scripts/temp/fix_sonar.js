const fs = require('fs');

let content = fs.readFileSync('src/core/tabs.js', 'utf8');

// Clear elements
content = content.replace(/tabList\.innerHTML = '';/g, 'tabList.replaceChildren();');
content = content.replace(/mobileTabList\.innerHTML = '';/g, 'mobileTabList.replaceChildren();');

// Text content
content = content.replace(/menuBtn\.innerHTML = '&#8943;';/g, "menuBtn.textContent = '⋯';");
content = content.replace(/newBtn\.innerHTML = '<i class="bi bi-plus-lg"><\\/i>';/g, "newBtn.replaceChildren();\\n    const icon = document.createElement('i');\\n    icon.className = 'bi bi-plus-lg';\\n    newBtn.appendChild(icon);");

// HTML templating
content = content.replace(/dropdown\.innerHTML =\s*([\s\S]*?);/g, "dropdown.replaceChildren();\\n      dropdown.insertAdjacentHTML('beforeend', $1);");
content = content.replace(/groupSubContainer\.innerHTML = (buildGroupSubmenu\(tab\.groupId\));/g, "groupSubContainer.replaceChildren();\\n      groupSubContainer.insertAdjacentHTML('beforeend', $1);");
content = content.replace(/header\.innerHTML =\s*([\s\S]*?);/g, "header.replaceChildren();\\n      header.insertAdjacentHTML('beforeend', $1);");
content = content.replace(/menu\.innerHTML =\s*([\s\S]*?);/g, "menu.replaceChildren();\\n        menu.insertAdjacentHTML('beforeend', $1);");

// Sonar Cognitive Complexity issues might be raised if functions are too long.
// But without the exact error, fixing the HTML strings is the most common JavaScript Sonar smell.

fs.writeFileSync('src/core/tabs.js', content);
