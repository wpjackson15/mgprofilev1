import * as pdfjs from 'pdfjs-dist';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF file');
  }
}

export function parseStudentProfilesFromText(text: string): Array<{
  name: string;
  grade: string;
  subject: string;
  profile: string;
}> {
  const lines = text.split('\n').filter(line => line.trim());
  const profiles: Array<{ name: string; grade: string; subject: string; profile: string }> = [];
  
  // Try to parse as CSV first
  for (const line of lines) {
    const values = line.split(',').map(v => v.trim());
    if (values.length >= 4) {
      profiles.push({
        name: values[0] || 'Unknown',
        grade: values[1] || 'Unknown',
        subject: values[2] || 'Unknown',
        profile: values[3] || 'No profile provided'
      });
    }
  }
  
  // If no CSV format found, try to extract structured information
  if (profiles.length === 0) {
    // Simple text parsing - look for patterns like "Name:", "Grade:", etc.
    const nameMatch = text.match(/Name[:\s]+([^\n\r]+)/i);
    const gradeMatch = text.match(/Grade[:\s]+([^\n\r]+)/i);
    const subjectMatch = text.match(/Subject[:\s]+([^\n\r]+)/i);
    
    if (nameMatch || gradeMatch || subjectMatch) {
      profiles.push({
        name: nameMatch?.[1]?.trim() || 'Unknown',
        grade: gradeMatch?.[1]?.trim() || 'Unknown',
        subject: subjectMatch?.[1]?.trim() || 'Unknown',
        profile: text.substring(0, 500) + (text.length > 500 ? '...' : '') // Use first 500 chars as profile
      });
    }
  }
  
  return profiles;
} 