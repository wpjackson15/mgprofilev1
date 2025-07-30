// Only import jsPDF on the client side
let jsPDF: any = null;

if (typeof window !== 'undefined') {
  // Dynamic import to avoid SSR issues
  import('jspdf').then((module) => {
    jsPDF = module.default;
  });
}

export interface LessonPlanData {
  title: string;
  subject: string;
  grade: string;
  objectives: string[];
  activities: string[];
  assessment: string;
  materials: string[];
  duration: string;
  studentProfiles: Array<{
    name: string;
    grade: string;
    subject: string;
    profile: string;
  }>;
}

export function generateLessonPlanPDF(data: LessonPlanData): any {
  // Ensure we're on the client side
  if (typeof window === 'undefined') {
    throw new Error('PDF generation is only available on the client side');
  }

  // Wait for jsPDF to be loaded
  if (!jsPDF) {
    throw new Error('jsPDF is not loaded yet. Please try again.');
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const lineHeight = 7;
  let yPosition = margin;

  // Helper function to add text with word wrapping
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number): number => {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + (lines.length * lineHeight);
  };

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  yPosition = addWrappedText(data.title, margin, yPosition, pageWidth - 2 * margin);
  yPosition += 10;

  // Basic Info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  yPosition = addWrappedText(`Subject: ${data.subject}`, margin, yPosition, pageWidth - 2 * margin);
  yPosition = addWrappedText(`Grade: ${data.grade}`, margin, yPosition, pageWidth - 2 * margin);
  yPosition = addWrappedText(`Duration: ${data.duration}`, margin, yPosition, pageWidth - 2 * margin);
  yPosition += 10;

  // Check if we need a new page
  if (yPosition > 250) {
    doc.addPage();
    yPosition = margin;
  }

  // Objectives
  doc.setFont('helvetica', 'bold');
  yPosition = addWrappedText('Learning Objectives:', margin, yPosition, pageWidth - 2 * margin);
  doc.setFont('helvetica', 'normal');
  yPosition += 5;
  
  data.objectives.forEach((objective, index) => {
    yPosition = addWrappedText(`${index + 1}. ${objective}`, margin + 10, yPosition, pageWidth - 2 * margin - 10);
  });
  yPosition += 10;

  // Check if we need a new page
  if (yPosition > 250) {
    doc.addPage();
    yPosition = margin;
  }

  // Activities
  doc.setFont('helvetica', 'bold');
  yPosition = addWrappedText('Activities:', margin, yPosition, pageWidth - 2 * margin);
  doc.setFont('helvetica', 'normal');
  yPosition += 5;
  
  data.activities.forEach((activity, index) => {
    yPosition = addWrappedText(`${index + 1}. ${activity}`, margin + 10, yPosition, pageWidth - 2 * margin - 10);
  });
  yPosition += 10;

  // Check if we need a new page
  if (yPosition > 250) {
    doc.addPage();
    yPosition = margin;
  }

  // Materials
  doc.setFont('helvetica', 'bold');
  yPosition = addWrappedText('Materials:', margin, yPosition, pageWidth - 2 * margin);
  doc.setFont('helvetica', 'normal');
  yPosition += 5;
  
  data.materials.forEach((material) => {
    yPosition = addWrappedText(`• ${material}`, margin + 10, yPosition, pageWidth - 2 * margin - 10);
  });
  yPosition += 10;

  // Check if we need a new page
  if (yPosition > 250) {
    doc.addPage();
    yPosition = margin;
  }

  // Assessment
  doc.setFont('helvetica', 'bold');
  yPosition = addWrappedText('Assessment:', margin, yPosition, pageWidth - 2 * margin);
  doc.setFont('helvetica', 'normal');
  yPosition += 5;
  yPosition = addWrappedText(data.assessment, margin + 10, yPosition, pageWidth - 2 * margin - 10);
  yPosition += 10;

  // Student Profiles (if any)
  if (data.studentProfiles.length > 0) {
    // Check if we need a new page
    if (yPosition > 200) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFont('helvetica', 'bold');
    yPosition = addWrappedText('Student Profiles:', margin, yPosition, pageWidth - 2 * margin);
    doc.setFont('helvetica', 'normal');
    yPosition += 5;

    data.studentProfiles.forEach((profile) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = margin;
      }
      
      yPosition = addWrappedText(`${profile.name} (${profile.grade})`, margin + 10, yPosition, pageWidth - 2 * margin - 10);
      yPosition = addWrappedText(`Subject: ${profile.subject}`, margin + 20, yPosition, pageWidth - 2 * margin - 20);
      yPosition = addWrappedText(`Profile: ${profile.profile.substring(0, 100)}${profile.profile.length > 100 ? '...' : ''}`, margin + 20, yPosition, pageWidth - 2 * margin - 20);
      yPosition += 5;
    });
  }

  return doc;
}

export function downloadLessonPlanPDF(data: LessonPlanData, filename: string = 'lesson-plan.pdf'): void {
  // Ensure we're on the client side
  if (typeof window === 'undefined') {
    throw new Error('PDF download is only available on the client side');
  }

  const doc = generateLessonPlanPDF(data);
  doc.save(filename);
} 