const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

// Document type mapping based on current categories
const documentTypeMapping = {
  // Lesson Plan specific documents
  'processing-framework': 'lesson-plan',
  'formatting': 'lesson-plan',
  'presentation': 'lesson-plan',
  
  // Profile specific documents
  'black-genius-elements': 'profile',
  'cultural-context': 'profile',
  'style': 'profile',
  
  // Both lesson plans and profiles
  'examples': 'both',
  'best-practices': 'both',
  'content-guidelines': 'both',
  'evidence-handling': 'both',
  
  // General documents
  'research': 'general',
  'technical-format': 'general'
};

// Usage tag mapping
const usageTagMapping = {
  'examples': { lessonPlans: true, profiles: true, examples: true, bestPractices: false },
  'best-practices': { lessonPlans: true, profiles: true, examples: false, bestPractices: true },
  'processing-framework': { lessonPlans: true, profiles: false, examples: false, bestPractices: false },
  'formatting': { lessonPlans: true, profiles: false, examples: false, bestPractices: false },
  'presentation': { lessonPlans: true, profiles: false, examples: false, bestPractices: false },
  'black-genius-elements': { lessonPlans: false, profiles: true, examples: false, bestPractices: false },
  'cultural-context': { lessonPlans: false, profiles: true, examples: false, bestPractices: false },
  'style': { lessonPlans: false, profiles: true, examples: false, bestPractices: false },
  'content-guidelines': { lessonPlans: true, profiles: true, examples: false, bestPractices: false },
  'evidence-handling': { lessonPlans: true, profiles: true, examples: false, bestPractices: false },
  'research': { lessonPlans: false, profiles: false, examples: false, bestPractices: false },
  'technical-format': { lessonPlans: false, profiles: false, examples: false, bestPractices: false }
};

// Priority mapping for lesson plans vs profiles
const priorityMapping = {
  'examples': { lessonPlans: 9, profiles: 8 },
  'best-practices': { lessonPlans: 10, profiles: 7 },
  'processing-framework': { lessonPlans: 8, profiles: 8 },
  'formatting': { lessonPlans: 3, profiles: 4 },
  'presentation': { lessonPlans: 5, profiles: 2 },
  'black-genius-elements': { lessonPlans: 8, profiles: 10 },
  'cultural-context': { lessonPlans: 7, profiles: 7 },
  'style': { lessonPlans: 4, profiles: 3 },
  'content-guidelines': { lessonPlans: 7, profiles: 9 },
  'evidence-handling': { lessonPlans: 6, profiles: 6 },
  'research': { lessonPlans: 1, profiles: 1 },
  'technical-format': { lessonPlans: 2, profiles: 5 }
};

async function updateDocumentStructure() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('mgprofilev1');
    const collection = db.collection('referenceDocuments');

    // Get all documents
    const documents = await collection.find({}).toArray();
    console.log(`Found ${documents.length} documents to update`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const doc of documents) {
      const category = doc.category;
      
      // Skip if already has the new structure
      if (doc.documentType && doc.usageTags && doc.priority) {
        console.log(`Skipping ${doc.title} - already has new structure`);
        skippedCount++;
        continue;
      }

      const documentType = documentTypeMapping[category] || 'general';
      const usageTags = usageTagMapping[category] || { lessonPlans: false, profiles: false, examples: false, bestPractices: false };
      const priority = priorityMapping[category] || { lessonPlans: 1, profiles: 1 };

      const updateResult = await collection.updateOne(
        { _id: doc._id },
        {
          $set: {
            documentType,
            usageTags,
            priority,
            updatedAt: new Date()
          }
        }
      );

      if (updateResult.modifiedCount > 0) {
        console.log(`Updated ${doc.title}: ${documentType}, lessonPlans: ${usageTags.lessonPlans}, profiles: ${usageTags.profiles}`);
        updatedCount++;
      } else {
        console.log(`Failed to update ${doc.title}`);
      }
    }

    console.log(`\nUpdate complete:`);
    console.log(`- Updated: ${updatedCount} documents`);
    console.log(`- Skipped: ${skippedCount} documents (already had new structure)`);

    // Show summary of document types
    const summary = await collection.aggregate([
      {
        $group: {
          _id: '$documentType',
          count: { $sum: 1 },
          categories: { $addToSet: '$category' }
        }
      }
    ]).toArray();

    console.log('\nDocument type summary:');
    summary.forEach(item => {
      console.log(`- ${item._id}: ${item.count} documents (${item.categories.join(', ')})`);
    });

  } catch (error) {
    console.error('Error updating document structure:', error);
  } finally {
    await client.close();
  }
}

updateDocumentStructure();
