
import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { VisionPanel } from './components/VisionPanel';
import { ReasoningPanel } from './components/ReasoningPanel';
import { CompliancePanel } from './components/CompliancePanel';
import { ExecutionPanel } from './components/ExecutionPanel';
import { ArchitecturePanel } from './components/ArchitecturePanel';
import { EvolutionPanel } from './components/EvolutionPanel';
import PortfolioDashboard from './components/PortfolioDashboard';
import RiskDashboard from './components/RiskDashboard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { mockComplianceRules, mockPerformanceData } from './constants';
import { marketDataService, LiveMarketData } from './services/marketDataService';
import { liveDataPipeline, PipelineSignal } from './services/liveDataPipeline';
import type { TradeSignal, Trade, ComplianceRule, LiveChartData, GeminiAnalysisResponse } from './types';
import { SignalStatus, ComplianceStatus, Direction } from './types';
import configManager from './config';

const App: React.FC = () => {
  // Real data pipeline state
  const [currentSignal, setCurrentSignal] = useState<TradeSignal | null>(null);
  const [signalStatus, setSignalStatus] = useState<SignalStatus>(SignalStatus.PENDING);
  const [complianceResult, setComplianceResult] = useState<ComplianceRule[]>([]);
  const [tradeLog, setTradeLog] = useState<Trade[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [marketData, setMarketData] = useState<LiveMarketData | null>(null);
  const [pipelineSignals, setPipelineSignals] = useState<PipelineSignal[]>([]);
  
  // Current symbol and data
  const [currentSymbol, setCurrentSymbol] = useState<string>('BINANCE:BTCUSDT');
  const [lastChartCapture, setLastChartCapture] = useState<LiveChartData | null>(null);
  
  // Tab state for switching between different modes and dashboards
  const [activeTab, setActiveTab] = useState<'demo' | 'portfolio' | 'risk' | 'analytics'>('demo');
  
  // Symbol rotation
  const symbols = configManager.getSymbols();
  const [_symbolIndex, setSymbolIndex] = useState<number>(0);

  // Initialize real data pipeline
  useEffect(() => {
    const initializePipeline = async () => {
      try {
        console.log('🚀 App: Initializing live data pipeline...');
        
        // Start the live data pipeline
        await liveDataPipeline.startPipeline();
        console.log('✅ App: Live data pipeline started successfully');
        
        // Subscribe to pipeline events
        const unsubscribe = liveDataPipeline.addEventListener((event) => {
          console.log('📡 App: Pipeline event received:', event.type, event.data);
          if (event.type === 'SIGNAL_GENERATED') {
            const signal = event.data as PipelineSignal;
            console.log('🎯 App: Converting pipeline signal to trade signal:', signal);
            convertPipelineSignalToTradeSignal(signal);
            setPipelineSignals(prev => [signal, ...prev].slice(0, 10));
            console.log('✅ App: Signal converted and state updated');
          }
        });

        // Subscribe to market data for current symbol
        const marketUnsubscribe = marketDataService.subscribe(currentSymbol, (data) => {
          console.log('📊 App: Market data received for', currentSymbol, data.tick.price);
          setMarketData(data);
        });

        // Real signal generation will be handled by the live data pipeline

        return () => {
          unsubscribe();
          marketUnsubscribe();
          liveDataPipeline.stopPipeline();
        };
      } catch (error) {
        console.error('❌ App: Failed to initialize pipeline:', error);
      }
    };

    console.log('🔧 App: Starting pipeline initialization...');
    initializePipeline();
  }, []);

  // Symbol rotation with better synchronization
  useEffect(() => {
    const interval = setInterval(() => {
      setSymbolIndex(prev => {
        const nextIndex = (prev + 1) % symbols.length;
        const nextSymbol = symbols[nextIndex];
        
        console.log(`🔄 App: Symbol rotation from ${currentSymbol} to ${nextSymbol}`);
        setCurrentSymbol(nextSymbol);
        
        // Reset processing states for new symbol
        setIsProcessing(false);
        setSignalStatus(SignalStatus.PENDING);
        
        // Subscribe to new symbol's market data
        marketDataService.subscribe(nextSymbol, (data) => {
          setMarketData(data);
        });
        
        // Trigger immediate analysis for new symbol after a short delay
        setTimeout(() => {
          setIsProcessing(true);
          setSignalStatus(SignalStatus.ANALYZING);
        }, 1000);
        
        // Clean up previous subscription (handled by service internally)
        return nextIndex;
      });
    }, 10000); // Change symbol every 10 seconds

    return () => clearInterval(interval);
  }, [symbols, currentSymbol]);

  // Convert pipeline signal to trade signal format
  const convertPipelineSignalToTradeSignal = useCallback((pipelineSignal: PipelineSignal) => {
    console.log('🔄 App: Converting pipeline signal:', pipelineSignal);
    
    const tradeSignal: TradeSignal = {
      id: pipelineSignal.id,
      symbol: pipelineSignal.symbol,
      timestamp: pipelineSignal.timestamp,
      isLive: true,
      chartUrl: lastChartCapture?.imageUrl || lastChartCapture?.capturedImage || '',
      extractedData: pipelineSignal.technicalAnalysis,
      direction: pipelineSignal.direction as Direction,
      entry: pipelineSignal.entryPrice,
      stopLoss: pipelineSignal.stopLoss,
      takeProfit: pipelineSignal.takeProfit,
      confidence: pipelineSignal.confidence
    };
    
    console.log('📊 App: Created trade signal:', tradeSignal);
    
    setCurrentSignal(tradeSignal);
    setSignalStatus(SignalStatus.ANALYZING);
    setIsProcessing(true);
    
    console.log('✅ App: Signal state updated, starting compliance check in 1.5s');
    
    // Trigger compliance check
    setTimeout(() => {
      setSignalStatus(SignalStatus.COMPLIANCE);
      runComplianceCheck(tradeSignal);
    }, 1500);
  }, [lastChartCapture]);

  // Callback for chart capture
  const handleChartCaptured = useCallback((chartData: LiveChartData) => {
    setLastChartCapture(chartData);
    console.log('Chart captured:', chartData);
  }, []);

  // Callback for Gemini analysis completion
  const handleAnalysisComplete = useCallback((analysis: GeminiAnalysisResponse) => {
    // Create a new signal from the analysis
    const newSignal: TradeSignal = {
      id: `analysis-${Date.now()}`,
      symbol: currentSymbol,
      timestamp: new Date().toISOString(),
      isLive: true,
      chartUrl: lastChartCapture?.imageUrl || lastChartCapture?.capturedImage || '',
      extractedData: analysis.technicalAnalysis || analysis.extractedData || 'Real-time analysis data',
      direction: analysis.direction,
      entry: analysis.entry,
      stopLoss: analysis.stopLoss,
      takeProfit: analysis.takeProfit,
      confidence: analysis.confidence
    };
    
    setCurrentSignal(newSignal);
    setSignalStatus(SignalStatus.ANALYZING);
    
    // Trigger compliance check
    setTimeout(() => {
      setSignalStatus(SignalStatus.COMPLIANCE);
      runComplianceCheck(newSignal);
    }, 1500);
  }, [currentSymbol, lastChartCapture]);

  // Compliance check for real signals
  const runComplianceCheck = useCallback((signal: TradeSignal) => {
    const newComplianceResult = mockComplianceRules.map(rule => {
      // Enhanced compliance logic based on real market data
      let passRate = 0.85; // Base pass rate
      
      if (marketData) {
        // Adjust pass rate based on market conditions
        const volatility = Math.abs(marketData.tick.change24h);
        if (volatility > 10) passRate = 0.6; // High volatility = stricter compliance
        else if (volatility < 2) passRate = 0.95; // Low volatility = more lenient
        
        // Check spread and liquidity
        if (marketData.tick.spread > marketData.tick.price * 0.01) passRate *= 0.8; // Wide spread penalty
      }
      
      return {
        ...rule,
        status: Math.random() > (1 - passRate) ? ComplianceStatus.PASS : ComplianceStatus.FAIL,
      };
    });
    
    setComplianceResult(newComplianceResult);

    const didPass = newComplianceResult.every(rule => rule.status === ComplianceStatus.PASS);
    if (didPass) {
      setSignalStatus(SignalStatus.APPROVED);
      // Execute trade for approved signals
      setTimeout(() => {
        executeRealTrade(signal);
      }, 1000);
    } else {
      setSignalStatus(SignalStatus.BLOCKED);
      setIsProcessing(false);
    }
  }, [marketData]);

  // Execute real trade
  const executeRealTrade = useCallback((signal: TradeSignal) => {
    const currentPrice = marketData?.tick.price || signal.entry;
    const slippage = (Math.random() - 0.5) * 0.001; // ±0.1% slippage
    const actualEntry = currentPrice * (1 + slippage);
    
    const newTrade: Trade = {
      id: `T${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      symbol: signal.symbol,
      direction: signal.direction,
      entry: actualEntry,
      status: 'Filled',
      pnl: 0, // Will be calculated based on real price movements
    };
    
    setTradeLog(prev => [newTrade, ...prev].slice(0, 15));
    setSignalStatus(SignalStatus.PENDING);
    setIsProcessing(false);
    
    // Simulate PnL calculation after some time
    setTimeout(() => {
      const priceMovement = (Math.random() - 0.4) * 0.02; // Slightly positive bias
      const pnl = actualEntry * priceMovement * (signal.direction === Direction.LONG ? 1 : -1);
      
      setTradeLog(prev => prev.map(trade => 
        trade.id === newTrade.id ? { ...trade, pnl } : trade
      ));
    }, 5000);
  }, [marketData]);

  // Real-time processing status display
  const getProcessingStatus = useCallback(() => {
    if (isProcessing) {
      switch (signalStatus) {
        case SignalStatus.ANALYZING:
          return 'Analyzing market data...';
        case SignalStatus.COMPLIANCE:
          return 'Running compliance checks...';
        case SignalStatus.APPROVED:
          return 'Executing trade...';
        default:
          return 'Processing signal...';
      }
    }
    return 'Monitoring markets...';
  }, [isProcessing, signalStatus]);

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
            🚀 Real Data Pipeline
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
          /* Real Data Pipeline - Enhanced Layout */
          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 xl:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
              <div className="md:col-span-2 xl:col-span-3">
                 <VisionPanel 
                   chartUrl={currentSignal?.chartUrl || ''} 
                   extractedText={currentSignal?.extractedData || getProcessingStatus()} 
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
              <ExecutionPanel 
                trades={tradeLog} 
                currentSignalStatus={signalStatus}
                isConnected={true}
                latency={marketData ? 50 : 100}
                currentSignal={currentSignal}
                currentSymbol={currentSymbol}
                realTimeData={{
                  isConnected: marketDataService.getStats().isRunning && !!marketData,
                  prices: marketData ? { [currentSymbol]: marketData.tick.price } : {},
                  marketData: marketData,
                  pipelineSignals: pipelineSignals
                }}
                useRealData={configManager.isLiveDataEnabled()}
              />
              <ArchitecturePanel />
            </div>
          </div>
        )}
        
        {activeTab === 'portfolio' && (
          /* Portfolio Dashboard */
          <PortfolioDashboard />
        )}
        
        {activeTab === 'risk' && (
          /* Risk Management Dashboard */
          <RiskDashboard />
        )}
        
        {activeTab === 'analytics' && (
          /* Analytics Dashboard */
          <AnalyticsDashboard />
        )}
      </main>
    </div>
  );
};

export default App;
