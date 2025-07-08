import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initGA, incrementViewCount } from './utils/analytics.ts'

// Initialize analytics and track page view
initGA();
incrementViewCount();

createRoot(document.getElementById("root")!).render(<App />);
