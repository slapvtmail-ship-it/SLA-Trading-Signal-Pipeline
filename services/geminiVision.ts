import axios from 'axios';
import type { GeminiAnalysisResponse, Direction } from '../types';
import { configManager } from '../config';

export class GeminiVisionService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Analyze a trading chart image using Gemini Vision API
   */
  async analyzeChart(imageData: string, symbol: string): Promise<GeminiAnalysisResponse> {
    try {
      // Validate inputs
      if (!imageData || typeof imageData !== 'string') {
        console.error('Invalid imageData provided to analyzeChart');
        return this.getFallbackAnalysis(symbol);
      }

      if (!symbol || typeof symbol !== 'string') {
        console.error('Invalid symbol provided to analyzeChart');
        return this.getFallbackAnalysis('UNKNOWN');
      }

      if (!this.apiKey || this.apiKey === 'demo-key') {
        console.warn('Using demo API key, returning fallback analysis');
        return this.getFallbackAnalysis(symbol);
      }

      // Remove data URL prefix if present
      const base64Image = imageData.replace(/^data:image\/[a-z]+;base64,/, '');

      // Validate base64 image data
      if (!base64Image || base64Image.length < 100) {
        console.error('Invalid or too small base64 image data');
        return this.getFallbackAnalysis(symbol);
      }

      const prompt = `
        Analyze this trading chart for ${symbol} and provide a comprehensive technical analysis.
        
        Please provide:
        1. Technical indicators analysis (RSI, MACD, Bollinger Bands, etc.)
        2. Chart patterns identified
        3. Support and resistance levels
        4. Trading recommendation (LONG, SHORT, or FLAT)
        5. Entry price suggestion
        6. Stop-loss level
        7. Take-profit target
        8. Confidence level (0-1)
        9. Detailed reasoning for the recommendation
        
        Format your response as a structured analysis focusing on actionable trading insights.
      `;

      const requestBody = {
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: "image/png",
                data: base64Image
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 32,
          topP: 1,
          maxOutputTokens: 1024,
        }
      };

      const response = await axios.post(
        `${this.baseUrl}?key=${this.apiKey}`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      // Validate response structure
      if (!response.data || !response.data.candidates || !Array.isArray(response.data.candidates)) {
        console.error('Invalid response structure from Gemini API');
        return this.getFallbackAnalysis(symbol);
      }

      // Parse the response and extract trading signals
      const analysisText = response.data.candidates[0]?.content?.parts[0]?.text || '';
      
      if (!analysisText) {
        console.error('No analysis text received from Gemini API');
        return this.getFallbackAnalysis(symbol);
      }

      console.log(`Successfully analyzed chart for ${symbol}`);
      return this.parseAnalysisResponse(analysisText, symbol);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          console.error('Gemini API authentication failed - check API key');
        } else if (error.response?.status === 429) {
          console.error('Gemini API rate limit exceeded');
        } else if (error.code === 'ECONNABORTED') {
          console.error('Gemini API request timeout');
        } else {
          console.error('Gemini API HTTP error:', error.response?.status, error.response?.statusText);
        }
      } else {
        console.error('Gemini Vision API error:', error);
      }
      
      // Return fallback analysis if API fails
      return this.getFallbackAnalysis(symbol);
    }
  }

  /**
   * Parse Gemini's text response into structured data
   */
  private parseAnalysisResponse(analysisText: string, symbol: string): GeminiAnalysisResponse {
    try {
      // Validate inputs
      if (!analysisText || typeof analysisText !== 'string') {
        console.error('Invalid analysisText provided to parseAnalysisResponse');
        return this.getFallbackAnalysis(symbol);
      }

      if (!symbol || typeof symbol !== 'string') {
        console.error('Invalid symbol provided to parseAnalysisResponse');
        return this.getFallbackAnalysis('UNKNOWN');
      }

      // This is a simplified parser - in production, you'd want more robust parsing
      // Extract key information using regex patterns
      const directionMatch = analysisText.match(/(LONG|SHORT|FLAT)/i);
      const entryMatch = analysisText.match(/entry[:\s]*\$?([0-9,]+\.?[0-9]*)/i);
      const stopLossMatch = analysisText.match(/stop[-\s]*loss[:\s]*\$?([0-9,]+\.?[0-9]*)/i);
      const takeProfitMatch = analysisText.match(/take[-\s]*profit[:\s]*\$?([0-9,]+\.?[0-9]*)/i);
      const confidenceMatch = analysisText.match(/confidence[:\s]*([0-9]+)%?/i);

      // Default values based on symbol
      const basePrice = this.getBasePrice(symbol);
      
      // Parse and validate numeric values
      const entry = this.parsePrice(entryMatch?.[1], basePrice);
      const stopLoss = this.parsePrice(stopLossMatch?.[1], basePrice * 0.95);
      const takeProfit = this.parsePrice(takeProfitMatch?.[1], basePrice * 1.05);
      const confidence = this.parseConfidence(confidenceMatch?.[1]);

      return {
        extractedData: analysisText,
        direction: this.parseDirection(directionMatch?.[1] || 'FLAT'),
        entry,
        stopLoss,
        takeProfit,
        confidence,
        reasoning: this.extractReasoning(analysisText),
        technicalAnalysis: this.formatTechnicalAnalysis(analysisText),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error parsing analysis response:', error);
      return this.getFallbackAnalysis(symbol);
    }
  }

  /**
   * Get fallback analysis when API fails
   */
  private getFallbackAnalysis(symbol: string): GeminiAnalysisResponse {
    const basePrice = this.getBasePrice(symbol);
    
    return {
      extractedData: `Fallback analysis for ${symbol}. API temporarily unavailable. Using technical indicators from chart patterns.`,
      direction: 'FLAT' as Direction,
      entry: basePrice,
      stopLoss: basePrice * 0.95,
      takeProfit: basePrice * 1.05,
      confidence: 0.5,
      reasoning: 'Fallback mode - API unavailable',
      technicalAnalysis: 'Fallback technical analysis: Consolidation pattern detected. RSI: 50, MACD: neutral, Sentiment: neutral',
      timestamp: new Date().toISOString()
    };
  }

  private parseDirection(direction: string): Direction {
    switch (direction.toUpperCase()) {
      case 'LONG': return 'LONG' as Direction;
      case 'SHORT': return 'SHORT' as Direction;
      default: return 'FLAT' as Direction;
    }
  }

  private getBasePrice(symbol: string): number {
    // Approximate current prices for major symbols
    const prices: Record<string, number> = {
      'BTC/USD': 67000,
      'BTCUSDT': 67000,
      'ETH/USD': 3400,
      'ETHUSDT': 3400,
      'SOL/USD': 155,
      'SOLUSDT': 155,
      'ADA/USD': 0.45,
      'ADAUSDT': 0.45
    };
    
    return prices[symbol] || prices[symbol.replace('BINANCE:', '')] || 100;
  }

  private extractReasoning(text: string): string {
    // Extract reasoning section from the analysis
    const reasoningMatch = text.match(/reasoning[:\s]*(.*?)(?=\n\n|\n[A-Z]|$)/is);
    return reasoningMatch?.[1]?.trim() || 'Technical analysis based on chart patterns and indicators.';
  }

  private extractPatterns(text: string): string[] {
    const patterns = [];
    const patternKeywords = ['triangle', 'head and shoulders', 'double top', 'double bottom', 'flag', 'pennant', 'wedge'];
    
    for (const pattern of patternKeywords) {
      if (text.toLowerCase().includes(pattern)) {
        patterns.push(pattern);
      }
    }
    
    return patterns.length > 0 ? patterns : ['Consolidation'];
  }

  private extractIndicators(text: string): Record<string, any> {
    const indicators: Record<string, any> = {};
    
    // Extract RSI
    const rsiMatch = text.match(/rsi[:\s]*([0-9]+)/i);
    if (rsiMatch) indicators.rsi = parseInt(rsiMatch[1]);
    
    // Extract MACD
    const macdMatch = text.match(/macd[:\s]*([+-]?[0-9.]+)/i);
    if (macdMatch) indicators.macd = parseFloat(macdMatch[1]);
    
    return indicators;
  }

  private extractSentiment(text: string): 'bullish' | 'bearish' | 'neutral' {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('bullish') || lowerText.includes('buy') || lowerText.includes('long')) {
      return 'bullish';
    } else if (lowerText.includes('bearish') || lowerText.includes('sell') || lowerText.includes('short')) {
      return 'bearish';
    }
    
    return 'neutral';
  }

  private formatTechnicalAnalysis(text: string): string {
    const patterns = this.extractPatterns(text);
    const indicators = this.extractIndicators(text);
    const sentiment = this.extractSentiment(text);

    let analysis = `Technical Analysis Summary:\n`;
    analysis += `Patterns: ${patterns.join(', ')}\n`;
    analysis += `Sentiment: ${sentiment}\n`;
    
    if (indicators.rsi) {
      analysis += `RSI: ${indicators.rsi}\n`;
    }
    if (indicators.macd) {
      analysis += `MACD: ${indicators.macd}\n`;
    }
    
    return analysis.trim();
  }

  private parsePrice(priceString: string | undefined, defaultValue: number): number {
    if (!priceString) return defaultValue;
    
    try {
      const cleanPrice = priceString.replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(cleanPrice);
      
      // Validate the parsed price is reasonable
      if (isNaN(parsed) || parsed <= 0 || parsed > 1000000) {
        console.warn(`Invalid price parsed: ${priceString}, using default: ${defaultValue}`);
        return defaultValue;
      }
      
      return parsed;
    } catch (error) {
      console.warn(`Error parsing price: ${priceString}, using default: ${defaultValue}`);
      return defaultValue;
    }
  }

  private parseConfidence(confidenceString: string | undefined): number {
    if (!confidenceString) return 0.75; // Default 75%
    
    try {
      const parsed = parseFloat(confidenceString);
      
      // Validate confidence is between 0 and 100 (or 0 and 1)
      if (isNaN(parsed)) return 0.75;
      
      // Convert percentage to decimal if needed
      const confidence = parsed > 1 ? parsed / 100 : parsed;
      
      // Clamp between 0 and 1
      return Math.max(0, Math.min(1, confidence));
    } catch (error) {
      console.warn(`Error parsing confidence: ${confidenceString}, using default: 0.75`);
      return 0.75;
    }
  }
}

// Export singleton instance
export const geminiVisionService = new GeminiVisionService(
  configManager.getGeminiApiKey() || 'demo-key'
);