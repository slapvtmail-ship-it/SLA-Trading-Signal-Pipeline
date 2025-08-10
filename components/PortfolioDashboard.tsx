/**
 * Advanced Portfolio Dashboard Component
 * Phase 5: Enhanced Features & Optimization
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  AlertTriangle,
  Target,
  Activity,
  Shield,
  Clock,
  Zap
} from 'lucide-react';

interface Portfolio {
  id: string;
  name: string;
  totalValue: number;
  availableCash: number;
  totalPnL: number;
  dailyPnL: number;
  positions: Position[];
  performance: PortfolioPerformance;
  allocation: AssetAllocation;
  lastUpdated: string;
}

interface Position {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  stopLoss?: number;
  takeProfit?: number;
  entryTime: string;
  status: 'OPEN' | 'CLOSED' | 'PENDING';
}

interface PortfolioPerformance {
  totalReturnPercent: number;
  dailyReturnPercent: number;
  weeklyReturn: number;
  monthlyReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  totalTrades: number;
}

interface AssetAllocation {
  cash: number;
  crypto: number;
  stocks: number;
  forex: number;
  commodities: number;
  other: number;
}

interface RiskMetrics {
  riskScore: number;
  valueAtRisk: number;
  maxDrawdown: number;
  concentrationRisk: number;
}

const PortfolioDashboard: React.FC = () => {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '1Y'>('1D');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPortfolioData();
    const interval = setInterval(loadPortfolioData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadPortfolioData = async () => {
    try {
      // Mock data - in real implementation, this would fetch from portfolio manager
      const mockPortfolio: Portfolio = {
        id: 'portfolio-1',
        name: 'Main Trading Portfolio',
        totalValue: 127500,
        availableCash: 45000,
        totalPnL: 27500,
        dailyPnL: 1250,
        positions: [
          {
            id: 'pos-1',
            symbol: 'BTCUSDT',
            side: 'LONG',
            quantity: 0.5,
            entryPrice: 45000,
            currentPrice: 47500,
            marketValue: 23750,
            unrealizedPnL: 1250,
            stopLoss: 43000,
            takeProfit: 50000,
            entryTime: '2024-01-15T10:30:00Z',
            status: 'OPEN'
          },
          {
            id: 'pos-2',
            symbol: 'ETHUSDT',
            side: 'LONG',
            quantity: 5,
            entryPrice: 2800,
            currentPrice: 3100,
            marketValue: 15500,
            unrealizedPnL: 1500,
            stopLoss: 2650,
            takeProfit: 3400,
            entryTime: '2024-01-16T14:20:00Z',
            status: 'OPEN'
          },
          {
            id: 'pos-3',
            symbol: 'ADAUSDT',
            side: 'LONG',
            quantity: 10000,
            entryPrice: 0.45,
            currentPrice: 0.52,
            marketValue: 5200,
            unrealizedPnL: 700,
            stopLoss: 0.42,
            takeProfit: 0.60,
            entryTime: '2024-01-17T09:15:00Z',
            status: 'OPEN'
          }
        ],
        performance: {
          totalReturnPercent: 27.5,
          dailyReturnPercent: 0.98,
          weeklyReturn: 4.2,
          monthlyReturn: 12.8,
          maxDrawdown: -8.5,
          sharpeRatio: 1.85,
          winRate: 68.5,
          totalTrades: 47
        },
        allocation: {
          cash: 35.3,
          crypto: 64.7,
          stocks: 0,
          forex: 0,
          commodities: 0,
          other: 0
        },
        lastUpdated: new Date().toISOString()
      };

      const mockRiskMetrics: RiskMetrics = {
        riskScore: 42,
        valueAtRisk: -2850,
        maxDrawdown: -8.5,
        concentrationRisk: 0.35
      };

      setPortfolio(mockPortfolio);
      setRiskMetrics(mockRiskMetrics);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading portfolio data:', error);
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
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getRiskColor = (score: number): string => {
    if (score < 30) return 'text-green-600';
    if (score < 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskLabel = (score: number): string => {
    if (score < 30) return 'Low Risk';
    if (score < 60) return 'Medium Risk';
    return 'High Risk';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!portfolio || !riskMetrics) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No portfolio data</h3>
        <p className="mt-1 text-sm text-gray-500">Unable to load portfolio information.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{portfolio.name}</h1>
            <p className="text-sm text-gray-500">Last updated: {new Date(portfolio.lastUpdated).toLocaleString()}</p>
          </div>
          <div className="flex space-x-2">
            {(['1D', '1W', '1M', '3M', '1Y'] as const).map((timeframe) => (
              <button
                key={timeframe}
                onClick={() => setSelectedTimeframe(timeframe)}
                className={`px-3 py-1 text-sm rounded-md ${
                  selectedTimeframe === timeframe
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {timeframe}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(portfolio.totalValue)}</p>
              <p className={`text-sm ${portfolio.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(portfolio.performance.totalReturnPercent)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {portfolio.dailyPnL >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-600" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-600" />
              )}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Daily P&L</p>
              <p className={`text-2xl font-bold ${portfolio.dailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(portfolio.dailyPnL)}
              </p>
              <p className={`text-sm ${portfolio.dailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(portfolio.performance.dailyReturnPercent)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Shield className={`h-8 w-8 ${getRiskColor(riskMetrics.riskScore)}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Risk Score</p>
              <p className={`text-2xl font-bold ${getRiskColor(riskMetrics.riskScore)}`}>
                {riskMetrics.riskScore}
              </p>
              <p className={`text-sm ${getRiskColor(riskMetrics.riskScore)}`}>
                {getRiskLabel(riskMetrics.riskScore)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Win Rate</p>
              <p className="text-2xl font-bold text-gray-900">{portfolio.performance.winRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-500">{portfolio.performance.totalTrades} trades</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Sharpe Ratio</span>
              <span className="text-sm font-medium text-gray-900">{portfolio.performance.sharpeRatio.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Max Drawdown</span>
              <span className="text-sm font-medium text-red-600">{portfolio.performance.maxDrawdown.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Weekly Return</span>
              <span className={`text-sm font-medium ${portfolio.performance.weeklyReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(portfolio.performance.weeklyReturn)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Monthly Return</span>
              <span className={`text-sm font-medium ${portfolio.performance.monthlyReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(portfolio.performance.monthlyReturn)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Value at Risk (95%)</span>
              <span className="text-sm font-medium text-red-600">{formatCurrency(riskMetrics.valueAtRisk)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Concentration Risk</span>
              <span className="text-sm font-medium text-yellow-600">{(riskMetrics.concentrationRisk * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Available Cash</span>
              <span className="text-sm font-medium text-gray-900">{formatCurrency(portfolio.availableCash)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Cash Allocation</span>
              <span className="text-sm font-medium text-gray-900">{portfolio.allocation.cash.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Allocation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Asset Allocation</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(portfolio.allocation).map(([asset, percentage]) => (
            <div key={asset} className="text-center">
              <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">{percentage.toFixed(0)}%</span>
              </div>
              <p className="text-sm font-medium text-gray-900 capitalize">{asset}</p>
              <p className="text-xs text-gray-500">{formatCurrency(portfolio.totalValue * percentage / 100)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Active Positions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Active Positions</h3>
          <span className="text-sm text-gray-500">{portfolio.positions.length} positions</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Side</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entry Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unrealized P&L</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {portfolio.positions.map((position) => (
                <tr key={position.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {position.symbol}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      position.side === 'LONG' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {position.side}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {position.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${position.entryPrice.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${position.currentPrice.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(position.marketValue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      position.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(position.unrealizedPnL)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="text-blue-600 hover:text-blue-900 mr-2">Edit</button>
                    <button className="text-red-600 hover:text-red-900">Close</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
            <BarChart3 className="h-5 w-5 mr-2" />
            Analytics
          </button>
          <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Activity className="h-5 w-5 mr-2" />
            Rebalance
          </button>
          <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Zap className="h-5 w-5 mr-2" />
            Auto-Trade
          </button>
          <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Clock className="h-5 w-5 mr-2" />
            History
          </button>
        </div>
      </div>
    </div>
  );
};

export default PortfolioDashboard;