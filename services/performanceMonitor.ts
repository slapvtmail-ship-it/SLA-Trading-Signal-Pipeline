/**
 * Real-time Performance Monitoring Service
 * Phase 4: Complete Live Data Pipeline Implementation
 */

import { liveDataPipeline } from './liveDataPipeline';
import { marketDataService } from './marketDataService';

export interface PerformanceMetrics {
  system: SystemMetrics;
  trading: TradingMetrics;
  pipeline: PipelineMetrics;
  realtime: RealtimeMetrics;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  networkLatency: number;
  uptime: number;
  errorRate: number;
  responseTime: number;
}

export interface TradingMetrics {
  totalTrades: number;
  winRate: number;
  profitLoss: number;
  avgHoldTime: number;
  maxDrawdown: number;
  sharpeRatio: number;
  dailyPnL: number;
  weeklyPnL: number;
  monthlyPnL: number;
}

export interface PipelineMetrics {
  signalsGenerated: number;
  signalsExecuted: number;
  avgSignalLatency: number;
  dataProcessingRate: number;
  queueLength: number;
  throughput: number;
}

export interface RealtimeMetrics {
  activeConnections: number;
  dataUpdatesPerSecond: number;
  apiCallsPerMinute: number;
  cacheHitRate: number;
  bandwidthUsage: number;
}

export interface PerformanceAlert {
  id: string;
  type: 'WARNING' | 'ERROR' | 'CRITICAL';
  category: 'SYSTEM' | 'TRADING' | 'PIPELINE' | 'NETWORK';
  message: string;
  timestamp: string;
  value: number;
  threshold: number;
  resolved: boolean;
}

export interface PerformanceSnapshot {
  timestamp: string;
  metrics: PerformanceMetrics;
  alerts: PerformanceAlert[];
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

class PerformanceMonitor {
  private isMonitoring = false;
  private metrics: PerformanceMetrics = {
    system: {
      cpuUsage: 0,
      memoryUsage: 0,
      networkLatency: 0,
      uptime: 0,
      errorRate: 0,
      responseTime: 0
    },
    trading: {
      totalTrades: 0,
      winRate: 0,
      profitLoss: 0,
      avgHoldTime: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      dailyPnL: 0,
      weeklyPnL: 0,
      monthlyPnL: 0
    },
    pipeline: {
      signalsGenerated: 0,
      signalsExecuted: 0,
      avgSignalLatency: 0,
      dataProcessingRate: 0,
      queueLength: 0,
      throughput: 0
    },
    realtime: {
      activeConnections: 0,
      dataUpdatesPerSecond: 0,
      apiCallsPerMinute: 0,
      cacheHitRate: 0,
      bandwidthUsage: 0
    }
  };
  private alerts: Map<string, PerformanceAlert> = new Map();
  private snapshots: PerformanceSnapshot[] = [];
  private listeners: ((snapshot: PerformanceSnapshot) => void)[] = [];
  
  private startTime = Date.now();
  private lastSnapshot = Date.now();
  private snapshotInterval = 5000; // 5 seconds
  private maxSnapshots = 1000; // Keep last 1000 snapshots
  
  // Performance thresholds
  private thresholds = {
    cpuUsage: 80,
    memoryUsage: 85,
    networkLatency: 1000,
    errorRate: 5,
    responseTime: 2000,
    signalLatency: 5000,
    queueLength: 100,
    winRate: 40, // Minimum win rate
    maxDrawdown: 20 // Maximum drawdown percentage
  };

  // Simulated trading data
  private tradingHistory: any[] = [];
  private currentPnL = 0;
  private dailyPnL = 0;
  private weeklyPnL = 0;
  private monthlyPnL = 0;

  constructor() {
    this.initializeMetrics();
    this.initializeTradingData();
  }

  /**
   * Initialize metrics structure
   */
  private initializeMetrics(): void {
    this.metrics = {
      system: {
        cpuUsage: 0,
        memoryUsage: 0,
        networkLatency: 0,
        uptime: 0,
        errorRate: 0,
        responseTime: 0
      },
      trading: {
        totalTrades: 0,
        winRate: 0,
        profitLoss: 0,
        avgHoldTime: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        dailyPnL: 0,
        weeklyPnL: 0,
        monthlyPnL: 0
      },
      pipeline: {
        signalsGenerated: 0,
        signalsExecuted: 0,
        avgSignalLatency: 0,
        dataProcessingRate: 0,
        queueLength: 0,
        throughput: 0
      },
      realtime: {
        activeConnections: 0,
        dataUpdatesPerSecond: 0,
        apiCallsPerMinute: 0,
        cacheHitRate: 0,
        bandwidthUsage: 0
      }
    };
  }

