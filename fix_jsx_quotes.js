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
    
    // Only replace quotes/apostrophes within JSX content, not in imports or directives
    // Look for patterns like: >text with 'quotes'< or >text with "quotes"<
    content = content.replace(/>([^<]*?)'([^<]*?)</g, '>$1&apos;$2<');
    content = content.replace(/>([^<]*?)"([^<]*?)</g, '>$1&quot;$2<');
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed JSX quotes in ${filePath}`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});

console.log('JSX quote fixes completed!');
