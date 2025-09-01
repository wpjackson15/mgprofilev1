"use client";
import * as React from 'react';
import Link from 'next/link';
import { Home, BookOpen, TestTube, CheckCircle, XCircle } from 'lucide-react';

export default function LessonPlanRAGTest() {
  const [testResults, setTestResults] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const testScenarios = [
    {
      name: "Elementary Math - Cultural Connection",
      data: {
        studentProfiles: [
          { profile: "Student loves music and rhythm, shows strong spatial reasoning, enjoys collaborative activities" }
        ],
        grade: "3rd Grade",
        subject: "Mathematics",
        calesCriteria: {
          canDoAttitude: true,
          interestAwareness: true,
          multiculturalNavigation: true,
          racialPride: false,
          selectiveTrust: false,
          socialJustice: false,
          holisticWellBeing: true,
          clarity: true,
          accessibility: true,
          credibility: false,
          outcomes: true
        },
        prompt: "Create a lesson on fractions using cultural music and rhythm"
      }
    },
    {
      name: "Middle School ELA - Social Justice",
      data: {
        studentProfiles: [
          { profile: "Student is passionate about social issues, strong reader, enjoys writing and debate" },
          { profile: "Student loves storytelling, connects well with peers, interested in current events" }
        ],
        grade: "7th Grade",
        subject: "English Language Arts",
        calesCriteria: {
          canDoAttitude: true,
          interestAwareness: true,
          multiculturalNavigation: true,
          racialPride: true,
          selectiveTrust: true,
          socialJustice: true,
          holisticWellBeing: true,
          clarity: true,
          accessibility: true,
          credibility: true,
          outcomes: true
        },
        prompt: "Design a lesson on persuasive writing about social justice issues"
      }
    },
    {
      name: "High School Science - Black Genius Elements",
      data: {
        studentProfiles: [
          { profile: "Student shows strong analytical thinking, interested in environmental science, enjoys hands-on experiments" }
        ],
        grade: "10th Grade",
        subject: "Biology",
        calesCriteria: {
          canDoAttitude: true,
          interestAwareness: true,
          multiculturalNavigation: true,
          racialPride: true,
          selectiveTrust: false,
          socialJustice: false,
          holisticWellBeing: true,
          clarity: true,
          accessibility: true,
          credibility: true,
          outcomes: true
        },
        prompt: "Create a lesson on genetics that celebrates diverse contributions to science"
      }
    }
  ];

  const runTest = async (scenario: any) => {
    setLoading(true);
    setTestResults(null);

    try {
      const response = await fetch('/api/v2/lesson-plans/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scenario.data),
      });

      if (response.ok) {
        const result = await response.json();
        setTestResults({
          success: true,
          scenario: scenario.name,
          enhancedPrompt: result.enhancedPrompt,
          documentContext: result.documentContext,
          timestamp: new Date().toISOString()
        });
      } else {
        const errorText = await response.text();
        setTestResults({
          success: false,
          scenario: scenario.name,
          error: errorText,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      setTestResults({
        success: false,
        scenario: scenario.name,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lesson Plan RAG Test</h1>
            <p className="text-gray-600 mt-1">Test the enhanced knowledge library for lesson plan generation</p>
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
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Lesson Plan Test Scenarios</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testScenarios.map((scenario, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{scenario.name}</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Grade: {scenario.data.grade}<br/>
                  Subject: {scenario.data.subject}<br/>
                  Students: {scenario.data.studentProfiles.length}
                </p>
                <button
                  onClick={() => runTest(scenario)}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                >
                  {loading ? 'Testing...' : 'Run Test'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        {testResults && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h2>
            
            {testResults.success ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-700 font-medium">Success:</span>
                    <span className="text-green-600">{testResults.scenario}</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Document Context Preview:</h3>
                  <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-700">
                    {testResults.documentContext}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Enhanced Prompt Preview:</h3>
                  <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-700 max-h-40 overflow-y-auto">
                    {testResults.enhancedPrompt.substring(0, 500)}...
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  Tested at: {new Date(testResults.timestamp).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-700 font-medium">Error:</span>
                </div>
                <p className="text-red-600 mt-2">{testResults.error}</p>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">How This Works</h2>
          <div className="space-y-3 text-blue-800">
            <p><strong>Enhanced Knowledge Library:</strong> Uses the same document database but with lesson plan-specific prioritization</p>
            <p><strong>Different Priorities:</strong> Lesson plans prioritize 'best-practices', 'examples', and 'processing-framework' over other categories</p>
            <p><strong>Context-Aware Selection:</strong> Analyzes grade level, subject, and CALES criteria to select relevant documents</p>
            <p><strong>Balanced Output:</strong> Ensures diversity in document categories for comprehensive lesson planning</p>
            <p><strong>Expected Results:</strong> Each test should show different document selections based on the scenario</p>
          </div>
        </div>
      </div>
    </div>
  );
}
