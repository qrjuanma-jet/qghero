const fs = require('fs');
let code = fs.readFileSync('src/chordDb.js', 'utf8');

code = code.replace(/\"([EBGDA]) \(\d\) (.*?)\"/g, (match, note, content) => {
  let cells = content.split('|');
  let newCells = cells.map((cell, idx) => {
    let val = cell.replace(/-/g, '');
    if (val.length === 0) {
      return '----';
    } else {
      return val + '---';
    }
  });
  // Also we need to get the number inside parens.
  // match is "E (1) O---|---|---"
  let numMatch = match.match(/\((\d)\)/);
  let num = numMatch ? numMatch[1] : '';
  return '\"' + note + ' (' + num + ') ' + newCells.join('|') + '\"';
});

fs.writeFileSync('src/chordDb.js', code);
console.log("Done");
