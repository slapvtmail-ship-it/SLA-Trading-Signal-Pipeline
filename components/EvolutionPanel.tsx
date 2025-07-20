
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { SectionCard } from './SectionCard';
import type { PerformanceDataPoint } from '../types';
import { TrendingUpIcon } from './icons/TrendingUpIcon';

interface EvolutionPanelProps {
  performanceData: PerformanceDataPoint[];
}

export const EvolutionPanel: React.FC<EvolutionPanelProps> = ({ performanceData }) => {
  return (
    <SectionCard title="Continuous Evolution" icon={<TrendingUpIcon />}>
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-slate-400">Daily Backtest Performance</p>
            <span className="text-xs font-semibold bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
                Version: Stable 2.1.4
            </span>
        </div>
        <div className="flex-grow h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={performanceData}
              margin={{
                top: 5, right: 20, left: -10, bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderColor: '#334155',
                  color: '#cbd5e1'
                }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Legend wrapperStyle={{fontSize: "12px"}}/>
              <Line type="monotone" dataKey="performance" name="Model Edge" stroke="#2dd4bf" strokeWidth={2} dot={{ r: 4, fill: '#2dd4bf' }} />
              <Line type="monotone" dataKey="threshold" name="Threshold" stroke="#f43f5e" strokeDasharray="5 5" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </SectionCard>
  );
};
