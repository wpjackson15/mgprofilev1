'use client';

import * as React from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';

interface AnalyticsEvent {
  event: string;
  timestamp: number;
  properties?: Record<string, string | number | boolean>;
}

interface AnalyticsData {
  totalSessions: number;
  totalLessonPlans: number;
  totalPDFUploads: number;
  totalProfiles: number;
  paywallTriggers: number;
  featureUsage: Record<string, number>;
  recentEvents: AnalyticsEvent[];
}

export function AnalyticsDashboard() {
  const { exportData } = useAnalytics();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalSessions: 0,
    totalLessonPlans: 0,
    totalPDFUploads: 0,
    totalProfiles: 0,
    paywallTriggers: 0,
    featureUsage: {},
    recentEvents: []
  });
  const [showRawData, setShowRawData] = React.useState(false);

  React.useEffect(() => {
    // Load analytics data from localStorage
    if (typeof window === 'undefined') return;

    try {
      const analyticsData = localStorage.getItem('mgprofile_analytics');
      
      if (analyticsData) {
        const parsed = JSON.parse(analyticsData);
        const events = parsed.session?.events || [];
        
        // Calculate statistics
        const stats: AnalyticsData = {
          totalSessions: 1, // For now, just count current session
          totalLessonPlans: events.filter((e: AnalyticsEvent) => e.event === 'lesson_plan_created').length,
          totalPDFUploads: events.filter((e: AnalyticsEvent) => e.event === 'pdf_uploaded').length,
          totalProfiles: events.filter((e: AnalyticsEvent) => e.event === 'profile_created').length,
          paywallTriggers: events.filter((e: AnalyticsEvent) => e.event === 'paywall_triggered').length,
          featureUsage: {} as Record<string, number>,
          recentEvents: events.slice(-10).reverse() // Last 10 events
        };

        // Count feature usage
        events.forEach((event: AnalyticsEvent) => {
          if (event.event === 'feature_used') {
            const feature = event.properties?.feature as string || 'unknown';
            stats.featureUsage[feature] = (stats.featureUsage[feature] || 0) + 1;
          }
        });

        setAnalyticsData(stats);
      }
    } catch (error) {
      console.warn('Failed to load analytics data:', error);
    }
  }, []);

  const exportAnalyticsData = () => {
    const data = exportData();
    const usageData = localStorage.getItem('mgprofile_usage_stats');
    
    const exportObject = {
      analytics: data,
      usage: usageData ? JSON.parse(usageData) : null,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearAnalyticsData = () => {
    if (confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
      localStorage.removeItem('mgprofile_analytics');
      localStorage.removeItem('mgprofile_usage_stats');
      setAnalyticsData({
        totalSessions: 0,
        totalLessonPlans: 0,
        totalPDFUploads: 0,
        totalProfiles: 0,
        paywallTriggers: 0,
        featureUsage: {},
        recentEvents: []
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Analytics Dashboard</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRawData(!showRawData)}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            {showRawData ? 'Hide Raw Data' : 'Show Raw Data'}
          </button>
          <button
            onClick={exportAnalyticsData}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Export Data
          </button>
          <button
            onClick={clearAnalyticsData}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Clear Data
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{analyticsData.totalLessonPlans}</div>
          <div className="text-sm text-blue-800">Lesson Plans Created</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{analyticsData.totalPDFUploads}</div>
          <div className="text-sm text-green-800">PDF Uploads</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{analyticsData.totalProfiles}</div>
          <div className="text-sm text-purple-800">Profiles Created</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{analyticsData.paywallTriggers}</div>
          <div className="text-sm text-yellow-800">Paywall Triggers</div>
        </div>
      </div>

      {/* Feature Usage */}
      {Object.keys(analyticsData.featureUsage).length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-700 mb-3">Feature Usage</h4>
          <div className="space-y-2">
            {Object.entries(analyticsData.featureUsage).map(([feature, count]) => (
              <div key={feature} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-700">{feature}</span>
                <span className="text-sm text-gray-500">{count} uses</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Events */}
      {analyticsData.recentEvents.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-700 mb-3">Recent Events</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {analyticsData.recentEvents.map((event, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-gray-700">{event.event}</span>
                  <span className="text-gray-500 text-xs">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {event.properties && Object.keys(event.properties).length > 0 && (
                  <div className="text-xs text-gray-600 mt-1">
                    {Object.entries(event.properties).map(([key, value]) => (
                      <span key={key} className="mr-2">
                        {key}: {String(value)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw Data */}
      {showRawData && (
        <div className="border-t pt-4">
          <h4 className="text-lg font-medium text-gray-700 mb-3">Raw Analytics Data</h4>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">
            {JSON.stringify(exportData(), null, 2)}
          </pre>
        </div>
      )}

      {/* MVP Testing Notes */}
      <div className="border-t pt-4 mt-6">
        <h4 className="text-lg font-medium text-gray-700 mb-3">MVP Testing Notes</h4>
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>Current Limits:</strong> 3 lesson plans, 1 PDF upload, 5 profiles per session</p>
          <p><strong>Paywall Triggers:</strong> When users hit these limits, they see upgrade prompts</p>
          <p><strong>Key Metrics:</strong> Track which features drive the most engagement</p>
          <p><strong>Next Steps:</strong> Analyze data to determine optimal paywall placement</p>
        </div>
      </div>
    </div>
  );
} 