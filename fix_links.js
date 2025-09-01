const fs = require('fs');
const path = require('path');

// Files that need Link imports and a tag replacements
const files = [
  'src/app/admin/mongodb-test/page.tsx',
  'src/app/admin/lesson-plan-rag-test/page.tsx',
  'src/app/admin/documents/test-rag/page.tsx',
  'src/app/admin/documents/enhanced/page.tsx',
  'src/app/admin/documents/page.tsx',
  'src/app/admin/login/page.tsx',
  'src/app/admin/test/page.tsx',
  'src/app/chatbot/page.tsx'
];

files.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add Link import if not already present
    if (!content.includes("import Link from 'next/link'") && !content.includes('import Link from "next/link"')) {
      content = content.replace(
        /import \* as React from ['"]react['"];/,
        "import * as React from 'react';\nimport Link from 'next/link';"
      );
    }
    
    // Replace <a href="/"> with <Link href="/">
    content = content.replace(/<a\s+href="\/"/g, '<Link href="/"');
    content = content.replace(/<\/a>/g, '</Link>');
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${filePath}`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});

console.log('Link fixes completed!');
