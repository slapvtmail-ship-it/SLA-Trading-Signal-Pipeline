
import React from 'react';
import { SectionCard } from './SectionCard';
import type { Trade } from '../types';
import { Direction } from '../types';
import { ActivityIcon } from './icons/ActivityIcon';

interface ExecutionPanelProps {
  trades: Trade[];
}

const KPICard: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div className="bg-slate-900 p-3 rounded-md text-center">
    <p className="text-xs text-slate-400">{label}</p>
    <p className={`font-bold text-lg ${color}`}>{value}</p>
  </div>
);

export const ExecutionPanel: React.FC<ExecutionPanelProps> = ({ trades }) => {
  return (
    <SectionCard title="Execution & Feedback" icon={<ActivityIcon />}>
      <div className="flex flex-col h-full">
        <div className="grid grid-cols-3 gap-2 mb-4">
          <KPICard label="Win Rate" value="72%" color="text-green-400" />
          <KPICard label="Latency" value="~85ms" color="text-cyan-400" />
          <KPICard label="Drawdown" value="8.2%" color="text-red-400" />
        </div>
        <div className="flex-grow overflow-y-auto">
          <h3 className="text-sm font-semibold text-cyan-400 mb-2 sticky top-0 bg-slate-800 py-1">Live Trade Log</h3>
          <div className="font-mono text-xs space-y-2">
            {trades.map((trade) => (
              <div key={trade.id} className="grid grid-cols-4 gap-2 items-center bg-slate-900 p-2 rounded-md">
                <span className="text-slate-300">{trade.symbol}</span>
                <span className={`${trade.direction === Direction.LONG ? 'text-green-400' : 'text-red-400'} font-bold`}>
                  {trade.direction}
                </span>
                <span className={`${trade.pnl && trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {trade.pnl ? `${trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}` : 'N/A'}
                </span>
                <span className="text-right text-slate-500">{new Date(trade.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
};
