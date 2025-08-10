/**
 * Enhanced Live Data Pipeline Manager
 * Phase 4: Complete Live Data Pipeline Implementation
 */

import { marketDataService, LiveMarketData } from './marketDataService';
import { chartCaptureService } from './chartCapture';
import configManager from '../config';

export interface PipelineSignal {
  id: string;
  symbol: string;
  timestamp: string;
  direction: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  reasoning: string;
  technicalAnalysis: string;
  marketData: LiveMarketData;
  chartAnalysis?: any;
  riskScore: number;
  signalStrength: number;
  timeframe: string;
  status: 'PENDING' | 'ACTIVE' | 'EXECUTED' | 'CANCELLED';
}

export interface PipelineMetrics {
  totalSignals: number;
  activeSignals: number;
  successRate: number;
  avgConfidence: number;
  avgLatency: number;
  errorRate: number;
  throughput: number;
  lastProcessTime: number;
}

export interface PipelineEvent {
  type: 'SIGNAL_GENERATED' | 'SIGNAL_EXECUTED' | 'ERROR' | 'STATUS_UPDATE';
  timestamp: string;
  data: any;
}

class LiveDataPipeline {
  private isRunning = false;
  private signals: Map<string, PipelineSignal> = new Map();
  private metrics: PipelineMetrics = {
    totalSignals: 0,
    activeSignals: 0,
    successRate: 0,
    avgConfidence: 0,
    avgLatency: 0,
    errorRate: 0,
    throughput: 0,
    lastProcessTime: 0
  };
  
  private eventListeners: ((event: PipelineEvent) => void)[] = [];
  private processingQueue: string[] = [];
  private isProcessing = false;
  private lastProcessedSymbol = '';
  private symbolRotationIndex = 0;
  private startTime = 0;
  private processedCount = 0;
  private errorCount = 0;
  private latencySum = 0;

  constructor() {
    this.initializePipeline();
  }

  /**
   * Initialize the live data pipeline
   */
  private initializePipeline(): void {
    console.log('🔧 Initializing Live Data Pipeline...');
    
    // Subscribe to market data updates
    const symbols = configManager.getSymbols();
    symbols.forEach(symbol => {
      marketDataService.subscribe(symbol, (data) => {
        this.handleMarketDataUpdate(symbol, data);
      });
    });
  }

  /**
   * Start the live data pipeline
   */
  async startPipeline(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Pipeline already running');
      return;
    }

