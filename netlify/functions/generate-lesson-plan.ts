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
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { prompt, studentProfiles, outputFormat = 'pdf', lessonSettings, calesCriteria }: GenerateLessonPlanRequest = JSON.parse(event.body || '{}');

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
        // Continue without standards if there's an error
      }
    }

    // Generate CALES-enhanced prompt if criteria are provided
    let enhancedPrompt = prompt + standardsText;
    
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
        title: 'Customized Lesson Plan',
        subject: studentProfiles[0]?.subject || 'General',
        grade: studentProfiles[0]?.grade || 'K-8',
        objectives: ['Create engaging learning experiences for diverse learners'],
        activities: ['Differentiated instruction based on student profiles'],
        assessment: 'Ongoing formative assessment',
        materials: ['Standard classroom materials'],
        duration: '45 minutes',
        outputFormat,
      };
    }

    // Add output format to the response
    lessonPlan.outputFormat = outputFormat;
    
    // Create Google Doc if requested
    if (outputFormat === 'google-doc') {
      try {
        const content = `Lesson Plan: ${lessonPlan.title}
Subject: ${lessonPlan.subject}
Grade: ${lessonPlan.grade}
Duration: ${lessonPlan.duration}

Learning Objectives:
${lessonPlan.objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

Activities:
${lessonPlan.activities.map((act, i) => `${i + 1}. ${act}`).join('\n')}

Assessment:
${lessonPlan.assessment}

Materials:
${lessonPlan.materials.map(mat => `• ${mat}`).join('\n')}

Student Profiles:
${studentProfiles.map(profile => 
  `${profile.name} (${profile.grade})\nSubject: ${profile.subject}\nProfile: ${profile.profile.substring(0, 200)}${profile.profile.length > 200 ? '...' : ''}`
).join('\n\n')}`;

        const googleDocResponse = await fetch('/.netlify/functions/create-google-doc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: lessonPlan.title,
            content: content,
            studentProfiles: studentProfiles
          })
        });

        if (googleDocResponse.ok) {
          const googleDocData = await googleDocResponse.json();
          lessonPlan.googleDocUrl = googleDocData.documentUrl;
        } else {
          console.error('Failed to create Google Doc');
          lessonPlan.googleDocUrl = `https://docs.google.com/document/d/placeholder-${Date.now()}`;
        }
      } catch (error) {
        console.error('Error creating Google Doc:', error);
        lessonPlan.googleDocUrl = `https://docs.google.com/document/d/placeholder-${Date.now()}`;
      }
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
    console.error('Lesson plan generation error:', error);
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