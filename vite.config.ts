import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, createLogger } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

function suppressViteHmrPlugin() {
  const scriptContent = `
    (function() {
      // 1. Mock do WebSocket para vite-hmr e vite-ping (evita que o cliente do Vite tente conexões que falham no iframe)
      try {
        var OrigWS = window.WebSocket;
        if (OrigWS) {
          var MockWS = function(url, protocols) {
            var isHmr = false;
            if (typeof protocols === 'string' && (protocols === 'vite-hmr' || protocols === 'vite-ping')) {
              isHmr = true;
            } else if (Array.isArray(protocols) && (protocols.indexOf('vite-hmr') !== -1 || protocols.indexOf('vite-ping') !== -1)) {
              isHmr = true;
            } else if (typeof url === 'string' && (url.indexOf('token=') !== -1 || url.indexOf('vite-hmr') !== -1)) {
              isHmr = true;
            }
            if (isHmr) {
              var target = new EventTarget();
              target.readyState = 1;
              target.CONNECTING = 0;
              target.OPEN = 1;
              target.CLOSING = 2;
              target.CLOSED = 3;
              target.protocol = typeof protocols === 'string' ? protocols : 'vite-hmr';
              target.url = url;
              target.send = function() {};
              target.close = function() {};
              return target;
            }
            return new OrigWS(url, protocols);
          };
          MockWS.prototype = OrigWS.prototype;
          MockWS.CONNECTING = 0;
          MockWS.OPEN = 1;
          MockWS.CLOSING = 2;
          MockWS.CLOSED = 3;
          window.WebSocket = MockWS;
        }
      } catch (e) {}

      // 2. Intercepta mensagens de log de Vite/WebSocket no console
      function isViteLog(arg) {
        if (!arg) return false;
        var s = typeof arg === 'string' ? arg : (arg.message || String(arg));
        return s.indexOf('[vite]') !== -1 || 
               s.toLowerCase().indexOf('websocket') !== -1 || 
               s.indexOf('vite-hmr') !== -1 ||
               s.indexOf('vite-ping') !== -1;
      }

      ['error', 'warn', 'info', 'log'].forEach(function(m) {
        var orig = console[m];
        console[m] = function() {
          for (var i = 0; i < arguments.length; i++) {
            if (isViteLog(arguments[i])) return;
          }
          orig.apply(console, arguments);
        };
      });

      window.addEventListener('error', function(e) {
        if (isViteLog(e.message) || isViteLog(e.error)) {
          e.stopImmediatePropagation();
          e.preventDefault();
        }
      }, true);

      window.addEventListener('unhandledrejection', function(e) {
        if (isViteLog(e.reason)) {
          e.stopImmediatePropagation();
          e.preventDefault();
        }
      }, true);
    })();
  `;

  return {
    name: 'suppress-vite-hmr',
    enforce: 'pre' as const,
    transformIndexHtml: {
      order: 'pre' as const,
      handler() {
        return [
          {
            tag: 'script',
            children: scriptContent,
            injectTo: 'head-prepend' as const,
          },
        ];
      },
    },
  };
}

const customViteLogger = createLogger();
const origError = customViteLogger.error.bind(customViteLogger);
const origWarn = customViteLogger.warn.bind(customViteLogger);
const origInfo = customViteLogger.info.bind(customViteLogger);

customViteLogger.error = (msg, opts) => {
  const str = typeof msg === 'string' ? msg : (msg && (msg as any).message) || String(msg);
  if (str.includes('WebSocket') || str.includes('ws error') || str.includes('vite-hmr') || str.includes('EADDRINUSE')) {
    return;
  }
  origError(msg, opts);
};

customViteLogger.warn = (msg, opts) => {
  const str = typeof msg === 'string' ? msg : (msg && (msg as any).message) || String(msg);
  if (str.includes('WebSocket') || str.includes('ws error') || str.includes('vite-hmr')) {
    return;
  }
  origWarn(msg, opts);
};

customViteLogger.info = (msg, opts) => {
  const str = typeof msg === 'string' ? msg : (msg && (msg as any).message) || String(msg);
  if (str.includes('WebSocket') || str.includes('ws error') || str.includes('vite-hmr')) {
    return;
  }
  origInfo(msg, opts);
};

export default defineConfig(() => {
  return {
    customLogger: customViteLogger,
    plugins: [
      suppressViteHmrPlugin(),
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'icon.svg', 'logo.svg'],
        manifest: {
          id: '/',
          name: 'AuraEstética - Gestão Clínica',
          short_name: 'AuraEstética',
          description: 'Sistema de gestão para clínicas de estética, balcão de recepção, anamnese clínica e fluxo financeiro.',
          theme_color: '#4f46e5',
          background_color: '#0f172a',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          categories: ['medical', 'business', 'productivity'],
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
