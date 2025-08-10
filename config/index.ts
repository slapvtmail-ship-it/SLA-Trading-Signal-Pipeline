/**
 * Configuration Manager for Live Data Integration
 */

export interface AppConfig {
  gemini: {
    apiKey: string;
    enabled: boolean;
  };
  tradingView: {
    enabled: boolean;
    widgetApi: boolean;
  };
  chartCapture: {
    interval: number;
    analysisInterval: number;
    quality: number;
    format: 'png' | 'jpeg';
  };
  liveData: {
    enabled: boolean;
    symbolRotationInterval: number;
    maxApiCallsPerMinute: number;
  };
  symbols: string[];
}

class ConfigManager {
  private config: AppConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): AppConfig {
    return {
      gemini: {
        apiKey: process.env.GEMINI_API_KEY || '',
        enabled: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
      },
      tradingView: {
        enabled: process.env.TRADINGVIEW_WIDGET_API === 'true',
        widgetApi: true
      },
      chartCapture: {
        interval: parseInt(process.env.CHART_CAPTURE_INTERVAL || '30000'),
        analysisInterval: parseInt(process.env.CHART_ANALYSIS_INTERVAL || '45000'),
        quality: 0.9,
        format: 'png'
      },
      liveData: {
        enabled: process.env.ENABLE_LIVE_DATA === 'true',
        symbolRotationInterval: parseInt(process.env.SYMBOL_ROTATION_INTERVAL || '60000'),
        maxApiCallsPerMinute: parseInt(process.env.MAX_API_CALLS_PER_MINUTE || '10')
      },
      symbols: [
        'BINANCE:BTCUSDT',
        'BINANCE:ETHUSDT',
        'BINANCE:SOLUSDT',
        'BINANCE:ADAUSDT',
        'BINANCE:BNBUSDT',
        'BINANCE:XRPUSDT'
      ]
    };
  }

  getConfig(): AppConfig {
    return this.config;
  }

  isLiveDataEnabled(): boolean {
    return this.config.liveData.enabled && this.config.gemini.enabled;
  }

  isTradingViewEnabled(): boolean {
    return this.config.tradingView.enabled;
  }

  getSymbols(): string[] {
    return this.config.symbols;
  }

  getChartCaptureInterval(): number {
    return this.config.chartCapture.interval;
  }

  getAnalysisInterval(): number {
    return this.config.chartCapture.analysisInterval;
  }

  getSymbolRotationInterval(): number {
    return this.config.liveData.symbolRotationInterval;
  }

  getMaxApiCallsPerMinute(): number {
    return this.config.liveData.maxApiCallsPerMinute;
  }

  updateConfig(updates: Partial<AppConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.config.liveData.enabled && !this.config.gemini.apiKey) {
      errors.push('Gemini API key is required for live data mode');
    }

    if (this.config.chartCapture.interval < 10000) {
      errors.push('Chart capture interval should be at least 10 seconds');
    }

    if (this.config.liveData.maxApiCallsPerMinute > 60) {
      errors.push('API rate limit should not exceed 60 calls per minute');
    }

    if (this.config.symbols.length === 0) {
      errors.push('At least one trading symbol must be configured');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getDemoMode(): boolean {
    return !this.isLiveDataEnabled();
  }

  getEnvironmentInfo(): Record<string, any> {
    return {
      mode: this.getDemoMode() ? 'demo' : 'live',
      geminiEnabled: this.config.gemini.enabled,
      tradingViewEnabled: this.config.tradingView.enabled,
      liveDataEnabled: this.config.liveData.enabled,
      symbolCount: this.config.symbols.length,
      captureInterval: this.config.chartCapture.interval,
      analysisInterval: this.config.chartCapture.analysisInterval
    };
  }
}

// Export singleton instance
export const configManager = new ConfigManager();

// Export default config for easy access
export default configManager;