import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { incrementViewCount } from './utils/analytics.ts'

// Track page view (GA already initialized in HTML)
incrementViewCount();

createRoot(document.getElementById("root")!).render(<App />);
