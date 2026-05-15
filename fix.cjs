const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src/pages');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // The bad output is:
  // onChange={(e) =>
  // <label className="floating-label">البريد الإلكتروني</label> setEmail(e.target.value)}
  // ...
  // />
  // We need to match from `<input` up to `/>` where the `<label...` is inside it.
  
  const regex = /<input([^>]*)>\s*<label className="floating-label"([^>]*)>([\s\S]*?)<\/label>\s*([^>]*)\/>/g;
  
  // Wait, the regex used before was:
  // <input([^>]*)>
  // But wait! It stopped at `=>` so the `/>` is actually still at the end of the input string!
  // Let's use a simpler approach. We know `<label className="floating-label"...>...</label>` is embedded inside the input component text.
  // We can just extract it, and put it right after the closing `/>` or `</select>`.
  
  // Actually, we can just replace `<label className="floating-label"` to `</label>` and save it.
  let modified = false;
  
  content = content.replace(/(<label className="floating-label"[^>]*>[\s\S]*?<\/label>)/g, (match) => {
    // replace it with empty temporarily, we will add it back
    return `__LABEL_HOLDER__${match}__END_LABEL_HOLDER__`;
  });
  
  // Now we have __LABEL_HOLDER__...__END_LABEL_HOLDER__ inside the input tag attributes.
  // We want to move it to after the `/>` or `</select>`.
  // Regex to find input tag containing the holder, up to its `/>`
  
  const inputRegex = /<(input|select)([\s\S]*?)__LABEL_HOLDER__([\s\S]*?)__END_LABEL_HOLDER__([\s\S]*?)(\/>|<\/select>)/g;
  content = content.replace(inputRegex, (match, tag, before, labelMatch, after, closing) => {
      modified = true;
      return `<${tag}${before}${after}${closing}\n            ${labelMatch}`;
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${filePath}`);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      fixFile(fullPath);
    }
  });
}

processDirectory(directoryPath);
