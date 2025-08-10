/**
 * Advanced Analytics Dashboard Component
 * Phase 5: Enhanced Features & Optimization
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  Activity, 
  Target,
  Download,
  RefreshCw,
  Eye,
  DollarSign,
  Award,
  AlertTriangle
} from 'lucide-react';

interface PerformanceSummary {
  totalReturn: number;
  totalReturnPercent: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  largestWin: number;
  largestLoss: number;
  averageHoldingPeriod: number;
}

interface TradingAnalytics {
  profitBySymbol: { [symbol: string]: number };
  tradesByHour: { [hour: string]: number };
  signalAccuracy: { [signalType: string]: number };
  monthlyReturns: { month: string; return: number }[];
  drawdownPeriods: { start: string; end: string; drawdown: number }[];
}

interface ChartData {
  equityCurve: { date: string; value: number }[];
  drawdownChart: { date: string; drawdown: number }[];
  profitDistribution: { range: string; count: number }[];
  signalHeatmap: { signal: string; hour: number; accuracy: number }[];
}

interface BacktestResult {
  id: string;
  name: string;
  strategy: string;
  period: string;
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  createdAt: string;
  status: 'COMPLETED' | 'RUNNING' | 'FAILED';
}

const AnalyticsDashboard: React.FC = () => {
  const [performanceSummary, setPerformanceSummary] = useState<PerformanceSummary | null>(null);
  const [tradingAnalytics, setTradingAnalytics] = useState<TradingAnalytics | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [backtestResults, setBacktestResults] = useState<BacktestResult[]>([]);
  const [selectedTab, setSelectedTab] = useState<'performance' | 'analytics' | 'charts' | 'backtests'>('performance');
  const [selectedPeriod, setSelectedPeriod] = useState<'1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'>('1M');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
    const interval = setInterval(loadAnalyticsData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      // Mock data - in real implementation, this would fetch from analytics service
      const mockPerformance: PerformanceSummary = {
        totalReturn: 12750,
        totalReturnPercent: 15.3,
        sharpeRatio: 1.85,
        maxDrawdown: -8.2,
        winRate: 68.5,
        profitFactor: 2.1,
        averageWin: 285,
        averageLoss: -135,
        totalTrades: 147,
        winningTrades: 101,
        losingTrades: 46,
        largestWin: 1250,
        largestLoss: -680,
        averageHoldingPeriod: 2.3
      };

      const mockAnalytics: TradingAnalytics = {
        profitBySymbol: {
          'BTCUSDT': 4250,
          'ETHUSDT': 3100,
          'ADAUSDT': 1850,
          'SOLUSDT': 2200,
          'DOTUSDT': 1350
        },
        tradesByHour: {
          '00': 2, '01': 1, '02': 0, '03': 1, '04': 2, '05': 3,
          '06': 5, '07': 8, '08': 12, '09': 15, '10': 18, '11': 14,
          '12': 16, '13': 19, '14': 22, '15': 17, '16': 13, '17': 11,
          '18': 8, '19': 6, '20': 4, '21': 3, '22': 2, '23': 1
        },
        signalAccuracy: {
          'BULLISH_BREAKOUT': 72.5,
          'BEARISH_REVERSAL': 68.2,
          'MOMENTUM_SURGE': 75.8,
          'SUPPORT_BOUNCE': 71.3,
          'RESISTANCE_BREAK': 69.7
        },
        monthlyReturns: [
          { month: 'Jan', return: 8.2 },
          { month: 'Feb', return: -2.1 },
          { month: 'Mar', return: 12.5 },
          { month: 'Apr', return: 6.8 },
          { month: 'May', return: -1.5 },
          { month: 'Jun', return: 9.3 }
        ],
        drawdownPeriods: [
          { start: '2024-01-15', end: '2024-01-18', drawdown: -3.2 },
          { start: '2024-02-08', end: '2024-02-12', drawdown: -5.1 },
          { start: '2024-03-22', end: '2024-03-25', drawdown: -2.8 }
        ]
      };

      const mockChartData: ChartData = {
        equityCurve: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          value: 100000 + Math.random() * 15000 + i * 500
        })),
        drawdownChart: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          drawdown: Math.random() * -10
        })),
        profitDistribution: [
          { range: '-500+', count: 3 },
          { range: '-250 to -500', count: 8 },
          { range: '-100 to -250', count: 15 },
          { range: '-50 to -100', count: 20 },
          { range: '0 to -50', count: 12 },
          { range: '0 to 50', count: 18 },
          { range: '50 to 100', count: 25 },
          { range: '100 to 250', count: 22 },
          { range: '250 to 500', count: 12 },
          { range: '500+', count: 6 }
        ],
        signalHeatmap: []
      };

      const mockBacktests: BacktestResult[] = [
        {
          id: 'bt-1',
          name: 'Momentum Strategy v2.1',
          strategy: 'MOMENTUM_BREAKOUT',
          period: '2023-01-01 to 2024-01-01',
          totalReturn: 28.5,
          sharpeRatio: 1.92,
          maxDrawdown: -12.3,
          winRate: 71.2,
          totalTrades: 234,
          createdAt: '2024-01-20T10:30:00Z',
          status: 'COMPLETED'
        },
        {
          id: 'bt-2',
          name: 'Mean Reversion Strategy',
          strategy: 'MEAN_REVERSION',
          period: '2023-06-01 to 2024-01-01',
          totalReturn: 18.7,
          sharpeRatio: 1.45,
          maxDrawdown: -8.9,
          winRate: 64.8,
          totalTrades: 189,
          createdAt: '2024-01-19T14:15:00Z',
          status: 'COMPLETED'
        },
        {
          id: 'bt-3',
          name: 'Multi-Timeframe Analysis',
          strategy: 'MULTI_TIMEFRAME',
          period: '2023-01-01 to 2024-01-01',
          totalReturn: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          winRate: 0,
          totalTrades: 0,
          createdAt: '2024-01-20T16:45:00Z',
          status: 'RUNNING'
        }
      ];

      setPerformanceSummary(mockPerformance);
      setTradingAnalytics(mockAnalytics);
      setChartData(mockChartData);
      setBacktestResults(mockBacktests);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const getPerformanceColor = (value: number): string => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };



  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!performanceSummary || !tradingAnalytics || !chartData) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No analytics data</h3>
        <p className="mt-1 text-sm text-gray-500">Unable to load analytics information.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-sm text-gray-500">Comprehensive trading performance analysis</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="1D">1 Day</option>
              <option value="1W">1 Week</option>
              <option value="1M">1 Month</option>
              <option value="3M">3 Months</option>
              <option value="1Y">1 Year</option>
              <option value="ALL">All Time</option>
            </select>
            <button
              onClick={loadAnalyticsData}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'performance', name: 'Performance', icon: TrendingUp },
              { id: 'analytics', name: 'Analytics', icon: BarChart3 },
              { id: 'charts', name: 'Charts', icon: PieChart },
              { id: 'backtests', name: 'Backtests', icon: Activity }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {selectedTab === 'performance' && (
            <div className="space-y-6">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <DollarSign className={`h-8 w-8 ${getPerformanceColor(performanceSummary.totalReturn)}`} />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Total Return</p>
                      <p className={`text-2xl font-bold ${getPerformanceColor(performanceSummary.totalReturn)}`}>
                        {formatCurrency(performanceSummary.totalReturn)}
                      </p>
                      <p className={`text-sm ${getPerformanceColor(performanceSummary.totalReturnPercent)}`}>
                        {formatPercent(performanceSummary.totalReturnPercent)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Award className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Sharpe Ratio</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {performanceSummary.sharpeRatio.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <TrendingDown className="h-8 w-8 text-red-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Max Drawdown</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatPercent(Math.abs(performanceSummary.maxDrawdown))}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Target className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Win Rate</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatPercent(performanceSummary.winRate)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Performance Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Trading Statistics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Total Trades</span>
                      <span className="text-sm font-medium">{performanceSummary.totalTrades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Winning Trades</span>
                      <span className="text-sm font-medium text-green-600">{performanceSummary.winningTrades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Losing Trades</span>
                      <span className="text-sm font-medium text-red-600">{performanceSummary.losingTrades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Profit Factor</span>
                      <span className="text-sm font-medium">{performanceSummary.profitFactor.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Average Win</span>
                      <span className="text-sm font-medium text-green-600">{formatCurrency(performanceSummary.averageWin)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Average Loss</span>
                      <span className="text-sm font-medium text-red-600">{formatCurrency(performanceSummary.averageLoss)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Largest Win</span>
                      <span className="text-sm font-medium text-green-600">{formatCurrency(performanceSummary.largestWin)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Largest Loss</span>
                      <span className="text-sm font-medium text-red-600">{formatCurrency(performanceSummary.largestLoss)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Avg Holding Period</span>
                      <span className="text-sm font-medium">{performanceSummary.averageHoldingPeriod.toFixed(1)} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Sharpe Ratio</span>
                      <span className="text-sm font-medium">{performanceSummary.sharpeRatio.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Returns */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Returns</h3>
                <div className="grid grid-cols-6 gap-4">
                  {tradingAnalytics.monthlyReturns.map((month) => (
                    <div key={month.month} className="text-center">
                      <div className="text-sm text-gray-500 mb-1">{month.month}</div>
                      <div className={`text-lg font-bold ${getPerformanceColor(month.return)}`}>
                        {formatPercent(month.return)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'analytics' && (
            <div className="space-y-6">
              {/* Profit by Symbol */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Profit by Symbol</h3>
                <div className="space-y-3">
                  {Object.entries(tradingAnalytics.profitBySymbol)
                    .sort(([,a], [,b]) => b - a)
                    .map(([symbol, profit]) => (
                      <div key={symbol} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{symbol}</span>
                        <div className="flex items-center">
                          <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                            <div 
                              className={`h-2 rounded-full ${profit >= 0 ? 'bg-green-600' : 'bg-red-600'}`}
                              style={{ width: `${Math.abs(profit) / Math.max(...Object.values(tradingAnalytics.profitBySymbol)) * 100}%` }}
                            ></div>
                          </div>
                          <span className={`text-sm font-medium ${getPerformanceColor(profit)}`}>
                            {formatCurrency(profit)}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Signal Accuracy */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Signal Accuracy</h3>
                <div className="space-y-3">
                  {Object.entries(tradingAnalytics.signalAccuracy).map(([signal, accuracy]) => (
                    <div key={signal} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{signal.replace(/_/g, ' ')}</span>
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${accuracy}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-blue-600">
                          {formatPercent(accuracy)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trading Activity by Hour */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Trading Activity by Hour</h3>
                <div className="grid grid-cols-12 gap-2">
                  {Object.entries(tradingAnalytics.tradesByHour).map(([hour, trades]) => (
                    <div key={hour} className="text-center">
                      <div className="text-xs text-gray-500 mb-1">{hour}:00</div>
                      <div 
                        className="bg-blue-600 rounded"
                        style={{ 
                          height: `${Math.max(trades / Math.max(...Object.values(tradingAnalytics.tradesByHour)) * 40, 2)}px`,
                          minHeight: '2px'
                        }}
                      ></div>
                      <div className="text-xs text-gray-700 mt-1">{trades}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'charts' && (
            <div className="space-y-6">
              {/* Equity Curve */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Equity Curve</h3>
                <div className="h-64 flex items-end space-x-1">
                  {chartData.equityCurve.map((point, index) => (
                    <div
                      key={`${point.date}-${index}`}
                      className="bg-blue-600 rounded-t"
                      style={{
                        height: `${(point.value - Math.min(...chartData.equityCurve.map(p => p.value))) / 
                          (Math.max(...chartData.equityCurve.map(p => p.value)) - Math.min(...chartData.equityCurve.map(p => p.value))) * 100}%`,
                        width: `${100 / chartData.equityCurve.length}%`
                      }}
                      title={`${point.date}: ${formatCurrency(point.value)}`}
                    ></div>
                  ))}
                </div>
              </div>

              {/* Profit Distribution */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Profit Distribution</h3>
                <div className="space-y-2">
                  {chartData.profitDistribution.map((range) => (
                    <div key={range.range} className="flex items-center">
                      <div className="w-24 text-sm text-gray-600">{range.range}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-4 mx-3">
                        <div 
                          className="bg-blue-600 h-4 rounded-full"
                          style={{ width: `${range.count / Math.max(...chartData.profitDistribution.map(r => r.count)) * 100}%` }}
                        ></div>
                      </div>
                      <div className="w-8 text-sm text-gray-900">{range.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'backtests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Backtest Results</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                  New Backtest
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Strategy</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sharpe</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drawdown</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Win Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trades</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {backtestResults.map((backtest) => (
                      <tr key={backtest.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {backtest.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {backtest.strategy.replace(/_/g, ' ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {backtest.period}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${
                            backtest.status === 'COMPLETED' ? getPerformanceColor(backtest.totalReturn) : 'text-gray-400'
                          }`}>
                            {backtest.status === 'COMPLETED' ? formatPercent(backtest.totalReturn) : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {backtest.status === 'COMPLETED' ? backtest.sharpeRatio.toFixed(2) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {backtest.status === 'COMPLETED' ? formatPercent(Math.abs(backtest.maxDrawdown)) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {backtest.status === 'COMPLETED' ? formatPercent(backtest.winRate) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {backtest.status === 'COMPLETED' ? backtest.totalTrades : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            backtest.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            backtest.status === 'RUNNING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {backtest.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button className="text-blue-600 hover:text-blue-900 mr-2">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900 mr-2">
                            <Download className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;