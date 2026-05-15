const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src/pages');

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('/ placeholder=" "')) {
        content = content.replace(/\/\s*placeholder=" "/g, 'placeholder=" " /');
        fs.writeFileSync(fullPath, content);
        console.log(`Fixed slash issue in ${fullPath}`);
      }
    }
  });
}

processDirectory(directoryPath);
