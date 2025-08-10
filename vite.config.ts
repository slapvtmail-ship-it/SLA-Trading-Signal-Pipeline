import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.TRADINGVIEW_WIDGET_API': JSON.stringify(env.TRADINGVIEW_WIDGET_API),
        'process.env.CHART_CAPTURE_INTERVAL': JSON.stringify(env.CHART_CAPTURE_INTERVAL),
        'process.env.CHART_ANALYSIS_INTERVAL': JSON.stringify(env.CHART_ANALYSIS_INTERVAL),
        'process.env.ENABLE_LIVE_DATA': JSON.stringify(env.ENABLE_LIVE_DATA),
        'process.env.SYMBOL_ROTATION_INTERVAL': JSON.stringify(env.SYMBOL_ROTATION_INTERVAL),
        'process.env.MAX_API_CALLS_PER_MINUTE': JSON.stringify(env.MAX_API_CALLS_PER_MINUTE)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      server: {
        port: 5175,
        host: true
      }
    };
});
