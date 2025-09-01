import { connectToMongoDB, searchReferenceDocuments } from './mongodb';

export interface LessonPlanRAGContext {
  studentProfiles: string[];
  grade: string;
  subject: string;
  calesCriteria: string[];
  lessonType?: 'individual' | 'group' | 'whole-class';
  duration?: string;
}

export class LessonPlanRAGService {
  private getLessonPlanPriority(doc: any): number {
    // Use the document's lesson plan priority if available, otherwise fall back to category-based priority
    if (doc.priority && typeof doc.priority.lessonPlans === 'number') {
      return doc.priority.lessonPlans;
    }
    
    // Fallback to category-based priority
    const lessonPlanPriority = {
      // Lesson Planning & Pedagogy (highest priority for lesson plans)
      'best-practices': 10,        // Proven teaching methods
      'examples': 9,               // Example lesson plans and activities
      'processing-framework': 8,   // How to structure lessons
      'content-guidelines': 7,     // What to include in lessons
      
      // Cultural & Student-Centered (high priority)
      'black-genius-elements': 8,  // CALES framework elements
      'cultural-context': 7,       // Cultural considerations
      'evidence-handling': 6,      // Assessment and evaluation
      
      // Format & Presentation (medium priority)
      'presentation': 5,           // How to present lessons
      'style': 4,                  // Teaching style and tone
      'formatting': 3,             // Lesson plan formatting
      'technical-format': 2,       // Technical requirements
      
      // Research & Background (lower priority)
      'research': 1
    };
    return lessonPlanPriority[doc.category] || 0;
  }

  private identifyLessonPlanRelevantCategories(context: LessonPlanRAGContext): string[] {
    const relevantCategories: string[] = [];
    const contextText = [
      ...context.studentProfiles,
      context.grade,
      context.subject,
      ...context.calesCriteria
    ].join(' ').toLowerCase();

    // Lesson planning keywords
    if (contextText.includes('lesson') || contextText.includes('activity') || contextText.includes('instruction')) {
      relevantCategories.push('best-practices', 'examples', 'processing-framework');
    }

    // Cultural and student-centered keywords
    if (contextText.includes('cultural') || contextText.includes('black') || contextText.includes('genius')) {
      relevantCategories.push('black-genius-elements', 'cultural-context');
    }

    // Assessment keywords
    if (contextText.includes('assessment') || contextText.includes('evaluation') || contextText.includes('evidence')) {
      relevantCategories.push('evidence-handling');
    }

    // Grade-specific keywords
    if (contextText.includes('elementary') || contextText.includes('primary')) {
      relevantCategories.push('examples', 'best-practices');
    }

    if (contextText.includes('middle') || contextText.includes('secondary')) {
      relevantCategories.push('processing-framework', 'content-guidelines');
    }

    // Subject-specific keywords
    if (contextText.includes('math') || contextText.includes('science')) {
      relevantCategories.push('examples', 'best-practices');
    }

    if (contextText.includes('language') || contextText.includes('reading')) {
      relevantCategories.push('cultural-context', 'black-genius-elements');
    }

    return [...new Set(relevantCategories)]; // Remove duplicates
  }

  private prioritizeDocumentsForLessonPlans(documents: any[], relevantCategories: string[]): any[] {
    return documents.map(doc => {
      const documentPriority = this.getLessonPlanPriority(doc);
      const relevanceScore = relevantCategories.includes(doc.category) ? 5 : 0;
      const usageBonus = doc.usageTags?.lessonPlans ? 3 : 0;
      const totalScore = documentPriority + relevanceScore + usageBonus;
      
      return {
        ...doc,
        priorityScore: totalScore
      };
    }).sort((a, b) => b.priorityScore - a.priorityScore);
  }

