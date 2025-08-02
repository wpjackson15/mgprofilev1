import { CALESCriteria } from './calesCriteria';

export interface RAGDocument {
  id: string;
  title: string;
  content: string;
  type: 'cales' | 'standards' | 'curriculum' | 'best-practices';
  metadata?: Record<string, any>;
}

export interface RAGQuery {
  query: string;
  criteria?: CALESCriteria;
  subject?: string;
  grade?: string;
  maxResults?: number;
}

export interface RAGResult {
  document: RAGDocument;
  relevance: number;
  excerpt: string;
}

// Simple in-memory document store (in production, you'd use a vector database)
class DocumentStore {
  private documents: RAGDocument[] = [];
  private embeddings: Map<string, number[]> = new Map();

  async addDocument(doc: RAGDocument): Promise<void> {
    this.documents.push(doc);
    // In a real implementation, you'd generate embeddings here
    // For now, we'll use simple keyword matching
  }

  async search(query: RAGQuery): Promise<RAGResult[]> {
    const queryLower = query.query.toLowerCase();
    const results: RAGResult[] = [];

    for (const doc of this.documents) {
      const contentLower = doc.content.toLowerCase();
      let relevance = 0;

      // Simple keyword matching (replace with semantic search in production)
      const keywords = queryLower.split(' ');
      for (const keyword of keywords) {
        if (contentLower.includes(keyword)) {
          relevance += 1;
        }
      }

      // Boost relevance for CALES criteria matches
      if (query.criteria && doc.type === 'cales') {
        const criteriaKeywords = this.getCriteriaKeywords(query.criteria);
        for (const keyword of criteriaKeywords) {
          if (contentLower.includes(keyword.toLowerCase())) {
            relevance += 2;
          }
        }
      }

      // Boost relevance for subject/grade matches
      if (query.subject && contentLower.includes(query.subject.toLowerCase())) {
        relevance += 1;
      }
      if (query.grade && contentLower.includes(query.grade.toLowerCase())) {
        relevance += 1;
      }

      if (relevance > 0) {
        // Extract relevant excerpt
        const excerpt = this.extractExcerpt(doc.content, queryLower, 200);
        results.push({
          document: doc,
          relevance,
          excerpt
        });
      }
    }

    // Sort by relevance and limit results
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, query.maxResults || 5);
  }

  private getCriteriaKeywords(criteria: CALESCriteria): string[] {
    const keywords: string[] = [];
    
    if (criteria.canDoAttitude) keywords.push('growth mindset', 'capabilities', 'belief');
    if (criteria.interestAwareness) keywords.push('interests', 'experiences', 'personal');
    if (criteria.multiculturalNavigation) keywords.push('cultural', 'diverse', 'contexts');
    if (criteria.racialPride) keywords.push('racial', 'cultural identities', 'affirm');
    if (criteria.selectiveTrust) keywords.push('trusting relationships', 'critical thinking');
    if (criteria.socialJustice) keywords.push('social justice', 'equity', 'fairness');
    if (criteria.holisticWellBeing) keywords.push('emotional', 'social', 'development');
    if (criteria.clarity) keywords.push('clear', 'understandable', 'expectations');
    if (criteria.accessibility) keywords.push('accessible', 'ability', 'inclusive');
    if (criteria.credibility) keywords.push('trust', 'authenticity', 'credible');
    if (criteria.outcomes) keywords.push('outcomes', 'success', 'meaningful');

    return keywords;
  }

  private extractExcerpt(content: string, query: string, maxLength: number): string {
    const queryWords = query.split(' ');
    let bestStart = 0;
    let maxMatches = 0;

    // Find the section with the most query word matches
    for (let i = 0; i < content.length - maxLength; i += 50) {
      const section = content.substring(i, i + maxLength).toLowerCase();
      let matches = 0;
      
      for (const word of queryWords) {
        if (section.includes(word.toLowerCase())) {
          matches++;
        }
      }

      if (matches > maxMatches) {
        maxMatches = matches;
        bestStart = i;
      }
    }

    let excerpt = content.substring(bestStart, bestStart + maxLength);
    
    // Try to start at a sentence boundary
    const firstPeriod = excerpt.indexOf('.');
    if (firstPeriod > 0 && firstPeriod < maxLength / 2) {
      excerpt = excerpt.substring(firstPeriod + 1).trim();
    }

    // Add ellipsis if we're not at the end
    if (bestStart + maxLength < content.length) {
      excerpt += '...';
    }

    return excerpt;
  }
}

