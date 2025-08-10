/**
 * Real-time Portfolio Management Service
 * Phase 5: Enhanced Features & Optimization
 */

import { PipelineSignal } from './liveDataPipeline';
import { LiveMarketData } from './marketDataService';
// import { riskManager, PositionRisk } from './riskManager'; // Import when needed for actual implementation

export interface Portfolio {
  id: string;
  name: string;
  totalValue: number;
  availableCash: number;
  totalPnL: number;
  dailyPnL: number;
  positions: Position[];
  performance: PortfolioPerformance;
  allocation: AssetAllocation;
  created: string;
  lastUpdated: string;
}

export interface Position {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  realizedPnL: number;
  stopLoss?: number;
  takeProfit?: number;
  entryTime: string;
  lastUpdated: string;
  status: 'OPEN' | 'CLOSED' | 'PENDING';
  fees: number;
  leverage: number;
}

export interface PortfolioPerformance {
  totalReturn: number;
  totalReturnPercent: number;
  dailyReturn: number;
  dailyReturnPercent: number;
  weeklyReturn: number;
  monthlyReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
}

export interface AssetAllocation {
  cash: number;
  crypto: number;
  stocks: number;
  forex: number;
  commodities: number;
  other: number;
}

export interface Trade {
  id: string;
  portfolioId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  value: number;
  fees: number;
  timestamp: string;
  signalId?: string;
  type: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
  status: 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED';
  reason?: string;
}

export interface PortfolioAlert {
  id: string;
  portfolioId: string;
  type: 'PERFORMANCE' | 'ALLOCATION' | 'POSITION' | 'RISK';
  severity: 'INFO' | 'WARNING' | 'ERROR';
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

class PortfolioManager {
  private portfolios: Map<string, Portfolio> = new Map();
  private trades: Map<string, Trade[]> = new Map();
  private alerts: Map<string, PortfolioAlert[]> = new Map();
  private marketData: Map<string, LiveMarketData> = new Map();
  private listeners: Map<string, ((portfolio: Portfolio) => void)[]> = new Map();
  private performanceHistory: Map<string, PortfolioPerformance[]> = new Map();

  constructor() {
    this.initializePortfolioManager();
  }

  /**
   * Initialize portfolio manager
   */
  private initializePortfolioManager(): void {
    // Create default portfolio
    this.createPortfolio('Default Portfolio', 100000);

    // Update portfolios every 5 seconds
    setInterval(() => {
      this.updateAllPortfolios();
    }, 5000);

    // Save performance snapshots every hour
    setInterval(() => {
      this.savePerformanceSnapshots();
    }, 60 * 60 * 1000);
  }

