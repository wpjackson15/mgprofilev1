# n8n Integration Setup Guide

## 🎯 **Overview**
This guide will help you set up n8n to handle lesson plan generation after Firebase uploads.

## 📋 **Prerequisites**
- n8n instance running (cloud or self-hosted)
- Access to n8n web interface
- Your existing Firebase project
- Claude API key

## 🚀 **Step 1: Create the Webhook Endpoint**

### **1.1 Access n8n**
1. Open your n8n instance in a web browser
2. Click "Create new workflow"
3. Name it "Lesson Plan Generator"

### **1.2 Add Webhook Trigger**
1. Click the "+" button to add a node
2. Search for "Webhook" and select it
3. Configure the webhook:
   - **HTTP Method**: POST
   - **Path**: `lesson-plan-generate`
   - **Response Mode**: "Respond to Webhook"
4. Click "Save" and note the webhook URL

### **1.3 Test the Basic Webhook**
1. Copy the webhook URL from n8n
2. Update the URL in `test-n8n-webhook.js`
3. Run the test: `node test-n8n-webhook.js`
4. Verify you get a successful response

## 🔧 **Step 2: Build the Workflow**

### **2.1 Add Input Validation Node**
1. Add a "Code" node after the webhook
2. Use this code for validation:

```javascript
// Validate incoming data
const { studentProfiles, lessonSettings, calesCriteria } = $input.first().json;

// Basic validation
if (!studentProfiles || studentProfiles.length === 0) {
  throw new Error('No student profiles provided');
}

if (!lessonSettings || !lessonSettings.grade || !lessonSettings.subject || !lessonSettings.state) {
  throw new Error('Missing lesson settings');
}

// Return validated data
return {
  json: {
    studentProfiles,
    lessonSettings,
    calesCriteria,
    outputFormat: $input.first().json.outputFormat || 'pdf',
    useRAG: $input.first().json.useRAG !== false,
    userId: $input.first().json.userId
  }
};
```

### **2.2 Add CALES Context Node**
1. Add another "Code" node
2. Use this code to generate CALES context:

```javascript
const { calesCriteria, lessonSettings } = $input.first().json;

// CALES framework content
const calesContent = `
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
`;

// Filter selected criteria
const selectedCriteria = Object.entries(calesCriteria)
  .filter(([_, isSelected]) => isSelected)
  .map(([key, _]) => key);

return {
  json: {
    ...$input.first().json,
    calesContext: calesContent,
    selectedCriteria
  }
};
```

### **2.3 Add AI Generation Node**
1. Add an "HTTP Request" node
2. Configure it to call Claude API:

```javascript
// Configuration
const url = 'https://api.anthropic.com/v1/messages';
const method = 'POST';
const headers = {
  'Content-Type': 'application/json',
  'x-api-key': process.env.CLAUDE_API_KEY,
  'anthropic-version': '2023-06-01'
};

// Build the prompt
const { studentProfiles, lessonSettings, calesContext, selectedCriteria } = $input.first().json;

const profilesText = studentProfiles.map(p => 
  `Student: ${p.name} (Grade ${p.grade}, ${p.subject})\nProfile: ${p.profile}`
).join('\n\n');

const prompt = `Create a culturally responsive, differentiated lesson plan that aligns with ${lessonSettings.state} state standards for ${lessonSettings.grade} grade ${lessonSettings.subject}.

Lesson Settings:
- Grade Level: ${lessonSettings.grade}
- Subject: ${lessonSettings.subject}
- State: ${lessonSettings.state}

Student Profiles:
${profilesText}

CALES Framework Context:
${calesContext}

Selected CALES Criteria: ${selectedCriteria.join(', ')}

Please provide a comprehensive, standards-aligned lesson plan with:
1. Title and subject
2. Grade level
3. Learning objectives that align with ${lessonSettings.state} state standards for ${lessonSettings.grade} grade ${lessonSettings.subject}
4. Engaging activities that accommodate different learning styles and cultural backgrounds
5. Assessment methods that measure standards mastery
6. Required materials
7. Estimated duration

