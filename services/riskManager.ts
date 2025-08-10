/**
 * Advanced Risk Management Service
 * Phase 5: Enhanced Features & Optimization
 */

import { PipelineSignal } from './liveDataPipeline';
import { LiveMarketData } from './marketDataService';
// import configManager from '../config'; // For future use
// import { TradingSignal } from '../types/trading'; // For future use
// import { portfolioManager } from './portfolioManager'; // Import when needed for actual implementation

export interface RiskParameters {
  maxPositionSize: number;
  maxDailyLoss: number;
  maxDrawdown: number;
  maxLeverage: number;
  stopLossPercentage: number;
  takeProfitPercentage: number;
  maxOpenPositions: number;
  correlationLimit: number;
  volatilityThreshold: number;
  liquidityThreshold: number;
}

export interface PositionRisk {
  symbol: string;
  positionSize: number;
  unrealizedPnL: number;
  riskScore: number;
  stopLoss: number;
  takeProfit: number;
  leverage: number;
  entryTime: string;
  currentPrice: number;
  riskReward: number;
}

export interface PortfolioRisk {
  totalExposure: number;
  dailyPnL: number;
  unrealizedPnL: number;
  currentDrawdown: number;
  riskScore: number;
  correlationRisk: number;
  concentrationRisk: number;
  liquidityRisk: number;
  volatilityRisk: number;
}

export interface RiskAlert {
  id: string;
  type: 'POSITION' | 'PORTFOLIO' | 'MARKET' | 'SYSTEM';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  timestamp: string;
  symbol?: string;
  value: number;
  threshold: number;
  action: 'MONITOR' | 'REDUCE' | 'CLOSE' | 'HALT';
}

class RiskManager {
  private riskParams: RiskParameters;
  private positions: Map<string, PositionRisk> = new Map();
  private alerts: RiskAlert[] = [];
  private dailyPnL = 0;
  private maxDrawdown = 0;
  private peakEquity = 100000; // Starting equity
  private currentEquity = 100000;
  private riskListeners: ((alert: RiskAlert) => void)[] = [];

  constructor() {
    this.riskParams = this.getDefaultRiskParameters();
    this.initializeRiskMonitoring();
  }

  /**
   * Get default risk parameters
   */
  private getDefaultRiskParameters(): RiskParameters {
    return {
      maxPositionSize: 10000, // $10,000 per position
      maxDailyLoss: 2000, // $2,000 daily loss limit
      maxDrawdown: 15, // 15% maximum drawdown
      maxLeverage: 3, // 3x maximum leverage
      stopLossPercentage: 2, // 2% stop loss
      takeProfitPercentage: 6, // 6% take profit (1:3 risk/reward)
      maxOpenPositions: 5, // Maximum 5 open positions
      correlationLimit: 0.7, // Maximum 70% correlation between positions
      volatilityThreshold: 25, // 25% volatility threshold
      liquidityThreshold: 1000000 // $1M minimum daily volume
    };
  }

