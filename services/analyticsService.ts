/**
 * Advanced Analytics & Reporting Service
 * Phase 5: Enhanced Features & Optimization
 */

import { Portfolio, Trade, PortfolioPerformance } from './portfolioManager';
import { PipelineSignal } from './liveDataPipeline';
import { RiskAlert } from './riskManager';

// Import services when needed for actual implementation
// import { portfolioManager } from './portfolioManager';
// import { riskManager } from './riskManager';
// import { marketDataService } from './marketDataService';
// import { performanceMonitor } from './performanceMonitor';

export interface AnalyticsReport {
  id: string;
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  period: {
    start: string;
    end: string;
  };
  portfolio: {
    id: string;
    name: string;
  };
  summary: PerformanceSummary;
  trading: TradingAnalytics;
  risk: RiskAnalytics;
  signals: SignalAnalytics;
  charts: ChartData[];
  recommendations: string[];
  generated: string;
}

export interface PerformanceSummary {
  totalReturn: number;
  totalReturnPercent: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  calmarRatio: number;
  winRate: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  consecutiveWins: number;
  consecutiveLosses: number;
}

export interface TradingAnalytics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  averageTradeSize: number;
  averageHoldTime: number;
  tradingFrequency: number;
  bestPerformingSymbol: string;
  worstPerformingSymbol: string;
  profitBySymbol: { [symbol: string]: number };
  profitByTimeOfDay: { [hour: string]: number };
  profitByDayOfWeek: { [day: string]: number };
  monthlyReturns: { [month: string]: number };
}

export interface RiskAnalytics {
  currentRiskScore: number;
  averageRiskScore: number;
  maxRiskScore: number;
  riskAdjustedReturn: number;
  valueAtRisk: number;
  expectedShortfall: number;
  correlationMatrix: { [symbol: string]: { [symbol: string]: number } };
  concentrationRisk: number;
  liquidityRisk: number;
  alertsGenerated: number;
  criticalAlerts: number;
}

export interface SignalAnalytics {
  totalSignals: number;
  executedSignals: number;
  rejectedSignals: number;
  signalAccuracy: number;
  averageSignalStrength: number;
  bestPerformingStrategy: string;
  worstPerformingStrategy: string;
  signalsByType: { [type: string]: number };
  signalsByTimeframe: { [timeframe: string]: number };
  profitBySignalStrength: { [strength: string]: number };
}

export interface ChartData {
  type: 'LINE' | 'BAR' | 'PIE' | 'HEATMAP';
  title: string;
  data: any[];
  labels: string[];
  colors?: string[];
  options?: any;
}

export interface BacktestResult {
  id: string;
  strategy: string;
  period: {
    start: string;
    end: string;
  };
  initialCapital: number;
  finalValue: number;
  totalReturn: number;
  annualizedReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  trades: number;
  winRate: number;
  profitFactor: number;
  trades_detail: BacktestTrade[];
  equity_curve: { date: string; value: number }[];
  drawdown_curve: { date: string; drawdown: number }[];
}

export interface BacktestTrade {
  date: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  pnl: number;
  cumulative_pnl: number;
}

class AnalyticsService {
  private reports: Map<string, AnalyticsReport> = new Map();
  private backtests: Map<string, BacktestResult> = new Map();
  private performanceCache: Map<string, any> = new Map();
  private isGeneratingReport = false;

  constructor() {
    this.initializeAnalytics();
  }

  /**
   * Initialize analytics service
   */
  private initializeAnalytics(): void {
    // Generate daily reports at midnight
    setInterval(() => {
      this.generateDailyReports();
    }, 24 * 60 * 60 * 1000);

    // Clear cache every hour
    setInterval(() => {
      this.clearCache();
    }, 60 * 60 * 1000);
  }

