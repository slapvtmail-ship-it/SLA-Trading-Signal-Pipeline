/**
 * Advanced Risk Management Dashboard Component
 * Phase 5: Enhanced Features & Optimization
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  TrendingDown, 
  Activity, 
  Target,
  BarChart3,
  DollarSign,
  Percent,
  PieChart,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

interface RiskAlert {
  id: string;
  type: 'POSITION' | 'PORTFOLIO' | 'MARKET' | 'SYSTEM';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  timestamp: string;
  symbol?: string;
  value: number;
  threshold: number;
  action: 'MONITOR' | 'REDUCE' | 'CLOSE' | 'HALT';
  acknowledged: boolean;
}

interface RiskMetrics {
  currentRiskScore: number;
  averageRiskScore: number;
  maxRiskScore: number;
  valueAtRisk: number;
  expectedShortfall: number;
  maxDrawdown: number;
  concentrationRisk: number;
  liquidityRisk: number;
  volatilityRisk: number;
  correlationRisk: number;
}

interface RiskParameters {
  maxPositionSize: number;
  maxDailyLoss: number;
  maxDrawdown: number;
  maxLeverage: number;
  stopLossPercentage: number;
  takeProfitPercentage: number;
  maxOpenPositions: number;
  correlationLimit: number;
  volatilityThreshold: number;
}

interface PositionRisk {
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

const RiskDashboard: React.FC = () => {
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [riskParameters, setRiskParameters] = useState<RiskParameters | null>(null);
  const [positionRisks, setPositionRisks] = useState<PositionRisk[]>([]);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'alerts' | 'positions' | 'settings'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRiskData();
    const interval = setInterval(loadRiskData, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadRiskData = async () => {
    try {
      // Mock data - in real implementation, this would fetch from risk manager
      const mockRiskMetrics: RiskMetrics = {
        currentRiskScore: 42,
        averageRiskScore: 38,
        maxRiskScore: 78,
        valueAtRisk: -2850,
        expectedShortfall: -3200,
        maxDrawdown: -8.5,
        concentrationRisk: 0.35,
        liquidityRisk: 0.25,
        volatilityRisk: 0.45,
        correlationRisk: 0.62
      };

      const mockAlerts: RiskAlert[] = [
        {
          id: 'alert-1',
          type: 'PORTFOLIO',
          severity: 'HIGH',
          message: 'Daily loss approaching limit: $1,850',
          timestamp: '2024-01-20T14:30:00Z',
          value: 1850,
          threshold: 2000,
          action: 'MONITOR',
          acknowledged: false
        },
        {
          id: 'alert-2',
          type: 'POSITION',
          severity: 'MEDIUM',
          message: 'High correlation detected between BTC and ETH positions',
          timestamp: '2024-01-20T13:45:00Z',
          symbol: 'BTCUSDT',
          value: 0.85,
          threshold: 0.7,
          action: 'REDUCE',
          acknowledged: false
        },
        {
          id: 'alert-3',
          type: 'MARKET',
          severity: 'LOW',
          message: 'Market volatility increased to 28%',
          timestamp: '2024-01-20T12:15:00Z',
          value: 28,
          threshold: 25,
          action: 'MONITOR',
          acknowledged: true
        }
      ];

      const mockParameters: RiskParameters = {
        maxPositionSize: 10000,
        maxDailyLoss: 2000,
        maxDrawdown: 15,
        maxLeverage: 3,
        stopLossPercentage: 2,
        takeProfitPercentage: 6,
        maxOpenPositions: 5,
        correlationLimit: 0.7,
        volatilityThreshold: 25
      };

      const mockPositionRisks: PositionRisk[] = [
        {
          symbol: 'BTCUSDT',
          positionSize: 23750,
          unrealizedPnL: 1250,
          riskScore: 35,
          stopLoss: 43000,
          takeProfit: 50000,
          leverage: 1,
          entryTime: '2024-01-15T10:30:00Z',
          currentPrice: 47500,
          riskReward: 2.5
        },
        {
          symbol: 'ETHUSDT',
          positionSize: 15500,
          unrealizedPnL: 1500,
          riskScore: 28,
          stopLoss: 2650,
          takeProfit: 3400,
          leverage: 1,
          entryTime: '2024-01-16T14:20:00Z',
          currentPrice: 3100,
          riskReward: 2.0
        },
        {
          symbol: 'ADAUSDT',
          positionSize: 5200,
          unrealizedPnL: 700,
          riskScore: 45,
          stopLoss: 0.42,
          takeProfit: 0.60,
          leverage: 1,
          entryTime: '2024-01-17T09:15:00Z',
          currentPrice: 0.52,
          riskReward: 2.67
        }
      ];

      setRiskMetrics(mockRiskMetrics);
      setRiskAlerts(mockAlerts);
      setRiskParameters(mockParameters);
      setPositionRisks(mockPositionRisks);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading risk data:', error);
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

  const getRiskColor = (score: number): string => {
    if (score < 30) return 'text-green-600';
    if (score < 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskBgColor = (score: number): string => {
    if (score < 30) return 'bg-green-100';
    if (score < 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'LOW': return 'text-blue-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'HIGH': return 'text-orange-600';
      case 'CRITICAL': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSeverityBgColor = (severity: string): string => {
    switch (severity) {
      case 'LOW': return 'bg-blue-100';
      case 'MEDIUM': return 'bg-yellow-100';
      case 'HIGH': return 'bg-orange-100';
      case 'CRITICAL': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    setRiskAlerts(alerts => 
      alerts.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!riskMetrics || !riskParameters) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No risk data</h3>
        <p className="mt-1 text-sm text-gray-500">Unable to load risk management information.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Risk Management Dashboard</h1>
            <p className="text-sm text-gray-500">Real-time risk monitoring and control</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskBgColor(riskMetrics.currentRiskScore)} ${getRiskColor(riskMetrics.currentRiskScore)}`}>
              Risk Score: {riskMetrics.currentRiskScore}
            </div>
            <button className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700">
              Emergency Stop
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview', icon: Shield },
              { id: 'alerts', name: 'Alerts', icon: AlertTriangle },
              { id: 'positions', name: 'Position Risk', icon: Target },
              { id: 'settings', name: 'Settings', icon: Activity }
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
                {tab.id === 'alerts' && riskAlerts.filter(a => !a.acknowledged).length > 0 && (
                  <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                    {riskAlerts.filter(a => !a.acknowledged).length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {selectedTab === 'overview' && (
            <div className="space-y-6">
              {/* Risk Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Shield className={`h-8 w-8 ${getRiskColor(riskMetrics.currentRiskScore)}`} />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Current Risk</p>
                      <p className={`text-2xl font-bold ${getRiskColor(riskMetrics.currentRiskScore)}`}>
                        {riskMetrics.currentRiskScore}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <TrendingDown className="h-8 w-8 text-red-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Value at Risk</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(riskMetrics.valueAtRisk)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <BarChart3 className="h-8 w-8 text-orange-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Max Drawdown</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {formatPercent(Math.abs(riskMetrics.maxDrawdown))}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <PieChart className="h-8 w-8 text-yellow-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Concentration</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {formatPercent(riskMetrics.concentrationRisk * 100)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Breakdown</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Concentration Risk</span>
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className="bg-yellow-600 h-2 rounded-full" 
                            style={{ width: `${riskMetrics.concentrationRisk * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{formatPercent(riskMetrics.concentrationRisk * 100)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Liquidity Risk</span>
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${riskMetrics.liquidityRisk * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{formatPercent(riskMetrics.liquidityRisk * 100)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Volatility Risk</span>
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className="bg-orange-600 h-2 rounded-full" 
                            style={{ width: `${riskMetrics.volatilityRisk * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{formatPercent(riskMetrics.volatilityRisk * 100)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Correlation Risk</span>
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className="bg-red-600 h-2 rounded-full" 
                            style={{ width: `${riskMetrics.correlationRisk * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{formatPercent(riskMetrics.correlationRisk * 100)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Limits</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Max Position Size</span>
                      <span className="text-sm font-medium">{formatCurrency(riskParameters.maxPositionSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Max Daily Loss</span>
                      <span className="text-sm font-medium">{formatCurrency(riskParameters.maxDailyLoss)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Max Drawdown</span>
                      <span className="text-sm font-medium">{formatPercent(riskParameters.maxDrawdown)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Max Leverage</span>
                      <span className="text-sm font-medium">{riskParameters.maxLeverage}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Max Open Positions</span>
                      <span className="text-sm font-medium">{riskParameters.maxOpenPositions}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'alerts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Risk Alerts</h3>
                <div className="flex space-x-2">
                  <span className="text-sm text-gray-500">
                    {riskAlerts.filter(a => !a.acknowledged).length} unacknowledged
                  </span>
                </div>
              </div>
              
              {riskAlerts.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No active alerts</h3>
                  <p className="mt-1 text-sm text-gray-500">All risk metrics are within acceptable limits.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {riskAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`border rounded-lg p-4 ${
                        alert.acknowledged ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start">
                          <div className={`flex-shrink-0 ${getSeverityBgColor(alert.severity)} rounded-full p-2`}>
                            {alert.severity === 'CRITICAL' ? (
                              <XCircle className={`h-5 w-5 ${getSeverityColor(alert.severity)}`} />
                            ) : (
                              <AlertCircle className={`h-5 w-5 ${getSeverityColor(alert.severity)}`} />
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="flex items-center">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityBgColor(alert.severity)} ${getSeverityColor(alert.severity)}`}>
                                {alert.severity}
                              </span>
                              <span className="ml-2 text-xs text-gray-500">{alert.type}</span>
                              {alert.symbol && (
                                <span className="ml-2 text-xs font-medium text-gray-700">{alert.symbol}</span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-gray-900">{alert.message}</p>
                            <div className="mt-2 flex items-center text-xs text-gray-500">
                              <Clock className="h-4 w-4 mr-1" />
                              {new Date(alert.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            alert.action === 'HALT' ? 'bg-red-100 text-red-800' :
                            alert.action === 'CLOSE' ? 'bg-orange-100 text-orange-800' :
                            alert.action === 'REDUCE' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {alert.action}
                          </span>
                          {!alert.acknowledged && (
                            <button
                              onClick={() => acknowledgeAlert(alert.id)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Acknowledge
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedTab === 'positions' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Position Risk Analysis</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position Size</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unrealized P&L</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk/Reward</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stop Loss</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Take Profit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {positionRisks.map((position) => (
                      <tr key={position.symbol} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {position.symbol}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(position.positionSize)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${
                            position.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(position.unrealizedPnL)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskBgColor(position.riskScore)} ${getRiskColor(position.riskScore)}`}>
                            {position.riskScore}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          1:{position.riskReward.toFixed(1)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${position.stopLoss.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${position.takeProfit.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button className="text-blue-600 hover:text-blue-900 mr-2">Adjust</button>
                          <button className="text-red-600 hover:text-red-900">Close</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Risk Parameters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Position Size</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DollarSign className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        value={riskParameters.maxPositionSize}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Daily Loss</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DollarSign className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        value={riskParameters.maxDailyLoss}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Drawdown (%)</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Percent className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        value={riskParameters.maxDrawdown}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stop Loss (%)</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Percent className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        value={riskParameters.stopLossPercentage}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Take Profit (%)</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Percent className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        value={riskParameters.takeProfitPercentage}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Open Positions</label>
                    <input
                      type="number"
                      value={riskParameters.maxOpenPositions}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                  Save Parameters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiskDashboard;