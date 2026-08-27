import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ConnectionStatusProvider } from './contexts/ConnectionStatusContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConnectionStatusProvider>
      <App />
    </ConnectionStatusProvider>
  </StrictMode>,
);

