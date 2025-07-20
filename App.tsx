
import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { VisionPanel } from './components/VisionPanel';
import { ReasoningPanel } from './components/ReasoningPanel';
import { CompliancePanel } from './components/CompliancePanel';
import { ExecutionPanel } from './components/ExecutionPanel';
import { ArchitecturePanel } from './components/ArchitecturePanel';
import { EvolutionPanel } from './components/EvolutionPanel';
import { mockSignals, mockComplianceRules, mockTrades, mockPerformanceData } from './constants';
import type { TradeSignal, Trade, ComplianceRule } from './types';
import { SignalStatus, ComplianceStatus } from './types';

const App: React.FC = () => {
  const [currentSignal, setCurrentSignal] = useState<TradeSignal>(mockSignals[0]);
  const [signalStatus, setSignalStatus] = useState<SignalStatus>(SignalStatus.PENDING);
  const [complianceResult, setComplianceResult] = useState<ComplianceRule[]>([]);
  const [tradeLog, setTradeLog] = useState<Trade[]>(mockTrades);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const runSimulationStep = useCallback(() => {
    setIsProcessing(true);
    setSignalStatus(SignalStatus.PENDING);

    // 1. New Chart Ingested (Vision)
    setTimeout(() => {
      const nextSignalIndex = (mockSignals.indexOf(currentSignal) + 1) % mockSignals.length;
      const newSignal = mockSignals[nextSignalIndex];
      setCurrentSignal(newSignal);
      setSignalStatus(SignalStatus.ANALYZING);
    }, 1500);

    // 2. Gemini Reasoning
    setTimeout(() => {
      setSignalStatus(SignalStatus.COMPLIANCE);
    }, 3000);

    // 3. Rules & Compliance Check
    setTimeout(() => {
      const newComplianceResult = mockComplianceRules.map(rule => ({
        ...rule,
        status: Math.random() > 0.1 ? ComplianceStatus.PASS : ComplianceStatus.FAIL,
      }));
      setComplianceResult(newComplianceResult);

      const didPass = newComplianceResult.every(rule => rule.status === ComplianceStatus.PASS);
      if (didPass) {
        setSignalStatus(SignalStatus.APPROVED);
      } else {
        setSignalStatus(SignalStatus.BLOCKED);
      }
    }, 4500);

    // 4. Execution & Feedback
    setTimeout(() => {
      if (signalStatus === SignalStatus.APPROVED) {
        const newTrade: Trade = {
          id: `T${Date.now()}`,
          timestamp: new Date().toISOString(),
          symbol: currentSignal.symbol,
          direction: currentSignal.direction,
          entry: currentSignal.entry,
          status: 'Filled',
          pnl: (Math.random() - 0.4) * 500,
        };
        setTradeLog(prev => [newTrade, ...prev].slice(0, 10));
      }
       setIsProcessing(false);
    }, 6000);

  }, [currentSignal, signalStatus]);

  useEffect(() => {
    const interval = setInterval(() => {
        if (!isProcessing) {
            runSimulationStep();
        }
    }, 7000); // Run the full simulation every 7 seconds
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProcessing]);

  return (
    <div className="min-h-screen bg-slate-900 font-sans p-4 lg:p-6">
      <Header />
      <main className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 mt-6">
        {/* Left Column */}
        <div className="lg:col-span-2 xl:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          <div className="md:col-span-2 xl:col-span-3">
             <VisionPanel chartUrl={currentSignal.chartUrl} extractedText={currentSignal.extractedData} isProcessing={isProcessing} />
          </div>
          <div className="xl:col-span-1">
            <ReasoningPanel signal={currentSignal} status={signalStatus} />
          </div>
          <div className="xl:col-span-1">
            <CompliancePanel rules={complianceResult} status={signalStatus} />
          </div>
          <div className="xl:col-span-1">
            <EvolutionPanel performanceData={mockPerformanceData} />
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 xl:col-span-1 flex flex-col gap-4 lg:gap-6">
          <ExecutionPanel trades={tradeLog} />
          <ArchitecturePanel />
        </div>
      </main>
    </div>
  );
};

export default App;