  /**
   * Initialize simulated trading data
   */
  private initializeTradingData(): void {
    // Generate some historical trading data for realistic metrics
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    for (let i = 0; i < 50; i++) {
      const timestamp = now - (Math.random() * 30 * dayMs); // Last 30 days
      const isWin = Math.random() > 0.4; // 60% win rate
      const pnl = isWin ? 
        (Math.random() * 500 + 100) : // Win: $100-600
        -(Math.random() * 300 + 50);   // Loss: $50-350
      
      this.tradingHistory.push({
        timestamp,
        pnl,
        isWin,
        holdTime: Math.random() * 3600000 + 300000 // 5min - 1hour
      });
    }
    
    this.calculateTradingMetrics();
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.startTime = Date.now();
    
    // Start monitoring loop
    this.monitoringLoop();
    
    console.log('📊 Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('⏹️ Performance monitoring stopped');
  }

  /**
   * Main monitoring loop
   */
  private async monitoringLoop(): Promise<void> {
    while (this.isMonitoring) {
      try {
        await this.collectMetrics();
        await this.checkAlerts();
        await this.createSnapshot();
        
        await this.delay(this.snapshotInterval);
      } catch (error) {
        console.error('Error in monitoring loop:', error);
        await this.delay(this.snapshotInterval);
      }
    }
  }

  /**
   * Collect all performance metrics
   */
  private async collectMetrics(): Promise<void> {
    await Promise.all([
      this.collectSystemMetrics(),
      this.collectTradingMetrics(),
      this.collectPipelineMetrics(),
      this.collectRealtimeMetrics()
    ]);
  }

  /**
   * Collect system performance metrics
   */
  private async collectSystemMetrics(): Promise<void> {
    // Simulate system metrics (in real implementation, use actual system APIs)
    this.metrics.system = {
      cpuUsage: this.simulateCpuUsage(),
      memoryUsage: this.simulateMemoryUsage(),
      networkLatency: this.simulateNetworkLatency(),
      uptime: Date.now() - this.startTime,
      errorRate: this.calculateErrorRate(),
      responseTime: this.simulateResponseTime()
    };
  }

  /**
   * Collect trading performance metrics
   */
  private async collectTradingMetrics(): Promise<void> {
    this.calculateTradingMetrics();
    
    // Add some real-time fluctuation to P&L
    const fluctuation = (Math.random() - 0.5) * 100;
    this.currentPnL += fluctuation;
    this.dailyPnL += fluctuation * 0.1;
    
    this.metrics.trading.profitLoss = this.currentPnL;
    this.metrics.trading.dailyPnL = this.dailyPnL;
  }

  /**
   * Calculate trading metrics from history
   */
  private calculateTradingMetrics(): void {
    if (this.tradingHistory.length === 0) return;
    
    const wins = this.tradingHistory.filter(t => t.isWin);
    const totalPnL = this.tradingHistory.reduce((sum, t) => sum + t.pnl, 0);
    const avgHoldTime = this.tradingHistory.reduce((sum, t) => sum + t.holdTime, 0) / this.tradingHistory.length;
    
    // Calculate drawdown
    let peak = 0;
    let maxDrawdown = 0;
    let runningPnL = 0;
    
    this.tradingHistory.forEach(trade => {
      runningPnL += trade.pnl;
      if (runningPnL > peak) peak = runningPnL;
      const drawdown = ((peak - runningPnL) / peak) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });
    
    // Calculate Sharpe ratio (simplified)
    const returns = this.tradingHistory.map(t => t.pnl);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
    const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;
    
    this.metrics.trading = {
      totalTrades: this.tradingHistory.length,
      winRate: (wins.length / this.tradingHistory.length) * 100,
      profitLoss: totalPnL,
      avgHoldTime: avgHoldTime / 1000 / 60, // Convert to minutes
      maxDrawdown,
      sharpeRatio,
      dailyPnL: this.dailyPnL,
      weeklyPnL: this.weeklyPnL,
      monthlyPnL: this.monthlyPnL
    };
  }

  /**
   * Collect pipeline performance metrics
   */
  private async collectPipelineMetrics(): Promise<void> {
    const pipelineStatus = liveDataPipeline.getStatus();
    const signals = liveDataPipeline.getSignals();
    
    const executedSignals = signals.filter(s => s.status === 'EXECUTED');
    const avgLatency = signals.length > 0 ? 
      signals.reduce((sum, s) => {
        const latency = new Date().getTime() - new Date(s.timestamp).getTime();
        return sum + latency;
      }, 0) / signals.length : 0;
    
    this.metrics.pipeline = {
      signalsGenerated: signals.length,
      signalsExecuted: executedSignals.length,
      avgSignalLatency: avgLatency,
      dataProcessingRate: this.calculateProcessingRate(),
      queueLength: pipelineStatus.queueLength || 0,
      throughput: pipelineStatus.metrics?.throughput || 0
    };
  }

  /**
   * Collect real-time metrics
   */
  private async collectRealtimeMetrics(): Promise<void> {
    const marketStats = marketDataService.getStats();
    
    this.metrics.realtime = {
      activeConnections: marketStats.subscriberCount || 0,
      dataUpdatesPerSecond: this.calculateDataUpdatesPerSecond(),
      apiCallsPerMinute: this.calculateApiCallsPerMinute(),
      cacheHitRate: this.simulateCacheHitRate(),
      bandwidthUsage: this.simulateBandwidthUsage()
    };
  }

  /**
   * Check for performance alerts
   */
  private async checkAlerts(): Promise<void> {
    this.checkSystemAlerts();
    this.checkTradingAlerts();
    this.checkPipelineAlerts();
    this.checkRealtimeAlerts();
  }

  /**
   * Check system alerts
   */
  private checkSystemAlerts(): void {
    const { system } = this.metrics;
    
    this.checkAlert('cpu_usage', 'SYSTEM', 'High CPU Usage', 
      system.cpuUsage, this.thresholds.cpuUsage, '%');
    
    this.checkAlert('memory_usage', 'SYSTEM', 'High Memory Usage', 
      system.memoryUsage, this.thresholds.memoryUsage, '%');
    
    this.checkAlert('network_latency', 'NETWORK', 'High Network Latency', 
      system.networkLatency, this.thresholds.networkLatency, 'ms');
    
    this.checkAlert('error_rate', 'SYSTEM', 'High Error Rate', 
      system.errorRate, this.thresholds.errorRate, '%');
  }

  /**
   * Check trading alerts
   */
  private checkTradingAlerts(): void {
    const { trading } = this.metrics;
    
    this.checkAlert('win_rate', 'TRADING', 'Low Win Rate', 
      trading.winRate, this.thresholds.winRate, '%', true); // Reverse check (low is bad)
    
    this.checkAlert('max_drawdown', 'TRADING', 'High Drawdown', 
      trading.maxDrawdown, this.thresholds.maxDrawdown, '%');
  }

  /**
   * Check pipeline alerts
   */
  private checkPipelineAlerts(): void {
    const { pipeline } = this.metrics;
    
    this.checkAlert('signal_latency', 'PIPELINE', 'High Signal Latency', 
      pipeline.avgSignalLatency, this.thresholds.signalLatency, 'ms');
    
    this.checkAlert('queue_length', 'PIPELINE', 'High Queue Length', 
      pipeline.queueLength, this.thresholds.queueLength, 'items');
  }

  /**
   * Check real-time alerts
   */
  private checkRealtimeAlerts(): void {
    // Add real-time specific alerts if needed
  }

  /**
   * Check individual alert condition
   */
  private checkAlert(
    id: string, 
    category: string, 
    message: string, 
    value: number, 
    threshold: number, 
    unit: string,
    reverse = false
  ): void {
    const isTriggered = reverse ? value < threshold : value > threshold;
    const alertId = `${category.toLowerCase()}_${id}`;
    
    if (isTriggered) {
      if (!this.alerts.has(alertId)) {
        const alert: PerformanceAlert = {
          id: alertId,
          type: this.getAlertType(value, threshold, reverse),
          category: category as any,
          message: `${message}: ${value.toFixed(1)}${unit} (threshold: ${threshold}${unit})`,
          timestamp: new Date().toISOString(),
          value,
          threshold,
          resolved: false
        };
        
        this.alerts.set(alertId, alert);
        console.warn(`⚠️ Performance Alert: ${alert.message}`);
      }
    } else {
      // Resolve alert if it exists
      const existingAlert = this.alerts.get(alertId);
      if (existingAlert && !existingAlert.resolved) {
        existingAlert.resolved = true;
        console.log(`✅ Performance Alert Resolved: ${existingAlert.message}`);
      }
    }
  }

  /**
   * Get alert type based on severity
   */
  private getAlertType(value: number, threshold: number, reverse = false): 'WARNING' | 'ERROR' | 'CRITICAL' {
    const ratio = reverse ? threshold / value : value / threshold;
    
    if (ratio >= 2) return 'CRITICAL';
    if (ratio >= 1.5) return 'ERROR';
    return 'WARNING';
  }

  /**
   * Create performance snapshot
   */
  private async createSnapshot(): Promise<void> {
    const activeAlerts = Array.from(this.alerts.values()).filter(a => !a.resolved);
    
    let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
    if (activeAlerts.some(a => a.type === 'CRITICAL')) status = 'CRITICAL';
    else if (activeAlerts.some(a => a.type === 'ERROR' || a.type === 'WARNING')) status = 'WARNING';
    
    const snapshot: PerformanceSnapshot = {
      timestamp: new Date().toISOString(),
      metrics: JSON.parse(JSON.stringify(this.metrics)), // Deep copy
      alerts: [...activeAlerts],
      status
    };
    
    this.snapshots.push(snapshot);
    
    // Keep only recent snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-this.maxSnapshots);
    }
    
    // Notify listeners
    this.notifyListeners(snapshot);
    
    this.lastSnapshot = Date.now();
  }

