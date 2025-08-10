
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SectionCard } from './SectionCard';
import { EyeIcon } from './icons/EyeIcon';
import { chartCaptureService } from '../services/chartCapture';
import { geminiVisionService } from '../services/geminiVision';
import configManager from '../config';
import type { LiveChartData, GeminiAnalysisResponse } from '../types';

interface VisionPanelProps {
  chartUrl: string;
  extractedText: string;
  isProcessing: boolean;
  symbol: string;
  onChartCaptured?: (chartData: LiveChartData) => void;
  onAnalysisComplete?: (analysis: GeminiAnalysisResponse) => void;
}

export const VisionPanel: React.FC<VisionPanelProps> = ({ 
  chartUrl, 
  extractedText, 
  isProcessing, 
  symbol,
  onChartCaptured,
  onAnalysisComplete 
}) => {
  const [currentSymbol, setCurrentSymbol] = useState(symbol);
  const [livePrice, setLivePrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastCaptureTime, setLastCaptureTime] = useState<string>('');
  const [tradingViewLoaded, setTradingViewLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(!configManager.isTradingViewEnabled());
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const tradingViewScriptRef = useRef<HTMLScriptElement | null>(null);

  // Sanitize symbol for DOM ID
  const sanitizeSymbol = useCallback((sym: string) => {
    return sym.replace(/[^a-zA-Z0-9]/g, '-');
  }, []);

  const containerId = `tradingview-chart-${sanitizeSymbol(currentSymbol)}`;

  // Initialize TradingView widget
  const initializeTradingViewWidget = useCallback(() => {
    if (!configManager.isTradingViewEnabled() || useFallback) return;

    try {
      // @ts-ignore - TradingView widget global
      if (typeof TradingView !== 'undefined') {
        // @ts-ignore
        new TradingView.widget({
          autosize: true,
          symbol: currentSymbol,
          interval: "5",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#1e1e1e",
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: true,
          save_image: false,
          container_id: containerId,
          crossOrigin: 'anonymous'
        });
        setTradingViewLoaded(true);
      }
    } catch (error) {
      console.error('TradingView widget initialization failed:', error);
      setUseFallback(true);
    }
  }, [currentSymbol, containerId, useFallback]);

  // Load TradingView script
  useEffect(() => {
    if (!configManager.isTradingViewEnabled() || useFallback) return;

    if (!tradingViewScriptRef.current) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        setTimeout(initializeTradingViewWidget, 1000);
      };
      script.onerror = () => {
        console.error('Failed to load TradingView script');
        setUseFallback(true);
      };
      
      document.head.appendChild(script);
      tradingViewScriptRef.current = script;
    } else {
      initializeTradingViewWidget();
    }

    return () => {
      if (tradingViewScriptRef.current) {
        document.head.removeChild(tradingViewScriptRef.current);
        tradingViewScriptRef.current = null;
      }
    };
  }, [initializeTradingViewWidget, useFallback]);

  // Live price simulation
  useEffect(() => {
    const getBasePrice = (sym: string) => {
      const prices: Record<string, number> = {
        'BINANCE:BTCUSDT': 67000,
        'BINANCE:ETHUSDT': 3400,
        'BINANCE:SOLUSDT': 155,
        'BINANCE:ADAUSDT': 0.45,
        'BINANCE:BNBUSDT': 580,
        'BINANCE:XRPUSDT': 0.52
      };
      return prices[sym] || prices[sym.replace('BINANCE:', '')] || 100;
    };

    const basePrice = getBasePrice(currentSymbol);
    setLivePrice(basePrice);

    const interval = setInterval(() => {
      const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
      const newPrice = basePrice * (1 + variation);
      const change = ((newPrice - basePrice) / basePrice) * 100;
      
      setLivePrice(newPrice);
      setPriceChange(change);

      // Update DOM elements directly for live updates
      const priceElement = document.querySelector(`#${containerId} .live-price`);
      const changeElement = document.querySelector(`#${containerId} .live-change`);
      
      if (priceElement) {
        priceElement.textContent = `$${newPrice.toFixed(2)}`;
      }
      if (changeElement) {
        changeElement.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
        changeElement.className = `live-change ${change >= 0 ? 'text-green-400' : 'text-red-400'}`;
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentSymbol, containerId]);

  // Chart capture functionality
  const captureChart = useCallback(async () => {
    if (isCapturing) return;
    
    setIsCapturing(true);
    try {
      const chartData = await chartCaptureService.captureChart(containerId, currentSymbol);
      
      if (chartData) {
        setLastCaptureTime(new Date().toLocaleTimeString());
        onChartCaptured?.(chartData);

        // Analyze with Gemini Vision if enabled
        if (configManager.isLiveDataEnabled()) {
          const analysis = await geminiVisionService.analyzeChart(chartData.capturedImage, currentSymbol);
          onAnalysisComplete?.(analysis);
        }
      }
    } catch (error) {
      console.error('Chart capture failed:', error);
    } finally {
      setIsCapturing(false);
    }
  }, [containerId, currentSymbol, isCapturing, onChartCaptured, onAnalysisComplete]);

  // Auto-capture based on configuration
  useEffect(() => {
    if (!configManager.isLiveDataEnabled()) return;

    const interval = setInterval(captureChart, configManager.getChartCaptureInterval());
    return () => clearInterval(interval);
  }, [captureChart]);

  // Fallback chart component
  const renderFallbackChart = () => (
    <div className="w-full h-full bg-slate-900 rounded-md border border-slate-600 relative overflow-hidden">
      {/* Chart Header */}
      <div className="bg-slate-800 p-3 border-b border-slate-600">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-white font-bold text-lg">{currentSymbol.replace('BINANCE:', '')}</h3>
            <div className="flex items-center gap-2">
              <span className="live-price text-2xl font-mono text-white">${livePrice.toFixed(2)}</span>
              <span className={`live-change text-sm font-medium ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">LIVE DEMO</div>
            <div className="text-xs text-slate-400 mt-1">Real-time simulation</div>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="relative h-full p-4">
        <svg className="w-full h-full" viewBox="0 0 800 400">
          {/* Grid */}
          <defs>
            <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#374151" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Price Line */}
          <path
            d="M50,200 Q200,180 350,190 T650,185 L750,175"
            stroke="#10b981"
            strokeWidth="2"
            fill="none"
          />
          
          {/* Volume Bars */}
          {Array.from({length: 20}, (_, i) => (
            <rect
              key={i}
              x={50 + i * 35}
              y={350 - Math.random() * 50}
              width="20"
              height={Math.random() * 50}
              fill="#374151"
              opacity="0.6"
            />
          ))}
          
          {/* Indicators */}
          <path
            d="M50,220 Q200,200 350,210 T650,205 L750,195"
            stroke="#f59e0b"
            strokeWidth="1"
            fill="none"
            strokeDasharray="5,5"
          />
        </svg>
        
        {/* Chart Footer */}
        <div className="absolute bottom-2 left-4 right-4 flex justify-between text-xs text-slate-400">
          <span>RSI: {(Math.random() * 100).toFixed(1)}</span>
          <span>MACD: {((Math.random() - 0.5) * 10).toFixed(2)}</span>
          <span>Vol: {(Math.random() * 1000000).toFixed(0)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <SectionCard title="Vision: Chart Ingestion & Analysis" icon={<EyeIcon />}>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 h-full">
        <div className="md:col-span-3 relative">
          <div ref={chartContainerRef} id={containerId} className="w-full h-full">
            {useFallback ? renderFallbackChart() : (
              <div className="w-full h-full bg-slate-900 rounded-md border border-slate-600 flex items-center justify-center">
                {!tradingViewLoaded && (
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-slate-400">Loading TradingView Chart...</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Capture Controls */}
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              onClick={captureChart}
              disabled={isCapturing}
              className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
            >
              {isCapturing ? 'Capturing...' : 'Capture'}
            </button>
            {lastCaptureTime && (
              <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs">
                Last: {lastCaptureTime}
              </span>
            )}
          </div>
          
          {(isProcessing || isCapturing) && (
            <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center rounded-md transition-opacity duration-300">
              <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        
        <div className="md:col-span-2 bg-slate-900 p-4 rounded-md h-full flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-cyan-400">Machine-Readable Data (Vision API)</h3>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${configManager.isLiveDataEnabled() ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
              <span className="text-xs text-slate-400">
                {configManager.isLiveDataEnabled() ? 'Live' : 'Demo'}
              </span>
            </div>
          </div>
          
          <div className="flex-grow overflow-y-auto text-sm text-slate-400 font-mono leading-relaxed pr-2">
            <p>{extractedText}</p>
            
            {configManager.getDemoMode() && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
                <p className="text-yellow-400 text-xs">
                  <strong>Demo Mode:</strong> Add your Gemini API key to .env file to enable live analysis.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </SectionCard>
  );
};
