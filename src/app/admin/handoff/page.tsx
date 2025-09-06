"use client";
import * as React from 'react';
import { useState } from 'react';
import { Database, RefreshCw, CheckCircle, AlertCircle, Users, FileText } from 'lucide-react';

interface UserProfile {
  userId: string;
  firebaseProgress: any;
  mongodbSummaries: any[];
  summaryCount: number;
}

interface ValidationResult {
  isSynced: boolean;
  firebaseSummaryIds: string[];
  mongodbSummaryIds: string[];
  missingInFirebase: string[];
  missingInMongoDB: string[];
}

export default function HandoffManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({});

  const handleSyncUser = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/v2/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync',
          userId
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess(`Successfully synced summaries for user ${userId}`);
        loadUserProfiles(); // Refresh the list
      } else {
        setError(result.error || 'Sync failed');
      }
    } catch (err) {
      setError('Error syncing user data');
      console.error('Sync error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all summaries first
      const summariesResponse = await fetch('/api/v2/summaries');
      const summariesData = await summariesResponse.json();
      
      if (!summariesData.success) {
        throw new Error('Failed to load summaries');
      }
      
      // Get unique user IDs
      const uniqueUserIds = Array.from(new Set(
        summariesData.summaries
          .map((s: any) => s.userId)
          .filter(Boolean)
      ));
      
      // Load profile data for each user
      const profiles: UserProfile[] = [];
      for (const userId of uniqueUserIds) {
        try {
          const response = await fetch('/api/v2/handoff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'getProfile',
              userId
            })
          });
          
          const result = await response.json();
          if (result.success) {
            profiles.push({
              userId,
              firebaseProgress: result.firebaseProgress,
              mongodbSummaries: result.mongodbSummaries,
              summaryCount: result.summaryCount
            });
          }
        } catch (err) {
          console.error(`Failed to load profile for user ${userId}:`, err);
        }
      }
      
      setUserProfiles(profiles);
    } catch (err) {
      setError('Error loading user profiles');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateUserSync = async (userId: string) => {
    try {
      const response = await fetch('/api/v2/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate',
          userId
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setValidationResults(prev => ({
          ...prev,
          [userId]: result
        }));
      }
    } catch (err) {
      console.error('Validation error:', err);
    }
  };

  const validateAllUsers = async () => {
    for (const profile of userProfiles) {
      await validateUserSync(profile.userId);
    }
  };

  React.useEffect(() => {
    loadUserProfiles();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Firebase-MongoDB Handoff Management</h1>
        <p className="text-gray-600 mt-2">Manage the synchronization between Firebase progress and MongoDB summaries</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Users with Summaries</p>
              <p className="text-2xl font-bold text-gray-900">{userProfiles.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Summaries</p>
              <p className="text-2xl font-bold text-gray-900">
                {userProfiles.reduce((sum, profile) => sum + profile.summaryCount, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <RefreshCw className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Synced Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {Object.values(validationResults).filter(result => result.isSynced).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={loadUserProfiles}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            Refresh Data
          </button>
          
          <button
            onClick={validateAllUsers}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Validate All Users
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <p className="text-green-600">{success}</p>
          </div>
        </div>
      )}

      {/* User Profiles */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">User Profiles</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading user profiles...</p>
          </div>
        ) : userProfiles.length === 0 ? (
          <div className="p-8 text-center">
            <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No user profiles found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {userProfiles.map((profile) => {
              const validation = validationResults[profile.userId];
              const isSynced = validation?.isSynced ?? false;
              
              return (
                <div key={profile.userId} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          User: {profile.userId}
                        </h3>
                        {isSynced ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Synced
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Needs Sync
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">Firebase Progress</h4>
                          <p className="text-gray-600">
                            {profile.firebaseProgress ? (
                              <>
                                Last Updated: {formatDate(profile.firebaseProgress.updatedAt)}<br/>
                                Summary IDs: {profile.firebaseProgress.summaryIds?.length || 0}<br/>
                                Last Sync: {profile.firebaseProgress.lastSummarySync ? formatDate(profile.firebaseProgress.lastSummarySync) : 'Never'}
                              </>
                            ) : (
                              'No Firebase progress found'
                            )}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">MongoDB Summaries</h4>
                          <p className="text-gray-600">
                            Count: {profile.summaryCount}<br/>
                            {profile.mongodbSummaries.length > 0 && (
                              <>
                                Latest: {formatDate(profile.mongodbSummaries[0].createdAt)}<br/>
                                Modules: {profile.mongodbSummaries.map(s => s.profileId.split('-')[2]).join(', ')}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      {validation && !isSynced && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <h5 className="font-medium text-yellow-800 mb-1">Sync Issues:</h5>
                          {validation.missingInFirebase.length > 0 && (
                            <p className="text-sm text-yellow-700">
                              Missing in Firebase: {validation.missingInFirebase.length} summaries
                            </p>
                          )}
                          {validation.missingInMongoDB.length > 0 && (
                            <p className="text-sm text-yellow-700">
                              Missing in MongoDB: {validation.missingInMongoDB.length} summaries
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4 flex flex-col gap-2">
                      <button
                        onClick={() => validateUserSync(profile.userId)}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Validate
                      </button>
                      <button
                        onClick={() => handleSyncUser(profile.userId)}
                        disabled={loading}
                        className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        Sync
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
