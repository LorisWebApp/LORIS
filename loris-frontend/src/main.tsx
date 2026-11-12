import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { registerServiceWorker } from './group-d/pwa/registerServiceWorker';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

registerServiceWorker();

if (import.meta.env.DEV) {
  // Dev-only helper: window.lorisSeedDemo() saves sample materials into IndexedDB.
  void import('./dev/seedDemoMaterials').then((m) => { (window as unknown as Record<string, unknown>).lorisSeedDemo = m.seedDemoMaterials; });
}
