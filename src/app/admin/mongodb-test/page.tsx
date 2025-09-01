"use client";
import * as React from 'react';
import { Home, Database, CheckCircle, XCircle } from 'lucide-react';

export default function MongoDBTest() {
  const [testResults, setTestResults] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const runTests = async () => {
    setLoading(true);
    setTestResults(null);

    try {
      // Test 1: Basic connection
      const connectionTest = await fetch('/api/v2/documents');
      const connectionResult = connectionTest.ok ? '✅ Connected' : '❌ Failed';

      // Test 2: Upload a test document
      const uploadTest = await fetch('/api/v2/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'MongoDB Test Document',
          content: 'This is a test document to verify MongoDB operations.',
          category: 'research',
          tags: ['test', 'mongodb']
        })
      });
      const uploadResult = uploadTest.ok ? '✅ Uploaded' : '❌ Failed';

      // Test 3: Fetch documents again
      const fetchTest = await fetch('/api/v2/documents');
      const fetchResult = fetchTest.ok ? '✅ Fetched' : '❌ Failed';

      setTestResults({
        connection: connectionResult,
        upload: uploadResult,
        fetch: fetchResult,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      setTestResults({
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
          <h1 className="text-3xl font-bold text-gray-900">MongoDB Test</h1>
          <p className="text-gray-600 mt-1">Test MongoDB connection and basic operations</p>
        </div>
        <a 
          href="/" 
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors font-medium"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </a>
      </div>

      {/* Test Button */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">MongoDB Operations Test</h2>
        </div>
        
        <button
          onClick={runTests}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {loading ? 'Running Tests...' : 'Run MongoDB Tests'}
        </button>
      </div>

      {/* Results */}
      {testResults && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h2>
          
          {testResults.error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-700 font-medium">Error:</span>
              </div>
              <p className="text-red-600 mt-2">{testResults.error}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-900">Connection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {testResults.connection.includes('✅') ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className={testResults.connection.includes('✅') ? 'text-green-700' : 'text-red-700'}>
                      {testResults.connection}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-900">Upload</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {testResults.upload.includes('✅') ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className={testResults.upload.includes('✅') ? 'text-green-700' : 'text-red-700'}>
                      {testResults.upload}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-900">Fetch</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {testResults.fetch.includes('✅') ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className={testResults.fetch.includes('✅') ? 'text-green-700' : 'text-red-700'}>
                      {testResults.fetch}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-500">
                Tested at: {new Date(testResults.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">What This Tests</h2>
        <div className="space-y-3 text-blue-800">
          <p><strong>Connection Test:</strong> Verifies that the app can connect to MongoDB</p>
          <p><strong>Upload Test:</strong> Tests creating a new document in the database</p>
          <p><strong>Fetch Test:</strong> Tests retrieving documents from the database</p>
          <p><strong>Expected Results:</strong> All tests should show ✅ if MongoDB is working properly</p>
        </div>
      </div>
    </div>
  );
}
