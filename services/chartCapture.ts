import html2canvas from 'html2canvas';
import type { ChartCaptureConfig, LiveChartData } from '../types';

export class ChartCaptureService {
  private defaultConfig: ChartCaptureConfig = {
    width: 1200,
    height: 800,
    quality: 0.9,
    format: 'png',
    backgroundColor: '#1e1e1e'
  };

  /**
   * Capture a chart screenshot from a DOM element
   */
  async captureChart(
    elementId: string, 
    symbol: string,
    config: Partial<ChartCaptureConfig> = {}
  ): Promise<LiveChartData | null> {
    try {
      // Validate inputs
      if (!elementId || typeof elementId !== 'string') {
        console.error('Invalid elementId provided to captureChart');
        return null;
      }

      if (!symbol || typeof symbol !== 'string') {
        console.error('Invalid symbol provided to captureChart');
        return null;
      }

      const finalConfig = { ...this.defaultConfig, ...config };
      const element = document.getElementById(elementId);
      
      if (!element) {
        console.error(`Chart element with ID "${elementId}" not found`);
        return null;
      }

      // Check if element is visible
      if (element.offsetWidth === 0 || element.offsetHeight === 0) {
        console.warn(`Chart element "${elementId}" is not visible, capture may fail`);
      }

      // Wait for chart to fully load
      await this.waitForChartLoad(element);

      // Capture the chart
      const canvas = await html2canvas(element, {
        width: finalConfig.width,
        height: finalConfig.height,
        backgroundColorColor: finalConfig.backgroundColor || null,
        scale: 1,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: true,
        logging: false
      } as any);

      // Validate canvas
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        console.error('Failed to create valid canvas from chart element');
        return null;
      }

      // Convert to base64
      const imageData = canvas.toDataURL(`image/${finalConfig.format}`, finalConfig.quality);

      // Validate captured image
      if (!this.validateCapture(imageData)) {
        console.error('Captured image failed validation');
        return null;
      }

      // Extract market data from the chart (if available)
      const marketData = this.extractMarketData(element, symbol);
      const technicalIndicators = this.extractTechnicalIndicators(element);

      const result: LiveChartData = {
        symbol,
        timestamp: new Date().toISOString(),
        capturedImage: imageData,
        imageUrl: imageData, // For compatibility
        technicalIndicators,
        marketData
      };

      console.log(`Successfully captured chart for ${symbol}`);
      return result;

    } catch (error) {
      console.error('Chart capture failed:', error);
      return null;
    }
  }

  /**
   * Capture multiple charts in sequence
   */
  async captureMultipleCharts(
    symbols: string[],
    elementIdPrefix: string = 'tradingview-chart'
  ): Promise<LiveChartData[]> {
    const results: LiveChartData[] = [];

    for (const symbol of symbols) {
      const sanitizedSymbol = this.sanitizeSymbol(symbol);
      const elementId = `${elementIdPrefix}-${sanitizedSymbol}`;
      
      const chartData = await this.captureChart(elementId, symbol);  
      if (chartData) {
        results.push(chartData);
      }

      // Add delay between captures to avoid overwhelming the browser
      await this.delay(1000);
    }

    return results;
  }

  /**
   * Wait for chart to fully load before capturing
   */
  private async waitForChartLoad(element: HTMLElement, maxWait: number = 5000): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkLoad = () => {
        // Check if TradingView widget is loaded
        const tvWidget = element.querySelector('[data-widget-type="chart"]');
        const hasContent = element.children.length > 0;
        const hasCanvas = element.querySelector('canvas');
        
        if ((tvWidget || hasCanvas || hasContent) || (Date.now() - startTime > maxWait)) {
          resolve();
        } else {
          setTimeout(checkLoad, 100);
        }
      };
      
      checkLoad();
    });
  }

  /**
   * Extract market data from chart element
   */
  private extractMarketData(element: HTMLElement, symbol: string) {
    // Try to extract price data from TradingView widget or fallback chart
    const priceElement = element.querySelector('.live-price, .tv-symbol-price-quote__value');
    const changeElement = element.querySelector('.live-change, .tv-symbol-price-quote__change');
    
    // Get base price for the symbol
    const basePrice = this.getBasePrice(symbol);
    const currentPrice = priceElement?.textContent ? 
      parseFloat(priceElement.textContent.replace(/[^0-9.-]/g, '')) : basePrice;
    
    const change24h = changeElement?.textContent ? 
      parseFloat(changeElement.textContent.replace(/[^0-9.-]/g, '')) : 0;

    return {
      currentPrice,
      change24h,
      volume24h: Math.random() * 1000000, // Simulated for demo
      high24h: currentPrice * 1.05,
      low24h: currentPrice * 0.95
    };
  }

  /**
   * Extract technical indicators from chart
   */
  private extractTechnicalIndicators(_element: HTMLElement) {
    // In a real implementation, this would extract actual indicator values
    // For now, we'll simulate realistic values
    return {
      rsi: Math.random() * 100,
      macd: (Math.random() - 0.5) * 10,
      bollinger: Math.random() > 0.5 ? 'Upper Band' : 'Lower Band',
      volume: Math.random() * 1000000,
      priceAction: Math.random() > 0.5 ? 'Bullish' : 'Bearish'
    };
  }

  /**
   * Get base price for symbol
   */
  private getBasePrice(symbol: string): number {
    const prices: Record<string, number> = {
      'BTC/USD': 67000,
      'BTCUSDT': 67000,
      'BINANCE:BTCUSDT': 67000,
      'ETH/USD': 3400,
      'ETHUSDT': 3400,
      'BINANCE:ETHUSDT': 3400,
      'SOL/USD': 155,
      'SOLUSDT': 155,
      'BINANCE:SOLUSDT': 155,
      'ADA/USD': 0.45,
      'ADAUSDT': 0.45,
      'BINANCE:ADAUSDT': 0.45
    };
    
    return prices[symbol] || 100;
  }

  /**
   * Sanitize symbol for use in DOM IDs
   */
  private sanitizeSymbol(symbol: string): string {
    return symbol.replace(/[^a-zA-Z0-9]/g, '-');
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate captured image quality
   */
  validateCapture(imageData: string): boolean {
    try {
      // Check if image data is valid base64
      const base64Data = imageData.split(',')[1];
      if (!base64Data || base64Data.length < 1000) {
        return false;
      }

      // Check image size (should be reasonable)
      const sizeInBytes = (base64Data.length * 3) / 4;
      return sizeInBytes > 10000 && sizeInBytes < 5000000; // 10KB to 5MB
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const chartCaptureService = new ChartCaptureService();