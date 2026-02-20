const fs = require('fs');
const file = process.argv[2];
const newKeys = JSON.parse(process.argv[3]);
const content = JSON.parse(fs.readFileSync(file, 'utf8'));
Object.assign(content, newKeys);
fs.writeFileSync(file, JSON.stringify(content, null, 2));
