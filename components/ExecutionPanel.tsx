
import React from 'react';
import { SectionCard } from './SectionCard';
import type { Trade } from '../types';
import { Direction, SignalStatus } from '../types';
import { ActivityIcon } from './icons/ActivityIcon';

interface ExecutionPanelProps {
  trades: Trade[];
  currentSignalStatus?: SignalStatus;
  isConnected?: boolean;
  latency?: number;
  currentSignal?: any;
  realTimeData?: any;
  useRealData?: boolean;
}

const KPICard: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div className="bg-slate-900 p-3 rounded-md text-center">
    <p className="text-xs text-slate-400">{label}</p>
    <p className={`font-bold text-lg ${color}`}>{value}</p>
  </div>
);

export const ExecutionPanel: React.FC<ExecutionPanelProps> = ({ 
  trades, 
  currentSignalStatus, 
  isConnected: _isConnected = false, 
  latency = 85,
  currentSignal,
  realTimeData,
  useRealData = false
}) => {
  // Calculate real-time metrics
  const winningTrades = trades.filter(t => t.pnl && t.pnl > 0).length;
  const totalTrades = trades.filter(t => t.pnl !== undefined).length;
  const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(0) : '0';
  
  const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const maxDrawdown = Math.min(...trades.map(t => t.pnl || 0), 0);

  // Get live data status - check if system is configured for real data and connected
  const hasLiveData = useRealData && realTimeData && (realTimeData.isConnected || Object.keys(realTimeData.prices || {}).length > 0);
  const hasVisionAnalysis = currentSignal?.visionAnalysis;
  const analysisTimestamp = hasVisionAnalysis ? new Date(currentSignal.visionAnalysis.analysisTimestamp || Date.now()).toLocaleTimeString() : null;

  return (
    <SectionCard title="Execution & Feedback" icon={<ActivityIcon />}>
      <div className="flex flex-col h-full">
        {/* Connection Status */}
        <div className="mb-3 p-2 bg-slate-900 rounded-md">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">AI Pipeline:</span>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-1 ${hasLiveData ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className={hasLiveData ? 'text-green-400' : 'text-red-400'}>
                {hasLiveData ? 'Live Data Active' : 'Demo Mode'}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-slate-400">Vision Analysis:</span>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-1 ${hasVisionAnalysis ? 'bg-blue-400 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className={hasVisionAnalysis ? 'text-blue-400' : 'text-gray-400'}>
                {hasVisionAnalysis ? `Active (${analysisTimestamp})` : 'Inactive'}
              </span>
            </div>
          </div>
          {currentSignalStatus && (
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-slate-400">Signal Status:</span>
              <span className={`px-2 py-1 rounded text-xs ${
                currentSignalStatus === SignalStatus.APPROVED ? 'bg-green-500/20 text-green-400' :
                currentSignalStatus === SignalStatus.BLOCKED ? 'bg-red-500/20 text-red-400' :
                currentSignalStatus === SignalStatus.ANALYZING ? 'bg-blue-500/20 text-blue-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {currentSignalStatus}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-slate-400">Execution Mode:</span>
            <span className="text-yellow-400">Simulated (Safe)</span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <KPICard label="Win Rate" value={`${winRate}%`} color="text-green-400" />
          <KPICard label="Latency" value={`~${latency}ms`} color="text-cyan-400" />
          <KPICard 
            label="Drawdown" 
            value={`${Math.abs(maxDrawdown).toFixed(1)}%`} 
            color="text-red-400" 
          />
        </div>

        {/* Total P&L */}
        <div className="mb-3 p-2 bg-slate-900 rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Total P&L:</span>
            <span className={`font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
            </span>
          </div>
        </div>

        {/* AI Execution Process */}
        <div className="mb-3 p-2 bg-blue-900/20 border border-blue-500/30 rounded-md">
          <h4 className="text-xs font-semibold text-blue-400 mb-1">🔄 AI Execution Pipeline:</h4>
          <div className="text-xs text-slate-300 space-y-1">
            <div>1. Live chart capture & AI vision analysis</div>
            <div>2. Signal generation with confidence scoring</div>
            <div>3. Real-time compliance validation</div>
            <div>4. Risk assessment & position sizing</div>
            <div>5. Simulated execution with P&L tracking</div>
          </div>
        </div>

        {/* Trade Log */}
        <div className="flex-grow overflow-y-auto">
          <h3 className="text-sm font-semibold text-cyan-400 mb-2 sticky top-0 bg-slate-800 py-1">
            Live Trade Log ({trades.length})
          </h3>
          <div className="font-mono text-xs space-y-2">
            {trades.length === 0 ? (
              <div className="text-center text-slate-500 py-4">
                <p>No trades executed yet</p>
                <p className="text-xs mt-1">Waiting for approved signals...</p>
              </div>
            ) : (
              trades.map((trade) => (
                <div key={trade.id} className="grid grid-cols-4 gap-2 items-center bg-slate-900 p-2 rounded-md hover:bg-slate-800 transition-colors">
                  <span className="text-slate-300 truncate">{trade.symbol}</span>
                  <span className={`${trade.direction === Direction.LONG ? 'text-green-400' : 'text-red-400'} font-bold`}>
                    {trade.direction}
                  </span>
                  <span className={`${trade.pnl && trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'} font-semibold`}>
                    {trade.pnl ? `${trade.pnl >= 0 ? '+' : ''}$${Math.abs(trade.pnl).toFixed(2)}` : 'N/A'}
                  </span>
                  <span className="text-right text-slate-500 text-xs">
                    {new Date(trade.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Real-time Execution Status */}
        {currentSignalStatus === SignalStatus.APPROVED && (
          <div className="mt-3 p-2 bg-green-500/10 border border-green-500/20 rounded-md">
            <div className="flex items-center justify-center text-green-400 text-xs">
              <div className="animate-spin rounded-full h-3 w-3 border-b border-green-400 mr-2"></div>
              Executing Trade...
            </div>
          </div>
        )}
        
        {currentSignalStatus === SignalStatus.BLOCKED && (
          <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-md">
            <div className="flex items-center justify-center text-red-400 text-xs">
              ⚠️ Trade Blocked by Compliance
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
};
