declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Google Analytics Measurement ID (now initialized in HTML head)
const GA_MEASUREMENT_ID = 'G-NTM8XNRYDX';

// API endpoint for visitor tracking (using a simple free service)
const VISITOR_API_URL = 'https://api.countapi.xyz/hit/mohammad-abbass-portfolio/views';
const VISITOR_GET_URL = 'https://api.countapi.xyz/get/mohammad-abbass-portfolio/views';

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

// Real visitor counter using external API service
export const getViewCount = async (): Promise<number> => {
  try {
    const response = await fetch(VISITOR_GET_URL);
    if (response.ok) {
      const data = await response.json();
      return data.value || 0;
    }
  } catch (error) {
    console.log('Analytics API unavailable, using fallback');
  }
  
  // Fallback to localStorage if API is unavailable
  if (typeof window !== 'undefined') {
    const views = localStorage.getItem('portfolio_views_fallback');
    return views ? parseInt(views, 10) : 0;
  }
  return 0;
};

export const incrementViewCount = async (): Promise<number> => {
  try {
    const response = await fetch(VISITOR_API_URL, { method: 'GET' });
    if (response.ok) {
      const data = await response.json();
      return data.value || 0;
    }
  } catch (error) {
    console.log('Analytics API unavailable, using fallback');
  }
  
  // Fallback to localStorage if API is unavailable
  if (typeof window !== 'undefined') {
    const currentViews = await getViewCount();
    const newViews = currentViews + 1;
    localStorage.setItem('portfolio_views_fallback', newViews.toString());
    return newViews;
  }
  return 0;
};

// Check if this is a new visitor session
export const isNewVisitor = (): boolean => {
  if (typeof window !== 'undefined') {
    const hasVisited = localStorage.getItem('has_visited_portfolio');
    if (!hasVisited) {
      localStorage.setItem('has_visited_portfolio', 'true');
      return true;
    }
  }
  return false;
};

// Initialize visitor tracking
export const initializeVisitorTracking = async () => {
  if (isNewVisitor()) {
    await incrementViewCount();
    trackEvent('new_visitor', {
      timestamp: new Date().toISOString(),
      referrer: document.referrer || 'direct',
    });
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
    
    return {
      viewCount: totalViews,
      sessionStart: sessionStart ? new Date(parseInt(sessionStart)) : new Date(),
      userAgent: navigator.userAgent,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language,
      isNewSession: !sessionStart,
    };
  }
  return null;
};

// Get visitor statistics
export const getVisitorStats = async () => {
  const totalViews = await getViewCount();
  const sessionInfo = await getSessionInfo();
  
  return {
    totalViews,
    sessionInfo,
    timestamp: new Date().toISOString(),
  };
}; 