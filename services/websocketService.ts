/**
 * Advanced WebSocket Service for Real-time Data
 * Phase 5: Enhanced Features & Optimization
 */

// import { LiveMarketData } from './marketDataService'; // For future use
// import { portfolioManager } from './portfolioManager'; // For future use
// import { riskManager } from './riskManager'; // For future use

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  subscriptions: string[];
  apiKey?: string;
}

export interface WebSocketMessage {
  type: 'SUBSCRIBE' | 'UNSUBSCRIBE' | 'HEARTBEAT' | 'DATA' | 'ERROR';
  channel?: string;
  symbol?: string;
  data?: any;
  timestamp: string;
}

export interface StreamData {
  symbol: string;
  price: number;
  volume: number;
  change: number;
  change24h: number;
  timestamp: string;
  source: string;
}

export interface OrderBookUpdate {
  symbol: string;
  bids: Array<{ price: number; quantity: number }>;
  asks: Array<{ price: number; quantity: number }>;
  timestamp: string;
}

export interface TradeUpdate {
  symbol: string;
  price: number;
  quantity: number;
  side: 'BUY' | 'SELL';
  timestamp: string;
}

class WebSocketService {
  private connections: Map<string, WebSocket> = new Map();
  private configs: Map<string, WebSocketConfig> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();
  // private subscriptions: Map<string, Set<string>> = new Map(); // For future use
  private dataListeners: Map<string, ((data: StreamData) => void)[]> = new Map();
  private orderBookListeners: Map<string, ((data: OrderBookUpdate) => void)[]> = new Map();
  private tradeListeners: Map<string, ((data: TradeUpdate) => void)[]> = new Map();
  private connectionListeners: ((status: { exchange: string; connected: boolean }) => void)[] = [];
  private isInitialized = false;

  constructor() {
    this.initializeWebSocketService();
  }

  /**
   * Initialize WebSocket service with multiple exchanges
   */
  private initializeWebSocketService(): void {
    if (this.isInitialized) return;

    // Initialize connections for major exchanges
    this.initializeBinanceConnection();
    this.initializeCoinbaseConnection();
    this.initializeKrakenConnection();

    this.isInitialized = true;
  }

  /**
   * Initialize Binance WebSocket connection
   */
  private initializeBinanceConnection(): void {
    const config: WebSocketConfig = {
      url: 'wss://stream.binance.com:9443/ws',
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      subscriptions: ['btcusdt@ticker', 'ethusdt@ticker', 'adausdt@ticker']
    };

    this.configs.set('binance', config);
    this.connect('binance');
  }

  /**
   * Initialize Coinbase WebSocket connection
   */
  private initializeCoinbaseConnection(): void {
    const config: WebSocketConfig = {
      url: 'wss://ws-feed.exchange.coinbase.com',
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      subscriptions: ['BTC-USD', 'ETH-USD', 'ADA-USD']
    };

    this.configs.set('coinbase', config);
    this.connect('coinbase');
  }

  /**
   * Initialize Kraken WebSocket connection
   */
  private initializeKrakenConnection(): void {
    const config: WebSocketConfig = {
      url: 'wss://ws.kraken.com',
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      subscriptions: ['XBT/USD', 'ETH/USD', 'ADA/USD']
    };

    this.configs.set('kraken', config);
    this.connect('kraken');
  }

  /**
   * Connect to exchange WebSocket
   */
  private connect(exchange: string): void {
    const config = this.configs.get(exchange);
    if (!config) return;

    try {
      const ws = new WebSocket(config.url);
      
      ws.onopen = () => {
        console.log(`✅ Connected to ${exchange} WebSocket`);
        this.connections.set(exchange, ws);
        this.reconnectAttempts.set(exchange, 0);
        
        // Subscribe to channels
        this.subscribeToChannels(exchange);
        
        // Start heartbeat
        this.startHeartbeat(exchange);
        
        // Notify connection listeners
        this.notifyConnectionListeners(exchange, true);
      };

      ws.onmessage = (event) => {
        this.handleMessage(exchange, event.data);
      };

      ws.onclose = () => {
        console.log(`❌ Disconnected from ${exchange} WebSocket`);
        this.connections.delete(exchange);
        this.stopHeartbeat(exchange);
        this.notifyConnectionListeners(exchange, false);
        
        // Attempt reconnection
        this.attemptReconnection(exchange);
      };

      ws.onerror = (error) => {
        console.error(`❌ ${exchange} WebSocket error:`, error);
      };

    } catch (error) {
      console.error(`❌ Failed to connect to ${exchange}:`, error);
      this.attemptReconnection(exchange);
    }
  }

