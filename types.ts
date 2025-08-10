
export enum Direction {
  LONG = 'LONG',
  SHORT = 'SHORT',
  FLAT = 'FLAT'
}

export interface TradeSignal {
  id?: string;
  symbol: string;
  chartUrl: string;
  extractedData: string;
  direction: Direction;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  timestamp?: string;
  isLive?: boolean;
}

// Live Chart Data Interface
export interface LiveChartData {
  symbol: string;
  timestamp: string;
  capturedImage: string; // base64 encoded image
  imageUrl?: string; // Optional URL for compatibility
  technicalIndicators: {
    rsi: number;
    macd: number;
    bollinger: string;
    volume: number;
    priceAction: string;
  };
  marketData: {
    currentPrice: number;
    change24h: number;
    volume24h: number;
    high24h: number;
    low24h: number;
  };
}

// Gemini Vision API Response
export interface GeminiAnalysisResponse {
  extractedData: string;
  direction: Direction;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  reasoning: string;
  technicalAnalysis?: string;
  signals?: TradeSignal[];
  timestamp: string;
}

// Chart Capture Configuration
export interface ChartCaptureConfig {
  width: number;
  height: number;
  quality: number;
  format: 'png' | 'jpeg';
  backgroundColor: string;
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
