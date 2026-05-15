const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src/pages');

function refactorFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // We want to transform:
  // <label className="label-text" ...>Text</label>
  // <input ... className="input-field" ... />
  // 
  // To:
  // <div className="relative">
  //   <input ... className="input-field peer" placeholder=" " ... />
  //   <label className="floating-label" ...>Text</label>
  // </div>
  // Wait, sometimes they are inside <div> already. 
  // If they are, we can just replace the div's className to include 'relative' or add it.

  // A safer approach:
  // Replace <label className="label-text"...>...</label>\s*<input.../>
  const regex = /<label className="label-text"([^>]*)>([\s\S]*?)<\/label>\s*<(input|select)([^>]*(?:className="input-field"[^>]*)?)>/g;

  let modified = false;
  content = content.replace(regex, (match, labelAttrs, labelContent, tag, inputAttrs) => {
    modified = true;
    
    // ensure input has placeholder=" " if it doesn't have one
    let newAttrs = inputAttrs;
    if (tag === 'input' && !newAttrs.includes('placeholder=')) {
      newAttrs += ' placeholder=" "';
    } else if (tag === 'input') {
       // if it has placeholder="something", we might need to keep it or replace it.
       // The user's placeholders might conflict with floating labels, usually we replace them.
       newAttrs = newAttrs.replace(/placeholder="[^"]*"/, 'placeholder=" "');
    }

    // if className="input-field" is there, we add peer
    if (newAttrs.includes('className="input-field"')) {
      newAttrs = newAttrs.replace('className="input-field"', 'className="input-field peer"');
    } else if (newAttrs.includes('className="')) {
      newAttrs = newAttrs.replace(/className="([^"]+)"/, 'className="$1 peer"');
    } else {
      newAttrs += ' className="peer"';
    }

    // Return inverted order
    return `<${tag}${newAttrs}>\n            <label className="floating-label"${labelAttrs}>${labelContent}</label>`;
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      refactorFile(fullPath);
    }
  });
}

processDirectory(directoryPath);