  /**
   * Subscribe to channels based on exchange
   */
  private subscribeToChannels(exchange: string): void {
    const ws = this.connections.get(exchange);
    const config = this.configs.get(exchange);
    if (!ws || !config) return;

    switch (exchange) {
      case 'binance':
        this.subscribeBinance(ws, config.subscriptions);
        break;
      case 'coinbase':
        this.subscribeCoinbase(ws, config.subscriptions);
        break;
      case 'kraken':
        this.subscribeKraken(ws, config.subscriptions);
        break;
    }
  }

  /**
   * Subscribe to Binance streams
   */
  private subscribeBinance(ws: WebSocket, symbols: string[]): void {
    const subscribeMessage = {
      method: 'SUBSCRIBE',
      params: symbols,
      id: Date.now()
    };
    
    ws.send(JSON.stringify(subscribeMessage));
    
    // Also subscribe to order book streams
    const orderBookStreams = symbols.map(s => s.replace('@ticker', '@depth20@100ms'));
    const orderBookMessage = {
      method: 'SUBSCRIBE',
      params: orderBookStreams,
      id: Date.now() + 1
    };
    
    ws.send(JSON.stringify(orderBookMessage));
  }

  /**
   * Subscribe to Coinbase feeds
   */
  private subscribeCoinbase(ws: WebSocket, symbols: string[]): void {
    const subscribeMessage = {
      type: 'subscribe',
      product_ids: symbols,
      channels: ['ticker', 'level2']
    };
    
    ws.send(JSON.stringify(subscribeMessage));
  }

