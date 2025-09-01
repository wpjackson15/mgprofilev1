"use client";
import * as React from 'react';
import { Home } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
}

export default function DocumentsAdmin() {
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [tags, setTags] = React.useState('');
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/v2/documents/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          category,
          tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setMessage('Document uploaded successfully!');
        setTitle('');
        setContent('');
        setCategory('');
        setTags('');
        fetchDocuments();
      } else {
        const errorText = await response.text();
        console.error('Upload error response:', errorText);
        try {
          const error = JSON.parse(errorText);
          setMessage(`Error: ${error.error}`);
        } catch {
          setMessage(`Error: ${response.status} - ${errorText}`);
        }
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      console.log('Fetching documents...');
      const response = await fetch('/api/v2/documents');
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const docs = await response.json();
        console.log('Documents fetched:', docs.length);
        setDocuments(docs);
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setMessage(`Error fetching documents: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  React.useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Reference Documents Admin</h1>
        <a 
          href="/" 
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors font-medium"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </a>
      </div>
        
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload New Reference Document</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a category...</option>
              <optgroup label="Format & Style">
                <option value="formatting">Formatting Guidelines</option>
                <option value="style">Writing Style & Tone</option>
                <option value="presentation">Presentation & Readability</option>
                <option value="technical-format">Technical Format (JSON/Schema)</option>
              </optgroup>
              <optgroup label="Content & Processing">
                <option value="content-guidelines">Content Guidelines</option>
                <option value="processing-framework">Processing Framework</option>
                <option value="black-genius-elements">Black Genius Elements</option>
                <option value="cultural-context">Cultural Context</option>
                <option value="evidence-handling">Evidence Handling</option>
              </optgroup>
              <optgroup label="Other">
                <option value="research">Research & Background</option>
                <option value="best-practices">Best Practices</option>
                <option value="examples">Examples & Templates</option>
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., black genius, education, strengths"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Paste or type the document content here..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Upload Document'}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded-md ${
            message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {message}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Existing Reference Documents</h2>
        
        {documents.length === 0 ? (
          <p className="text-gray-500">No documents uploaded yet.</p>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => {
              const getCategoryColor = (category: string) => {
                if (category.includes('format') || category.includes('style') || category.includes('presentation')) {
                  return 'bg-blue-100 text-blue-800';
                } else if (category.includes('content') || category.includes('processing') || category.includes('black-genius') || category.includes('cultural') || category.includes('evidence')) {
                  return 'bg-green-100 text-green-800';
                } else {
                  return 'bg-gray-100 text-gray-800';
                }
              };

              return (
                <div key={doc.id} className="border border-gray-200 rounded-md p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">{doc.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(doc.category)}`}>
                      {doc.category}
                    </span>
                  </div>
                  {doc.tags.length > 0 && (
                    <p className="text-sm text-gray-600 mb-2">
                      Tags: {doc.tags.join(', ')}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mb-2">
                    Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-gray-700 line-clamp-3">
                    {doc.content.substring(0, 200)}...
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