  private selectLessonPlanDocuments(prioritizedDocs: any[], context: LessonPlanRAGContext): any[] {
    // For lesson plans, we want a mix of:
    // 1. High-priority lesson planning documents
    // 2. Cultural and student-centered content
    // 3. Subject-specific examples
    
    const selectedDocs = [];
    const categoriesSelected = new Set<string>();
    
    // Select top documents, ensuring diversity
    for (const doc of prioritizedDocs) {
      if (selectedDocs.length >= 6) break; // Limit to 6 documents for lesson plans
      
      // Ensure we get a good mix of categories
      if (categoriesSelected.size < 4 || !categoriesSelected.has(doc.category)) {
        selectedDocs.push(doc);
        categoriesSelected.add(doc.category);
      }
    }
    
    return selectedDocs;
  }

  public async getLessonPlanContext(context: LessonPlanRAGContext): Promise<string> {
    try {
      // Connect to MongoDB
      await connectToMongoDB();
      
      // Create a search query from the context
      const searchQuery = [
        ...context.studentProfiles,
        context.grade,
        context.subject,
        ...context.calesCriteria
      ].join(' ');
      
      console.log('Lesson Plan RAG - Search Query:', searchQuery);
      
      // Get relevant documents (filtered for lesson plans)
      const allDocuments = await searchReferenceDocuments(searchQuery, 10, 'lesson-plan');
      
      console.log('Lesson Plan RAG - Documents found:', allDocuments.length);
      console.log('Lesson Plan RAG - Document titles:', allDocuments.map(d => d.title));
      
      if (allDocuments.length === 0) {
        console.log('Lesson Plan RAG - No documents found, using default context');
        return this.getDefaultLessonPlanContext();
      }

      // Identify relevant categories for lesson planning
      const relevantCategories = this.identifyLessonPlanRelevantCategories(context);
      
      // Prioritize documents for lesson plans
      const prioritizedDocs = this.prioritizeDocumentsForLessonPlans(allDocuments, relevantCategories);
      
      // Select balanced set of documents
      const selectedDocs = this.selectLessonPlanDocuments(prioritizedDocs, context);
      
      console.log(`Lesson Plan RAG: ${selectedDocs.length} documents selected from ${allDocuments.length} total`);
      console.log(`Relevant categories: ${relevantCategories.join(', ')}`);
      console.log(`Selected categories: ${selectedDocs.map(d => d.category).join(', ')}`);
      
      // Format context for lesson plan generation
      const documentContext = selectedDocs.map(doc => 
        `Document: ${doc.title}\nCategory: ${doc.category}\nPriority: ${this.getLessonPlanPriority(doc)}\nContent: ${doc.content.substring(0, 400)}...`
      ).join('\n\n');

      return `\n\nReference Documents (Optimized for Lesson Planning):\n${documentContext}`;
      
    } catch (error) {
      console.error('Error fetching lesson plan documents:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      return this.getDefaultLessonPlanContext();
    }
  }

  private getDefaultLessonPlanContext(): string {
    return `
Default Lesson Planning Context:

CALES Framework for Lesson Planning:
1. CAN-DO ATTITUDE - Foster growth mindset and belief in capabilities
2. INTEREST AWARENESS - Connect learning to personal interests
3. MULTICULTURAL NAVIGATION - Navigate diverse cultural contexts
4. RACIAL PRIDE - Celebrate racial and cultural identities
5. SELECTIVE TRUST - Build trusting relationships with critical thinking
6. SOCIAL JUSTICE - Address social justice and promote equity

Lesson Structure:
- Opening Circle (5-10 min) - Build community
- Cultural Connection (10-15 min) - Connect to cultural backgrounds
- Core Learning (20-30 min) - Main instruction with differentiation
- Application & Expression (15-20 min) - Creative application
- Reflection & Planning (5-10 min) - Reflect and plan next steps

Key Principles:
- Ensure all students feel seen, heard, and valued
- Connect learning to lived experiences
- Provide multiple ways to engage with content
- Celebrate diverse perspectives
- Build on strengths and cultural assets
- Create opportunities for student voice and choice
    `;
  }
}