    try {
      this.isRunning = true;
      this.startTime = Date.now();
      
      // Start market data service
      marketDataService.startLiveData();
      
      // Start symbol rotation for chart capture
      this.startSymbolRotation();
      
      // Start metrics collection
      this.startMetricsCollection();
      
      this.emitEvent({
        type: 'STATUS_UPDATE',
        timestamp: new Date().toISOString(),
        data: { status: 'STARTED', message: 'Live data pipeline started successfully' }
      });
      
      console.log('🚀 Live Data Pipeline started successfully');
      
    } catch (error) {
      this.isRunning = false;
      console.error('❌ Failed to start Live Data Pipeline:', error);
      throw error;
    }
  }

  /**
   * Stop the live data pipeline
   */
  async stopPipeline(): Promise<void> {
    if (!this.isRunning) {
      console.log('⚠️ Pipeline not running');
      return;
    }

    this.isRunning = false;
    
    // Stop market data service
    marketDataService.stopLiveData();
    
    // Clear processing queue
    this.processingQueue = [];
    this.isProcessing = false;
    
    this.emitEvent({
      type: 'STATUS_UPDATE',
      timestamp: new Date().toISOString(),
      data: { status: 'STOPPED', message: 'Live data pipeline stopped' }
    });
    
    console.log('⏹️ Live Data Pipeline stopped');
  }

  /**
   * Handle market data updates
   */
  private handleMarketDataUpdate(symbol: string, _data: LiveMarketData): void {
    if (!this.isRunning) return;

    // Add to processing queue if not already queued
    if (!this.processingQueue.includes(symbol)) {
      this.processingQueue.push(symbol);
    }

    // Process queue if not currently processing
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process the symbol queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) return;

    this.isProcessing = true;

    while (this.processingQueue.length > 0 && this.isRunning) {
      const symbol = this.processingQueue.shift()!;
      await this.processSymbol(symbol);
      
      // Small delay to prevent overwhelming
      await this.delay(100);
    }

    this.isProcessing = false;
  }

  /**
   * Process a single symbol
   */
  private async processSymbol(symbol: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      const marketData = marketDataService.getCurrentData(symbol);
      if (!marketData) return;

      // Check if signal generation is needed
      if (this.shouldGenerateSignal(symbol, marketData)) {
        await this.generateSignal(symbol, marketData);
      }

      // Update metrics
      const latency = Date.now() - startTime;
      this.updateLatencyMetrics(latency);
      this.processedCount++;

    } catch (error) {
      console.error(`❌ Error processing symbol ${symbol}:`, error);
      this.errorCount++;
      
      this.emitEvent({
        type: 'ERROR',
        timestamp: new Date().toISOString(),
        data: { symbol, error: error instanceof Error ? error.message : String(error) }
      });
    }
  }

  /**
   * Determine if signal generation is needed
   */
  private shouldGenerateSignal(symbol: string, data: LiveMarketData): boolean {
    // Check various conditions for signal generation
    const conditions = [
      this.checkVolatilityCondition(data),
      this.checkTechnicalCondition(data),
      this.checkSentimentCondition(data),
      this.checkTimeCondition(symbol)
    ];

    // Generate signal if at least 2 conditions are met
    return conditions.filter(Boolean).length >= 2;
  }

  private checkVolatilityCondition(data: LiveMarketData): boolean {
    return Math.abs(data.tick.change24h) > 3; // 3% change
  }

  private checkTechnicalCondition(data: LiveMarketData): boolean {
    const { rsi, macd } = data.technicals;
    return (rsi < 30 || rsi > 70) || (macd.macd > macd.signal);
  }

  private checkSentimentCondition(data: LiveMarketData): boolean {
    return Math.abs(data.sentiment.score) > 0.5 && data.sentiment.confidence > 0.7;
  }

  private checkTimeCondition(symbol: string): boolean {
    const lastSignal = Array.from(this.signals.values())
      .filter(s => s.symbol === symbol)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    
    if (!lastSignal) return true;
    
    const timeSinceLastSignal = Date.now() - new Date(lastSignal.timestamp).getTime();
    return timeSinceLastSignal > 300000; // 5 minutes
  }

  /**
   * Generate trading signal
   */
  private async generateSignal(symbol: string, marketData: LiveMarketData): Promise<void> {
    try {
      // Capture chart for analysis
      const chartData = await this.captureChartForAnalysis(symbol);
      
      // Generate signal using market data and chart analysis
      const signal = await this.createTradingSignal(symbol, marketData, chartData);
      
      // Store signal
      this.signals.set(signal.id, signal);
      this.metrics.totalSignals++;
      this.metrics.activeSignals++;
      
      // Emit signal event
      this.emitEvent({
        type: 'SIGNAL_GENERATED',
        timestamp: new Date().toISOString(),
        data: signal
      });
      
      console.log(`📊 Generated signal for ${symbol}: ${signal.direction} at ${signal.entryPrice}`);
      
    } catch (error) {
      console.error(`❌ Failed to generate signal for ${symbol}:`, error);
      this.errorCount++;
    }
  }

  /**
   * Capture chart for analysis
   */
  private async captureChartForAnalysis(symbol: string): Promise<any> {
    try {
      // Sanitize symbol for DOM ID (same as VisionPanel)
      const sanitizedSymbol = symbol.replace(/[^a-zA-Z0-9]/g, '-');
      const elementId = `tradingview-chart-${sanitizedSymbol}`;
      const result = await chartCaptureService.captureChart(elementId, symbol);
      return result;
    } catch (error) {
      console.warn(`⚠️ Chart capture failed for ${symbol}, using market data only`);
      return null;
    }
  }

  /**
   * Create trading signal from analysis
   */
  private async createTradingSignal(
    symbol: string, 
    marketData: LiveMarketData, 
    chartData?: any
  ): Promise<PipelineSignal> {
    
    const currentPrice = marketData.tick.price;
    const { technicals, sentiment } = marketData;
    
    // Determine direction based on multiple factors
    const direction = this.determineDirection(marketData, chartData);
    
    // Calculate entry, stop loss, and take profit
    const { entryPrice, stopLoss, takeProfit } = this.calculateLevels(
      currentPrice, 
      direction, 
      technicals
    );
    
    // Calculate confidence and risk
    const confidence = this.calculateConfidence(marketData, chartData);
    const riskScore = this.calculateRiskScore(marketData, direction);
    const signalStrength = this.calculateSignalStrength(marketData, sentiment);
    
    // Generate reasoning
    const reasoning = this.generateReasoning(marketData, direction, chartData);
    const technicalAnalysis = this.generateTechnicalAnalysis(technicals);
    
    const signal: PipelineSignal = {
      id: `signal_${symbol}_${Date.now()}`,
      symbol,
      timestamp: new Date().toISOString(),
      direction,
      confidence,
      entryPrice,
      stopLoss,
      takeProfit,
      reasoning,
      technicalAnalysis,
      marketData,
      chartAnalysis: chartData,
      riskScore,
      signalStrength,
      timeframe: '5m',
      status: 'PENDING'
    };
    
    return signal;
  }

  /**
   * Determine trade direction
   */
  private determineDirection(marketData: LiveMarketData, chartData?: any): 'BUY' | 'SELL' | 'HOLD' {
    const { technicals, sentiment } = marketData;
    let score = 0;
    
    // Technical indicators
    if (technicals.rsi < 30) score += 2; // Oversold
    if (technicals.rsi > 70) score -= 2; // Overbought
    if (technicals.macd.macd > technicals.macd.signal) score += 1;
    if (technicals.ema.ema12 > technicals.ema.ema26) score += 1;
    
    // Sentiment
    score += sentiment.score * 2;
    
    // Price action
    if (marketData.tick.change24h > 5) score += 1;
    if (marketData.tick.change24h < -5) score -= 1;
    
    // Chart analysis (if available)
    if (chartData?.analysis) {
      if (chartData.analysis.includes('bullish')) score += 1;
      if (chartData.analysis.includes('bearish')) score -= 1;
    }
    
    if (score >= 2) return 'BUY';
    if (score <= -2) return 'SELL';
    return 'HOLD';
  }

  /**
   * Calculate price levels
   */
  private calculateLevels(currentPrice: number, direction: string, technicals: any): any {
    const entryPrice = currentPrice;
    let stopLoss: number;
    let takeProfit: number;
    
    if (direction === 'BUY') {
      stopLoss = Math.min(entryPrice * 0.98, technicals.bollinger.lower);
      takeProfit = Math.max(entryPrice * 1.04, technicals.bollinger.upper);
    } else if (direction === 'SELL') {
      stopLoss = Math.max(entryPrice * 1.02, technicals.bollinger.upper);
      takeProfit = Math.min(entryPrice * 0.96, technicals.bollinger.lower);
    } else {
      stopLoss = entryPrice * 0.99;
      takeProfit = entryPrice * 1.01;
    }
    
    return { entryPrice, stopLoss, takeProfit };
  }

  /**
   * Calculate signal confidence
   */
  private calculateConfidence(marketData: LiveMarketData, chartData?: any): number {
    let confidence = 0.5; // Base confidence
    
    // Technical alignment
    const { technicals } = marketData;
    if (technicals.rsi < 30 || technicals.rsi > 70) confidence += 0.1;
    if (technicals.macd.macd > technicals.macd.signal) confidence += 0.1;
    
    // Sentiment confidence
    confidence += marketData.sentiment.confidence * 0.2;
    
    // Volume confirmation
    if (technicals.volume.ratio > 1.2) confidence += 0.1;
    
    // Chart analysis boost
    if (chartData?.confidence) confidence += chartData.confidence * 0.1;
    
    return Math.min(0.95, Math.max(0.1, confidence));
  }

  /**
   * Calculate risk score
   */
  private calculateRiskScore(marketData: LiveMarketData, _direction: string): number {
    let risk = 0.5; // Base risk
    
    // Volatility risk
    const volatility = Math.abs(marketData.tick.change24h) / 100;
    risk += volatility * 0.3;
    
    // Spread risk
    const spreadRisk = marketData.tick.spread / marketData.tick.price;
    risk += spreadRisk * 10;
    
    // Market sentiment risk
    if (Math.abs(marketData.sentiment.score) < 0.3) risk += 0.2; // Uncertain sentiment
    
    return Math.min(1.0, Math.max(0.1, risk));
  }

  /**
   * Calculate signal strength
   */
  private calculateSignalStrength(marketData: LiveMarketData, sentiment: any): number {
    let strength = 0.5;
    
    // Technical strength
    const { technicals } = marketData;
    if (technicals.rsi < 20 || technicals.rsi > 80) strength += 0.2;
    if (Math.abs(technicals.macd.histogram) > 0.5) strength += 0.1;
    
    // Sentiment strength
    strength += Math.abs(sentiment.score) * 0.3;
    
    // Volume strength
    if (technicals.volume.ratio > 1.5) strength += 0.2;
    
    return Math.min(1.0, Math.max(0.1, strength));
  }

  /**
   * Generate reasoning text
   */
  private generateReasoning(marketData: LiveMarketData, _direction: string, _chartData?: any): string {
    const reasons: string[] = [];
    const { technicals, sentiment } = marketData;
    
    // Technical reasons
    if (technicals.rsi < 30) reasons.push('RSI indicates oversold conditions');
    if (technicals.rsi > 70) reasons.push('RSI indicates overbought conditions');
    if (technicals.macd.macd > technicals.macd.signal) reasons.push('MACD showing bullish crossover');
    
    // Sentiment reasons
    if (sentiment.score > 0.5) reasons.push('Positive market sentiment detected');
    if (sentiment.score < -0.5) reasons.push('Negative market sentiment detected');
    
    // Volume reasons
    if (technicals.volume.ratio > 1.3) reasons.push('Above-average volume supporting the move');
    
    // Price action
    if (Math.abs(marketData.tick.change24h) > 5) {
      reasons.push(`Strong ${marketData.tick.change24h > 0 ? 'upward' : 'downward'} momentum`);
    }
    
    return reasons.join('. ') + '.';
  }

  /**
   * Generate technical analysis text
   */
  private generateTechnicalAnalysis(technicals: any): string {
    const analysis: string[] = [];
    
    analysis.push(`RSI: ${technicals.rsi.toFixed(1)}`);
    analysis.push(`MACD: ${technicals.macd.macd.toFixed(3)}`);
    analysis.push(`EMA12/26: ${(technicals.ema.ema12/technicals.ema.ema26).toFixed(3)}`);
    analysis.push(`Volume Ratio: ${technicals.volume.ratio.toFixed(2)}`);
    
    return analysis.join(' | ');
  }

  /**
   * Start symbol rotation for chart capture
   */
  private startSymbolRotation(): void {
    const symbols = configManager.getSymbols();
    const rotationInterval = configManager.getChartCaptureInterval();
    
    setInterval(() => {
      if (!this.isRunning) return;
      
      const symbol = symbols[this.symbolRotationIndex];
      this.lastProcessedSymbol = symbol;
      
      // Trigger processing for this symbol
      if (!this.processingQueue.includes(symbol)) {
        this.processingQueue.push(symbol);
      }
      
      this.symbolRotationIndex = (this.symbolRotationIndex + 1) % symbols.length;
    }, rotationInterval);
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    setInterval(() => {
      this.updateMetrics();
    }, 5000); // Update every 5 seconds
  }

  /**
   * Update pipeline metrics
   */
  private updateMetrics(): void {
    const now = Date.now();
    const uptime = now - this.startTime;
    
    this.metrics.activeSignals = Array.from(this.signals.values())
      .filter(s => s.status === 'ACTIVE' || s.status === 'PENDING').length;
    
    if (this.processedCount > 0) {
      this.metrics.successRate = ((this.processedCount - this.errorCount) / this.processedCount) * 100;
      this.metrics.errorRate = (this.errorCount / this.processedCount) * 100;
      this.metrics.avgLatency = this.latencySum / this.processedCount;
      this.metrics.throughput = (this.processedCount / uptime) * 1000 * 60; // per minute
    }
    
    // Calculate average confidence
    const activeSignals = Array.from(this.signals.values());
    if (activeSignals.length > 0) {
      this.metrics.avgConfidence = activeSignals.reduce((sum, s) => sum + s.confidence, 0) / activeSignals.length;
    }
    
    this.metrics.lastProcessTime = now;
  }

  /**
   * Update latency metrics
   */
  private updateLatencyMetrics(latency: number): void {
    this.latencySum += latency;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Emit pipeline event
   */
  private emitEvent(event: PipelineEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in pipeline event listener:', error);
      }
    });
  }

  /**
   * Subscribe to pipeline events
   */
  addEventListener(listener: (event: PipelineEvent) => void): () => void {
    this.eventListeners.push(listener);
    
    return () => {
      const index = this.eventListeners.indexOf(listener);
      if (index > -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current pipeline status
   */
  getStatus(): any {
    return {
      isRunning: this.isRunning,
      metrics: this.metrics,
      activeSignals: this.metrics.activeSignals,
      queueLength: this.processingQueue.length,
      isProcessing: this.isProcessing,
      lastProcessedSymbol: this.lastProcessedSymbol,
      uptime: this.isRunning ? Date.now() - this.startTime : 0
    };
  }

  /**
   * Get all signals
   */
  getSignals(): PipelineSignal[] {
    return Array.from(this.signals.values()).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Get signals for specific symbol
   */
  getSignalsForSymbol(symbol: string): PipelineSignal[] {
    return this.getSignals().filter(s => s.symbol === symbol);
  }

  /**
   * Execute signal (mark as executed)
   */
  executeSignal(signalId: string): void {
    const signal = this.signals.get(signalId);
    if (signal) {
      signal.status = 'EXECUTED';
      this.metrics.activeSignals--;
      
      this.emitEvent({
        type: 'SIGNAL_EXECUTED',
        timestamp: new Date().toISOString(),
        data: signal
      });
    }
  }

  /**
   * Cancel signal
   */
  cancelSignal(signalId: string): void {
    const signal = this.signals.get(signalId);
    if (signal) {
      signal.status = 'CANCELLED';
      this.metrics.activeSignals--;
    }
  }
}

// Export singleton instance
export const liveDataPipeline = new LiveDataPipeline();
export default liveDataPipeline;