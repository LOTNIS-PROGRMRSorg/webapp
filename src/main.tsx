import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
import '@/theme/tokens.css';
import '@/styles/styles.css';
import '@/styles/features.css';
import '@/styles/design.css';
import '@/styles/events.css';
import '@/styles/event-detail.css';
import '@/styles/components.css';
import '@/styles/headers.css';

async function start() {
  // Dev-only preview of signed-in screens: ?mock=<state>. Tree-shaken out of production builds.
  if (import.meta.env.DEV && (location.search.includes('mock') || sessionStorage.getItem('lotnis_mock')))
    await import('@/dev/devMock');
  render();
}

function render() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
}

start();
