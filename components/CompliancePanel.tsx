
import React from 'react';
import { SectionCard } from './SectionCard';
import type { ComplianceRule } from '../types';
import { ComplianceStatus, SignalStatus } from '../types';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';

interface CompliancePanelProps {
  rules: ComplianceRule[];
  status: SignalStatus;
}

const StatusIcon: React.FC<{ status: ComplianceStatus }> = ({ status }) => {
  switch (status) {
    case ComplianceStatus.PASS:
      return <div className="w-5 h-5 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>;
    case ComplianceStatus.FAIL:
      return <div className="w-5 h-5 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></div>;
    default:
       return <div className="w-5 h-5 bg-slate-600/20 text-slate-400 rounded-full flex items-center justify-center animate-spin"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 3v.01" /></svg></div>;
  }
};

export const CompliancePanel: React.FC<CompliancePanelProps> = ({ rules, status }) => {
  const showChecks = status === SignalStatus.COMPLIANCE || status === SignalStatus.APPROVED || status === SignalStatus.BLOCKED;
  
  return (
    <SectionCard title="Rules & Compliance" icon={<ShieldCheckIcon />}>
      { !showChecks ? (
         <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <p className="text-sm">Awaiting signal analysis...</p>
        </div>
      ) : (
        <div className="space-y-3">
        {rules.map((rule) => (
          <div key={rule.name} className="flex items-start bg-slate-900 p-2 rounded-md">
            <div className="mt-1">
                 <StatusIcon status={rule.status} />
            </div>
            <div className="ml-3">
              <p className="font-semibold text-slate-300 text-sm">{rule.name}</p>
              <p className="text-xs text-slate-400">{rule.description}</p>
            </div>
          </div>
        ))}
      </div>
      )}
    </SectionCard>
  );
};
