const { MongoClient } = require('mongodb');

// Sample lesson plan documents with different categories
const lessonPlanDocuments = [
  {
    title: "CALES Framework Lesson Planning Guide",
    content: "The CALES (Culturally Affirming Learning Environment) Framework provides a structured approach to lesson planning that centers Black genius elements. Key components include: 1) Opening Circle (5-10 min) to build community and set positive expectations, 2) Cultural Connection (10-15 min) to connect content to students' cultural backgrounds, 3) Core Learning (20-30 min) for main instruction with differentiation, 4) Application & Expression (15-20 min) for creative application, and 5) Reflection & Planning (5-10 min) for reflection and next steps. Each component should incorporate relevant CALES elements based on the lesson objectives and student needs.",
    category: "processing-framework",
    tags: ["cales", "lesson-planning", "framework", "structure"],
    status: "published",
    priority: "high"
  },
  {
    title: "Elementary Math Lesson: Fractions Through Cultural Music",
    content: "This lesson demonstrates how to teach fractions using cultural music and rhythm. Students explore fractions through musical patterns, creating visual representations of musical beats. The lesson incorporates CAN-DO ATTITUDE by emphasizing that everyone can understand math through music, INTEREST AWARENESS by connecting to students' musical interests, and MULTICULTURAL NAVIGATION by exploring rhythms from different cultures. Materials include: rhythm instruments, fraction circles, and cultural music samples. Assessment includes students creating their own rhythmic patterns and explaining the fractional relationships.",
    category: "examples",
    tags: ["math", "fractions", "music", "elementary", "cultural"],
    status: "published",
    priority: "high"
  },
  {
    title: "Middle School ELA: Persuasive Writing for Social Justice",
    content: "A comprehensive lesson on persuasive writing that addresses social justice issues. Students learn to craft compelling arguments while incorporating RACIAL PRIDE, SOCIAL JUSTICE, and SELECTIVE TRUST elements. The lesson includes analyzing mentor texts, identifying rhetorical devices, and creating persuasive pieces on topics relevant to students' communities. Students practice critical thinking by evaluating sources and building evidence-based arguments. The lesson culminates in students presenting their arguments to peers and receiving constructive feedback.",
    category: "best-practices",
    tags: ["ela", "writing", "persuasive", "social-justice", "middle-school"],
    status: "published",
    priority: "high"
  },
  {
    title: "High School Science: Genetics and Diverse Scientific Contributions",
    content: "This lesson celebrates diverse contributions to genetics and scientific discovery. Students explore the work of scientists from various backgrounds, including Dr. Mae Jemison, Dr. Charles Drew, and others. The lesson incorporates RACIAL PRIDE by highlighting Black excellence in science, HOLISTIC WELL-BEING by connecting scientific concepts to real-world applications, and CREDIBILITY by using accurate historical and scientific information. Students conduct hands-on experiments, research scientific contributions, and create presentations on diverse scientists' work.",
    category: "examples",
    tags: ["science", "genetics", "diversity", "high-school", "black-scientists"],
    status: "published",
    priority: "high"
  },
  {
    title: "Assessment Strategies for Culturally Responsive Teaching",
    content: "Effective assessment in culturally responsive classrooms goes beyond traditional tests. This guide covers multiple assessment methods including: 1) Student self-reflection and goal-setting, 2) Project-based assessments that allow for cultural expression, 3) Peer assessment with cultural sensitivity, 4) Portfolio assessments that showcase growth over time, 5) Performance-based assessments that value different ways of knowing. The guide emphasizes EVIDENCE HANDLING by collecting multiple forms of evidence, CLARITY by providing clear assessment criteria, and OUTCOMES by focusing on meaningful learning rather than just grades.",
    category: "evidence-handling",
    tags: ["assessment", "culturally-responsive", "evaluation", "methods"],
    status: "published",
    priority: "medium"
  },
  {
    title: "Differentiation Strategies for Diverse Learners",
    content: "This resource provides practical differentiation strategies that honor student diversity and promote ACCESSIBILITY. Key strategies include: 1) Multiple entry points for learning activities, 2) Flexible grouping based on interests and strengths, 3) Choice boards that allow student voice and choice, 4) Scaffolded support that builds independence, 5) Cultural connections that make content relevant. The guide emphasizes building on students' cultural assets and providing multiple ways to engage with content. Each strategy is designed to support CLARITY in instruction while maintaining high expectations for all students.",
    category: "best-practices",
    tags: ["differentiation", "diverse-learners", "accessibility", "strategies"],
    status: "published",
    priority: "high"
  },
  {
    title: "Lesson Plan Template with CALES Integration",
    content: "A comprehensive lesson plan template that integrates CALES elements throughout the planning process. The template includes sections for: Learning Objectives (with CALES element alignment), Materials and Resources (including cultural materials), Lesson Structure (with time allocations for each CALES component), Differentiation Strategies (addressing diverse learning needs), Assessment Methods (multiple forms of evidence), Cultural Connections (explicit connections to students' backgrounds), and Reflection Questions (for both teachers and students). The template emphasizes CLARITY in planning while ensuring ACCESSIBILITY for all students.",
    category: "formatting",
    tags: ["template", "lesson-plan", "cales", "formatting"],
    status: "published",
    priority: "medium"
  },
  {
    title: "Cultural Connections in Mathematics Instruction",
    content: "This guide shows how to integrate cultural connections into mathematics instruction at all grade levels. Examples include: using traditional African geometric patterns to teach geometry, incorporating counting systems from different cultures, exploring mathematical concepts through cultural artifacts and stories, and connecting mathematical thinking to students' everyday experiences. The guide emphasizes INTEREST AWARENESS by connecting math to students' cultural backgrounds, MULTICULTURAL NAVIGATION by exploring mathematical thinking across cultures, and CAN-DO ATTITUDE by showing that mathematical thinking is universal across cultures.",
    category: "content-guidelines",
    tags: ["math", "cultural-connections", "mathematics", "instruction"],
    status: "published",
    priority: "medium"
  }
];

async function createLessonPlanDocuments() {
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });
  
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not found in environment variables');
    process.exit(1);
  }
  
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('mgprofilev1');
    const collection = db.collection('referenceDocuments');

    // Add creation timestamps
    const documentsWithTimestamps = lessonPlanDocuments.map(doc => ({
      ...doc,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'admin'
    }));

    // Insert documents
    const result = await collection.insertMany(documentsWithTimestamps);
    console.log(`Successfully created ${result.insertedCount} lesson plan documents`);

    // Display created documents
    console.log('\nCreated documents:');
    Object.values(result.insertedIds).forEach((id, index) => {
      console.log(`${index + 1}. ${lessonPlanDocuments[index].title} (${lessonPlanDocuments[index].category})`);
    });

  } catch (error) {
    console.error('Error creating lesson plan documents:', error);
  } finally {
    await client.close();
  }
}

// Run the script
createLessonPlanDocuments();
