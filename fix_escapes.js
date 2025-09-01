const fs = require('fs');

// Files with unescaped character issues
const files = [
  'src/app/admin/debug/page.tsx',
  'src/app/admin/documents/test-rag/page.tsx',
  'src/app/admin/lesson-plan-rag-test/page.tsx',
  'src/app/admin/simple-test/page.tsx',
  'src/app/admin/test/page.tsx',
  'src/app/firebase-test/page.tsx'
];

files.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace unescaped apostrophes and quotes
    content = content.replace(/(?<!&)(?<!&#)(?<!&#x)'/g, '&apos;');
    content = content.replace(/(?<!&)(?<!&#)(?<!&#x)"/g, '&quot;');
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed escapes in ${filePath}`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});

console.log('Escape fixes completed!');