  /**
   * Subscribe to Kraken feeds
   */
  private subscribeKraken(ws: WebSocket, symbols: string[]): void {
    const subscribeMessage = {
      event: 'subscribe',
      pair: symbols,
      subscription: { name: 'ticker' }
    };
    
    ws.send(JSON.stringify(subscribeMessage));
    
    // Subscribe to order book
    const orderBookMessage = {
      event: 'subscribe',
      pair: symbols,
      subscription: { name: 'book', depth: 25 }
    };
    
    ws.send(JSON.stringify(orderBookMessage));
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(exchange: string, data: string): void {
    try {
      const message = JSON.parse(data);
      
      switch (exchange) {
        case 'binance':
          this.handleBinanceMessage(message);
          break;
        case 'coinbase':
          this.handleCoinbaseMessage(message);
          break;
        case 'kraken':
          this.handleKrakenMessage(message);
          break;
      }
    } catch (error) {
      console.error(`❌ Error parsing ${exchange} message:`, error);
    }
  }

  /**
   * Handle Binance messages
   */
  private handleBinanceMessage(message: any): void {
    if (message.e === '24hrTicker') {
      const streamData: StreamData = {
        symbol: message.s,
        price: parseFloat(message.c),
        volume: parseFloat(message.v),
        change: parseFloat(message.p),
        change24h: parseFloat(message.P),
        timestamp: new Date(message.E).toISOString(),
        source: 'binance'
      };
      
      this.notifyDataListeners(streamData);
      this.updatePortfolioManager(streamData);
    }
    
    if (message.e === 'depthUpdate') {
      const orderBookUpdate: OrderBookUpdate = {
        symbol: message.s,
        bids: message.b.map((bid: string[]) => ({
          price: parseFloat(bid[0]),
          quantity: parseFloat(bid[1])
        })),
        asks: message.a.map((ask: string[]) => ({
          price: parseFloat(ask[0]),
          quantity: parseFloat(ask[1])
        })),
        timestamp: new Date(message.E).toISOString()
      };
      
      this.notifyOrderBookListeners(orderBookUpdate);
    }
  }

  /**
   * Handle Coinbase messages
   */
  private handleCoinbaseMessage(message: any): void {
    if (message.type === 'ticker') {
      const streamData: StreamData = {
        symbol: message.product_id,
        price: parseFloat(message.price),
        volume: parseFloat(message.volume_24h),
        change: parseFloat(message.price) - parseFloat(message.open_24h),
        change24h: ((parseFloat(message.price) - parseFloat(message.open_24h)) / parseFloat(message.open_24h)) * 100,
        timestamp: message.time,
        source: 'coinbase'
      };
      
      this.notifyDataListeners(streamData);
      this.updatePortfolioManager(streamData);
    }
    
    if (message.type === 'l2update') {
      const orderBookUpdate: OrderBookUpdate = {
        symbol: message.product_id,
        bids: message.changes
          .filter((change: string[]) => change[0] === 'buy')
          .map((change: string[]) => ({
            price: parseFloat(change[1]),
            quantity: parseFloat(change[2])
          })),
        asks: message.changes
          .filter((change: string[]) => change[0] === 'sell')
          .map((change: string[]) => ({
            price: parseFloat(change[1]),
            quantity: parseFloat(change[2])
          })),
        timestamp: message.time
      };
      
      this.notifyOrderBookListeners(orderBookUpdate);
    }
  }

  /**
   * Handle Kraken messages
   */
  private handleKrakenMessage(message: any): void {
    if (Array.isArray(message) && message[1] && message[2] === 'ticker') {
      const tickerData = message[1];
      const symbol = message[3];
      
      const streamData: StreamData = {
        symbol,
        price: parseFloat(tickerData.c[0]),
        volume: parseFloat(tickerData.v[1]),
        change: parseFloat(tickerData.c[0]) - parseFloat(tickerData.o),
        change24h: ((parseFloat(tickerData.c[0]) - parseFloat(tickerData.o)) / parseFloat(tickerData.o)) * 100,
        timestamp: new Date().toISOString(),
        source: 'kraken'
      };
      
      this.notifyDataListeners(streamData);
      this.updatePortfolioManager(streamData);
    }
    
    if (Array.isArray(message) && message[1] && message[2] === 'book-25') {
      const bookData = message[1];
      const symbol = message[3];
      
      const orderBookUpdate: OrderBookUpdate = {
        symbol,
        bids: Object.entries(bookData.b || {}).map(([price, data]: [string, any]) => ({
          price: parseFloat(price),
          quantity: parseFloat(data[0])
        })),
        asks: Object.entries(bookData.a || {}).map(([price, data]: [string, any]) => ({
          price: parseFloat(price),
          quantity: parseFloat(data[0])
        })),
        timestamp: new Date().toISOString()
      };
      
      this.notifyOrderBookListeners(orderBookUpdate);
    }
  }

  /**
   * Update portfolio manager with new market data
   */
  private updatePortfolioManager(streamData: StreamData): void {
    // Update portfolio manager with market data (commented out to avoid circular dependency)
    // This method would convert streamData to LiveMarketData format and update the portfolio
    console.log(`Received market data for ${streamData.symbol}: $${streamData.price}`);
  }

  /**
   * Start heartbeat for connection
   */
  private startHeartbeat(exchange: string): void {
    const config = this.configs.get(exchange);
    if (!config) return;

    const interval = setInterval(() => {
      const ws = this.connections.get(exchange);
      if (ws && ws.readyState === WebSocket.OPEN) {
        // Send ping based on exchange protocol
        switch (exchange) {
          case 'binance':
            ws.send(JSON.stringify({ method: 'ping' }));
            break;
          case 'coinbase':
            ws.send(JSON.stringify({ type: 'heartbeat', on: true }));
            break;
          case 'kraken':
            ws.send(JSON.stringify({ event: 'ping' }));
            break;
        }
      }
    }, config.heartbeatInterval);

    this.heartbeatIntervals.set(exchange, interval);
  }

  /**
   * Stop heartbeat for connection
   */
  private stopHeartbeat(exchange: string): void {
    const interval = this.heartbeatIntervals.get(exchange);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(exchange);
    }
  }