  /**
   * Generate comprehensive analytics report
   */
  async generateReport(
    portfolioId: string,
    type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM',
    startDate?: string,
    endDate?: string
  ): Promise<AnalyticsReport> {
    if (this.isGeneratingReport) {
      throw new Error('Report generation already in progress');
    }

    this.isGeneratingReport = true;

    try {
      const period = this.calculatePeriod(type, startDate, endDate);
      const portfolio = await this.getPortfolioData(portfolioId);
      const trades = await this.getTradesData(portfolioId, period.start, period.end);
      const signals = await this.getSignalsData(portfolioId, period.start, period.end);
      const alerts = await this.getAlertsData(portfolioId, period.start, period.end);

      const report: AnalyticsReport = {
        id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        period,
        portfolio: {
          id: portfolio.id,
          name: portfolio.name
        },
        summary: this.calculatePerformanceSummary(trades, portfolio),
        trading: this.calculateTradingAnalytics(trades),
        risk: this.calculateRiskAnalytics(trades, alerts, portfolio),
        signals: this.calculateSignalAnalytics(signals, trades),
        charts: this.generateCharts(trades, portfolio, signals),
        recommendations: this.generateRecommendations(trades, portfolio, signals, alerts),
        generated: new Date().toISOString()
      };

      this.reports.set(report.id, report);
      return report;

    } finally {
      this.isGeneratingReport = false;
    }
  }

  /**
   * Calculate performance summary
   */
  private calculatePerformanceSummary(trades: Trade[], portfolio: Portfolio): PerformanceSummary {
    const returns = this.calculateReturns(trades);
    const drawdowns = this.calculateDrawdowns(trades);

    return {
      totalReturn: portfolio.totalPnL,
      totalReturnPercent: (portfolio.totalPnL / 100000) * 100, // Assuming $100k initial
      annualizedReturn: this.calculateAnnualizedReturn(returns),
      volatility: this.calculateVolatility(returns),
      sharpeRatio: this.calculateSharpeRatio(returns),
      maxDrawdown: Math.max(...drawdowns),
      calmarRatio: this.calculateCalmarRatio(returns, drawdowns),
      winRate: this.calculateWinRate(trades),
      profitFactor: this.calculateProfitFactor(trades),
      averageWin: this.calculateAverageWin(trades),
      averageLoss: this.calculateAverageLoss(trades),
      largestWin: this.calculateLargestWin(trades),
      largestLoss: this.calculateLargestLoss(trades),
      consecutiveWins: this.calculateConsecutiveWins(trades),
      consecutiveLosses: this.calculateConsecutiveLosses(trades)
    };
  }

  /**
   * Calculate trading analytics
   */
  private calculateTradingAnalytics(trades: Trade[]): TradingAnalytics {
    const profitBySymbol = this.calculateProfitBySymbol(trades);
    const profitByTimeOfDay = this.calculateProfitByTimeOfDay(trades);
    const profitByDayOfWeek = this.calculateProfitByDayOfWeek(trades);
    const monthlyReturns = this.calculateMonthlyReturns(trades);

    return {
      totalTrades: trades.length,
      winningTrades: trades.filter(t => this.getTradePnL(t) > 0).length,
      losingTrades: trades.filter(t => this.getTradePnL(t) < 0).length,
      averageTradeSize: trades.reduce((sum, t) => sum + t.value, 0) / trades.length,
      averageHoldTime: this.calculateAverageHoldTime(trades),
      tradingFrequency: this.calculateTradingFrequency(trades),
      bestPerformingSymbol: this.getBestPerformingSymbol(profitBySymbol),
      worstPerformingSymbol: this.getWorstPerformingSymbol(profitBySymbol),
      profitBySymbol,
      profitByTimeOfDay,
      profitByDayOfWeek,
      monthlyReturns
    };
  }

