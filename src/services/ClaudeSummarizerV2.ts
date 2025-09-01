import { ChildSummaryV1, BlackGeniusKey } from '../lib/schemas';
import { lintNoPrescriptions } from '../lib/utils';
import { metrics, V2_METRICS } from '../lib/metrics';
import { getReferenceDocuments, searchReferenceDocuments } from './mongodb';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

interface SummarizerV2Options {
  runId: string;
  profileId: string;
  model?: string;
  includeDocuments?: boolean;
}

interface EvidenceByElement {
  [key: string]: string[] | undefined;
}

export class ClaudeSummarizerV2 {
  private runId: string;
  private profileId: string;
  private model: string;
  private includeDocuments: boolean;

  constructor(options: SummarizerV2Options) {
    this.runId = options.runId;
    this.profileId = options.profileId;
    this.model = options.model || 'claude-3-5-sonnet-20240620';
    this.includeDocuments = options.includeDocuments || false;
  }

  /**
   * Build evidence grouped by Black Genius elements from MVP answers
   */
  private buildEvidenceByElement(answers: string[]): EvidenceByElement {
    // This is a simplified mapping - in practice, you'd want more sophisticated
    // logic to categorize answers by BG elements based on question content
    const evidenceByElement: EvidenceByElement = {};
    
    // For now, distribute answers across elements (this should be enhanced)
    const elements: BlackGeniusKey[] = [
      'interest_awareness',
      'can_do_attitude',
      'racial_identity',
      'multicultural_navigation',
      'selective_trust',
      'social_justice'
    ];

    answers.forEach((answer, index) => {
      const element = elements[index % elements.length];
      if (!evidenceByElement[element]) {
        evidenceByElement[element] = [];
      }
      evidenceByElement[element]!.push(answer.substring(0, 100)); // Truncate for evidence
    });

    return evidenceByElement;
  }

  /**
   * Get relevant reference documents with category-based prioritization
   */
  private async getRelevantDocuments(answers: string[]): Promise<string> {
    if (!this.includeDocuments) return '';

    try {
      // Search for documents related to the answers (filtered for profiles)
      const searchQuery = answers.join(' ');
      const allDocuments = await searchReferenceDocuments(searchQuery, 10, 'profile'); // Get more documents for filtering
      
      if (allDocuments.length === 0) return '';

      // Analyze answers to determine which categories are most relevant
      const answerText = answers.join(' ').toLowerCase();
      const relevantCategories = this.identifyRelevantCategories(answerText);
      
      // Prioritize documents based on relevance and category importance
      const prioritizedDocs = this.prioritizeDocumentsByRelevance(allDocuments, relevantCategories);
      
      // Select balanced documents across relevant categories
      const selectedDocs = this.selectBalancedDocuments(prioritizedDocs, relevantCategories);
      
      console.log(`Document selection: ${selectedDocs.length} documents selected from ${allDocuments.length} total`);
      console.log(`Relevant categories: ${relevantCategories.join(', ')}`);
      console.log(`Selected categories: ${selectedDocs.map(d => d.category).join(', ')}`);
      
      const documentContext = selectedDocs.map(doc => 
        `Document: ${doc.title}\nCategory: ${doc.category}\nPriority: ${this.getProfilePriority(doc)}\nContent: ${doc.content.substring(0, 500)}...`
      ).join('\n\n');

      return `\n\nReference Documents (Prioritized by Relevance):\n${documentContext}`;
    } catch (error) {
      console.error('Error fetching reference documents:', error);
      return '';
    }
  }

  /**
   * Get category priority score
   */
  private getProfilePriority(doc: any): number {
    // Use the document's profile priority if available, otherwise fall back to category-based priority
    if (doc.priority && typeof doc.priority.profiles === 'number') {
      return doc.priority.profiles;
    }
    
    // Fallback to category-based priority
    const categoryPriority = {
      // Content & Processing (highest priority)
      'black-genius-elements': 10,
      'content-guidelines': 9,
      'processing-framework': 8,
      'cultural-context': 7,
      'evidence-handling': 6,
      
      // Examples & Quality Standards (high priority)
      'examples': 8, // Elevated - high-quality examples are invaluable
      'best-practices': 7, // Elevated - proven approaches
      
      // Format & Style (medium priority)
      'technical-format': 5,
      'formatting': 4,
      'style': 3,
      'presentation': 2,
      
      // Research & Background (lower priority)
      'research': 1
    };

    return categoryPriority[doc.category] || 0;
  }

