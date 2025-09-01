'use client';

import * as React from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';

interface UsageStats {
  lessonPlansCreated: number;
  pdfUploads: number;
  profilesCreated: number;
  sessionStart: number;
}

export function UsageTracker() {
  const { getUsageStats, exportData } = useAnalytics();
  const [usageStats, setUsageStats] = React.useState<UsageStats>({
    lessonPlansCreated: 0,
    pdfUploads: 0,
    profilesCreated: 0,
    sessionStart: Date.now()
  });
  const [showDetails, setShowDetails] = React.useState(false);

  // Load usage from localStorage on mount
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('mgprofile_usage_stats');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUsageStats(parsed);
      }
    } catch (error) {
      console.warn('Failed to load usage stats:', error);
    }
  }, []);

  // Check if user is approaching limits
  const getLimitStatus = () => {
    const limits = {
      lessonPlans: 3,
      pdfUploads: 1,
      profiles: 5
    };

    return {
      lessonPlans: {
        current: usageStats.lessonPlansCreated,
        limit: limits.lessonPlans,
        remaining: Math.max(0, limits.lessonPlans - usageStats.lessonPlansCreated),
        isAtLimit: usageStats.lessonPlansCreated >= limits.lessonPlans
      },
      pdfUploads: {
        current: usageStats.pdfUploads,
        limit: limits.pdfUploads,
        remaining: Math.max(0, limits.pdfUploads - usageStats.pdfUploads),
        isAtLimit: usageStats.pdfUploads >= limits.pdfUploads
      },
      profiles: {
        current: usageStats.profilesCreated,
        limit: limits.profiles,
        remaining: Math.max(0, limits.profiles - usageStats.profilesCreated),
        isAtLimit: usageStats.profilesCreated >= limits.profiles
      }
    };
  };

  const limitStatus = getLimitStatus();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Usage Tracker</h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Lesson Plans */}
        <div className={`p-3 rounded-lg border ${limitStatus.lessonPlans.isAtLimit ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <div className="text-sm font-medium text-gray-600">Lesson Plans</div>
          <div className="text-2xl font-bold text-gray-800">
            {usageStats.lessonPlansCreated}/{limitStatus.lessonPlans.limit}
          </div>
          <div className="text-xs text-gray-500">
            {limitStatus.lessonPlans.remaining} remaining
          </div>
        </div>

        {/* PDF Uploads */}
        <div className={`p-3 rounded-lg border ${limitStatus.pdfUploads.isAtLimit ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <div className="text-sm font-medium text-gray-600">PDF Uploads</div>
          <div className="text-2xl font-bold text-gray-800">
            {usageStats.pdfUploads}/{limitStatus.pdfUploads.limit}
          </div>
          <div className="text-xs text-gray-500">
            {limitStatus.pdfUploads.remaining} remaining
          </div>
        </div>

        {/* Profiles */}
        <div className={`p-3 rounded-lg border ${limitStatus.profiles.isAtLimit ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <div className="text-sm font-medium text-gray-600">Profiles Created</div>
          <div className="text-2xl font-bold text-gray-800">
            {usageStats.profilesCreated}/{limitStatus.profiles.limit}
          </div>
          <div className="text-xs text-gray-500">
            {limitStatus.profiles.remaining} remaining
          </div>
        </div>
      </div>

      {/* Paywall Warning */}
      {(limitStatus.lessonPlans.isAtLimit || limitStatus.pdfUploads.isAtLimit) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                You&apos;ve reached your free tier limit!
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  {limitStatus.lessonPlans.isAtLimit && "You&apos;ve used all 3 free lesson plans this month. "}
                  {limitStatus.pdfUploads.isAtLimit && "You&apos;ve used your free PDF upload. "}
                  Upgrade to premium for unlimited access!
                </p>
              </div>
              <div className="mt-4">
                <button className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-700">
                  Coming Soon: Upgrade to Premium
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Analytics */}
      {showDetails && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Session Analytics</h4>
          <div className="text-xs text-gray-500 space-y-1">
            <div>Session Duration: {Math.round((Date.now() - usageStats.sessionStart) / 1000 / 60)} minutes</div>
            <div>Total Events: {getUsageStats()?.totalEvents || 0}</div>
            <button
              onClick={() => {
                const data = exportData();
                console.log('Analytics Data:', data);
                alert('Analytics data logged to console');
              }}
              className="text-blue-600 hover:text-blue-800 text-xs"
            >
              Export Analytics Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Export functions to update usage from other components
export const updateUsageStats = {
  lessonPlanCreated: () => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('mgprofile_usage_stats');
    if (stored) {
      const parsed = JSON.parse(stored);
      parsed.lessonPlansCreated = (parsed.lessonPlansCreated || 0) + 1;
      localStorage.setItem('mgprofile_usage_stats', JSON.stringify(parsed));
    }
  },
  pdfUploaded: () => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('mgprofile_usage_stats');
    if (stored) {
      const parsed = JSON.parse(stored);
      parsed.pdfUploads = (parsed.pdfUploads || 0) + 1;
      localStorage.setItem('mgprofile_usage_stats', JSON.stringify(parsed));
    }
  },
  profileCreated: () => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('mgprofile_usage_stats');
    if (stored) {
      const parsed = JSON.parse(stored);
      parsed.profilesCreated = (parsed.profilesCreated || 0) + 1;
      localStorage.setItem('mgprofile_usage_stats', JSON.stringify(parsed));
    }
  }
}; 