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
    this.model = options.model || 'claude-sonnet-4-20250514';
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
   * Get module key for summary sections
   */
  private getModuleKey(module: string): string {
    const keyMap: Record<string, string> = {
      'Interest Awareness': 'interest_awareness',
      'Can Do Attitude': 'can_do_attitude',
      'Multicultural Navigation': 'multicultural_navigation',
      'Selective Trust': 'selective_trust',
      'Social Justice / Fairness': 'social_justice',
      'Racial Identity': 'racial_identity'
    };
    return keyMap[module] || 'interest_awareness';
  }

  /**
   * Generate ultra-simple prompt based on module
   */
  private getElementSpecificPrompt(module: string): string {
    const prompts: Record<string, string> = {
      'Interest Awareness': `Summarize this child's interests in 2-3 sentences for teachers.`,
      'Can Do Attitude': `Summarize this child's persistence in 2-3 sentences for teachers.`,
      'Multicultural Navigation': `Summarize this child's adaptability in 2-3 sentences for teachers.`,
      'Selective Trust': `Summarize this child's trust-building in 2-3 sentences for teachers.`,
      'Social Justice / Fairness': `Summarize this child's community focus in 2-3 sentences for teachers.`,
      'Racial Identity': `Summarize this child's cultural connections in 2-3 sentences for teachers.`
    };

    return prompts[module] || prompts['Interest Awareness'];
  }

  /**
   * Get relevant reference documents with category-based prioritization
   */
  private async getRelevantDocuments(answers: string[]): Promise<string> {
    if (!this.includeDocuments) return '';

    try {
      console.log("About to make Claude API call...");
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
  private getProfilePriority(doc: Record<string, unknown>): number {
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
  private prioritizeDocumentsByCategory(documents: Record<string, unknown>[]): Record<string, unknown>[] {
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
  private prioritizeDocumentsByRelevance(documents: Record<string, unknown>[], relevantCategories: string[]): Record<string, unknown>[] {
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
  private selectBalancedDocuments(prioritizedDocs: Record<string, unknown>[], relevantCategories: string[]): Record<string, unknown>[] {
    const maxDocs = 5; // Increased for better coverage
    const selectedDocs: Record<string, unknown>[] = [];
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
  async generateSummary(module: string, answers: string[]): Promise<ChildSummaryV1 | null> {
    metrics.increment(V2_METRICS.SUMMARY_V2_ATTEMPT_TOTAL);
    
    if (!CLAUDE_API_KEY) {
      console.error('Missing CLAUDE_API_KEY for V2 summarizer');
      return null;
    }

    const evidenceByElement = this.buildEvidenceByElement(answers);
    const documentContext = await this.getRelevantDocuments(answers);

    // Generate element-specific prompt based on module
    const systemPrompt = this.getElementSpecificPrompt(module);

    const userPrompt = `Answers: ${answers.join(' | ')}`;

    try {
      console.log("About to make Claude API call...");
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': CLAUDE_API_KEY,
          'content-type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 500,
          system: systemPrompt,
          messages: [
            { role: 'user', content: userPrompt }
          ]
        }),
      });
      console.log("Claude API call completed, response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Claude API error:', response.status, errorText);
        metrics.increment(V2_METRICS.SUMMARY_V2_API_ERROR_TOTAL);
        return null;
      }

      const data = await response.json();
      const content = data.content?.[0]?.text || '';
      
      console.log('=== CLAUDE API DEBUG ===');
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      console.log('Full response data:', data);
      console.log('Content extracted:', content);
      console.log('Content length:', content.length);
      console.log('Content type:', typeof content);
      console.log('========================');
      
      // Handle Claude response (could be JSON or plain text)
      let jsonResponse;
      if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
        // Try to parse as JSON
        try {
      console.log("About to make Claude API call...");
          jsonResponse = JSON.parse(content);
          console.log('✅ Successfully parsed JSON:', jsonResponse);
        } catch (parseError) {
          console.error('❌ Failed to parse Claude response as JSON:', parseError);
          console.log('Raw content that failed to parse:', content);
          console.log('Content preview (first 200 chars):', content.substring(0, 200));
          // Retry with explicit JSON instruction
          return await this.retryWithJsonInstruction();
        }
      } else {
        // Handle plain text response
        console.log('✅ Claude returned plain text (no JSON parsing needed)');
        jsonResponse = content; // Treat the plain text as the response
      }

      // Try to extract summary text from any format
      let summaryText = '';
      
      // Try different possible formats
      if (jsonResponse.text) {
        summaryText = jsonResponse.text;
      } else if (jsonResponse.summary) {
        summaryText = jsonResponse.summary;
      } else if (jsonResponse.content) {
        summaryText = jsonResponse.content;
      } else if (typeof jsonResponse === 'string') {
        summaryText = jsonResponse;
      } else if (jsonResponse.sections && jsonResponse.sections.interest_awareness) {
        summaryText = jsonResponse.sections.interest_awareness.text || '';
      } else {
        // If all else fails, try to extract any text content
        summaryText = JSON.stringify(jsonResponse);
      }

      // Create a simple summary object
      const simpleSummary = {
        schemaVersion: "1.0.0",
        studentId: "",
        sections: {
          [this.getModuleKey(module)]: {
            text: summaryText,
            evidence: [],
            confidence: 1.0
          }
        },
        meta: {
          runId: this.runId,
          model: this.model,
          createdAt: new Date().toISOString()
        }
      };

      metrics.increment(V2_METRICS.SUMMARY_V2_SUCCESS_TOTAL);
      return simpleSummary;

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
      console.log("About to make Claude API call...");
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
      console.log("Claude API call completed, response status:", response.status);

      if (!response.ok) return null;

      const data = await response.json();
      const content = data.content?.[0]?.text || '';
      
      try {
      console.log("About to make Claude API call...");
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
      console.log("About to make Claude API call...");
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
