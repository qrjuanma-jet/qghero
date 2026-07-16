const fs = require('fs');
let code = fs.readFileSync('src/chordDb.js', 'utf8');

code = code.replace(/\"TS\s+([ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ])\s+([ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ])\s+([ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ])\"/g, 
  (match, r1, r2, r3) => {
    return '\"TS     ' + r1 + '    ' + r2 + '    ' + r3 + '\"';
});

// There are also TS lines with 4 numerals if any?
code = code.replace(/\"TS\s+([ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ])\s+([ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ])\s+([ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ])\s+([ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ])\"/g, 
  (match, r1, r2, r3, r4) => {
    return '\"TS     ' + r1 + '    ' + r2 + '    ' + r3 + '    ' + r4 + '\"';
});

fs.writeFileSync('src/chordDb.js', code);
console.log("Done TS alignment");