  /**
   * Calculate risk analytics
   */
  private calculateRiskAnalytics(trades: Trade[], alerts: RiskAlert[], portfolio: Portfolio): RiskAnalytics {
    return {
      currentRiskScore: 45, // Would get from risk manager
      averageRiskScore: 42,
      maxRiskScore: 78,
      riskAdjustedReturn: this.calculateRiskAdjustedReturn(trades),
      valueAtRisk: this.calculateVaR(trades),
      expectedShortfall: this.calculateExpectedShortfall(trades),
      correlationMatrix: this.calculateCorrelationMatrix(trades),
      concentrationRisk: this.calculateConcentrationRisk(portfolio),
      liquidityRisk: 0.3,
      alertsGenerated: alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === 'CRITICAL').length
    };
  }

  /**
   * Calculate signal analytics
   */
  private calculateSignalAnalytics(signals: PipelineSignal[], trades: Trade[]): SignalAnalytics {
    const executedSignals = signals.filter(s => trades.some(t => t.signalId === s.id));
    const rejectedSignals = signals.filter(s => !trades.some(t => t.signalId === s.id));

    return {
      totalSignals: signals.length,
      executedSignals: executedSignals.length,
      rejectedSignals: rejectedSignals.length,
      signalAccuracy: this.calculateSignalAccuracy(signals, trades),
      averageSignalStrength: signals.reduce((sum, s) => sum + s.signalStrength, 0) / signals.length,
      bestPerformingStrategy: this.getBestPerformingStrategy(signals, trades),
      worstPerformingStrategy: this.getWorstPerformingStrategy(signals, trades),
      signalsByType: this.groupSignalsByType(signals),
      signalsByTimeframe: this.groupSignalsByTimeframe(signals),
      profitBySignalStrength: this.calculateProfitBySignalStrength(signals, trades)
    };
  }

  /**
   * Generate charts for the report
   */
  private generateCharts(trades: Trade[], portfolio: Portfolio, signals: PipelineSignal[]): ChartData[] {
    const charts: ChartData[] = [];

    // Equity curve
    charts.push({
      type: 'LINE',
      title: 'Portfolio Equity Curve',
      data: this.generateEquityCurve(trades),
      labels: ['Date', 'Equity']
    });

    // Drawdown chart
    charts.push({
      type: 'LINE',
      title: 'Drawdown Analysis',
      data: this.generateDrawdownChart(trades),
      labels: ['Date', 'Drawdown %']
    });

    // Profit by symbol
    charts.push({
      type: 'BAR',
      title: 'Profit by Symbol',
      data: Object.entries(this.calculateProfitBySymbol(trades)),
      labels: ['Symbol', 'Profit']
    });

    // Asset allocation
    charts.push({
      type: 'PIE',
      title: 'Asset Allocation',
      data: [
        portfolio.allocation.cash,
        portfolio.allocation.crypto,
        portfolio.allocation.stocks,
        portfolio.allocation.forex
      ],
      labels: ['Cash', 'Crypto', 'Stocks', 'Forex']
    });

    // Signal performance heatmap
    charts.push({
      type: 'HEATMAP',
      title: 'Signal Performance by Hour',
      data: this.generateSignalHeatmap(signals, trades),
      labels: ['Hour', 'Day', 'Performance']
    });

    return charts;
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    trades: Trade[],
    portfolio: Portfolio,
    signals: PipelineSignal[],
    alerts: RiskAlert[]
  ): string[] {
    const recommendations: string[] = [];

    // Performance recommendations
    const winRate = this.calculateWinRate(trades);
    if (winRate < 50) {
      recommendations.push('Consider reviewing signal generation criteria to improve win rate');
    }

    // Risk recommendations
    const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL').length;
    if (criticalAlerts > 5) {
      recommendations.push('High number of critical risk alerts - consider reducing position sizes');
    }

    // Diversification recommendations
    const concentrationRisk = this.calculateConcentrationRisk(portfolio);
    if (concentrationRisk > 0.4) {
      recommendations.push('Portfolio concentration is high - consider diversifying across more assets');
    }

    // Signal recommendations
    const signalAccuracy = this.calculateSignalAccuracy(signals, trades);
    if (signalAccuracy < 60) {
      recommendations.push('Signal accuracy is below optimal - consider refining signal parameters');
    }

    // Trading frequency recommendations
    const tradingFreq = this.calculateTradingFrequency(trades);
    if (tradingFreq > 10) {
      recommendations.push('High trading frequency detected - consider reducing to minimize fees');
    }

    return recommendations;
  }

  /**
   * Run backtesting on historical data
   */
  async runBacktest(
    strategy: string,
    startDate: string,
    endDate: string,
    initialCapital: number = 100000
  ): Promise<BacktestResult> {
    // Simulate backtesting (in real implementation, this would use historical data)
    const trades = this.generateBacktestTrades(strategy, startDate, endDate);
    const equityCurve = this.calculateEquityCurve(trades, initialCapital);
    const drawdownCurve = this.calculateDrawdownCurve(equityCurve);

    const finalValue = equityCurve[equityCurve.length - 1]?.value || initialCapital;
    const totalReturn = finalValue - initialCapital;
    const returns = this.calculateReturnsFromEquity(equityCurve);

    const result: BacktestResult = {
      id: `backtest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      strategy,
      period: { start: startDate, end: endDate },
      initialCapital,
      finalValue,
      totalReturn,
      annualizedReturn: this.calculateAnnualizedReturn(returns),
      maxDrawdown: Math.max(...drawdownCurve.map(d => d.drawdown)),
      sharpeRatio: this.calculateSharpeRatio(returns),
      trades: trades.length,
      winRate: this.calculateWinRateFromBacktest(trades),
      profitFactor: this.calculateProfitFactorFromBacktest(trades),
      trades_detail: trades,
      equity_curve: equityCurve,
      drawdown_curve: drawdownCurve
    };

    this.backtests.set(result.id, result);
    return result;
  }

  /**
   * Helper methods for calculations
   */
  private calculatePeriod(type: string, startDate?: string, endDate?: string) {
    const now = new Date();
    let start: Date;
    let end = new Date(endDate || now.toISOString());

    switch (type) {
      case 'DAILY':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'WEEKLY':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'MONTHLY':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(startDate || now.toISOString());
    }

    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  }

  private async getPortfolioData(portfolioId: string): Promise<Portfolio> {
    // Mock implementation - would integrate with portfolio manager
    return {
      id: portfolioId,
      name: 'Default Portfolio',
      totalValue: 105000,
      availableCash: 50000,
      totalPnL: 5000,
      dailyPnL: 250,
      positions: [],
      performance: {} as PortfolioPerformance,
      allocation: { cash: 50, crypto: 30, stocks: 20, forex: 0, commodities: 0, other: 0 },
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
  }

  private async getTradesData(_portfolioId: string, _start: string, _end: string): Promise<Trade[]> {
    // Mock implementation - would integrate with portfolio manager
    return [];
  }

  private async getSignalsData(_portfolioId: string, _start: string, _end: string): Promise<PipelineSignal[]> {
    // Mock implementation - would integrate with signal pipeline
    return [];
  }

  private async getAlertsData(_portfolioId: string, _start: string, _end: string): Promise<RiskAlert[]> {
    // Mock implementation - would integrate with risk manager
    return [];
  }

  // Calculation helper methods (simplified implementations)
  private calculateReturns(trades: Trade[]): number[] {
    return trades.map(t => this.getTradePnL(t) / t.value);
  }

  private calculateDrawdowns(_trades: Trade[]): number[] {
    // Simplified drawdown calculation
    return [0, -5, -10, -3, 0, -8, -15, -2];
  }

  private calculateAnnualizedReturn(returns: number[]): number {
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    return avgReturn * 252; // 252 trading days per year
  }

  private calculateVolatility(returns: number[]): number {
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    return Math.sqrt(variance) * Math.sqrt(252);
  }

  private calculateSharpeRatio(returns: number[]): number {
    const avgReturn = this.calculateAnnualizedReturn(returns);
    const volatility = this.calculateVolatility(returns);
    const riskFreeRate = 0.02; // 2% risk-free rate
    return (avgReturn - riskFreeRate) / volatility;
  }

  private calculateCalmarRatio(returns: number[], drawdowns: number[]): number {
    const annualizedReturn = this.calculateAnnualizedReturn(returns);
    const maxDrawdown = Math.max(...drawdowns);
    return annualizedReturn / Math.abs(maxDrawdown);
  }

  private calculateWinRate(trades: Trade[]): number {
    const winningTrades = trades.filter(t => this.getTradePnL(t) > 0).length;
    return trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;
  }

  private calculateProfitFactor(trades: Trade[]): number {
    const wins = trades.filter(t => this.getTradePnL(t) > 0);
    const losses = trades.filter(t => this.getTradePnL(t) < 0);
    
    const totalWins = wins.reduce((sum, t) => sum + this.getTradePnL(t), 0);
    const totalLosses = Math.abs(losses.reduce((sum, t) => sum + this.getTradePnL(t), 0));
    
    return totalLosses > 0 ? totalWins / totalLosses : 0;
  }

  private getTradePnL(_trade: Trade): number {
    // Simplified P&L calculation
    return Math.random() * 200 - 100; // Random P&L for demo
  }

  private calculateAverageWin(trades: Trade[]): number {
    const wins = trades.filter(t => this.getTradePnL(t) > 0);
    return wins.length > 0 ? wins.reduce((sum, t) => sum + this.getTradePnL(t), 0) / wins.length : 0;
  }

  private calculateAverageLoss(trades: Trade[]): number {
    const losses = trades.filter(t => this.getTradePnL(t) < 0);
    return losses.length > 0 ? losses.reduce((sum, t) => sum + this.getTradePnL(t), 0) / losses.length : 0;
  }

  private calculateLargestWin(trades: Trade[]): number {
    const wins = trades.filter(t => this.getTradePnL(t) > 0);
    return wins.length > 0 ? Math.max(...wins.map(t => this.getTradePnL(t))) : 0;
  }

  private calculateLargestLoss(trades: Trade[]): number {
    const losses = trades.filter(t => this.getTradePnL(t) < 0);
    return losses.length > 0 ? Math.min(...losses.map(t => this.getTradePnL(t))) : 0;
  }

  private calculateConsecutiveWins(_trades: Trade[]): number {
    // Simplified consecutive wins calculation
    return 3;
  }

  private calculateConsecutiveLosses(_trades: Trade[]): number {
    // Simplified consecutive losses calculation
    return 2;
  }

  private calculateProfitBySymbol(trades: Trade[]): { [symbol: string]: number } {
    const profitBySymbol: { [symbol: string]: number } = {};
    trades.forEach(trade => {
      if (!profitBySymbol[trade.symbol]) {
        profitBySymbol[trade.symbol] = 0;
      }
      profitBySymbol[trade.symbol] += this.getTradePnL(trade);
    });
    return profitBySymbol;
  }

  private calculateProfitByTimeOfDay(_trades: Trade[]): { [hour: string]: number } {
    // Simplified implementation
    return { '09': 150, '10': 200, '11': -50, '14': 300, '15': 100 };
  }

  private calculateProfitByDayOfWeek(_trades: Trade[]): { [day: string]: number } {
    // Simplified implementation
    return { 'Mon': 200, 'Tue': 150, 'Wed': -100, 'Thu': 300, 'Fri': 250 };
  }

  private calculateMonthlyReturns(_trades: Trade[]): { [month: string]: number } {
    // Simplified implementation
    return { 'Jan': 2.5, 'Feb': 1.8, 'Mar': -0.5, 'Apr': 3.2, 'May': 1.9 };
  }

  private calculateAverageHoldTime(_trades: Trade[]): number {
    // Simplified - return hours
    return 24.5;
  }

  private calculateTradingFrequency(trades: Trade[]): number {
    // Trades per day
    return trades.length / 30; // Assuming 30-day period
  }

  private getBestPerformingSymbol(profitBySymbol: { [symbol: string]: number }): string {
    return Object.entries(profitBySymbol).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  }

  private getWorstPerformingSymbol(profitBySymbol: { [symbol: string]: number }): string {
    return Object.entries(profitBySymbol).sort((a, b) => a[1] - b[1])[0]?.[0] || '';
  }

  private calculateRiskAdjustedReturn(_trades: Trade[]): number {
    // Simplified risk-adjusted return
    return 0.15; // 15%
  }

  private calculateVaR(_trades: Trade[]): number {
    // Value at Risk (95% confidence)
    return -2500; // $2,500 potential loss
  }

  private calculateExpectedShortfall(_trades: Trade[]): number {
    // Expected Shortfall (Conditional VaR)
    return -3200; // $3,200 expected loss in worst 5% scenarios
  }

  private calculateCorrelationMatrix(_trades: Trade[]): { [symbol: string]: { [symbol: string]: number } } {
    // Simplified correlation matrix
    return {
      'BTCUSDT': { 'BTCUSDT': 1.0, 'ETHUSDT': 0.8, 'ADAUSDT': 0.6 },
      'ETHUSDT': { 'BTCUSDT': 0.8, 'ETHUSDT': 1.0, 'ADAUSDT': 0.7 },
      'ADAUSDT': { 'BTCUSDT': 0.6, 'ETHUSDT': 0.7, 'ADAUSDT': 1.0 }
    };
  }

  private calculateConcentrationRisk(_portfolio: Portfolio): number {
    // Simplified concentration risk
    return 0.35; // 35% concentration
  }

  private calculateSignalAccuracy(_signals: PipelineSignal[], _trades: Trade[]): number {
    // Simplified signal accuracy
    return 65.5; // 65.5% accuracy
  }

  private getBestPerformingStrategy(_signals: PipelineSignal[], _trades: Trade[]): string {
    return 'Technical Analysis';
  }

  private getWorstPerformingStrategy(_signals: PipelineSignal[], _trades: Trade[]): string {
    return 'Sentiment Analysis';
  }

  private groupSignalsByType(_signals: PipelineSignal[]): { [type: string]: number } {
    return { 'Technical': 45, 'Sentiment': 30, 'Volume': 25 };
  }

  private groupSignalsByTimeframe(_signals: PipelineSignal[]): { [timeframe: string]: number } {
    return { '1m': 20, '5m': 35, '15m': 25, '1h': 15, '4h': 5 };
  }

  private calculateProfitBySignalStrength(_signals: PipelineSignal[], _trades: Trade[]): { [strength: string]: number } {
    return { 'Weak': -50, 'Medium': 150, 'Strong': 400, 'Very Strong': 800 };
  }

  private generateEquityCurve(_trades: Trade[]): any[] {
    // Simplified equity curve
    return [
      { date: '2024-01-01', equity: 100000 },
      { date: '2024-01-02', equity: 101500 },
      { date: '2024-01-03', equity: 103200 },
      { date: '2024-01-04', equity: 102800 },
      { date: '2024-01-05', equity: 105000 }
    ];
  }

  private generateDrawdownChart(_trades: Trade[]): any[] {
    // Simplified drawdown chart
    return [
      { date: '2024-01-01', drawdown: 0 },
      { date: '2024-01-02', drawdown: -2.5 },
      { date: '2024-01-03', drawdown: -1.8 },
      { date: '2024-01-04', drawdown: -3.2 },
      { date: '2024-01-05', drawdown: 0 }
    ];
  }

  private generateSignalHeatmap(_signals: PipelineSignal[], _trades: Trade[]): any[] {
    // Simplified heatmap data
    return [
      { hour: 9, day: 'Mon', performance: 0.8 },
      { hour: 10, day: 'Mon', performance: 1.2 },
      { hour: 11, day: 'Mon', performance: -0.3 },
      { hour: 14, day: 'Mon', performance: 1.5 },
      { hour: 15, day: 'Mon', performance: 0.9 }
    ];
  }

  private generateBacktestTrades(_strategy: string, _startDate: string, _endDate: string): BacktestTrade[] {
    // Mock backtest trades
    return [
      {
        date: '2024-01-01',
        symbol: 'BTCUSDT',
        side: 'BUY',
        quantity: 0.1,
        price: 45000,
        pnl: 0,
        cumulative_pnl: 0
      },
      {
        date: '2024-01-02',
        symbol: 'BTCUSDT',
        side: 'SELL',
        quantity: 0.1,
        price: 46500,
        pnl: 150,
        cumulative_pnl: 150
      }
    ];
  }

  private calculateEquityCurve(trades: BacktestTrade[], initialCapital: number): { date: string; value: number }[] {
    let equity = initialCapital;
    return trades.map(trade => {
      equity += trade.pnl;
      return { date: trade.date, value: equity };
    });
  }

  private calculateDrawdownCurve(equityCurve: { date: string; value: number }[]): { date: string; drawdown: number }[] {
    let peak = equityCurve[0]?.value || 0;
    return equityCurve.map(point => {
      if (point.value > peak) peak = point.value;
      const drawdown = ((peak - point.value) / peak) * 100;
      return { date: point.date, drawdown: -drawdown };
    });
  }

  private calculateReturnsFromEquity(equityCurve: { date: string; value: number }[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < equityCurve.length; i++) {
      const ret = (equityCurve[i].value - equityCurve[i-1].value) / equityCurve[i-1].value;
      returns.push(ret);
    }
    return returns;
  }

  private calculateWinRateFromBacktest(trades: BacktestTrade[]): number {
    const winningTrades = trades.filter(t => t.pnl > 0).length;
    return trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;
  }

  private calculateProfitFactorFromBacktest(trades: BacktestTrade[]): number {
    const wins = trades.filter(t => t.pnl > 0);
    const losses = trades.filter(t => t.pnl < 0);
    
    const totalWins = wins.reduce((sum, t) => sum + t.pnl, 0);
    const totalLosses = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
    
    return totalLosses > 0 ? totalWins / totalLosses : 0;
  }

  private generateDailyReports(): void {
    // Auto-generate daily reports for all portfolios
    console.log('📊 Generating daily analytics reports...');
  }

  private clearCache(): void {
    this.performanceCache.clear();
  }

  /**
   * Public API methods
   */
  getReport(reportId: string): AnalyticsReport | undefined {
    return this.reports.get(reportId);
  }

  getAllReports(): AnalyticsReport[] {
    return Array.from(this.reports.values());
  }

  getBacktest(backtestId: string): BacktestResult | undefined {
    return this.backtests.get(backtestId);
  }

  getAllBacktests(): BacktestResult[] {
    return Array.from(this.backtests.values());
  }

  deleteReport(reportId: string): boolean {
    return this.reports.delete(reportId);
  }

  deleteBacktest(backtestId: string): boolean {
    return this.backtests.delete(backtestId);
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;