import { useCallback, useRef, useEffect, useState } from 'react';

// Type definitions
interface AnalyticsEvent {
  event: string;
  properties?: Record<string, string | number | boolean>;
  timestamp: number;
}

interface UserSession {
  sessionId: string;
  startTime: number;
  events: AnalyticsEvent[];
}

interface UsageStats {
  totalEvents: number;
  sessionDuration: number;
  eventCounts: Record<string, number>;
  lastEvent: AnalyticsEvent | null;
}

interface AnalyticsData {
  session: UserSession | null;
  lastUpdated: number;
}

// Custom hook for localStorage persistence
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}

// Main analytics hook
export function useAnalytics() {
  const sessionRef = useRef<UserSession | null>(null);
  const [analyticsData, setAnalyticsData] = useLocalStorage<AnalyticsData>('mgprofile_analytics', {
    session: null,
    lastUpdated: Date.now()
  });

  // Initialize session on mount
  useEffect(() => {
    if (!sessionRef.current) {
      sessionRef.current = {
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        startTime: Date.now(),
        events: []
      };
      
      setAnalyticsData(prev => ({
        ...prev,
        session: sessionRef.current,
        lastUpdated: Date.now()
      }));
    }
  }, [setAnalyticsData]);

  // Track event function
  const track = useCallback((event: string, properties?: Record<string, string | number | boolean>) => {
    if (!sessionRef.current) return;

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: Date.now()
    };

    sessionRef.current.events.push(analyticsEvent);
    
    // Update localStorage
    setAnalyticsData(prev => ({
      ...prev,
      session: sessionRef.current,
      lastUpdated: Date.now()
    }));

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', event, properties);
    }
  }, [setAnalyticsData]);

  // Specific tracking functions
  const trackFeatureUsage = useCallback((feature: string, action: string, properties?: Record<string, string | number | boolean>) => {
    track('feature_used', {
      feature,
      action,
      ...properties
    });
  }, [track]);

  const trackLessonPlanCreation = useCallback((properties?: Record<string, string | number | boolean>) => {
    track('lesson_plan_created', {
      timestamp: Date.now(),
      ...properties
    });
  }, [track]);

  const trackPDFUpload = useCallback((properties?: Record<string, string | number | boolean>) => {
    track('pdf_uploaded', {
      timestamp: Date.now(),
      ...properties
    });
  }, [track]);

  const trackProfileCreation = useCallback((properties?: Record<string, string | number | boolean>) => {
    track('profile_created', {
      timestamp: Date.now(),
      ...properties
    });
  }, [track]);

  const trackPaywallTrigger = useCallback((trigger: string, properties?: Record<string, string | number | boolean>) => {
    track('paywall_triggered', {
      trigger,
      timestamp: Date.now(),
      ...properties
    });
  }, [track]);

  // Get usage statistics
  const getUsageStats = useCallback((): UsageStats | null => {
    if (!sessionRef.current) return null;

    const events = sessionRef.current.events;
    const stats: UsageStats = {
      totalEvents: events.length,
      sessionDuration: Date.now() - sessionRef.current.startTime,
      eventCounts: {},
      lastEvent: events[events.length - 1] || null
    };

    events.forEach(event => {
      stats.eventCounts[event.event] = (stats.eventCounts[event.event] || 0) + 1;
    });

    return stats;
  }, []);

  // Export data for analysis
  const exportData = useCallback(() => {
    return sessionRef.current;
  }, []);

  return {
    track,
    trackFeatureUsage,
    trackLessonPlanCreation,
    trackPDFUpload,
    trackProfileCreation,
    trackPaywallTrigger,
    getUsageStats,
    exportData
  };
} 