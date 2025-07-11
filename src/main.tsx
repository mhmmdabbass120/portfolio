import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeVisitorTracking, trackPageView } from './utils/analytics.ts'

// Initialize visitor tracking and page view tracking
initializeVisitorTracking().then(() => {
  console.log('Visitor tracking initialized');
}).catch(error => {
  console.log('Analytics initialization failed:', error);
});

// Track page view (GA already initialized in HTML)
trackPageView('Mohammad Abbass Portfolio');

createRoot(document.getElementById("root")!).render(<App />);
