
import type { TradeSignal, ComplianceRule, Trade, PerformanceDataPoint } from './types';
import { Direction, ComplianceStatus } from './types';

export const mockSignals: TradeSignal[] = [
  {
    symbol: 'BTC/USD',
    chartUrl: 'https://i.ibb.co/6yqGvB6/chart-1.png',
    extractedData: 'Candlestick pattern: Bullish Engulfing on 4H chart. RSI(14) at 58. MACD crossover imminent. Trendline support at $67,200.',
    direction: Direction.LONG,
    entry: 68550.00,
    stopLoss: 67100.00,
    takeProfit: 71500.00,
    confidence: 0.85,
  },
  {
    symbol: 'ETH/USD',
    chartUrl: 'https://i.ibb.co/hM4BfW6/chart-2.png',
    extractedData: 'Head and Shoulders pattern forming on 1H chart. Volume declining on ascent. Indicator divergence on Momentum (10).',
    direction: Direction.SHORT,
    entry: 3480.50,
    stopLoss: 3550.00,
    takeProfit: 3300.00,
    confidence: 0.78,
  },
  {
    symbol: 'SOL/USD',
    chartUrl: 'https://i.ibb.co/z5Yj4Xv/chart-3.png',
    extractedData: 'Ranging market conditions. Low volatility, Bollinger Bands are contracting. ADX below 20 indicating lack of trend.',
    direction: Direction.FLAT,
    entry: 165.00,
    stopLoss: 160.00,
    takeProfit: 170.00,
    confidence: 0.55,
  },
];

export const mockComplianceRules: ComplianceRule[] = [
  { name: 'Position Size Limit', description: 'Max 2% of portfolio', status: ComplianceStatus.PENDING },
  { name: 'Exchange Constraints', description: 'Max leverage 20x', status: ComplianceStatus.PENDING },
  { name: 'Regional Regulations', description: 'U.S. Retail Leverage Cap', status: ComplianceStatus.PENDING },
  { name: 'On-Chain AML Risk', description: 'Wallet address screening', status: ComplianceStatus.PENDING },
];

export const mockTrades: Trade[] = [
    { id: 'T172938473', timestamp: '2023-10-27T10:45:00Z', symbol: 'BTC/USD', direction: Direction.LONG, entry: 67100, status: 'Filled', pnl: 1203.45 },
    { id: 'T172938472', timestamp: '2023-10-27T09:30:00Z', symbol: 'ETH/USD', direction: Direction.SHORT, entry: 3550, status: 'Filled', pnl: -250.80 },
    { id: 'T172938471', timestamp: '2023-10-27T08:15:00Z', symbol: 'SOL/USD', direction: Direction.LONG, entry: 160, status: 'Filled', pnl: 450.00 },
];

export const mockPerformanceData: PerformanceDataPoint[] = [
    { date: 'Day -6', performance: 2.1, threshold: 1.0 },
    { date: 'Day -5', performance: 2.5, threshold: 1.0 },
    { date: 'Day -4', performance: 1.8, threshold: 1.0 },
    { date: 'Day -3', performance: 0.9, threshold: 1.0 },
    { date: 'Day -2', performance: 1.5, threshold: 1.0 },
    { date: 'Day -1', performance: 1.7, threshold: 1.0 },
    { date: 'Today', performance: 2.2, threshold: 1.0 },
];
