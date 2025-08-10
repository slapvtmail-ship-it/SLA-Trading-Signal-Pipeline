
import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { VisionPanel } from './components/VisionPanel';
import { ReasoningPanel } from './components/ReasoningPanel';
import { CompliancePanel } from './components/CompliancePanel';
import { ExecutionPanel } from './components/ExecutionPanel';
import { ArchitecturePanel } from './components/ArchitecturePanel';
import { EvolutionPanel } from './components/EvolutionPanel';
import LiveDataDashboard from './components/LiveDataDashboard';
import PortfolioDashboard from './components/PortfolioDashboard';
import RiskDashboard from './components/RiskDashboard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { mockSignals, mockComplianceRules, mockTrades, mockPerformanceData } from './constants';
import type { TradeSignal, Trade, ComplianceRule, LiveChartData, GeminiAnalysisResponse } from './types';
import { SignalStatus, ComplianceStatus } from './types';
import configManager from './config';

const App: React.FC = () => {
  const [currentSignal, setCurrentSignal] = useState<TradeSignal>(mockSignals[0]);
  const [signalStatus, setSignalStatus] = useState<SignalStatus>(SignalStatus.PENDING);
  const [complianceResult, setComplianceResult] = useState<ComplianceRule[]>([]);
  const [tradeLog, setTradeLog] = useState<Trade[]>(mockTrades);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // Live data state
  const [currentSymbol, setCurrentSymbol] = useState<string>('BTCUSD');
  const [isLiveMode, setIsLiveMode] = useState<boolean>(false);
  const [lastChartCapture, setLastChartCapture] = useState<LiveChartData | null>(null);
  const [_liveSignals, setLiveSignals] = useState<TradeSignal[]>([]);
  
  // Tab state for switching between different modes and dashboards
  const [activeTab, setActiveTab] = useState<'demo' | 'live' | 'portfolio' | 'risk' | 'analytics'>('demo');
  
  // Symbol rotation for live mode
  const symbols = ['BTCUSD', 'ETHUSD', 'ADAUSD', 'SOLUSD', 'DOTUSD'];
  const [_symbolIndex, setSymbolIndex] = useState<number>(0);

  // Initialize live mode based on config
  useEffect(() => {
    try {
      const isLive = configManager.isLiveDataEnabled();
      setIsLiveMode(isLive);
      if (isLive) {
        setCurrentSymbol(symbols[0]);
      }
    } catch (error) {
      console.warn('Failed to load config, using demo mode:', error);
      setIsLiveMode(false);
    }
  }, []);

  // Symbol rotation for live mode
  useEffect(() => {
    if (!isLiveMode) return;

    const interval = setInterval(() => {
      setSymbolIndex(prev => {
        const nextIndex = (prev + 1) % symbols.length;
        setCurrentSymbol(symbols[nextIndex]);
        return nextIndex;
      });
    }, configManager.getSymbolRotationInterval());

    return () => clearInterval(interval);
  }, [isLiveMode, symbols]);

  // Callback for chart capture
  const handleChartCaptured = useCallback((chartData: LiveChartData) => {
    setLastChartCapture(chartData);
    console.log('Chart captured:', chartData);
  }, []);

  // Callback for Gemini analysis completion
  const handleAnalysisComplete = useCallback((analysis: GeminiAnalysisResponse) => {
    // Create a new signal from the analysis
    const newSignal: TradeSignal = {
      id: `live-${Date.now()}`,
      symbol: currentSymbol,
      timestamp: new Date().toISOString(),
      isLive: true,
      chartUrl: lastChartCapture?.imageUrl || lastChartCapture?.capturedImage || '',
      extractedData: analysis.technicalAnalysis || analysis.extractedData || 'Live analysis data',
      direction: analysis.direction,
      entry: analysis.entry,
      stopLoss: analysis.stopLoss,
      takeProfit: analysis.takeProfit,
      confidence: analysis.confidence
    };
    
    setCurrentSignal(newSignal);
    setLiveSignals(prev => [newSignal, ...prev].slice(0, 10));
    setSignalStatus(SignalStatus.ANALYZING);
    
    // Trigger compliance check for live signal
    setTimeout(() => {
      setSignalStatus(SignalStatus.COMPLIANCE);
      runComplianceCheck(newSignal);
    }, 1500);
  }, [currentSymbol, lastChartCapture]);

  // Compliance check for live signals
  const runComplianceCheck = useCallback((signal: TradeSignal) => {
    const newComplianceResult = mockComplianceRules.map(rule => ({
      ...rule,
      status: Math.random() > 0.15 ? ComplianceStatus.PASS : ComplianceStatus.FAIL,
    }));
    setComplianceResult(newComplianceResult);

    const didPass = newComplianceResult.every(rule => rule.status === ComplianceStatus.PASS);
    if (didPass) {
      setSignalStatus(SignalStatus.APPROVED);
      // Execute trade for approved live signals
      setTimeout(() => {
        executeLiveTrade(signal);
      }, 1000);
    } else {
      setSignalStatus(SignalStatus.BLOCKED);
    }
  }, []);

  // Execute live trade
  const executeLiveTrade = useCallback((signal: TradeSignal) => {
    const newTrade: Trade = {
      id: `live-T${Date.now()}`,
      timestamp: new Date().toISOString(),
      symbol: signal.symbol,
      direction: signal.direction,
      entry: signal.entry,
      status: 'Filled',
      pnl: (Math.random() - 0.3) * 1000, // Slightly better odds for live trades
    };
    setTradeLog(prev => [newTrade, ...prev].slice(0, 15));
    setSignalStatus(SignalStatus.PENDING);
  }, []);

  // Toggle live mode
  const handleToggleLiveMode = useCallback(() => {
    setIsLiveMode(prev => !prev);
  }, []);

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
    // Only run demo simulation when not in live mode
    if (isLiveMode) return;
    
    const interval = setInterval(() => {
        if (!isProcessing) {
            runSimulationStep();
        }
    }, 7000); // Run the full simulation every 7 seconds
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProcessing, isLiveMode]);

  return (
    <div className="min-h-screen bg-slate-900 font-sans p-4 lg:p-6">
      <Header />
      
      {/* Tab Navigation */}
      <div className="mt-6 mb-6">
        <div className="flex flex-wrap space-x-1 bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('demo')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'demo'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            📊 Demo Pipeline
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'live'
                ? 'bg-green-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            🚀 Live Data Pipeline
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'portfolio'
                ? 'bg-purple-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            💼 Portfolio
          </button>
          <button
            onClick={() => setActiveTab('risk')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'risk'
                ? 'bg-red-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            🛡️ Risk Management
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'bg-orange-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            📈 Analytics
          </button>
        </div>
      </div>

      <main>
        {activeTab === 'demo' && (
          /* Demo Mode - Original Layout */
          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 xl:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
              <div className="md:col-span-2 xl:col-span-3">
                 <VisionPanel 
                   chartUrl={currentSignal.chartUrl} 
                   extractedText={currentSignal.extractedData} 
                   isProcessing={isProcessing}
                   symbol={currentSymbol}
                   onChartCaptured={handleChartCaptured}
                   onAnalysisComplete={handleAnalysisComplete}
                 />
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
          </div>
        )}
        
        {activeTab === 'live' && (
          /* Live Mode - Live Data Dashboard */
          <LiveDataDashboard 
            isLiveMode={isLiveMode}
            onToggleLiveMode={handleToggleLiveMode}
          />
        )}
        
        {activeTab === 'portfolio' && (
          /* Portfolio Dashboard - Phase 5 */
          <PortfolioDashboard />
        )}
        
        {activeTab === 'risk' && (
          /* Risk Management Dashboard - Phase 5 */
          <RiskDashboard />
        )}
        
        {activeTab === 'analytics' && (
          /* Analytics Dashboard - Phase 5 */
          <AnalyticsDashboard />
        )}
      </main>
    </div>
  );
};

export default App;
