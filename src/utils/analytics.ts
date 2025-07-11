declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Google Analytics Measurement ID (now initialized in HTML head)
const GA_MEASUREMENT_ID = 'G-NTM8XNRYDX';

// Shared visitor tracking using GitHub API (free and reliable)
const GITHUB_OWNER = 'mhmmdabbass120';
const GITHUB_REPO = 'portfolio-stats';
const GITHUB_FILE = 'visitors.json';

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

// Fallback to simple counting service
const COUNTER_API = 'https://visitor-badge.laobi.icu/badge?page_id=mohammad-abbass-portfolio';

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

// Simple shared counter using multiple approaches
export const getViewCount = async (): Promise<number> => {
  try {
    // Try to get shared visitor count from JSONBin.io (free tier)
    const response = await fetch('https://api.jsonbin.io/v3/b/67914c8fad19ca34f8d5fdee', {
      method: 'GET',
      headers: {
        'X-Master-Key': '$2a$10$HTwKHsLWM8IeBQiY8gO1Euw6KHe5YShjwYKW9ztZUwzYnLb/5NXCS'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.record?.visitorCount || 1;
    }
  } catch (error) {
    console.log('Shared counter API unavailable, using fallback');
  }
  
  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    const localCount = localStorage.getItem('portfolio_visitor_count');
    return localCount ? parseInt(localCount, 10) : 1;
  }
  return 1;
};

export const incrementViewCount = async (): Promise<number> => {
  try {
    // Try to increment shared visitor count
    const currentCount = await getViewCount();
    const newCount = currentCount + 1;
    
    const response = await fetch('https://api.jsonbin.io/v3/b/67914c8fad19ca34f8d5fdee', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': '$2a$10$HTwKHsLWM8IeBQiY8gO1Euw6KHe5YShjwYKW9ztZUwzYnLb/5NXCS'
      },
      body: JSON.stringify({
        visitorCount: newCount,
        lastUpdated: new Date().toISOString()
      })
    });
    
    if (response.ok) {
      return newCount;
    }
  } catch (error) {
    console.log('Shared counter update failed, using fallback');
  }
  
  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    const currentCount = await getViewCount();
    const newCount = currentCount + 1;
    localStorage.setItem('portfolio_visitor_count', newCount.toString());
    return newCount;
  }
  return 1;
};

// Check if this is a new visitor session
export const isNewVisitor = (): boolean => {
  if (typeof window !== 'undefined') {
    const visitorId = generateVisitorId();
    const hasVisited = localStorage.getItem(`visitor_${visitorId}`);
    return !hasVisited;
  }
  return true;
};

// Initialize visitor tracking
export const initializeVisitorTracking = async () => {
  if (isNewVisitor()) {
    const visitorId = generateVisitorId();
    const newCount = await incrementViewCount();
    
    // Mark this visitor as having visited
    if (typeof window !== 'undefined') {
      localStorage.setItem(`visitor_${visitorId}`, JSON.stringify({
        firstVisit: new Date().toISOString(),
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenSize: `${screen.width}x${screen.height}`,
        platform: navigator.platform
      }));
    }
    
    trackEvent('new_visitor', {
      timestamp: new Date().toISOString(),
      referrer: document.referrer || 'direct',
      visitor_count: newCount,
      visitor_id: visitorId,
    });
    
    console.log('New visitor tracked! Total visitors:', newCount);
    return newCount;
  } else {
    console.log('Returning visitor detected');
    return await getViewCount();
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

// Get visitor statistics (enhanced with local demographics)
export const getVisitorStats = async () => {
  const totalViews = await getViewCount();
  const sessionInfo = await getSessionInfo();
  
  // Get local visitor demographics from all stored visitors
  const demographics = {
    browsers: {} as Record<string, number>,
    languages: {} as Record<string, number>,
    platforms: {} as Record<string, number>,
  };
  
  if (typeof window !== 'undefined') {
    // Scan localStorage for visitor data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('visitor_')) {
        try {
          const visitorData = JSON.parse(localStorage.getItem(key) || '{}');
          
          // Extract browser from user agent
          const browser = extractBrowser(visitorData.userAgent || '');
          demographics.browsers[browser] = (demographics.browsers[browser] || 0) + 1;
          
          // Track languages
          const lang = visitorData.language || 'unknown';
          demographics.languages[lang] = (demographics.languages[lang] || 0) + 1;
          
          // Track platforms
          const platform = visitorData.platform || 'unknown';
          demographics.platforms[platform] = (demographics.platforms[platform] || 0) + 1;
        } catch (error) {
          console.log('Error parsing visitor data:', error);
        }
      }
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