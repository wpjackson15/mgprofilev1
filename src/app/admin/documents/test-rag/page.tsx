"use client";
import * as React from 'react';
import Link from 'next/link';
import { Home, TestTube, FileText, Search } from 'lucide-react';

export default function TestRAGSystem() {
  const [testAnswers, setTestAnswers] = React.useState('');
  const [results, setResults] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const testScenarios = [
    {
      name: "Cultural Identity Focus",
      answers: "My child shows strong pride in our African heritage and often asks about our family history. They love learning about different cultures and traditions.",
      expectedCategories: ['black-genius-elements', 'cultural-context', 'content-guidelines']
    },
    {
      name: "Evidence & Analysis",
      answers: "When my child faces challenges, they demonstrate persistence and seek help from trusted adults. They show evidence of problem-solving skills.",
      expectedCategories: ['evidence-handling', 'processing-framework', 'content-guidelines']
    },
    {
      name: "Format & Style",
      answers: "I want the summary to be well-formatted with clear structure and readable presentation. The tone should be affirming and positive.",
      expectedCategories: ['formatting', 'style', 'presentation', 'technical-format']
    },
    {
      name: "Black Genius Elements",
      answers: "My child displays black genius through their interest awareness and can-do attitude. They navigate multicultural spaces with confidence.",
      expectedCategories: ['black-genius-elements', 'content-guidelines', 'processing-framework']
    }
  ];

  const runTest = async (scenario: any) => {
    setLoading(true);
    setTestAnswers(scenario.answers);
    
    try {
      const response = await fetch('/api/v2/summary/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: [scenario.answers],
          runId: `test-rag-${Date.now()}`,
          profileId: 'test-profile'
        }),
      });

      const result = await response.json();
      setResults({
        scenario: scenario.name,
        expectedCategories: scenario.expectedCategories,
        response: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setResults({
        scenario: scenario.name,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">RAG System Test</h1>
          <p className="text-gray-600 mt-1">Test the enhanced document prioritization system</p>
        </div>
        <Link href="/" 
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors font-medium"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
      </div>

      {/* Test Scenarios */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Test Scenarios
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testScenarios.map((scenario, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">{scenario.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{scenario.answers}</p>
              
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-700 mb-1">Expected Categories:</p>
                <div className="flex flex-wrap gap-1">
                  {scenario.expectedCategories.map(cat => (
                    <span key={cat} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
              
              <button
                onClick={() => runTest(scenario)}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {loading ? 'Testing...' : 'Run Test'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Current Test Input */}
      {testAnswers && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Search className="w-5 h-5" />
            Current Test Input
          </h2>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-gray-700">{testAnswers}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Test Results
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">Scenario: {results.scenario}</h3>
              <p className="text-sm text-gray-500">Tested at: {new Date(results.timestamp).toLocaleString()}</p>
            </div>

            {results.error ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-700 font-medium">Error:</p>
                <p className="text-red-600">{results.error}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Expected Categories:</h4>
                  <div className="flex flex-wrap gap-2">
                    {results.expectedCategories.map((cat: string) => (
                      <span key={cat} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">API Response:</h4>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <pre className="text-sm text-gray-700 overflow-auto">
                      {JSON.stringify(results.response, null, 2)}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Analysis:</h4>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <p className="text-yellow-800 text-sm">
                      <strong>Note:</strong> Check the server console logs to see the document selection process, 
                      including which categories were identified as relevant and which documents were selected 
                      based on the intelligent prioritization system.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">How to Test</h2>
        <div className="space-y-3 text-blue-800">
          <p>1. <strong>Select a test scenario</strong> that focuses on different aspects of document categorization</p>
          <p>2. <strong>Click "Run Test"</strong> to trigger the V2 summary generation with enhanced RAG</p>
          <p>3. <strong>Check server logs</strong> to see the document selection process:</p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Which categories were identified as relevant</li>
            <li>How documents were prioritized</li>
            <li>Which documents were selected for the summary</li>
          </ul>
          <p>4. <strong>Compare results</strong> with expected categories to verify the system is working correctly</p>
        </div>
      </div>
    </div>
  );
}