  /**
   * Create a new portfolio
   */
  createPortfolio(name: string, initialCash: number): Portfolio {
    const portfolio: Portfolio = {
      id: `portfolio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      totalValue: initialCash,
      availableCash: initialCash,
      totalPnL: 0,
      dailyPnL: 0,
      positions: [],
      performance: this.getInitialPerformance(),
      allocation: {
        cash: 100,
        crypto: 0,
        stocks: 0,
        forex: 0,
        commodities: 0,
        other: 0
      },
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    this.portfolios.set(portfolio.id, portfolio);
    this.trades.set(portfolio.id, []);
    this.alerts.set(portfolio.id, []);
    this.listeners.set(portfolio.id, []);
    this.performanceHistory.set(portfolio.id, []);

    return portfolio;
  }

  /**
   * Execute a signal and create position
   */
  async executeSignal(portfolioId: string, signal: PipelineSignal): Promise<{
    success: boolean;
    trade?: Trade;
    position?: Position;
    error?: string;
  }> {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) {
      return { success: false, error: 'Portfolio not found' };
    }

    // Get current market data
    const marketData = this.marketData.get(signal.symbol);
    if (!marketData) {
      return { success: false, error: 'Market data not available' };
    }

    // Risk evaluation (commented out to avoid circular dependency)
    // const riskEvaluation = riskManager.evaluateSignalRisk(signal, marketData);
    // if (!riskEvaluation.approved) {
    //   return { 
    //     success: false, 
    //     error: `Risk check failed: ${riskEvaluation.reasons.join(', ')}` 
    //   };
    // }

    // Calculate position size based on available cash and risk
    const positionValue = Math.min(
      portfolio.availableCash * 0.2, // Max 20% per position
      10000 // Max $10k per position
    );

    const quantity = positionValue / signal.entryPrice;
    const totalCost = quantity * signal.entryPrice;
    const fees = totalCost * 0.001; // 0.1% fees

    // Check if enough cash available
    if (totalCost + fees > portfolio.availableCash) {
      return { success: false, error: 'Insufficient funds' };
    }

    // Create trade
    const trade: Trade = {
      id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      portfolioId,
      symbol: signal.symbol,
      side: signal.direction === 'BUY' ? 'BUY' : 'SELL',
      quantity,
      price: signal.entryPrice,
      value: totalCost,
      fees,
      timestamp: new Date().toISOString(),
      signalId: signal.id,
      type: 'MARKET',
      status: 'FILLED'
    };

    // Create position
    const position: Position = {
      id: `position-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      symbol: signal.symbol,
      side: signal.direction === 'BUY' ? 'LONG' : 'SHORT',
      quantity,
      entryPrice: signal.entryPrice,
      currentPrice: signal.entryPrice,
      marketValue: totalCost,
      unrealizedPnL: 0,
      realizedPnL: 0,
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit,
      entryTime: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      status: 'OPEN',
      fees,
      leverage: 1
    };

    // Update portfolio
    portfolio.availableCash -= (totalCost + fees);
    portfolio.positions.push(position);
    portfolio.lastUpdated = new Date().toISOString();

    // Add trade to history
    const portfolioTrades = this.trades.get(portfolioId) || [];
    portfolioTrades.push(trade);
    this.trades.set(portfolioId, portfolioTrades);

    // Add to risk manager (commented out to avoid circular dependency)
    // riskManager.addPosition(signal);

    // Update portfolio metrics
    this.updatePortfolioMetrics(portfolio);

    // Notify listeners
    this.notifyListeners(portfolioId, portfolio);

    return { success: true, trade, position };
  }

  /**
   * Close a position
   */
  async closePosition(portfolioId: string, positionId: string, currentPrice?: number): Promise<{
    success: boolean;
    trade?: Trade;
    realizedPnL?: number;
    error?: string;
  }> {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) {
      return { success: false, error: 'Portfolio not found' };
    }

    const positionIndex = portfolio.positions.findIndex(p => p.id === positionId);
    if (positionIndex === -1) {
      return { success: false, error: 'Position not found' };
    }

    const position = portfolio.positions[positionIndex];
    const exitPrice = currentPrice || position.currentPrice;
    
    // Calculate P&L
    const priceDiff = position.side === 'LONG' 
      ? exitPrice - position.entryPrice
      : position.entryPrice - exitPrice;
    
    const realizedPnL = priceDiff * position.quantity;
    const exitValue = position.quantity * exitPrice;
    const fees = exitValue * 0.001; // 0.1% fees

    // Create closing trade
    const trade: Trade = {
      id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      portfolioId,
      symbol: position.symbol,
      side: position.side === 'LONG' ? 'SELL' : 'BUY',
      quantity: position.quantity,
      price: exitPrice,
      value: exitValue,
      fees,
      timestamp: new Date().toISOString(),
      type: 'MARKET',
      status: 'FILLED'
    };

    // Update portfolio
    portfolio.availableCash += (exitValue - fees);
    portfolio.totalPnL += realizedPnL;
    portfolio.dailyPnL += realizedPnL;
    
    // Update position
    position.status = 'CLOSED';
    position.realizedPnL = realizedPnL;
    position.lastUpdated = new Date().toISOString();

    // Remove from active positions
    portfolio.positions.splice(positionIndex, 1);
    portfolio.lastUpdated = new Date().toISOString();

    // Add trade to history
    const portfolioTrades = this.trades.get(portfolioId) || [];
    portfolioTrades.push(trade);
    this.trades.set(portfolioId, portfolioTrades);

    // Remove from risk manager (commented out to avoid circular dependency)
    // riskManager.removePosition(positionId, realizedPnL);

    // Update portfolio metrics
    this.updatePortfolioMetrics(portfolio);

    // Notify listeners
    this.notifyListeners(portfolioId, portfolio);

    return { success: true, trade, realizedPnL };
  }

