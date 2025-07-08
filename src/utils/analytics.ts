declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Google Analytics Measurement ID (now initialized in HTML head)
const GA_MEASUREMENT_ID = 'G-NTM8XNRYDX';

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

// Simple view counter using localStorage (for demo purposes)
export const getViewCount = (): number => {
  if (typeof window !== 'undefined') {
    const views = localStorage.getItem('portfolio_views');
    return views ? parseInt(views, 10) : 0;
  }
  return 0;
};

export const incrementViewCount = (): number => {
  if (typeof window !== 'undefined') {
    const currentViews = getViewCount();
    const newViews = currentViews + 1;
    localStorage.setItem('portfolio_views', newViews.toString());
    return newViews;
  }
  return 0;
};

// Get session info
export const getSessionInfo = () => {
  if (typeof window !== 'undefined') {
    const sessionStart = localStorage.getItem('session_start');
    if (!sessionStart) {
      localStorage.setItem('session_start', Date.now().toString());
    }
    
    return {
      viewCount: getViewCount(),
      sessionStart: sessionStart ? new Date(parseInt(sessionStart)) : new Date(),
      userAgent: navigator.userAgent,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language,
    };
  }
  return null;
}; 