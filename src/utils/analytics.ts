declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Google Analytics Measurement ID (now initialized in HTML head)
const GA_MEASUREMENT_ID = 'G-NTM8XNRYDX';

// Browser fingerprinting for unique visitor identification
const generateVisitorId = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Browser fingerprint', 2, 2);
  }
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.platform,
    navigator.hardwareConcurrency || 'unknown',
    canvas.toDataURL()
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
};

// Track page views
export const trackPageView = (pageTitle?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_title: pageTitle || 'Mohammad Abbass Portfolio',
      page_location: window.location.href,
    });
  }
};

// Track custom events
export const trackEvent = (eventName: string, parameters?: { [key: string]: any }) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, {
      event_category: 'engagement',
      event_label: 'portfolio_interaction',
      ...parameters,
    });
  }
};

// Track terminal commands
export const trackCommand = (command: string) => {
  trackEvent('terminal_command', {
    command_name: command,
    event_category: 'terminal_usage',
  });
};

// Enhanced visitor tracking with unique IDs
export const getViewCount = async (): Promise<number> => {
  if (typeof window !== 'undefined') {
    const visitorLog = localStorage.getItem('portfolio_visitor_log');
    if (visitorLog) {
      try {
        const log = JSON.parse(visitorLog);
        return Object.keys(log).length;
      } catch (error) {
        console.log('Error parsing visitor log:', error);
      }
    }
  }
  return 0;
};

export const incrementViewCount = async (): Promise<number> => {
  if (typeof window !== 'undefined') {
    const visitorId = generateVisitorId();
    let visitorLog: Record<string, any> = {};
    
    try {
      const existingLog = localStorage.getItem('portfolio_visitor_log');
      if (existingLog) {
        visitorLog = JSON.parse(existingLog);
      }
    } catch (error) {
      console.log('Error parsing existing visitor log:', error);
    }
    
    // Add this visitor if not already present
    if (!visitorLog[visitorId]) {
      visitorLog[visitorId] = {
        firstVisit: new Date().toISOString(),
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenSize: `${screen.width}x${screen.height}`,
        platform: navigator.platform
      };
      
      localStorage.setItem('portfolio_visitor_log', JSON.stringify(visitorLog));
    }
    
    return Object.keys(visitorLog).length;
  }
  return 0;
};

// Check if this is a new visitor session
export const isNewVisitor = (): boolean => {
  if (typeof window !== 'undefined') {
    const visitorId = generateVisitorId();
    const visitorLog = localStorage.getItem('portfolio_visitor_log');
    
    if (visitorLog) {
      try {
        const log = JSON.parse(visitorLog);
        return !log[visitorId];
      } catch (error) {
        console.log('Error checking visitor log:', error);
      }
    }
    return true;
  }
  return false;
};

// Initialize visitor tracking
export const initializeVisitorTracking = async () => {
  if (isNewVisitor()) {
    const newCount = await incrementViewCount();
    trackEvent('new_visitor', {
      timestamp: new Date().toISOString(),
      referrer: document.referrer || 'direct',
      visitor_count: newCount,
    });
    console.log('New visitor tracked! Total visitors:', newCount);
  } else {
    console.log('Returning visitor detected');
  }
};

// Get session info with real visitor count
export const getSessionInfo = async () => {
  if (typeof window !== 'undefined') {
    const sessionStart = localStorage.getItem('session_start');
    if (!sessionStart) {
      localStorage.setItem('session_start', Date.now().toString());
    }
    
    const totalViews = await getViewCount();
    const visitorId = generateVisitorId();
    
    return {
      viewCount: totalViews,
      sessionStart: sessionStart ? new Date(parseInt(sessionStart)) : new Date(),
      userAgent: navigator.userAgent,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language,
      isNewSession: !sessionStart,
      visitorId: visitorId,
    };
  }
  return null;
};

// Get visitor statistics
export const getVisitorStats = async () => {
  const totalViews = await getViewCount();
  const sessionInfo = await getSessionInfo();
  
  // Get visitor demographics
  const visitorLog = localStorage.getItem('portfolio_visitor_log');
  let demographics = {
    browsers: {} as Record<string, number>,
    languages: {} as Record<string, number>,
    platforms: {} as Record<string, number>,
  };
  
  if (visitorLog) {
    try {
      const log = JSON.parse(visitorLog);
      Object.values(log).forEach((visitor: any) => {
        // Extract browser from user agent
        const browser = extractBrowser(visitor.userAgent || '');
        demographics.browsers[browser] = (demographics.browsers[browser] || 0) + 1;
        
        // Track languages
        const lang = visitor.language || 'unknown';
        demographics.languages[lang] = (demographics.languages[lang] || 0) + 1;
        
        // Track platforms
        const platform = visitor.platform || 'unknown';
        demographics.platforms[platform] = (demographics.platforms[platform] || 0) + 1;
      });
    } catch (error) {
      console.log('Error parsing visitor demographics:', error);
    }
  }
  
  return {
    totalViews,
    sessionInfo,
    demographics,
    timestamp: new Date().toISOString(),
  };
};

// Helper function to extract browser name
const extractBrowser = (userAgent: string): string => {
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  return 'Unknown';
};

// Get visitor insights
export const getVisitorInsights = async () => {
  const stats = await getVisitorStats();
  
  return {
    totalUniqueVisitors: stats.totalViews,
    topBrowser: Object.entries(stats.demographics.browsers).sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown',
    topLanguage: Object.entries(stats.demographics.languages).sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown',
    topPlatform: Object.entries(stats.demographics.platforms).sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown',
    demographics: stats.demographics,
  };
}; 