Format the response as JSON with the following structure:
{
  "title": "Lesson Title",
  "subject": "Subject",
  "grade": "Grade Level",
  "objectives": ["Objective 1", "Objective 2"],
  "activities": ["Activity 1", "Activity 2"],
  "assessment": "Assessment description",
  "materials": ["Material 1", "Material 2"],
  "duration": "45 minutes"
}`;

const body = {
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 4000,
  messages: [
    {
      role: 'user',
      content: prompt
    }
  ]
};

return {
  json: {
    url,
    method,
    headers,
    body: JSON.stringify(body)
  }
};
```

### **2.4 Add Response Processing Node**
1. Add a "Code" node to process the AI response
2. Use this code:

```javascript
const aiResponse = $input.first().json;
const originalData = $('Validate Input').first().json;

// Parse AI response
let lessonPlan;
try {
  const content = aiResponse.content[0].text;
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
  const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
  lessonPlan = JSON.parse(jsonString);
} catch (error) {
  // Fallback lesson plan
  lessonPlan = {
    title: 'CALES-Enhanced Lesson Plan',
    subject: originalData.lessonSettings.subject,
    grade: originalData.lessonSettings.grade,
    objectives: ['Create culturally responsive learning experiences for diverse learners'],
    activities: ['Differentiated instruction based on CALES framework'],
    assessment: 'Culturally responsive formative assessment',
    materials: ['Standard classroom materials'],
    duration: '45 minutes'
  };
}

// Add metadata
lessonPlan.ragContext = ['CALES Framework applied', 'Culturally responsive design'];
lessonPlan.outputFormat = originalData.outputFormat;
lessonPlan.calesCriteria = originalData.calesCriteria;

return {
  json: {
    success: true,
    lessonPlan
  }
};
```

### **2.5 Add Response Node**
1. Add a "Respond to Webhook" node
2. Configure it to return the lesson plan

## 🔗 **Step 3: Connect to Frontend**

### **3.1 Update Frontend Code**
Replace the current lesson plan generation call in your frontend:

```javascript
// Replace this:
const response = await fetch('/.netlify/functions/generate-lesson-plan-rag', {

// With this:
const response = await fetch('YOUR_N8N_WEBHOOK_URL', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    prompt, 
    studentProfiles: selectedProfilesList, 
    outputFormat,
    lessonSettings,
    calesCriteria,
    useRAG,
    userId: user?.uid
  })
});
```

### **3.2 Environment Variables**
Set these in your n8n environment:
- `CLAUDE_API_KEY`: Your Claude API key
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `FIREBASE_PRIVATE_KEY`: Your Firebase private key
- `FIREBASE_CLIENT_EMAIL`: Your Firebase client email

## 🧪 **Step 4: Testing**

### **4.1 Test the Workflow**
1. Use the test script: `node test-n8n-webhook.js`
2. Check n8n execution logs
3. Verify the response format

### **4.2 Test from Frontend**
1. Upload student profiles to Firebase
2. Select profiles and settings
3. Generate a lesson plan
4. Verify the result

## 🔧 **Troubleshooting**

### **Common Issues:**
1. **Webhook not receiving data**: Check the webhook URL and CORS settings
2. **AI generation failing**: Verify Claude API key and rate limits
3. **Response format errors**: Check the JSON parsing in the response processing node

### **Debug Tips:**
1. Use n8n's execution logs to see data flow
2. Add console.log statements in Code nodes
3. Test each node individually
4. Check the webhook URL is accessible

## 📈 **Next Steps**
Once the basic workflow is working:
1. Add Firebase integration for saving lesson plans
2. Add error handling and retry logic
3. Add performance monitoring
4. Add multiple AI provider support 