  /**
   * Prioritize documents by category importance for summary generation
   */
  private prioritizeDocumentsByCategory(documents: any[]): any[] {
    return documents.sort((a, b) => {
      const priorityA = this.getProfilePriority(a);
      const priorityB = this.getProfilePriority(b);
      return priorityB - priorityA; // Sort descending
    });
  }

  /**
   * Identify which document categories are most relevant based on answer content
   */
  private identifyRelevantCategories(answerText: string): string[] {
    const categoryKeywords = {
      'black-genius-elements': ['black', 'genius', 'identity', 'racial', 'culture', 'heritage', 'pride', 'african', 'diaspora'],
      'content-guidelines': ['include', 'exclude', 'focus', 'emphasize', 'highlight', 'describe', 'content', 'guidelines'],
      'processing-framework': ['analyze', 'interpret', 'understand', 'context', 'meaning', 'framework', 'process'],
      'cultural-context': ['cultural', 'background', 'family', 'community', 'tradition', 'values', 'heritage', 'roots'],
      'evidence-handling': ['evidence', 'proof', 'example', 'instance', 'demonstrate', 'show', 'indicate', 'suggest'],
      'formatting': ['format', 'structure', 'organize', 'layout', 'presentation', 'style'],
      'style': ['tone', 'voice', 'writing', 'language', 'communication', 'expression'],
      'technical-format': ['json', 'schema', 'field', 'technical', 'format', 'structure'],
      'presentation': ['readable', 'clear', 'visual', 'presentation', 'display']
    };

    const relevantCategories: string[] = [];
    
    Object.entries(categoryKeywords).forEach(([category, keywords]) => {
      const matchCount = keywords.filter(keyword => answerText.includes(keyword)).length;
      if (matchCount > 0) {
        relevantCategories.push(category);
        console.log(`Category ${category} relevant (${matchCount} keyword matches)`);
      }
    });

    // Always include core categories if no specific matches
    if (relevantCategories.length === 0) {
      relevantCategories.push('black-genius-elements', 'content-guidelines', 'processing-framework');
    }

    return relevantCategories;
  }

  /**
   * Prioritize documents based on relevance and category importance
   */
  private prioritizeDocumentsByRelevance(documents: any[], relevantCategories: string[]): any[] {
    return documents.map(doc => {
      const documentPriority = this.getProfilePriority(doc);
      const relevanceScore = relevantCategories.includes(doc.category) ? 10 : 0;
      const usageBonus = doc.usageTags?.profiles ? 3 : 0;
      const totalScore = documentPriority + relevanceScore + usageBonus;
      
      return {
        ...doc,
        priorityScore: totalScore,
        isRelevant: relevantCategories.includes(doc.category)
      };
    }).sort((a, b) => b.priorityScore - a.priorityScore);
  }

  /**
   * Select a balanced set of documents across relevant categories
   */
  private selectBalancedDocuments(prioritizedDocs: any[], relevantCategories: string[]): any[] {
    const maxDocs = 5; // Increased for better coverage
    const selectedDocs: any[] = [];
    const categoryCount: Record<string, number> = {};

    // First pass: select highest priority documents from each relevant category
    relevantCategories.forEach(category => {
      const categoryDocs = prioritizedDocs.filter(doc => doc.category === category);
      if (categoryDocs.length > 0) {
        selectedDocs.push(categoryDocs[0]);
        categoryCount[category] = 1;
      }
    });

    // Second pass: fill remaining slots with highest priority documents
    const remainingSlots = maxDocs - selectedDocs.length;
    const remainingDocs = prioritizedDocs.filter(doc => 
      !selectedDocs.some(selected => selected.id === doc.id)
    );

    for (let i = 0; i < Math.min(remainingSlots, remainingDocs.length); i++) {
      selectedDocs.push(remainingDocs[i]);
    }

    return selectedDocs.slice(0, maxDocs);
  }