// Global document store instance
const documentStore = new DocumentStore();

// Initialize with CALES criteria content
const CALES_CONTENT = `
CALES (Culturally Affirming Learning Environment) Framework

Core Black Genius Elements:
1. CAN-DO ATTITUDE - Foster a growth mindset and belief in students' capabilities
2. INTEREST AWARENESS - Connect learning to students' personal interests and experiences
3. MULTICULTURAL NAVIGATION - Help students navigate and appreciate diverse cultural contexts
4. RACIAL PRIDE - Celebrate and affirm students' racial and cultural identities
5. SELECTIVE TRUST - Build trusting relationships while teaching critical thinking
6. SOCIAL JUSTICE - Address social justice issues and promote equity

Additional CALE Elements:
7. HOLISTIC WELL-BEING - Support students' emotional, social, and academic development
8. CLARITY - Provide clear, understandable instructions and expectations
9. ACCESSIBILITY - Ensure learning is accessible to all students regardless of ability
10. CREDIBILITY - Establish trust and authenticity in teaching methods
11. OUTCOMES - Focus on meaningful learning outcomes and student success

Lesson Plan Template:
1. Opening Circle (5-10 minutes) - Build community and set positive expectations
2. Cultural Connection (10-15 minutes) - Connect content to students' cultural backgrounds
3. Core Learning (20-30 minutes) - Main instructional content with differentiation
4. Application & Expression (15-20 minutes) - Students apply learning creatively
5. Reflection & Planning (5-10 minutes) - Reflect on learning and plan next steps

Key Principles:
- Ensure all students feel seen, heard, and valued
- Connect learning to students' lived experiences
- Provide multiple ways to engage with content
- Celebrate diverse perspectives and contributions
- Build on students' strengths and cultural assets
- Create opportunities for student voice and choice
- Address real-world issues that matter to students
- Foster a sense of belonging and community

Assessment Approaches:
- Culturally responsive and fair assessment methods
- Multiple forms of evidence for learning
- Include student self-reflection
- Growth-focused rather than deficit-based evaluation
- Consider cultural context in assessment design
- Provide multiple ways to demonstrate understanding

Key Questions for Lesson Reflection:
- Did all students feel included and valued?
- Were cultural connections meaningful and authentic?
- Did the lesson build on students' strengths?
- Were there opportunities for student voice and choice?
- Did the assessment methods consider cultural context?
- How can we improve cultural responsiveness next time?
`;

// Initialize the document store
documentStore.addDocument({
  id: 'cales-framework',
  title: 'CALES Framework Guide',
  content: CALES_CONTENT,
  type: 'cales'
});

export class RAGService {
  static async search(query: RAGQuery): Promise<RAGResult[]> {
    return await documentStore.search(query);
  }

  static async generateEnhancedPrompt(
    basePrompt: string,
    query: RAGQuery
  ): Promise<string> {
    const results = await this.search(query);
    
    if (results.length === 0) {
      return basePrompt;
    }

    const contextSections = results.map(result => 
      `From ${result.document.title}:\n${result.excerpt}`
    ).join('\n\n');

    return `${basePrompt}

Relevant Educational Context:
${contextSections}

Please incorporate the above context and best practices into your lesson plan generation.`;
  }

  static async addDocument(doc: RAGDocument): Promise<void> {
    await documentStore.addDocument(doc);
  }
} 