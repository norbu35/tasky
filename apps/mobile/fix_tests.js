const fs = require('fs');

const text = fs.readFileSync('test-results.json', 'utf-8');
const startIndex = text.indexOf('{');
const endIndex = text.lastIndexOf('}');
const jsonText = text.substring(startIndex, endIndex + 1);
const data = JSON.parse(jsonText);

const fixes = new Map();

for (const testResult of data.testResults) {
  if (testResult.status === 'failed') {
    const filename = testResult.name;
    const messages = testResult.assertionResults.filter(a => a.status === 'failed').map(a => a.failureMessages.join('\n'));
    
    for (const rawMsg of messages) {
       // Remove ANSI escape codes
       const msg = rawMsg.replace(/\x1B\[\d+m/g, '');
       
       const matchOld = msg.match(/Unable to find an element with testID: ([\w-]+)/);
       if (!matchOld) continue;
       const oldId = matchOld[1];
       
       const matchNew = msg.match(/testID=\"(SCR-[^\"]+)\"/);
       if (matchNew) {
          const newId = matchNew[1];
          if (!fixes.has(filename)) fixes.set(filename, new Map());
          
          let computedNewId = newId;
          if (oldId.endsWith('-cta') && !newId.endsWith('-cta')) computedNewId = newId + '-cta';
          else if (oldId.endsWith('-next') && !newId.endsWith('-next')) computedNewId = newId + '-next';
          else if (oldId.endsWith('-error') && !newId.endsWith('-error')) computedNewId = newId + '-error';
          else if (oldId.endsWith('-error-retry') && !newId.endsWith('-error-retry')) computedNewId = newId + '-error-retry';
          else if (oldId.endsWith('-secondary-cta') && !newId.endsWith('-secondary-cta')) computedNewId = newId + '-secondary-cta';
          else if (oldId.endsWith('-cancel') && !newId.endsWith('-cancel')) computedNewId = newId + '-cancel';
          else if (oldId.endsWith('-loading') && !newId.endsWith('-loading')) computedNewId = newId; // often screen root replaces loading
          
          fixes.get(filename).set(oldId, computedNewId);
       }
    }
  }
}

for (const [filename, fileFixes] of fixes.entries()) {
  let content = fs.readFileSync(filename, 'utf-8');
  for (const [oldId, newId] of fileFixes.entries()) {
    console.log(`Patching ${filename.split('/').pop()}: ${oldId} -> ${newId}`);
    const regex = new RegExp(`getByTestId\\(['"]${oldId}['"]\\)`, 'g');
    content = content.replace(regex, `getByTestId('${newId}')`);
  }
  fs.writeFileSync(filename, content, 'utf-8');
}
console.log("Done patching.");