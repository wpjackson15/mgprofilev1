"use client";
import * as React from 'react';
import Link from 'next/link';
import { Home, Search, Filter, SortAsc, SortDesc, Tag, Calendar, User, Edit, Trash2, Eye, Download } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
  author?: string;
  version?: string;
  status?: 'draft' | 'published' | 'archived';
  priority?: 'low' | 'medium' | 'high';
  usageCount?: number;
}

export default function EnhancedDocumentsAdmin() {
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = React.useState<Document[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [message, setMessage] = React.useState('');

  // Enhanced filtering and search
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = React.useState('');
  const [selectedPriority, setSelectedPriority] = React.useState('');
  const [selectedDocumentType, setSelectedDocumentType] = React.useState('');
  const [sortBy, setSortBy] = React.useState<'title' | 'createdAt' | 'updatedAt' | 'usageCount'>('createdAt');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = React.useState<'grid' | 'list' | 'table'>('grid');

  // Upload form state
  const [showUploadForm, setShowUploadForm] = React.useState(false);
  const [uploadForm, setUploadForm] = React.useState({
    title: '',
    content: '',
    category: '',
    tags: '',
    status: 'published' as 'draft' | 'published' | 'archived',
    priority: 'medium' as 'low' | 'medium' | 'high',
    documentType: 'both' as 'lesson-plan' | 'profile' | 'general' | 'both',
    usageTags: {
      lessonPlans: true,
      profiles: true,
      examples: false,
      bestPractices: false
    },
    priorityScores: {
      lessonPlans: 7,
      profiles: 7
    }
  });
  const [uploadLoading, setUploadLoading] = React.useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = React.useState<string | null>(null);

  // Statistics
  const [stats, setStats] = React.useState({
    total: 0,
    byCategory: {} as Record<string, number>,
    byStatus: {} as Record<string, number>,
    byPriority: {} as Record<string, number>,
    recentUploads: 0
  });

  React.useEffect(() => {
    fetchDocuments();
  }, []);

  React.useEffect(() => {
    filterAndSortDocuments();
  }, [documents, searchTerm, selectedCategory, selectedTags, selectedStatus, selectedPriority, sortBy, sortOrder]);

  const fetchDocuments = async () => {
    try {
      console.log('Fetching documents...');
      const response = await fetch('/api/v2/documents');
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const docs = await response.json();
        console.log('Documents fetched:', docs.length);
        setDocuments(docs);
        calculateStats(docs);
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setMessage(`Error fetching documents: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (docs: Document[]) => {
    const categoryCount: Record<string, number> = {};
    const statusCount: Record<string, number> = {};
    const priorityCount: Record<string, number> = {};
    
    docs.forEach(doc => {
      // Category stats
      categoryCount[doc.category] = (categoryCount[doc.category] || 0) + 1;
      
      // Status stats
      const status = doc.status || 'published';
      statusCount[status] = (statusCount[status] || 0) + 1;
      
      // Priority stats - handle both object and string formats
      let priorityKey = 'medium';
      if (typeof doc.priority === 'object' && doc.priority) {
        const lessonPlanPriority = doc.priority.lessonPlans || 0;
        const profilePriority = doc.priority.profiles || 0;
        const avgPriority = Math.round((lessonPlanPriority + profilePriority) / 2);
        priorityKey = avgPriority >= 8 ? 'high' : avgPriority >= 5 ? 'medium' : 'low';
      } else if (typeof doc.priority === 'string') {
        priorityKey = doc.priority;
      }
      priorityCount[priorityKey] = (priorityCount[priorityKey] || 0) + 1;
    });

    const recentUploads = docs.filter(doc => {
      const uploadDate = new Date(doc.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return uploadDate > weekAgo;
    }).length;

    setStats({
      total: docs.length,
      byCategory: categoryCount,
      byStatus: statusCount,
      byPriority: priorityCount,
      recentUploads
    });
  };

  const filterAndSortDocuments = () => {
    let filtered = [...documents];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.tags && Array.isArray(doc.tags) && doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }

    // Tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(doc =>
        doc.tags && Array.isArray(doc.tags) && selectedTags.some(tag => doc.tags.includes(tag))
      );
    }

    // Status filter
    if (selectedStatus) {
      filtered = filtered.filter(doc => (doc.status || 'published') === selectedStatus);
    }

    // Priority filter - handle both object and string formats
    if (selectedPriority) {
      filtered = filtered.filter(doc => {
        let docPriority = 'medium';
        if (typeof doc.priority === 'object' && doc.priority) {
          const lessonPlanPriority = doc.priority.lessonPlans || 0;
          const profilePriority = doc.priority.profiles || 0;
          const avgPriority = Math.round((lessonPlanPriority + profilePriority) / 2);
          docPriority = avgPriority >= 8 ? 'high' : avgPriority >= 5 ? 'medium' : 'low';
        } else if (typeof doc.priority === 'string') {
          docPriority = doc.priority;
        }
        return docPriority === selectedPriority;
      });
    }

    // Document type filter
    if (selectedDocumentType) {
      filtered = filtered.filter(doc => doc.documentType === selectedDocumentType);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt || a.createdAt);
          bValue = new Date(b.updatedAt || b.createdAt);
          break;
        case 'usageCount':
          aValue = a.usageCount || 0;
          bValue = b.usageCount || 0;
          break;
        default:
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredDocuments(filtered);
  };

  const getCategoryColor = (category: string) => {
    if (category.includes('format') || category.includes('style') || category.includes('presentation')) {
      return 'bg-blue-100 text-blue-800';
    } else if (category.includes('content') || category.includes('processing') || category.includes('black-genius') || category.includes('cultural') || category.includes('evidence')) {
      return 'bg-green-100 text-green-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };

  const getDocumentTypeColor = (documentType: string) => {
    switch (documentType) {
      case 'lesson-plan': return 'bg-purple-100 text-purple-800';
      case 'profile': return 'bg-orange-100 text-orange-800';
      case 'both': return 'bg-indigo-100 text-indigo-800';
      case 'general': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDocumentTypeLabel = (documentType: string) => {
    switch (documentType) {
      case 'lesson-plan': return 'Lesson Plan';
      case 'profile': return 'Profile';
      case 'both': return 'Both';
      case 'general': return 'General';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPriorityDisplay = (doc: any) => {
    // Handle new priority object format
    if (doc.priority && typeof doc.priority === 'object') {
      const lessonPlanPriority = doc.priority.lessonPlans || 0;
      const profilePriority = doc.priority.profiles || 0;
      const avgPriority = Math.round((lessonPlanPriority + profilePriority) / 2);
      
      if (avgPriority >= 8) return { text: 'High', color: 'bg-red-100 text-red-800' };
      if (avgPriority >= 5) return { text: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
      return { text: 'Low', color: 'bg-green-100 text-green-800' };
    }
    
    // Handle old string format
    const priority = typeof doc.priority === 'string' ? doc.priority : 'medium';
    return { 
      text: priority, 
      color: getPriorityColor(priority) 
    };
  };

  const getAllTags = () => {
    const allTags = new Set<string>();
    documents.forEach(doc => {
      if (doc.tags && Array.isArray(doc.tags)) {
        doc.tags.forEach(tag => allTags.add(tag));
      }
    });
    return Array.from(allTags).sort();
  };

  const getAllCategories = () => {
    const categories = new Set<string>();
    documents.forEach(doc => categories.add(doc.category));
    return Array.from(categories).sort();
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadLoading(true);

    try {
      const response = await fetch('/api/v2/documents/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: uploadForm.title,
          content: uploadForm.content,
          category: uploadForm.category,
          tags: uploadForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          status: uploadForm.status,
          priority: uploadForm.priority,
          documentType: uploadForm.documentType,
          usageTags: uploadForm.usageTags,
          priorityScores: uploadForm.priorityScores
        }),
      });

      if (response.ok) {
        setMessage('Document uploaded successfully!');
        setUploadForm({
          title: '',
          content: '',
          category: '',
          tags: '',
          status: 'published',
          priority: 'medium',
          documentType: 'both',
          usageTags: {
            lessonPlans: true,
            profiles: true,
            examples: false,
            bestPractices: false
          },
          priorityScores: {
            lessonPlans: 7,
            profiles: 7
          }
        });
        setShowUploadForm(false);
        fetchDocuments(); // Refresh the list
      } else {
        const errorText = await response.text();
        setMessage(`Error uploading document: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    try {
      const response = await fetch(`/api/v2/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage('Document deleted successfully!');
        setDeleteConfirm(null);
        fetchDocuments(); // Refresh the list
      } else {
        const errorText = await response.text();
        setMessage(`Error deleting document: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading enhanced document management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enhanced Document Management</h1>
          <p className="text-gray-600 mt-1">Advanced organization and filtering for reference documents</p>
        </div>
        <Link href="/" 
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors font-medium"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Tag className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Recent Uploads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.recentUploads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <User className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-gray-900">{Object.keys(stats.byCategory).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Filter className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Filtered</p>
              <p className="text-2xl font-bold text-gray-900">{filteredDocuments.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Advanced Filters & Search</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search documents..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {getAllCategories().map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Document Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
            <select
              value={selectedDocumentType}
              onChange={(e) => setSelectedDocumentType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="lesson-plan">Lesson Plan</option>
              <option value="profile">Profile</option>
              <option value="both">Both</option>
              <option value="general">General</option>
            </select>
          </div>
        </div>

        {/* Tags Filter */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
          <div className="flex flex-wrap gap-2">
            {getAllTags().map(tag => (
              <button
                key={tag}
                onClick={() => {
                  if (selectedTags.includes(tag)) {
                    setSelectedTags(selectedTags.filter(t => t !== tag));
                  } else {
                    setSelectedTags([...selectedTags, tag]);
                  }
                }}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="title">Title</option>
              <option value="createdAt">Created Date</option>
              <option value="updatedAt">Updated Date</option>
              <option value="usageCount">Usage Count</option>
            </select>
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
          >
            {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <label className="text-sm font-medium text-gray-700">View:</label>
            <div className="flex border border-gray-300 rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 text-sm ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-sm ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 text-sm ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              >
                Table
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upload New Document</h2>
            <button
              onClick={() => setShowUploadForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({...uploadForm, category: e.target.value})}
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
                  <optgroup label="Examples & Quality">
                    <option value="examples">Examples & Templates</option>
                    <option value="best-practices">Best Practices</option>
                  </optgroup>
                  <optgroup label="Other">
                    <option value="research">Research & Background</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={uploadForm.status}
                  onChange={(e) => setUploadForm({...uploadForm, status: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={uploadForm.priority}
                  onChange={(e) => setUploadForm({...uploadForm, priority: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={uploadForm.tags}
                onChange={(e) => setUploadForm({...uploadForm, tags: e.target.value})}
                placeholder="e.g., black genius, education, strengths"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                value={uploadForm.content}
                onChange={(e) => setUploadForm({...uploadForm, content: e.target.value})}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Paste or type the document content here..."
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={uploadLoading}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {uploadLoading ? 'Uploading...' : 'Upload Document'}
              </button>
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Documents Display */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Documents ({filteredDocuments.length})
          </h2>
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            {showUploadForm ? 'Hide Upload Form' : 'Upload New Document'}
          </button>
        </div>

        {filteredDocuments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No documents match your filters.</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {filteredDocuments.map((doc) => (
              <div key={doc._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg line-clamp-2">{doc.title}</h3>
                  <div className="flex items-center gap-1">
                    <button 
                      className="text-gray-400 hover:text-gray-600"
                      title="View document"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      className="text-gray-400 hover:text-gray-600"
                      title="Edit document"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setDeleteConfirm(doc._id)}
                      className="text-gray-400 hover:text-red-600"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(doc.category)}`}>
                    {doc.category}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDocumentTypeColor(doc.documentType || 'general')}`}>
                    {getDocumentTypeLabel(doc.documentType || 'general')}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status || 'published')}`}>
                    {doc.status || 'published'}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityDisplay(doc).color}`}>
                    {getPriorityDisplay(doc).text}
                  </span>
                </div>

                {doc.tags && Array.isArray(doc.tags) && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {doc.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                    {doc.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        +{doc.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Usage Tags */}
                {doc.usageTags && typeof doc.usageTags === 'object' && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {doc.usageTags.lessonPlans === true && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                        Lesson Plans
                      </span>
                    )}
                    {doc.usageTags.profiles === true && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                        Profiles
                      </span>
                    )}
                    {doc.usageTags.examples === true && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        Examples
                      </span>
                    )}
                    {doc.usageTags.bestPractices === true && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        Best Practices
                      </span>
                    )}
                  </div>
                )}

                <p className="text-gray-700 line-clamp-3 mb-3">
                  {doc.content.substring(0, 150)}...
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Created: {new Date(doc.createdAt).toLocaleDateString()}</span>
                  {doc.usageCount !== undefined && (
                    <span>Used {doc.usageCount} times</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this document? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className={`p-4 rounded-md ${
          message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}
