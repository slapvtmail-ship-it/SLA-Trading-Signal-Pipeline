
import React from 'react';

interface SectionCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({ title, icon, children, className }) => {
  return (
    <div className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg shadow-lg h-full flex flex-col ${className}`}>
      <div className="flex items-center p-4 border-b border-slate-700">
        {icon && <div className="mr-3 text-cyan-400">{icon}</div>}
        <h2 className="text-lg font-semibold text-slate-200 tracking-wide">{title}</h2>
      </div>
      <div className="p-4 flex-grow overflow-auto">
        {children}
      </div>
    </div>
  );
};