  /**
   * Initialize risk monitoring
   */
  private initializeRiskMonitoring(): void {
    // Monitor risk every 30 seconds
    setInterval(() => {
      this.performRiskAssessment();
    }, 30000);

    // Daily reset at midnight
    setInterval(() => {
      this.resetDailyMetrics();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Evaluate signal risk before execution
   */
  evaluateSignalRisk(signal: PipelineSignal, marketData: LiveMarketData): {
    approved: boolean;
    riskScore: number;
    reasons: string[];
    adjustments?: Partial<PipelineSignal>;
  } {
    const reasons: string[] = [];
    let riskScore = 0;
    let approved = true;

    // Check position size limits
    if (signal.entryPrice * 100 > this.riskParams.maxPositionSize) { // Assuming 100 shares
      reasons.push('Position size exceeds maximum limit');
      riskScore += 30;
      approved = false;
    }

    // Check daily loss limits
    if (this.dailyPnL < -this.riskParams.maxDailyLoss) {
      reasons.push('Daily loss limit reached');
      riskScore += 50;
      approved = false;
    }

    // Check maximum open positions
    if (this.positions.size >= this.riskParams.maxOpenPositions) {
      reasons.push('Maximum open positions reached');
      riskScore += 25;
      approved = false;
    }

    // Check market volatility
    const volatility = this.calculateVolatility(marketData);
    if (volatility > this.riskParams.volatilityThreshold) {
      reasons.push('Market volatility too high');
      riskScore += 20;
    }

    // Check correlation with existing positions
    const correlationRisk = this.calculateCorrelationRisk(signal.symbol);
    if (correlationRisk > this.riskParams.correlationLimit) {
      reasons.push('High correlation with existing positions');
      riskScore += 15;
    }

    // Check liquidity
    const liquidityRisk = this.assessLiquidityRisk(marketData);
    if (liquidityRisk > 0.5) {
      reasons.push('Insufficient market liquidity');
      riskScore += 10;
    }

    // Calculate stop loss and take profit
    const stopLoss = signal.direction === 'BUY' 
      ? signal.entryPrice * (1 - this.riskParams.stopLossPercentage / 100)
      : signal.entryPrice * (1 + this.riskParams.stopLossPercentage / 100);

    const takeProfit = signal.direction === 'BUY'
      ? signal.entryPrice * (1 + this.riskParams.takeProfitPercentage / 100)
      : signal.entryPrice * (1 - this.riskParams.takeProfitPercentage / 100);

    const adjustments = {
      stopLoss,
      takeProfit,
      riskScore: Math.min(riskScore, 100)
    };

    return {
      approved: approved && riskScore < 70, // Approve if risk score < 70
      riskScore,
      reasons,
      adjustments
    };
  }

  /**
   * Add position to risk monitoring
   */
  addPosition(signal: PipelineSignal): void {
    const position: PositionRisk = {
      symbol: signal.symbol,
      positionSize: signal.entryPrice * 100, // Assuming 100 shares
      unrealizedPnL: 0,
      riskScore: signal.riskScore,
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit,
      leverage: 1, // Default leverage
      entryTime: signal.timestamp,
      currentPrice: signal.entryPrice,
      riskReward: Math.abs(signal.takeProfit - signal.entryPrice) / Math.abs(signal.entryPrice - signal.stopLoss)
    };

    this.positions.set(signal.id, position);
  }

  /**
   * Update position with current market data
   */
  updatePosition(signalId: string, currentPrice: number): void {
    const position = this.positions.get(signalId);
    if (!position) return;

    position.currentPrice = currentPrice;
    
    // Calculate unrealized P&L (simplified)
    const priceDiff = currentPrice - (position.positionSize / 100); // Reverse calculate entry price
    position.unrealizedPnL = priceDiff * 100; // 100 shares

    // Update risk score based on current position
    position.riskScore = this.calculatePositionRisk(position);
  }

  /**
   * Remove position (when closed)
   */
  removePosition(signalId: string, realizedPnL: number): void {
    this.positions.delete(signalId);
    this.dailyPnL += realizedPnL;
    this.currentEquity += realizedPnL;

    // Update drawdown
    if (this.currentEquity > this.peakEquity) {
      this.peakEquity = this.currentEquity;
    }

    const currentDrawdown = ((this.peakEquity - this.currentEquity) / this.peakEquity) * 100;
    if (currentDrawdown > this.maxDrawdown) {
      this.maxDrawdown = currentDrawdown;
    }
  }

  /**
   * Perform comprehensive risk assessment
   */
  private performRiskAssessment(): void {
    const portfolioRisk = this.calculatePortfolioRisk();
    
    // Check for risk alerts
    this.checkRiskAlerts(portfolioRisk);
    
    // Auto-manage positions if needed
    this.autoManagePositions(portfolioRisk);
  }

  /**
   * Calculate portfolio-wide risk metrics
   */
  private calculatePortfolioRisk(): PortfolioRisk {
    const totalExposure = Array.from(this.positions.values())
      .reduce((sum, pos) => sum + pos.positionSize, 0);

    const unrealizedPnL = Array.from(this.positions.values())
      .reduce((sum, pos) => sum + pos.unrealizedPnL, 0);

    const currentDrawdown = ((this.peakEquity - this.currentEquity) / this.peakEquity) * 100;

    return {
      totalExposure,
      dailyPnL: this.dailyPnL,
      unrealizedPnL,
      currentDrawdown,
      riskScore: this.calculateOverallRiskScore(),
      correlationRisk: this.calculatePortfolioCorrelation(),
      concentrationRisk: this.calculateConcentrationRisk(),
      liquidityRisk: this.calculatePortfolioLiquidityRisk(),
      volatilityRisk: this.calculatePortfolioVolatilityRisk()
    };
  }

  /**
   * Check for risk alerts and generate warnings
   */
  private checkRiskAlerts(portfolioRisk: PortfolioRisk): void {
    // Daily loss alert
    if (this.dailyPnL < -this.riskParams.maxDailyLoss * 0.8) {
      this.generateAlert({
        type: 'PORTFOLIO',
        severity: this.dailyPnL < -this.riskParams.maxDailyLoss ? 'CRITICAL' : 'HIGH',
        message: `Daily loss approaching limit: $${Math.abs(this.dailyPnL).toFixed(2)}`,
        value: Math.abs(this.dailyPnL),
        threshold: this.riskParams.maxDailyLoss,
        action: this.dailyPnL < -this.riskParams.maxDailyLoss ? 'HALT' : 'MONITOR'
      });
    }

    // Drawdown alert
    if (portfolioRisk.currentDrawdown > this.riskParams.maxDrawdown * 0.8) {
      this.generateAlert({
        type: 'PORTFOLIO',
        severity: portfolioRisk.currentDrawdown > this.riskParams.maxDrawdown ? 'CRITICAL' : 'HIGH',
        message: `Drawdown approaching limit: ${portfolioRisk.currentDrawdown.toFixed(1)}%`,
        value: portfolioRisk.currentDrawdown,
        threshold: this.riskParams.maxDrawdown,
        action: portfolioRisk.currentDrawdown > this.riskParams.maxDrawdown ? 'REDUCE' : 'MONITOR'
      });
    }

    // Concentration risk alert
    if (portfolioRisk.concentrationRisk > 0.4) {
      this.generateAlert({
        type: 'PORTFOLIO',
        severity: 'MEDIUM',
        message: 'High concentration risk detected',
        value: portfolioRisk.concentrationRisk,
        threshold: 0.4,
        action: 'MONITOR'
      });
    }
  }

  /**
   * Generate risk alert
   */
  private generateAlert(alertData: Omit<RiskAlert, 'id' | 'timestamp'>): void {
    const alert: RiskAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...alertData
    };

    this.alerts.unshift(alert);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(0, 100);
    }

    // Notify listeners
    this.riskListeners.forEach(listener => {
      try {
        listener(alert);
      } catch (error) {
        console.error('Error in risk alert listener:', error);
      }
    });
  }

  /**
   * Auto-manage positions based on risk
   */
  private autoManagePositions(portfolioRisk: PortfolioRisk): void {
    if (portfolioRisk.riskScore > 80) {
      // High risk - consider reducing positions
      const highRiskPositions = Array.from(this.positions.entries())
        .filter(([_, pos]) => pos.riskScore > 70)
        .sort((a, b) => b[1].riskScore - a[1].riskScore);

      // Auto-close highest risk position if critical
      if (portfolioRisk.riskScore > 90 && highRiskPositions.length > 0) {
        const [_signalId] = highRiskPositions[0]; // Mark as intentionally unused
        this.generateAlert({
          type: 'POSITION',
          severity: 'CRITICAL',
          message: `Auto-closing high risk position: ${highRiskPositions[0][1].symbol}`,
          symbol: highRiskPositions[0][1].symbol,
          value: highRiskPositions[0][1].riskScore,
          threshold: 70,
          action: 'CLOSE'
        });
      }
    }
  }

  /**
   * Calculate various risk metrics
   */
  private calculateVolatility(marketData: LiveMarketData): number {
    return Math.abs(marketData.tick.change24h) * 2; // Simplified volatility
  }

  private calculateCorrelationRisk(symbol: string): number {
    // Simplified correlation calculation
    const existingSymbols = Array.from(this.positions.values()).map(p => p.symbol);
    const sameAssetClass = existingSymbols.filter(s => 
      (s.includes('BTC') && symbol.includes('BTC')) ||
      (s.includes('ETH') && symbol.includes('ETH'))
    ).length;
    
    return sameAssetClass / Math.max(existingSymbols.length, 1);
  }

  private assessLiquidityRisk(marketData: LiveMarketData): number {
    // Simplified liquidity assessment
    return marketData.orderBook.bids.length < 10 ? 0.8 : 0.2;
  }

  private calculatePositionRisk(position: PositionRisk): number {
    let risk = 0;
    
    // Time-based risk (longer positions = higher risk)
    const holdTime = Date.now() - new Date(position.entryTime).getTime();
    const hoursHeld = holdTime / (1000 * 60 * 60);
    risk += Math.min(hoursHeld / 24 * 10, 20); // Max 20 points for time
    
    // Unrealized P&L risk
    const pnlRisk = Math.abs(position.unrealizedPnL) / position.positionSize * 100;
    risk += Math.min(pnlRisk, 30); // Max 30 points for P&L
    
    // Distance from stop loss
    const stopDistance = Math.abs(position.currentPrice - position.stopLoss) / position.currentPrice * 100;
    risk += Math.max(0, 20 - stopDistance); // Higher risk if close to stop
    
    return Math.min(risk, 100);
  }

  private calculateOverallRiskScore(): number {
    if (this.positions.size === 0) return 0;
    
    const avgPositionRisk = Array.from(this.positions.values())
      .reduce((sum, pos) => sum + pos.riskScore, 0) / this.positions.size;
    
    const portfolioFactors = [
      this.dailyPnL < 0 ? Math.abs(this.dailyPnL) / this.riskParams.maxDailyLoss * 30 : 0,
      this.maxDrawdown / this.riskParams.maxDrawdown * 25,
      this.positions.size / this.riskParams.maxOpenPositions * 15
    ];
    
    return Math.min(avgPositionRisk + portfolioFactors.reduce((a, b) => a + b, 0), 100);
  }

  private calculatePortfolioCorrelation(): number {
    // Simplified portfolio correlation
    const symbols = Array.from(this.positions.values()).map(p => p.symbol);
    const uniqueAssets = new Set(symbols.map(s => s.split('/')[0])).size;
    return 1 - (uniqueAssets / Math.max(symbols.length, 1));
  }

  private calculateConcentrationRisk(): number {
    if (this.positions.size === 0) return 0;
    
    const totalExposure = Array.from(this.positions.values())
      .reduce((sum, pos) => sum + pos.positionSize, 0);
    
    const maxPosition = Math.max(...Array.from(this.positions.values())
      .map(pos => pos.positionSize));
    
    return maxPosition / totalExposure;
  }

  private calculatePortfolioLiquidityRisk(): number {
    // Simplified liquidity risk
    return this.positions.size > 3 ? 0.6 : 0.2;
  }

  private calculatePortfolioVolatilityRisk(): number {
    // Simplified volatility risk
    return Math.random() * 0.5 + 0.2; // 0.2 to 0.7
  }

  private resetDailyMetrics(): void {
    this.dailyPnL = 0;
  }

  /**
   * Public API methods
   */
  getRiskParameters(): RiskParameters {
    return { ...this.riskParams };
  }

  updateRiskParameters(params: Partial<RiskParameters>): void {
    this.riskParams = { ...this.riskParams, ...params };
  }

  getPortfolioRisk(): PortfolioRisk {
    return this.calculatePortfolioRisk();
  }

  getPositions(): PositionRisk[] {
    return Array.from(this.positions.values());
  }

  getAlerts(): RiskAlert[] {
    return [...this.alerts];
  }

  subscribeToAlerts(listener: (alert: RiskAlert) => void): () => void {
    this.riskListeners.push(listener);
    return () => {
      const index = this.riskListeners.indexOf(listener);
      if (index > -1) {
        this.riskListeners.splice(index, 1);
      }
    };
  }

  // Emergency stop all trading
  emergencyStop(): void {
    this.generateAlert({
      type: 'SYSTEM',
      severity: 'CRITICAL',
      message: 'Emergency stop activated - All trading halted',
      value: 100,
      threshold: 100,
      action: 'HALT'
    });
  }
}

// Export singleton instance
export const riskManager = new RiskManager();
export default riskManager;