  /**
   * Attempt reconnection
   */
  private attemptReconnection(exchange: string): void {
    const config = this.configs.get(exchange);
    if (!config) return;

    const attempts = this.reconnectAttempts.get(exchange) || 0;
    
    if (attempts < config.maxReconnectAttempts) {
      this.reconnectAttempts.set(exchange, attempts + 1);
      
      console.log(`🔄 Attempting to reconnect to ${exchange} (${attempts + 1}/${config.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(exchange);
      }, config.reconnectInterval);
    } else {
      console.error(`❌ Max reconnection attempts reached for ${exchange}`);
    }
  }

  /**
   * Notify data listeners
   */
  private notifyDataListeners(data: StreamData): void {
    const listeners = this.dataListeners.get(data.symbol) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Error in data listener:', error);
      }
    });
  }

  /**
   * Notify order book listeners
   */
  private notifyOrderBookListeners(data: OrderBookUpdate): void {
    const listeners = this.orderBookListeners.get(data.symbol) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Error in order book listener:', error);
      }
    });
  }

  /**
   * Notify trade listeners (commented out for now)
   */
  // private notifyTradeListeners(data: TradeUpdate): void {
  //   const listeners = this.tradeListeners.get(data.symbol) || [];
  //   listeners.forEach(listener => {
  //     try {
  //       listener(data);
  //     } catch (error) {
  //       console.error('Error in trade listener:', error);
  //     }
  //   });
  // }

  /**
   * Notify connection listeners
   */
  private notifyConnectionListeners(exchange: string, connected: boolean): void {
    this.connectionListeners.forEach(listener => {
      try {
        listener({ exchange, connected });
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  /**
   * Public API methods
   */
  subscribeToSymbol(symbol: string, listener: (data: StreamData) => void): () => void {
    const listeners = this.dataListeners.get(symbol) || [];
    listeners.push(listener);
    this.dataListeners.set(symbol, listeners);

    return () => {
      const currentListeners = this.dataListeners.get(symbol) || [];
      const index = currentListeners.indexOf(listener);
      if (index > -1) {
        currentListeners.splice(index, 1);
        this.dataListeners.set(symbol, currentListeners);
      }
    };
  }

  subscribeToOrderBook(symbol: string, listener: (data: OrderBookUpdate) => void): () => void {
    const listeners = this.orderBookListeners.get(symbol) || [];
    listeners.push(listener);
    this.orderBookListeners.set(symbol, listeners);

    return () => {
      const currentListeners = this.orderBookListeners.get(symbol) || [];
      const index = currentListeners.indexOf(listener);
      if (index > -1) {
        currentListeners.splice(index, 1);
        this.orderBookListeners.set(symbol, currentListeners);
      }
    };
  }

  subscribeToTrades(symbol: string, listener: (data: TradeUpdate) => void): () => void {
    const listeners = this.tradeListeners.get(symbol) || [];
    listeners.push(listener);
    this.tradeListeners.set(symbol, listeners);

    return () => {
      const currentListeners = this.tradeListeners.get(symbol) || [];
      const index = currentListeners.indexOf(listener);
      if (index > -1) {
        currentListeners.splice(index, 1);
        this.tradeListeners.set(symbol, currentListeners);
      }
    };
  }

  subscribeToConnections(listener: (status: { exchange: string; connected: boolean }) => void): () => void {
    this.connectionListeners.push(listener);

    return () => {
      const index = this.connectionListeners.indexOf(listener);
      if (index > -1) {
        this.connectionListeners.splice(index, 1);
      }
    };
  }

  getConnectionStatus(): { [exchange: string]: boolean } {
    const status: { [exchange: string]: boolean } = {};
    
    for (const [exchange, ws] of this.connections.entries()) {
      status[exchange] = ws.readyState === WebSocket.OPEN;
    }
    
    return status;
  }

  disconnect(exchange?: string): void {
    if (exchange) {
      const ws = this.connections.get(exchange);
      if (ws) {
        ws.close();
        this.connections.delete(exchange);
        this.stopHeartbeat(exchange);
      }
    } else {
      // Disconnect all
      for (const [exchangeName, ws] of this.connections.entries()) {
        ws.close();
        this.stopHeartbeat(exchangeName);
      }
      this.connections.clear();
    }
  }

  reconnect(exchange?: string): void {
    if (exchange) {
      this.disconnect(exchange);
      setTimeout(() => this.connect(exchange), 1000);
    } else {
      // Reconnect all
      const exchanges = Array.from(this.configs.keys());
      this.disconnect();
      setTimeout(() => {
        exchanges.forEach(ex => this.connect(ex));
      }, 1000);
    }
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;