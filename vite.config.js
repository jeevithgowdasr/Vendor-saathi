import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Build-time environment variable validator Vite plugin
 */
function envValidatorPlugin() {
  return {
    name: 'vite-plugin-env-validator',
    config(config, { mode }) {
      const env = loadEnv(mode, process.cwd(), '');
      const isProd = mode === 'production';
      
      const requiredVars = [
        'VITE_FIREBASE_API_KEY',
        'VITE_FIREBASE_AUTH_DOMAIN',
        'VITE_FIREBASE_PROJECT_ID',
        'VITE_FIREBASE_APP_ID',
        'VITE_STRIPE_PUBLISHABLE_KEY'
      ];

      const missing = [];
      for (const key of requiredVars) {
        const val = env[key];
        if (!val || val.includes('your_') || val.includes('placeholder')) {
          missing.push(key);
        }
      }

      console.log(`\n🛡️  [DevOps Env Check] Mode: ${mode.toUpperCase()}`);
      if (missing.length > 0) {
        const msg = `⚠️  Missing or placeholder environment variables: ${missing.join(', ')}`;
        if (isProd) {
          console.warn(`[Build Safeguard] ${msg} (Falling back to resilient defaults for zero-breakage builds)`);
        } else {
          console.warn(`[Dev Environment] ${msg}`);
        }
      } else {
        console.log('✅ [DevOps Env Check] All required environment variables are set correctly.\n');
      }

      // Check for localhost in production API base URL
      if (isProd && env.VITE_API_BASE_URL && (env.VITE_API_BASE_URL.includes('localhost') || env.VITE_API_BASE_URL.includes('127.0.0.1'))) {
        console.warn('⚠️  [Production Warning] VITE_API_BASE_URL is pointing to localhost. Ensure a cloud endpoint is provided for production deployments.\n');
      }
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    envValidatorPlugin()
  ],
  server: {
    port: 5173,
    host: true
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('@stripe') || id.includes('stripe')) {
              return 'vendor-stripe';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('canvas-confetti') || id.includes('qrcode.react')) {
              return 'vendor-utils';
            }
            return 'vendor-core';
          }
        }
      }
    }
  }
});
