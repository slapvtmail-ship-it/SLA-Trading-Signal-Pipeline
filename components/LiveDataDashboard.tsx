/**
 * Enhanced Live Data Dashboard Component
 * Phase 4: Complete Live Data Pipeline Implementation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { liveDataPipeline, PipelineSignal } from '../services/liveDataPipeline';
import { marketDataService, LiveMarketData } from '../services/marketDataService';
import { performanceMonitor, PerformanceSnapshot } from '../services/performanceMonitor';
import configManager from '../config';

interface LiveDataDashboardProps {
  isLiveMode: boolean;
  onToggleLiveMode: () => void;
}

interface MarketDataDisplay {
  [symbol: string]: LiveMarketData;
}

const LiveDataDashboard: React.FC<LiveDataDashboardProps> = ({
  isLiveMode,
  onToggleLiveMode
}) => {
  const [marketData, setMarketData] = useState<MarketDataDisplay>({});
  const [signals, setSignals] = useState<PipelineSignal[]>([]);
  const [performance, setPerformance] = useState<PerformanceSnapshot | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<any>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(2000);

  // Initialize dashboard
  useEffect(() => {
    const symbols = configManager.getSymbols();
    if (symbols.length > 0 && !selectedSymbol) {
      setSelectedSymbol(symbols[0]);
    }
  }, [selectedSymbol]);

  // Subscribe to market data updates
  useEffect(() => {
    if (!isLiveMode) return;

    const symbols = configManager.getSymbols();
    const unsubscribers: (() => void)[] = [];

    symbols.forEach(symbol => {
      const unsubscribe = marketDataService.subscribe(symbol, (data) => {
        setMarketData(prev => ({
          ...prev,
          [symbol]: data
        }));
      });
      unsubscribers.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [isLiveMode]);

  // Subscribe to pipeline events
  useEffect(() => {
    if (!isLiveMode) return;

    const unsubscribe = liveDataPipeline.addEventListener((event) => {
      if (event.type === 'SIGNAL_GENERATED') {
        setSignals(prev => [event.data, ...prev.slice(0, 49)]); // Keep last 50
      }
    });

    return unsubscribe;
  }, [isLiveMode]);

  // Subscribe to performance updates
  useEffect(() => {
    if (!isLiveMode) return;

    const unsubscribe = performanceMonitor.subscribe((snapshot) => {
      setPerformance(snapshot);
    });

    return unsubscribe;
  }, [isLiveMode]);

  // Auto-refresh pipeline status
  useEffect(() => {
    if (!isLiveMode || !autoRefresh) return;

    const interval = setInterval(() => {
      const status = liveDataPipeline.getStatus();
      setPipelineStatus(status);
      
      const allSignals = liveDataPipeline.getSignals();
      setSignals(allSignals.slice(0, 50)); // Keep last 50
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isLiveMode, autoRefresh, refreshInterval]);

  // Start/stop live data pipeline
  const handleToggleLiveMode = useCallback(async () => {
    try {
      if (isLiveMode) {
        await liveDataPipeline.stopPipeline();
        performanceMonitor.stopMonitoring();
      } else {
        await liveDataPipeline.startPipeline();
        performanceMonitor.startMonitoring();
      }
      onToggleLiveMode();
    } catch (error) {
      console.error('Error toggling live mode:', error);
    }
  }, [isLiveMode, onToggleLiveMode]);

  // Execute signal
  const handleExecuteSignal = useCallback((signalId: string) => {
    liveDataPipeline.executeSignal(signalId);
    
    // Simulate trade execution for performance metrics
    const signal = signals.find(s => s.id === signalId);
    if (signal) {
      const pnl = (Math.random() - 0.4) * 500; // 60% win rate simulation
      const holdTime = Math.random() * 3600000; // Random hold time
      performanceMonitor.addTrade(pnl, holdTime);
    }
  }, [signals]);

  // Cancel signal
  const handleCancelSignal = useCallback((signalId: string) => {
    liveDataPipeline.cancelSignal(signalId);
  }, []);

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'HEALTHY': return 'text-green-500';
      case 'WARNING': return 'text-yellow-500';
      case 'CRITICAL': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // Get signal direction color
  const getSignalColor = (direction: string): string => {
    switch (direction) {
      case 'BUY': return 'text-green-500';
      case 'SELL': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const symbols = configManager.getSymbols();
  const selectedMarketData = selectedSymbol ? marketData[selectedSymbol] : null;

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Live Data Dashboard</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-300">Auto Refresh:</label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
          </div>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="bg-gray-700 text-white rounded px-3 py-1 text-sm"
          >
            <option value={1000}>1s</option>
            <option value={2000}>2s</option>
            <option value={5000}>5s</option>
            <option value={10000}>10s</option>
          </select>
          <button
            onClick={handleToggleLiveMode}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              isLiveMode
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isLiveMode ? '⏹️ Stop Live Data' : '▶️ Start Live Data'}
          </button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Pipeline Status</h3>
          <div className={`text-lg font-bold ${
            pipelineStatus?.isRunning ? 'text-green-500' : 'text-red-500'
          }`}>
            {pipelineStatus?.isRunning ? '🟢 Running' : '🔴 Stopped'}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Uptime: {pipelineStatus?.uptime ? Math.floor(pipelineStatus.uptime / 1000 / 60) : 0}m
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2">System Health</h3>
          <div className={`text-lg font-bold ${
            performance ? getStatusColor(performance.status) : 'text-gray-500'
          }`}>
            {performance?.status || 'Unknown'}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Alerts: {performance?.alerts.length || 0}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Active Signals</h3>
          <div className="text-lg font-bold text-blue-500">
            {pipelineStatus?.activeSignals || 0}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Total: {pipelineStatus?.metrics?.totalSignals || 0}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Performance</h3>
          <div className="text-lg font-bold text-green-500">
            {performance?.metrics.trading.winRate.toFixed(1) || '0.0'}%
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Win Rate
          </div>
        </div>
      </div>

      {/* Market Data Overview */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Market Data</h3>
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="bg-gray-700 text-white rounded px-3 py-2"
          >
            {symbols.map(symbol => (
              <option key={symbol} value={symbol}>
                {symbol.replace('BINANCE:', '')}
              </option>
            ))}
          </select>
        </div>

        {selectedMarketData ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Price Info */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-300">Price Information</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Current Price:</span>
                  <span className="text-white font-mono">
                    {formatCurrency(selectedMarketData.tick.price)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">24h Change:</span>
                  <span className={`font-mono ${
                    selectedMarketData.tick.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {formatPercentage(selectedMarketData.tick.change24h)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Volume:</span>
                  <span className="text-white font-mono">
                    {selectedMarketData.tick.volume.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Spread:</span>
                  <span className="text-white font-mono">
                    {formatCurrency(selectedMarketData.tick.spread)}
                  </span>
                </div>
              </div>
            </div>

            {/* Technical Indicators */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-300">Technical Indicators</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">RSI:</span>
                  <span className={`font-mono ${
                    selectedMarketData.technicals.rsi > 70 ? 'text-red-500' :
                    selectedMarketData.technicals.rsi < 30 ? 'text-green-500' : 'text-white'
                  }`}>
                    {selectedMarketData.technicals.rsi.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">MACD:</span>
                  <span className={`font-mono ${
                    selectedMarketData.technicals.macd.macd > selectedMarketData.technicals.macd.signal 
                      ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {selectedMarketData.technicals.macd.macd.toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">EMA Ratio:</span>
                  <span className="text-white font-mono">
                    {(selectedMarketData.technicals.ema.ema12 / selectedMarketData.technicals.ema.ema26).toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Vol Ratio:</span>
                  <span className={`font-mono ${
                    selectedMarketData.technicals.volume.ratio > 1.2 ? 'text-green-500' : 'text-white'
                  }`}>
                    {selectedMarketData.technicals.volume.ratio.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Sentiment */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-300">Market Sentiment</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Score:</span>
                  <span className={`font-mono ${
                    selectedMarketData.sentiment.score > 0.3 ? 'text-green-500' :
                    selectedMarketData.sentiment.score < -0.3 ? 'text-red-500' : 'text-yellow-500'
                  }`}>
                    {selectedMarketData.sentiment.score.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Confidence:</span>
                  <span className="text-white font-mono">
                    {(selectedMarketData.sentiment.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-gray-400 text-sm">Signals:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedMarketData.sentiment.signals.map((signal, index) => (
                      <span
                        key={`${signal}-${index}`}
                        className="px-2 py-1 bg-gray-700 text-xs rounded text-gray-300"
                      >
                        {signal}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            {isLiveMode ? 'Loading market data...' : 'Start live data to view market information'}
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      {performance && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Trading Performance */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-300">Trading Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total P&L:</span>
                  <span className={`font-mono ${
                    performance.metrics.trading.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {formatCurrency(performance.metrics.trading.profitLoss)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Daily P&L:</span>
                  <span className={`font-mono ${
                    performance.metrics.trading.dailyPnL >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {formatCurrency(performance.metrics.trading.dailyPnL)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Win Rate:</span>
                  <span className="text-white font-mono">
                    {performance.metrics.trading.winRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Drawdown:</span>
                  <span className="text-red-500 font-mono">
                    {performance.metrics.trading.maxDrawdown.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* System Performance */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-300">System Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">CPU Usage:</span>
                  <span className={`font-mono ${
                    performance.metrics.system.cpuUsage > 80 ? 'text-red-500' :
                    performance.metrics.system.cpuUsage > 60 ? 'text-yellow-500' : 'text-green-500'
                  }`}>
                    {performance.metrics.system.cpuUsage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Memory:</span>
                  <span className={`font-mono ${
                    performance.metrics.system.memoryUsage > 85 ? 'text-red-500' :
                    performance.metrics.system.memoryUsage > 70 ? 'text-yellow-500' : 'text-green-500'
                  }`}>
                    {performance.metrics.system.memoryUsage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Latency:</span>
                  <span className="text-white font-mono">
                    {performance.metrics.system.networkLatency.toFixed(0)}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Error Rate:</span>
                  <span className={`font-mono ${
                    performance.metrics.system.errorRate > 5 ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {performance.metrics.system.errorRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Pipeline Performance */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-300">Pipeline Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Signals Generated:</span>
                  <span className="text-white font-mono">
                    {performance.metrics.pipeline.signalsGenerated}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Signals Executed:</span>
                  <span className="text-white font-mono">
                    {performance.metrics.pipeline.signalsExecuted}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Latency:</span>
                  <span className="text-white font-mono">
                    {performance.metrics.pipeline.avgSignalLatency.toFixed(0)}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Throughput:</span>
                  <span className="text-white font-mono">
                    {performance.metrics.pipeline.throughput.toFixed(1)}/min
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Signals */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Trading Signals</h3>
        {signals.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {signals.slice(0, 10).map((signal) => (
              <div
                key={signal.id}
                className="bg-gray-700 rounded-lg p-4 border-l-4 border-blue-500"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-white">
                      {signal.symbol.replace('BINANCE:', '')}
                    </span>
                    <span className={`font-bold ${getSignalColor(signal.direction)}`}>
                      {signal.direction}
                    </span>
                    <span className="text-sm text-gray-400">
                      {new Date(signal.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      signal.status === 'PENDING' ? 'bg-yellow-600 text-yellow-100' :
                      signal.status === 'EXECUTED' ? 'bg-green-600 text-green-100' :
                      signal.status === 'CANCELLED' ? 'bg-red-600 text-red-100' :
                      'bg-gray-600 text-gray-100'
                    }`}>
                      {signal.status}
                    </span>
                    {signal.status === 'PENDING' && (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleExecuteSignal(signal.id)}
                          className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                        >
                          Execute
                        </button>
                        <button
                          onClick={() => handleCancelSignal(signal.id)}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Entry: </span>
                    <span className="text-white font-mono">
                      {formatCurrency(signal.entryPrice)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Stop Loss: </span>
                    <span className="text-red-400 font-mono">
                      {formatCurrency(signal.stopLoss)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Take Profit: </span>
                    <span className="text-green-400 font-mono">
                      {formatCurrency(signal.takeProfit)}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-sm">
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-400">Confidence: </span>
                    <span className="text-white">
                      {(signal.confidence * 100).toFixed(1)}%
                    </span>
                    <span className="text-gray-400">Risk: </span>
                    <span className={`${
                      signal.riskScore > 0.7 ? 'text-red-400' :
                      signal.riskScore > 0.4 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {(signal.riskScore * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1 text-gray-300">
                    {signal.reasoning}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            {isLiveMode ? 'No signals generated yet' : 'Start live data to generate signals'}
          </div>
        )}
      </div>

      {/* Active Alerts */}
      {performance?.alerts && performance.alerts.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Active Alerts</h3>
          <div className="space-y-2">
            {performance.alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border-l-4 ${
                  alert.type === 'CRITICAL' ? 'bg-red-900 border-red-500' :
                  alert.type === 'ERROR' ? 'bg-orange-900 border-orange-500' :
                  'bg-yellow-900 border-yellow-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">{alert.message}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveDataDashboard;