import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ConnectionStatusProvider } from './contexts/ConnectionStatusContext';
import { registerSW } from 'virtual:pwa-register';

// Registra o Service Worker imediatamente para suporte PWA offline e instalação no Android e iOS
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConnectionStatusProvider>
      <App />
    </ConnectionStatusProvider>
  </StrictMode>,
);

