
import React from 'react';
import { SectionCard } from './SectionCard';
import { EyeIcon } from './icons/EyeIcon';

interface VisionPanelProps {
  chartUrl: string;
  extractedText: string;
  isProcessing: boolean;
}

export const VisionPanel: React.FC<VisionPanelProps> = ({ chartUrl, extractedText, isProcessing }) => {
  return (
    <SectionCard title="Vision: Chart Ingestion & Analysis" icon={<EyeIcon />}>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 h-full">
        <div className="md:col-span-3 relative">
          <img 
            src={chartUrl} 
            alt="TradingView Chart" 
            className="rounded-md object-cover w-full h-full border border-slate-600"
          />
           {isProcessing && <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center rounded-md transition-opacity duration-300"><div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div></div>}
        </div>
        <div className="md:col-span-2 bg-slate-900 p-4 rounded-md h-full flex flex-col">
          <h3 className="text-sm font-semibold text-cyan-400 mb-2">Machine-Readable Data (Vision API)</h3>
          <div className="flex-grow overflow-y-auto text-sm text-slate-400 font-mono leading-relaxed pr-2">
            <p>{extractedText}</p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
};
