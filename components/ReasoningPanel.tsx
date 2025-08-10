
import React from 'react';
import { SectionCard } from './SectionCard';
import type { TradeSignal } from '../types';
import { Direction, SignalStatus } from '../types';
import { ZapIcon } from './icons/ZapIcon';

interface ReasoningPanelProps {
  signal: TradeSignal | null;
  status: SignalStatus;
}

const getStatusColor = (status: SignalStatus) => {
    switch (status) {
        case SignalStatus.APPROVED: return 'bg-green-500/20 text-green-400';
        case SignalStatus.BLOCKED: return 'bg-red-500/20 text-red-400';
        case SignalStatus.ANALYZING:
        case SignalStatus.COMPLIANCE:
            return 'bg-yellow-500/20 text-yellow-400';
        default: return 'bg-slate-600/20 text-slate-400';
    }
}

const getDirectionStyles = (direction: Direction) => {
    switch (direction) {
        case Direction.LONG: return 'bg-green-500/20 text-green-400 border-green-500';
        case Direction.SHORT: return 'bg-red-500/20 text-red-400 border-red-500';
        default: return 'bg-slate-600/20 text-slate-400 border-slate-600';
    }
}

export const ReasoningPanel: React.FC<ReasoningPanelProps> = ({ signal, status }) => {
  
  if (!signal) {
    return (
      <SectionCard title="Reasoning: Gemini AI Signal" icon={<ZapIcon />}>
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-900 p-3 rounded-md">
            <h3 className="text-lg font-bold text-white">Waiting for signal...</h3>
            <span className={`px-3 py-1 text-sm font-bold rounded-full ${getStatusColor(status)}`}>
              {status}
            </span>
          </div>
          
          <div className="p-4 rounded-lg border-2 bg-slate-600/20 text-slate-400 border-slate-600">
            <p className="text-center text-2xl font-black tracking-wider">MONITORING</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-900 p-2 rounded-md">
              <p className="text-slate-400">Entry</p>
              <p className="font-mono font-semibold text-slate-400">--</p>
            </div>
            <div className="bg-slate-900 p-2 rounded-md">
              <p className="text-slate-400">Confidence</p>
              <p className="font-mono font-semibold text-slate-400">--</p>
            </div>
            <div className="bg-slate-900 p-2 rounded-md">
              <p className="text-slate-400">Stop-Loss</p>
              <p className="font-mono font-semibold text-slate-400">--</p>
            </div>
            <div className="bg-slate-900 p-2 rounded-md">
              <p className="text-slate-400">Take-Profit</p>
              <p className="font-mono font-semibold text-slate-400">--</p>
            </div>
          </div>
        </div>
      </SectionCard>
    );
  }

  const directionStyles = getDirectionStyles(signal.direction);

  return (
    <SectionCard title="Reasoning: Gemini AI Signal" icon={<ZapIcon />}>
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-slate-900 p-3 rounded-md">
            <h3 className="text-lg font-bold text-white">{signal.symbol}</h3>
            <span className={`px-3 py-1 text-sm font-bold rounded-full ${getStatusColor(status)}`}>
                {status}
            </span>
        </div>
        
        <div className={`p-4 rounded-lg border-2 ${directionStyles}`}>
            <p className="text-center text-2xl font-black tracking-wider">{signal.direction}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-slate-900 p-2 rounded-md">
            <p className="text-slate-400">Entry</p>
            <p className="font-mono font-semibold text-white">{signal.entry.toFixed(2)}</p>
          </div>
          <div className="bg-slate-900 p-2 rounded-md">
            <p className="text-slate-400">Confidence</p>
            <p className="font-mono font-semibold text-white">{(signal.confidence * 100).toFixed(0)}%</p>
          </div>
          <div className="bg-slate-900 p-2 rounded-md">
            <p className="text-slate-400">Stop-Loss</p>
            <p className="font-mono font-semibold text-red-400">{signal.stopLoss.toFixed(2)}</p>
          </div>
          <div className="bg-slate-900 p-2 rounded-md">
            <p className="text-slate-400">Take-Profit</p>
            <p className="font-mono font-semibold text-green-400">{signal.takeProfit.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
};