  /**
   * Update market data for a symbol
   */
  updateMarketData(symbol: string, data: LiveMarketData): void {
    this.marketData.set(symbol, data);
    
    // Update all positions with this symbol
    for (const portfolio of this.portfolios.values()) {
      let updated = false;
      
      for (const position of portfolio.positions) {
        if (position.symbol === symbol) {
          position.currentPrice = data.tick.price;
          position.marketValue = position.quantity * data.tick.price;
          
          // Calculate unrealized P&L
          const priceDiff = position.side === 'LONG' 
            ? data.tick.price - position.entryPrice
            : position.entryPrice - data.tick.price;
          
          position.unrealizedPnL = priceDiff * position.quantity;
          position.lastUpdated = new Date().toISOString();
          
          // Update risk manager (commented out to avoid circular dependency)
          // riskManager.updatePosition(position.id, data.tick.price);
          
          // Check stop loss / take profit
          this.checkStopLossTakeProfit(portfolio.id, position);
          
          updated = true;
        }
      }
      
      if (updated) {
        this.updatePortfolioMetrics(portfolio);
        this.notifyListeners(portfolio.id, portfolio);
      }
    }
  }

  /**
   * Check stop loss and take profit conditions
   */
  private checkStopLossTakeProfit(portfolioId: string, position: Position): void {
    if (position.status !== 'OPEN') return;

    const shouldClose = 
      (position.stopLoss && 
        ((position.side === 'LONG' && position.currentPrice <= position.stopLoss) ||
         (position.side === 'SHORT' && position.currentPrice >= position.stopLoss))) ||
      (position.takeProfit && 
        ((position.side === 'LONG' && position.currentPrice >= position.takeProfit) ||
         (position.side === 'SHORT' && position.currentPrice <= position.takeProfit)));

    if (shouldClose) {
      this.closePosition(portfolioId, position.id, position.currentPrice);
      
      const reason = position.currentPrice <= (position.stopLoss || 0) ? 'Stop Loss' : 'Take Profit';
      this.addAlert(portfolioId, {
        type: 'POSITION',
        severity: 'INFO',
        message: `Position closed automatically: ${position.symbol} (${reason})`
      });
    }
  }

  /**
   * Update portfolio metrics
   */
  private updatePortfolioMetrics(portfolio: Portfolio): void {
    // Calculate total value
    const positionsValue = portfolio.positions.reduce((sum, pos) => sum + pos.marketValue, 0);
    
    portfolio.totalValue = portfolio.availableCash + positionsValue;
    
    // Update allocation
    portfolio.allocation = this.calculateAllocation(portfolio);
    
    // Update performance metrics
    portfolio.performance = this.calculatePerformance(portfolio);
    
    portfolio.lastUpdated = new Date().toISOString();
  }