  /**
   * Notify all listeners of new snapshot
   */
  private notifyListeners(snapshot: PerformanceSnapshot): void {
    this.listeners.forEach(listener => {
      try {
        listener(snapshot);
      } catch (error) {
        console.error('Error in performance monitor listener:', error);
      }
    });
  }

  /**
   * Simulation methods for realistic metrics
   */
  private simulateCpuUsage(): number {
    const base = 20 + Math.random() * 30; // 20-50% base
    const spike = Math.random() < 0.1 ? Math.random() * 40 : 0; // 10% chance of spike
    return Math.min(100, base + spike);
  }

  private simulateMemoryUsage(): number {
    const base = 40 + Math.random() * 20; // 40-60% base
    const growth = Math.sin(Date.now() / 60000) * 10; // Slow oscillation
    return Math.max(0, Math.min(100, base + growth));
  }

  private simulateNetworkLatency(): number {
    const base = 50 + Math.random() * 100; // 50-150ms base
    const spike = Math.random() < 0.05 ? Math.random() * 500 : 0; // 5% chance of spike
    return base + spike;
  }

  private calculateErrorRate(): number {
    // Simulate error rate based on system load
    const cpuFactor = this.metrics.system.cpuUsage / 100;
    const memoryFactor = this.metrics.system.memoryUsage / 100;
    return (cpuFactor + memoryFactor) * 2.5; // 0-5% typical range
  }

