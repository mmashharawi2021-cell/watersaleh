const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src/pages');

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      if (content.includes('__LABEL_HOLDER__') || content.includes('__END_LABEL_HOLDER__')) {
        content = content.replace(/__LABEL_HOLDER__/g, '');
        content = content.replace(/__END_LABEL_HOLDER__/g, '');
        fs.writeFileSync(fullPath, content);
        console.log(`Cleaned placeholders in ${fullPath}`);
      }
    }
  });
}

processDirectory(directoryPath);
