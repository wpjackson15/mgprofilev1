// Only import pdfjs on the client side
let pdfjs: typeof import('pdfjs-dist') | null = null;

if (typeof window !== 'undefined') {
  // Dynamic import to avoid SSR issues
  import('pdfjs-dist').then((module) => {
    pdfjs = module;
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  });
}



export async function extractTextFromPDF(file: File): Promise<string> {
  // Ensure we're on the client side
  if (typeof window === 'undefined') {
    throw new Error('PDF extraction is only available on the client side');
  }

  // Wait for pdfjs to be loaded
  if (!pdfjs) {
    await new Promise<void>((resolve) => {
      const checkPdfjs = () => {
        if (pdfjs) {
          resolve();
        } else {
          setTimeout(checkPdfjs, 100);
        }
      };
      checkPdfjs();
    });
  }

  try {
    if (!pdfjs) {
      throw new Error('PDF.js is not loaded yet');
    }
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // Look for multiple student profiles in the text
    const studentBlocks = text.split(/(?=Student|Name|Grade|Subject)/i);
    
    for (const block of studentBlocks) {
      if (block.trim().length < 10) continue; // Skip very short blocks
      
      // Try different patterns for extracting student information
      const nameMatch = block.match(/(?:Student|Name)[:\s]+([^\n\r,]+)/i);
      const gradeMatch = block.match(/Grade[:\s]+([^\n\r,]+)/i);
      const subjectMatch = block.match(/Subject[:\s]+([^\n\r,]+)/i);
      
      if (nameMatch || gradeMatch || subjectMatch) {
        const profile = block.trim();
        profiles.push({
          name: nameMatch?.[1]?.trim() || 'Unknown Student',
          grade: gradeMatch?.[1]?.trim() || 'Unknown Grade',
          subject: subjectMatch?.[1]?.trim() || 'Unknown Subject',
          profile: profile.length > 200 ? profile.substring(0, 200) + '...' : profile
        });
      }
    }
    
    // If still no profiles found, try to extract any structured text as a single profile
    if (profiles.length === 0 && text.trim().length > 20) {
      profiles.push({
        name: 'Student from PDF',
        grade: 'Unknown Grade',
        subject: 'Unknown Subject',
        profile: text.trim().substring(0, 300) + (text.length > 300 ? '...' : '')
      });
    }
  }
  
  return profiles;
} 