export interface CALESCriteria {
  canDoAttitude: boolean;
  interestAwareness: boolean;
  multiculturalNavigation: boolean;
  racialPride: boolean;
  selectiveTrust: boolean;
  socialJustice: boolean;
  holisticWellBeing: boolean;
  clarity: boolean;
  accessibility: boolean;
  credibility: boolean;
  outcomes: boolean;
}

export const CALES_CRITERIA_DESCRIPTIONS = {
  canDoAttitude: "Foster a growth mindset and belief in students' capabilities",
  interestAwareness: "Connect learning to students' personal interests and experiences",
  multiculturalNavigation: "Help students navigate and appreciate diverse cultural contexts",
  racialPride: "Celebrate and affirm students' racial and cultural identities",
  selectiveTrust: "Build trusting relationships while teaching critical thinking",
  socialJustice: "Address social justice issues and promote equity",
  holisticWellBeing: "Support students' emotional, social, and academic development",
  clarity: "Provide clear, understandable instructions and expectations",
  accessibility: "Ensure learning is accessible to all students regardless of ability",
  credibility: "Establish trust and authenticity in teaching methods",
  outcomes: "Focus on meaningful learning outcomes and student success"
};

export const CALES_PROMPT_TEMPLATE = `
CALES (Culturally Affirming Learning Environment) Framework Integration:

When creating this lesson plan, incorporate the following CALES criteria:

{CRITERIA_LIST}

CALES Lesson Structure:
1. Opening Circle (5-10 minutes) - Build community and set positive expectations
2. Cultural Connection (10-15 minutes) - Connect content to students' cultural backgrounds
3. Core Learning (20-30 minutes) - Main instructional content with differentiation
4. Application & Expression (15-20 minutes) - Students apply learning creatively
5. Reflection & Planning (5-10 minutes) - Reflect on learning and plan next steps

Key CALES Principles:
- Ensure all students feel seen, heard, and valued
- Connect learning to students' lived experiences
- Provide multiple ways to engage with content
- Celebrate diverse perspectives and contributions
- Build on students' strengths and cultural assets
- Create opportunities for student voice and choice
- Address real-world issues that matter to students
- Foster a sense of belonging and community

Assessment should be:
- Culturally responsive and fair
- Multiple forms of evidence
- Student self-reflection included
- Growth-focused rather than deficit-based
`;

export function generateCALESPrompt(criteria: CALESCriteria): string {
  const selectedCriteria = Object.entries(criteria)
    .filter(([, isSelected]) => isSelected)
    .map(([key]) => `• ${CALES_CRITERIA_DESCRIPTIONS[key as keyof CALESCriteria]}`)
    .join('\n');

  return CALES_PROMPT_TEMPLATE.replace('{CRITERIA_LIST}', selectedCriteria || '• All CALES criteria should be considered');
}

export const CALES_FORM_FIELDS = [
  { id: 'canDoAttitude', label: 'Can-Do Attitude', description: 'Foster growth mindset' },
  { id: 'interestAwareness', label: 'Interest Awareness', description: 'Connect to student interests' },
  { id: 'multiculturalNavigation', label: 'Multicultural Navigation', description: 'Navigate diverse cultures' },
  { id: 'racialPride', label: 'Racial Pride', description: 'Celebrate cultural identities' },
  { id: 'selectiveTrust', label: 'Selective Trust', description: 'Build trusting relationships' },
  { id: 'socialJustice', label: 'Social Justice', description: 'Address equity issues' },
  { id: 'holisticWellBeing', label: 'Holistic Well-Being', description: 'Support whole child' },
  { id: 'clarity', label: 'Clarity', description: 'Clear instructions' },
  { id: 'accessibility', label: 'Accessibility', description: 'Ensure access for all' },
  { id: 'credibility', label: 'Credibility', description: 'Establish trust' },
  { id: 'outcomes', label: 'Outcomes', description: 'Focus on meaningful results' }
]; 