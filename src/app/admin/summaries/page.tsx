"use client";
import * as React from 'react';
import { useState, useEffect } from 'react';
import { FileText, User, Calendar, Search, Filter, Eye } from 'lucide-react';
import { SummaryV2 } from '@/services/mongodb';

export default function ParentSummariesAdmin() {
  const [summaries, setSummaries] = useState<SummaryV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [viewingSummary, setViewingSummary] = useState<SummaryV2 | null>(null);

  useEffect(() => {
    loadSummaries();
  }, []);

  const loadSummaries = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v2/summaries');
      const data = await response.json();
      
      if (data.success) {
        setSummaries(data.summaries);
      } else {
        setError('Failed to load summaries');
      }
    } catch (err) {
      setError('Error loading summaries');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSummariesByUser = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v2/summaries?userId=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setSummaries(data.summaries);
      } else {
        setError('Failed to load summaries for user');
      }
    } catch (err) {
      setError('Error loading summaries for user');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserFilter = (userId: string) => {
    setSelectedUserId(userId);
    if (userId) {
      loadSummariesByUser(userId);
    } else {
      loadSummaries();
    }
  };

  const filteredSummaries = summaries.filter(summary => {
    const matchesSearch = !searchTerm || 
      summary.profileId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      summary.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(summary.summary).toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const uniqueUsers = Array.from(new Set(summaries.map(s => s.userId).filter(Boolean)));

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getModuleFromProfileId = (profileId: string) => {
    // Extract module from profileId format: user-{userId}-{module}-{timestamp}
    const parts = profileId.split('-');
    if (parts.length >= 3) {
      return parts[2]; // The module name
    }
    return 'Unknown';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading parent summaries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Parent Summaries</h1>
        <p className="text-gray-600 mt-2">View and manage summaries created by parents through the chatbot</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Summaries</p>
              <p className="text-2xl font-bold text-gray-900">{summaries.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <User className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unique Parents</p>
              <p className="text-2xl font-bold text-gray-900">{uniqueUsers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Filtered Results</p>
              <p className="text-2xl font-bold text-gray-900">{filteredSummaries.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search summaries, users, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedUserId}
              onChange={(e) => handleUserFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Parents</option>
              {uniqueUsers.map(userId => (
                <option key={userId} value={userId}>
                  {userId}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Summaries List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Parent Summaries</h2>
        </div>
        
        {filteredSummaries.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No summaries found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredSummaries.map((summary) => (
              <div key={summary._id?.toString()} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getModuleFromProfileId(summary.profileId)}
                      </span>
                      {summary.userId && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <User className="w-3 h-3 mr-1" />
                          {summary.userId}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-sm font-medium text-gray-900 mb-1">
                      Profile ID: {summary.profileId}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      Run ID: {summary.runId}
                    </p>
                    
                    <div className="text-sm text-gray-500 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(summary.createdAt)}
                      </span>
                      {summary.model && (
                        <span>Model: {summary.model}</span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setViewingSummary(summary)}
                    className="ml-4 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Detail Modal */}
      {viewingSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Summary Details</h3>
              <button
                onClick={() => setViewingSummary(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Summary Content</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700">
                      {JSON.stringify(viewingSummary.summary, null, 2)}
                    </pre>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Metadata</h4>
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Profile ID:</dt>
                        <dd className="text-gray-900">{viewingSummary.profileId}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Run ID:</dt>
                        <dd className="text-gray-900">{viewingSummary.runId}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">User ID:</dt>
                        <dd className="text-gray-900">{viewingSummary.userId || 'Anonymous'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Model:</dt>
                        <dd className="text-gray-900">{viewingSummary.model || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Created:</dt>
                        <dd className="text-gray-900">{formatDate(viewingSummary.createdAt)}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
