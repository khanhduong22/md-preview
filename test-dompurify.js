const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const purify = DOMPurify(window);
const html = '<div class="mxgraph" data-mxgraph="{\\"hello\\":\\"world\\"}"></div>';
console.log(purify.sanitize(html, { ADD_ATTR: ['data-mxgraph'] }));