  private simulateResponseTime(): number {
    const base = 200 + Math.random() * 300; // 200-500ms base
    const loadFactor = (this.metrics.system.cpuUsage / 100) * 1000;
    return base + loadFactor;
  }

  private calculateProcessingRate(): number {
    return 50 + Math.random() * 100; // 50-150 items/second
  }

  private calculateDataUpdatesPerSecond(): number {
    return 10 + Math.random() * 20; // 10-30 updates/second
  }

  private calculateApiCallsPerMinute(): number {
    return 100 + Math.random() * 200; // 100-300 calls/minute
  }

  private simulateCacheHitRate(): number {
    return 85 + Math.random() * 10; // 85-95% hit rate
  }

  private simulateBandwidthUsage(): number {
    return Math.random() * 100; // 0-100 MB/s
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Subscribe to performance updates
   */
  subscribe(listener: (snapshot: PerformanceSnapshot) => void): () => void {
    this.listeners.push(listener);
    
    // Send current snapshot immediately
    if (this.snapshots.length > 0) {
      listener(this.snapshots[this.snapshots.length - 1]);
    }
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): PerformanceMetrics {
    return JSON.parse(JSON.stringify(this.metrics));
  }

  /**
   * Get recent snapshots
   */
  getRecentSnapshots(count = 100): PerformanceSnapshot[] {
    return this.snapshots.slice(-count);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.alerts.values()).filter(a => !a.resolved);
  }

  /**
   * Get monitoring status
   */
  getStatus(): any {
    return {
      isMonitoring: this.isMonitoring,
      uptime: Date.now() - this.startTime,
      snapshotCount: this.snapshots.length,
      activeAlerts: this.getActiveAlerts().length,
      lastSnapshot: this.lastSnapshot,
      status: this.snapshots.length > 0 ? this.snapshots[this.snapshots.length - 1].status : 'UNKNOWN'
    };
  }

  /**
   * Add simulated trade for testing
   */
  addTrade(pnl: number, holdTime: number): void {
    this.tradingHistory.push({
      timestamp: Date.now(),
      pnl,
      isWin: pnl > 0,
      holdTime
    });
    
    this.currentPnL += pnl;
    this.dailyPnL += pnl;
    
    // Keep only recent trades
    if (this.tradingHistory.length > 1000) {
      this.tradingHistory = this.tradingHistory.slice(-1000);
    }
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;