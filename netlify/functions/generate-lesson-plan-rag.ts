import { Handler } from '@netlify/functions';

interface StudentProfile {
  id: string;
  name: string;
  grade: string;
  subject: string;
  profile: string;
  createdAt: string;
}

interface GenerateLessonPlanRequest {
  prompt: string;
  studentProfiles: StudentProfile[];
  outputFormat?: 'pdf' | 'google-doc';
  lessonSettings?: {
    grade: string;
    subject: string;
    state: string;
  };
  calesCriteria?: {
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
  };
  useRAG?: boolean;
}

interface GenerateLessonPlanResponse {
  title: string;
  subject: string;
  grade: string;
  objectives: string[];
  activities: string[];
  assessment: string;
  materials: string[];
  duration: string;
  outputFormat?: 'pdf' | 'google-doc';
  googleDocUrl?: string;
  ragContext?: string[];
}

// Simple RAG implementation (in production, you'd use a proper vector database)
class SimpleRAG {
  private documents = [
    {
      id: 'cales-framework',
      title: 'CALES Framework Guide',
      content: `
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
      `,
      type: 'cales'
    },
    {
      id: 'differentiation-strategies',
      title: 'Differentiation Strategies',
      content: `
Differentiation Strategies for Diverse Learners:

Learning Style Differentiation:
- Visual learners: Use diagrams, charts, videos, graphic organizers
- Auditory learners: Include discussions, podcasts, verbal instructions
- Kinesthetic learners: Provide hands-on activities, movement, manipulatives
- Reading/writing learners: Offer text-based materials, writing assignments

Content Differentiation:
- Provide multiple entry points to the same concept
- Offer varying levels of complexity
- Use real-world examples that connect to students' experiences
- Include culturally relevant materials and examples

Process Differentiation:
- Allow different ways to explore and practice concepts
- Provide scaffolding for struggling learners
- Offer extension activities for advanced learners
- Include collaborative and individual work options

Product Differentiation:
- Allow multiple ways to demonstrate understanding
- Offer choice in assessment formats
- Include creative and traditional assessment options
- Provide opportunities for student voice and choice
      `,
      type: 'best-practices'
    },
    {
      id: 'culturally-responsive-teaching',
      title: 'Culturally Responsive Teaching',
      content: `
Culturally Responsive Teaching Strategies:

Building Relationships:
- Learn about students' cultural backgrounds and experiences
- Show genuine interest in students' lives and communities
- Build trust through consistent, respectful interactions
- Validate students' cultural identities and experiences

Curriculum and Instruction:
- Include diverse perspectives and voices in materials
- Connect content to students' cultural experiences
- Use culturally relevant examples and analogies
- Incorporate students' cultural knowledge and strengths

Classroom Environment:
- Create a welcoming, inclusive classroom culture
- Display diverse cultural representations
- Use culturally responsive classroom management
- Foster a sense of belonging for all students

Assessment and Evaluation:
- Use culturally fair assessment methods
- Consider cultural context in evaluation
- Provide multiple ways to demonstrate learning
- Focus on growth and improvement rather than deficits
      `,
      type: 'best-practices'
    }
  ];

  search(query: string, criteria?: any): string[] {
    const queryLower = query.toLowerCase();
    const results: string[] = [];

    for (const doc of this.documents) {
      const contentLower = doc.content.toLowerCase();
      let relevance = 0;

      // Simple keyword matching
      const keywords = queryLower.split(' ');
      for (const keyword of keywords) {
        if (contentLower.includes(keyword)) {
          relevance += 1;
        }
      }

      // Boost relevance for CALES criteria matches
      if (criteria && doc.type === 'cales') {
        const criteriaKeywords = this.getCriteriaKeywords(criteria);
        for (const keyword of criteriaKeywords) {
          if (contentLower.includes(keyword.toLowerCase())) {
            relevance += 2;
          }
        }
      }

      if (relevance > 0) {
        // Extract relevant excerpt
        const excerpt = this.extractExcerpt(doc.content, queryLower, 300);
        results.push(`From ${doc.title}:\n${excerpt}`);
      }
    }

    return results.slice(0, 3); // Return top 3 results
  }

