import { Handler } from '@netlify/functions';

// Mock state standards data - in a real implementation, this would come from a standards API
const mockStandards = {
  'CA-Math-3': [
    '3.NBT.A.1 - Use place value understanding to round whole numbers to the nearest 10 or 100.',
    '3.NBT.A.2 - Fluently add and subtract within 1000 using strategies and algorithms based on place value.',
    '3.OA.A.1 - Interpret products of whole numbers.',
    '3.OA.A.2 - Interpret whole-number quotients of whole numbers.',
    '3.OA.A.3 - Use multiplication and division within 100 to solve word problems.'
  ],
  'CA-Science-3': [
    '3-LS1-1 - Develop models to describe that organisms have unique and diverse life cycles.',
    '3-LS2-1 - Construct an argument that some animals form groups that help members survive.',
    '3-LS3-1 - Analyze and interpret data to provide evidence that plants and animals have traits inherited from parents.',
    '3-LS4-1 - Analyze and interpret data from fossils to provide evidence of the organisms and the environments in which they lived long ago.'
  ],
  'CA-ELA-3': [
    'RL.3.1 - Ask and answer questions to demonstrate understanding of a text.',
    'RL.3.2 - Recount stories, including fables, folktales, and myths from diverse cultures.',
    'RL.3.3 - Describe characters in a story and explain how their actions contribute to the sequence of events.',
    'W.3.1 - Write opinion pieces on topics or texts, supporting a point of view with reasons.',
    'W.3.2 - Write informative/explanatory texts to examine a topic and convey ideas and information clearly.'
  ],
  'TX-Math-3': [
    '3.2A - Compose and decompose numbers up to 100,000 as a sum of so many ten thousands, so many thousands, so many hundreds, so many tens, and so many ones.',
    '3.2B - Describe the mathematical relationships found in the base-10 place value system through the hundred thousands place.',
    '3.3A - Represent fractions greater than zero and less than or equal to one with denominators of 2, 3, 4, 6, and 8 using concrete objects and pictorial models.',
    '3.4A - Solve with fluency one-step and two-step problems involving addition and subtraction within 1,000.'
  ],
  'TX-Science-3': [
    '3.2A - Plan and implement descriptive investigations, including asking and answering questions, making inferences, and selecting and using equipment or technology.',
    '3.3A - Analyze, evaluate, and critique scientific explanations by using evidence, logical reasoning, and experimental and observational testing.',
    '3.4A - Collect, record, and analyze information using tools, including calculators, microscopes, cameras, computers, hand lenses, metric rulers, Celsius thermometers, prisms, mirrors, pan balances, triple beam balances, spring scales, graduated cylinders, beakers, hot plates, meter sticks, magnets, collecting nets, and notebooks.'
  ],
  'TX-ELA-3': [
    '3.2A - Demonstrate and apply phonetic knowledge by: (i) decoding multisyllabic words with multiple sound-spelling patterns; (ii) decoding multisyllabic words with closed syllables; (iii) decoding multisyllabic words with open syllables.',
    '3.3A - Use print or digital resources to determine meaning, syllabication, and pronunciation.',
    '3.6A - Establish purpose for reading assigned and self-selected texts.',
    '3.7A - Describe personal connections to a variety of sources, including self-selected texts.'
  ],
  'NY-Math-3': [
    '3.NBT.1 - Use place value understanding to round whole numbers to the nearest 10 or 100.',
    '3.NBT.2 - Fluently add and subtract within 1000 using strategies and algorithms based on place value.',
    '3.OA.1 - Interpret products of whole numbers.',
    '3.OA.2 - Interpret whole-number quotients of whole numbers.',
    '3.OA.3 - Use multiplication and division within 100 to solve word problems.'
  ],
  'NY-Science-3': [
    '3-LS1-1 - Develop models to describe that organisms have unique and diverse life cycles.',
    '3-LS2-1 - Construct an argument that some animals form groups that help members survive.',
    '3-LS3-1 - Analyze and interpret data to provide evidence that plants and animals have traits inherited from parents.',
    '3-LS4-1 - Analyze and interpret data from fossils to provide evidence of the organisms and the environments in which they lived long ago.'
  ],
  'NY-ELA-3': [
    '3R1 - Develop and answer questions to locate relevant and specific details in a text to support an answer or inference.',
    '3R2 - Determine a theme or central idea and explain how it is supported by key details; summarize portions of a text.',
    '3R3 - Describe fictional characters, including their traits, motivations, and feelings, and explain how their actions contribute to the plot.',
    '3W1 - Write an argument to support claims with clear reasons and relevant evidence.'
  ]
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { grade, subject, state } = event.queryStringParameters || {};

    if (!grade || !subject || !state) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameters: grade, subject, state' }),
      };
    }

    // Create a key for the standards lookup
    const key = `${state}-${subject}-${grade}`;
    const standards = mockStandards[key as keyof typeof mockStandards] || [];

    // If no standards found, provide a generic response
    if (standards.length === 0) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          standards: [],
          message: `No specific standards found for ${state} ${grade} grade ${subject}. Using general best practices.`
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        standards,
        message: `Found ${standards.length} standards for ${state} ${grade} grade ${subject}`
      }),
    };
  } catch (error) {
    console.error('Error fetching state standards:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch state standards' }),
    };
  }
}; 