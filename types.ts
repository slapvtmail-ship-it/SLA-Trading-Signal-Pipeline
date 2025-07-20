
export enum Direction {
  LONG = 'LONG',
  SHORT = 'SHORT',
  FLAT = 'FLAT'
}

export interface TradeSignal {
  symbol: string;
  chartUrl: string;
  extractedData: string;
  direction: Direction;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
}

export enum ComplianceStatus {
  PASS = 'PASS',
  FAIL = 'FAIL',
  PENDING = 'PENDING'
}

export interface ComplianceRule {
  name: string;
  description: string;
  status: ComplianceStatus;
}

export interface Trade {
  id: string;
  timestamp: string;
  symbol: string;
  direction: Direction;
  entry: number;
  status: 'Filled' | 'Rejected' | 'Pending';
  pnl?: number;
}

export interface PerformanceDataPoint {
  date: string;
  performance: number;
  threshold: number;
}

export enum SignalStatus {
    PENDING = 'PENDING',
    ANALYZING = 'ANALYZING',
    COMPLIANCE = 'COMPLIANCE CHECK',
    APPROVED = 'APPROVED',
    BLOCKED = 'BLOCKED',
}
