import { NextRequest, NextResponse } from 'next/server';
import { LessonPlanRAGService, LessonPlanRAGContext } from '@/services/LessonPlanRAGService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      studentProfiles,
      grade,
      subject,
      calesCriteria,
      lessonType = 'whole-class',
      duration = '45 minutes',
      prompt
    } = body;

    // Validate required fields
    if (!studentProfiles || !grade || !subject || !calesCriteria) {
      return NextResponse.json(
        { error: 'Missing required fields: studentProfiles, grade, subject, calesCriteria' },
        { status: 400 }
      );
    }

    // Handle studentProfiles as either string or array
    const studentProfilesArray = Array.isArray(studentProfiles) 
      ? studentProfiles.map((profile: any) => profile.profile || profile)
      : [studentProfiles];

    // Create RAG context for lesson planning
    const ragContext: LessonPlanRAGContext = {
      studentProfiles: studentProfilesArray,
      grade,
      subject,
      calesCriteria: Array.isArray(calesCriteria) ? calesCriteria : [calesCriteria],
      lessonType,
      duration
    };

    // Get enhanced context from knowledge library
    console.log('API: Creating RAG service...');
    const ragService = new LessonPlanRAGService();
    console.log('API: Getting lesson plan context...');
    const documentContext = await ragService.getLessonPlanContext(ragContext);
    console.log('API: Document context length:', documentContext.length);
    console.log('API: Document context preview:', documentContext.substring(0, 200));

    // Create the lesson plan prompt with enhanced context
    const enhancedPrompt = `
You are an expert educator creating culturally affirming lesson plans. Use the following context to generate a comprehensive lesson plan.

STUDENT CONTEXT:
${studentProfilesArray.map((profile: any, index: number) => 
  `Student ${index + 1}: ${profile.profile || profile}`
).join('\n')}

LESSON REQUIREMENTS:
- Grade: ${grade}
- Subject: ${subject}
- Duration: ${duration}
- Lesson Type: ${lessonType}
- CALES Elements to Include: ${Array.isArray(calesCriteria) ? calesCriteria.join(', ') : calesCriteria}

${documentContext}

USER REQUEST: ${prompt}

Please generate a detailed lesson plan that includes:
1. Lesson Title
2. Learning Objectives (3-4 specific, measurable objectives)
3. Materials Needed
4. Lesson Structure (with time allocations):
   - Opening Circle (5-10 min)
   - Cultural Connection (10-15 min)
   - Core Learning (20-30 min)
   - Application & Expression (15-20 min)
   - Reflection & Planning (5-10 min)
5. Differentiation Strategies
6. Assessment Methods
7. Cultural Connections
8. Extension Activities

Make sure the lesson plan:
- Incorporates the CALES framework elements specified
- Is appropriate for the grade level and subject
- Includes culturally affirming practices
- Provides clear, actionable steps
- Addresses the specific needs and interests of the students described
`;

    // For now, return the enhanced prompt
    // In production, you would send this to Claude API for lesson plan generation
    return NextResponse.json({
      success: true,
      enhancedPrompt,
      documentContext: documentContext.substring(0, 500) + '...',
      message: 'Lesson plan context prepared successfully'
    });

  } catch (error) {
    console.error('Error generating lesson plan:', error);
    return NextResponse.json(
      { error: 'Failed to generate lesson plan' },
      { status: 500 }
    );
  }
}
