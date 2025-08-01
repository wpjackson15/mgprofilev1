import { useEffect, useCallback } from 'react';

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: number;
}

interface UserSession {
  sessionId: string;
  startTime: number;
  events: AnalyticsEvent[];
}

class AnalyticsService {
  private session: UserSession | null = null;
  private isEnabled = true;

  constructor() {
    // Only enable analytics in production or when explicitly enabled
    this.isEnabled = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true';
  }

  private getSessionId(): string {
    if (!this.session) {
      this.session = {
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        startTime: Date.now(),
        events: []
      };
    }
    return this.session.sessionId;
  }

  track(event: string, properties?: Record<string, any>) {
    if (!this.isEnabled) return;

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: Date.now()
    };

    // Store locally for now (we'll implement server-side storage later)
    this.session?.events.push(analyticsEvent);
    
    // Also log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', event, properties);
    }

    // Store in localStorage for persistence across page reloads
    this.persistToLocalStorage();
  }

  private persistToLocalStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      const analyticsData = {
        session: this.session,
        lastUpdated: Date.now()
      };
      localStorage.setItem('mgprofile_analytics', JSON.stringify(analyticsData));
    } catch (error) {
      console.warn('Failed to persist analytics to localStorage:', error);
    }
  }

  getUsageStats() {
    if (!this.session) return null;

    const events = this.session.events;
    const stats = {
      totalEvents: events.length,
      sessionDuration: Date.now() - this.session.startTime,
      eventCounts: {} as Record<string, number>,
      lastEvent: events[events.length - 1] || null
    };

    events.forEach(event => {
      stats.eventCounts[event.event] = (stats.eventCounts[event.event] || 0) + 1;
    });

    return stats;
  }

  // Export data for analysis
  exportData() {
    return this.session;
  }
}

// Global analytics instance
const analytics = new AnalyticsService();

export function useAnalytics() {
  const track = useCallback((event: string, properties?: Record<string, any>) => {
    analytics.track(event, properties);
  }, []);

  const trackFeatureUsage = useCallback((feature: string, action: string, properties?: Record<string, any>) => {
    track('feature_used', {
      feature,
      action,
      ...properties
    });
  }, [track]);

  const trackLessonPlanCreation = useCallback((properties?: Record<string, any>) => {
    track('lesson_plan_created', {
      timestamp: Date.now(),
      ...properties
    });
  }, [track]);

  const trackPDFUpload = useCallback((properties?: Record<string, any>) => {
    track('pdf_uploaded', {
      timestamp: Date.now(),
      ...properties
    });
  }, [track]);

  const trackProfileCreation = useCallback((properties?: Record<string, any>) => {
    track('profile_created', {
      timestamp: Date.now(),
      ...properties
    });
  }, [track]);

  const trackPaywallTrigger = useCallback((trigger: string, properties?: Record<string, any>) => {
    track('paywall_triggered', {
      trigger,
      timestamp: Date.now(),
      ...properties
    });
  }, [track]);

  return {
    track,
    trackFeatureUsage,
    trackLessonPlanCreation,
    trackPDFUpload,
    trackProfileCreation,
    trackPaywallTrigger,
    getUsageStats: analytics.getUsageStats.bind(analytics),
    exportData: analytics.exportData.bind(analytics)
  };
} 