const fs = require('fs');

// Files with 'any' type issues
const files = [
  'src/app/admin/documents/enhanced/page.tsx',
  'src/app/admin/documents/test-rag/page.tsx',
  'src/app/admin/lesson-plan-rag-test/page.tsx',
  'src/app/admin/mongodb-test/page.tsx',
  'src/app/firebase-test/page.tsx'
];

files.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace 'any' types with more specific types
    content = content.replace(/: any/g, ': Record<string, unknown>');
    content = content.replace(/React\.useState<any>/g, 'React.useState<Record<string, unknown>>');
    content = content.replace(/useState<any>/g, 'useState<Record<string, unknown>>');
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed any types in ${filePath}`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});

console.log('Any type fixes completed!');
