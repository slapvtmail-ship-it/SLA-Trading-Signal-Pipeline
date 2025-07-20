
import React from 'react';
import { LogoIcon } from './icons/LogoIcon';

export const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between pb-4 border-b border-slate-700">
      <div className="flex items-center">
        <LogoIcon className="h-8 w-8 text-cyan-400" />
        <h1 className="ml-3 text-2xl font-bold text-slate-100 tracking-tight">
          Gemini Trading Signal Pipeline
        </h1>
      </div>
      <div className="flex items-center space-x-3">
        <div className="relative flex items-center">
          <span className="absolute left-0 top-0 h-2 w-2 bg-green-400 rounded-full animate-ping"></span>
          <span className="h-2 w-2 bg-green-400 rounded-full"></span>
        </div>
        <span className="text-sm font-medium text-green-400">LIVE</span>
      </div>
    </header>
  );
};