  /**
   * Generate structured summary using Claude
   */
  async generateSummary(answers: string[]): Promise<ChildSummaryV1 | null> {
    metrics.increment(V2_METRICS.SUMMARY_V2_ATTEMPT_TOTAL);
    
    if (!CLAUDE_API_KEY) {
      console.error('Missing CLAUDE_API_KEY for V2 summarizer');
      return null;
    }

    const evidenceByElement = this.buildEvidenceByElement(answers);
    const documentContext = await this.getRelevantDocuments(answers);

    const systemPrompt = `You are generating a concise, strengths-forward portrait of a child for caregivers and educators.

SCOPE: Describe the child only (interests, motivations, identity signals, persistence/help-seeking, trusted adults, cultural navigation). Do NOT recommend strategies, activities, or next steps.

FRAMEWORK: Organize insights under Black Genius elements:
  - Interest Awareness, Can-Do Attitude, Racial Identity, Multicultural Navigation, Selective Trust.
  - Include Social Justice only if evidence exists. The elements are integrative—do not force content.

VOICE: Clear, affirming, 7–9th grade readability. Focus on the child's strengths and characteristics.

OUTPUT: Return strict JSON matching this schema:
{
  "schemaVersion": "1.0.0",
  "studentId": "string",
  "sections": {
    "interest_awareness": {"text": "80-220 words", "evidence": [], "confidence": 0.0-1.0},
    "can_do_attitude": {"text": "80-220 words", "evidence": [], "confidence": 0.0-1.0},
    "racial_identity": {"text": "80-220 words", "evidence": [], "confidence": 0.0-1.0},
    "multicultural_navigation": {"text": "80-220 words", "evidence": [], "confidence": 0.0-1.0},
    "selective_trust": {"text": "80-220 words", "evidence": [], "confidence": 0.0-1.0},
    "social_justice": {"text": "80-220 words", "evidence": [], "confidence": 0.0-1.0}
  },
  "meta": {"runId": "string", "model": "string", "createdAt": "ISO datetime"}
}

Only include sections where you have clear evidence. Do not include social_justice unless explicitly supported.`;

    const userPrompt = `Generate a child-only summary based on these parent responses, organized by Black Genius elements:

${Object.entries(evidenceByElement)
  .map(([element, evidence]) => `${element}:\n${evidence?.map(e => `- ${e}`).join('\n')}`)
  .join('\n\n')}${documentContext}

Return valid JSON only.`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': CLAUDE_API_KEY,
          'content-type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 2048,
          system: systemPrompt,
          messages: [
            { role: 'user', content: userPrompt }
          ]
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Claude API error:', response.status, errorText);
        metrics.increment(V2_METRICS.SUMMARY_V2_API_ERROR_TOTAL);
        return null;
      }

      const data = await response.json();
      const content = data.content?.[0]?.text || '';
      
      // Try to parse JSON response
      let jsonResponse;
      try {
        jsonResponse = JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse Claude response as JSON:', parseError);
        // Retry with explicit JSON instruction
        return await this.retryWithJsonInstruction();
      }

      // Validate with Zod schema
      const validationResult = ChildSummaryV1.safeParse(jsonResponse);
      if (!validationResult.success) {
        console.error('Schema validation failed:', validationResult.error.errors);
        metrics.increment(V2_METRICS.SUMMARY_V2_SCHEMA_MISMATCH_TOTAL);
        return null;
      }

      // Run linter with permissive rules
      const allText = Object.values(validationResult.data.sections || {})
        .map(section => section.text)
        .join(' ');
      
      const lintResult = lintNoPrescriptions(allText);
      if (!lintResult.isValid) {
        console.error('Linter blocked summary:', lintResult.violations);
        metrics.increment(V2_METRICS.SUMMARY_V2_LINTER_BLOCK_TOTAL);
        return null;
      }

      metrics.increment(V2_METRICS.SUMMARY_V2_SUCCESS_TOTAL);
      return validationResult.data;

    } catch (error) {
      console.error('V2 summarizer error:', error);
      return null;
    }
  }

  /**
   * Retry with explicit JSON instruction if first attempt fails
   */
  private async retryWithJsonInstruction(): Promise<ChildSummaryV1 | null> {
    if (!CLAUDE_API_KEY) return null;

    const retryPrompt = `Return ONLY valid JSON. No additional text or explanation. Generate the summary in the exact format specified.`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': CLAUDE_API_KEY,
          'content-type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1024,
          messages: [
            { role: 'user', content: retryPrompt }
          ]
        }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      const content = data.content?.[0]?.text || '';
      
      try {
        const jsonResponse = JSON.parse(content);
        const validationResult = ChildSummaryV1.safeParse(jsonResponse);
        return validationResult.success ? validationResult.data : null;
      } catch {
        return null;
      }

    } catch {
      return null;
    }
  }

  /**
   * Send summary to finalize endpoint
   */
  async finalizeSummary(summary: ChildSummaryV1, tokens?: { input: number; output: number }): Promise<boolean> {
    try {
      // For server-side calls, we can call the function directly instead of making an HTTP request
      const { saveSummaryV2 } = await import('./mongodb');
      
      const summaryData = {
        profileId: this.profileId,
        runId: this.runId,
        summary,
        tokens,
        model: this.model
      };

      const id = await saveSummaryV2(summaryData);
      console.log('Summary saved with ID:', id);
      return true;
    } catch (error) {
      console.error('Failed to finalize summary:', error);
      return false;
    }
  }
}