  /**
   * Calculate asset allocation
   */
  private calculateAllocation(portfolio: Portfolio): AssetAllocation {
    const totalValue = portfolio.totalValue;
    if (totalValue === 0) return { cash: 100, crypto: 0, stocks: 0, forex: 0, commodities: 0, other: 0 };

    const allocation: AssetAllocation = {
      cash: (portfolio.availableCash / totalValue) * 100,
      crypto: 0,
      stocks: 0,
      forex: 0,
      commodities: 0,
      other: 0
    };

    // Categorize positions
    for (const position of portfolio.positions) {
      const positionPercent = (position.marketValue / totalValue) * 100;
      
      if (position.symbol.includes('BTC') || position.symbol.includes('ETH') || position.symbol.includes('USDT')) {
        allocation.crypto += positionPercent;
      } else if (position.symbol.includes('USD') || position.symbol.includes('EUR')) {
        allocation.forex += positionPercent;
      } else {
        allocation.other += positionPercent;
      }
    }

    return allocation;
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformance(portfolio: Portfolio): PortfolioPerformance {
    const trades = this.trades.get(portfolio.id) || [];
    const closedTrades = trades.filter(t => t.status === 'FILLED');
    
    // Calculate basic metrics
    const totalReturn = portfolio.totalPnL;
    const totalReturnPercent = (totalReturn / 100000) * 100; // Assuming $100k initial
    
    // Calculate win/loss metrics
    const winningTrades = closedTrades.filter((_t: Trade) => {
      // Find matching buy/sell pairs to calculate P&L
      return true; // Simplified for now
    });
    
    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
    
    return {
      totalReturn,
      totalReturnPercent,
      dailyReturn: portfolio.dailyPnL,
      dailyReturnPercent: (portfolio.dailyPnL / portfolio.totalValue) * 100,
      weeklyReturn: 0, // Would need historical data
      monthlyReturn: 0, // Would need historical data
      maxDrawdown: 0, // Would need historical data
      sharpeRatio: 0, // Would need historical data
      winRate,
      profitFactor: 1, // Would need detailed P&L calculation
      avgWin: 0,
      avgLoss: 0,
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: closedTrades.length - winningTrades.length
    };
  }

  /**
   * Update all portfolios
   */
  private updateAllPortfolios(): void {
    for (const portfolio of this.portfolios.values()) {
      this.updatePortfolioMetrics(portfolio);
    }
  }

  /**
   * Save performance snapshots
   */
  private savePerformanceSnapshots(): void {
    for (const [portfolioId, portfolio] of this.portfolios.entries()) {
      const history = this.performanceHistory.get(portfolioId) || [];
      history.push({ ...portfolio.performance });
      
      // Keep only last 30 days of hourly snapshots
      if (history.length > 24 * 30) {
        history.splice(0, history.length - (24 * 30));
      }
      
      this.performanceHistory.set(portfolioId, history);
    }
  }

  /**
   * Add alert
   */
  private addAlert(portfolioId: string, alertData: Omit<PortfolioAlert, 'id' | 'portfolioId' | 'timestamp' | 'acknowledged'>): void {
    const alert: PortfolioAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      portfolioId,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      ...alertData
    };

    const alerts = this.alerts.get(portfolioId) || [];
    alerts.unshift(alert);
    
    // Keep only last 100 alerts
    if (alerts.length > 100) {
      alerts.splice(100);
    }
    
    this.alerts.set(portfolioId, alerts);
  }

  /**
   * Notify listeners
   */
  private notifyListeners(portfolioId: string, portfolio: Portfolio): void {
    const listeners = this.listeners.get(portfolioId) || [];
    listeners.forEach(listener => {
      try {
        listener(portfolio);
      } catch (error) {
        console.error('Error in portfolio listener:', error);
      }
    });
  }

  /**
   * Get initial performance metrics
   */
  private getInitialPerformance(): PortfolioPerformance {
    return {
      totalReturn: 0,
      totalReturnPercent: 0,
      dailyReturn: 0,
      dailyReturnPercent: 0,
      weeklyReturn: 0,
      monthlyReturn: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      winRate: 0,
      profitFactor: 1,
      avgWin: 0,
      avgLoss: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0
    };
  }

  /**
   * Public API methods
   */
  getPortfolio(portfolioId: string): Portfolio | undefined {
    return this.portfolios.get(portfolioId);
  }

  getAllPortfolios(): Portfolio[] {
    return Array.from(this.portfolios.values());
  }

  getPortfolioTrades(portfolioId: string): Trade[] {
    return this.trades.get(portfolioId) || [];
  }

  getPortfolioAlerts(portfolioId: string): PortfolioAlert[] {
    return this.alerts.get(portfolioId) || [];
  }

  getPerformanceHistory(portfolioId: string): PortfolioPerformance[] {
    return this.performanceHistory.get(portfolioId) || [];
  }

  subscribeToPortfolio(portfolioId: string, listener: (portfolio: Portfolio) => void): () => void {
    const listeners = this.listeners.get(portfolioId) || [];
    listeners.push(listener);
    this.listeners.set(portfolioId, listeners);

    return () => {
      const currentListeners = this.listeners.get(portfolioId) || [];
      const index = currentListeners.indexOf(listener);
      if (index > -1) {
        currentListeners.splice(index, 1);
        this.listeners.set(portfolioId, currentListeners);
      }
    };
  }

  acknowledgeAlert(portfolioId: string, alertId: string): void {
    const alerts = this.alerts.get(portfolioId) || [];
    const alert = alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  // Get default portfolio ID
  getDefaultPortfolioId(): string {
    return Array.from(this.portfolios.keys())[0] || '';
  }
}

// Export singleton instance
export const portfolioManager = new PortfolioManager();
export default portfolioManager;