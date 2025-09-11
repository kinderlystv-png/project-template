const fs = require('fs');
const content = fs.readFileSync('data/data.js', 'utf8');
const matches = content.match(/"name":/g);
console.log('Количество компонентов:', matches ? matches.length : 0);