  private getCriteriaKeywords(criteria: any): string[] {
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

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { prompt, studentProfiles, outputFormat = 'pdf', lessonSettings, calesCriteria, useRAG = true }: GenerateLessonPlanRequest = JSON.parse(event.body || '{}');

    if (!prompt || !studentProfiles || studentProfiles.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: prompt and studentProfiles' }),
      };
    }

    const claudeApiKey = process.env.CLAUDE_API_KEY_LESSON_PLANS;
    if (!claudeApiKey) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({ error: 'Claude API key not configured' }),
      };
    }

    // Fetch state standards if lesson settings are provided
    let standardsText = '';
    if (lessonSettings) {
      try {
        const standardsResponse = await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/get-state-standards?grade=${lessonSettings.grade}&subject=${lessonSettings.subject}&state=${lessonSettings.state}`);
        if (standardsResponse.ok) {
          const standardsData = await standardsResponse.json();
          if (standardsData.standards && standardsData.standards.length > 0) {
            standardsText = `\n\nState Standards for ${lessonSettings.state} ${lessonSettings.grade} Grade ${lessonSettings.subject}:\n${standardsData.standards.join('\n')}`;
          }
        }
      } catch (error) {
        console.error('Error fetching state standards:', error);
      }
    }

    // Use RAG to enhance the prompt
    let enhancedPrompt = prompt + standardsText;
    let ragContext: string[] = [];

    if (useRAG) {
      const rag = new SimpleRAG();
      const searchQuery = `${lessonSettings?.subject || ''} ${lessonSettings?.grade || ''} lesson plan culturally responsive differentiation`;
      ragContext = rag.search(searchQuery, calesCriteria);

      if (ragContext.length > 0) {
        enhancedPrompt += `\n\nRelevant Educational Context:\n${ragContext.join('\n\n')}\n\nPlease incorporate the above context and best practices into your lesson plan generation.`;
      }
    }

    // Generate CALES-enhanced prompt if criteria are provided
    if (calesCriteria) {
      const calesDescriptions = {
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

      const selectedCriteria = Object.entries(calesCriteria)
        .filter(([_, isSelected]) => isSelected)
        .map(([key, _]) => `• ${calesDescriptions[key as keyof typeof calesDescriptions]}`)
        .join('\n');

      const calesEnhancement = `

CALES (Culturally Affirming Learning Environment) Framework Integration:

When creating this lesson plan, incorporate the following CALES criteria:
${selectedCriteria || '• All CALES criteria should be considered'}

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
- Growth-focused rather than deficit-based`;

      enhancedPrompt += calesEnhancement;
    }

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: enhancedPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', errorText);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to generate lesson plan' }),
      };
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Try to parse JSON from the response
    let lessonPlan: GenerateLessonPlanResponse;
    try {
      // Extract JSON from the response (Claude might wrap it in markdown)
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
      lessonPlan = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.log('Raw response:', content);
      
      // Fallback: create a basic lesson plan structure
      lessonPlan = {
        title: 'CALES-Enhanced Lesson Plan',
        subject: studentProfiles[0]?.subject || 'General',
        grade: studentProfiles[0]?.grade || 'K-8',
        objectives: ['Create culturally responsive learning experiences for diverse learners'],
        activities: ['Differentiated instruction based on CALES framework'],
        assessment: 'Culturally responsive formative assessment',
        materials: ['Standard classroom materials'],
        duration: '45 minutes',
        outputFormat,
      };
    }

    // Add output format and RAG context to the response
    lessonPlan.outputFormat = outputFormat;
    if (ragContext.length > 0) {
      lessonPlan.ragContext = ragContext;
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify(lessonPlan),
    };
  } catch (error) {
    console.error('RAG lesson plan generation error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}; 