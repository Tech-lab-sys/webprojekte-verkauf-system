import { generateOfferWithPerplexity } from './perplexity';
import OpenAI from 'openai';
import { WebsiteType } from '@prisma/client';

// OpenAI Fallback Client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export interface LLMOfferRequest {
  type: WebsiteType;
  niche: string;
  targetAudience?: string;
  features?: string[];
}

export interface LLMOfferResponse {
  title: string;
  description: string;
  highlights: string[];
  priceRecommendation: number;
  provider: 'perplexity' | 'openai';
  costEstimate: number; // in USD
}

/**
 * Generiert Angebot mit automatischem Fallback:
 * 1. Versucht Perplexity (günstig)
 * 2. Falls Fehler, automatischer Fallback auf OpenAI
 * 3. Retry-Logik (3x)
 */
export async function generateOfferWithFallback(
  request: LLMOfferRequest,
  maxRetries: number = 3
): Promise<LLMOfferResponse> {
  let lastError: Error | null = null;

  // 1. Versuche Perplexity (Primary, günstig)
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 Attempt ${attempt}/${maxRetries}: Trying Perplexity...`);

      const result = await generateOfferWithPerplexity(request);

      console.log('✅ Perplexity successful!');
      return {
        ...result,
        provider: 'perplexity',
        costEstimate: 0.005, // ~$0.005 pro Request
      };
    } catch (error) {
      console.warn(`⚠️ Perplexity attempt ${attempt} failed:`, error);
      lastError = error as Error;

      if (attempt < maxRetries) {
        // Exponentielles Backoff: 1s, 2s, 4s
        const waitTime = Math.pow(2, attempt - 1) * 1000;
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  // 2. Fallback auf OpenAI
  console.log('🔄 Falling back to OpenAI...');

  try {
    const result = await generateOfferWithOpenAI(request);

    console.log('✅ OpenAI successful!');
    return {
      ...result,
      provider: 'openai',
      costEstimate: 0.02, // ~$0.02 pro Request (teurer)
    };
  } catch (error) {
    console.error('❌ Both Perplexity and OpenAI failed!');
    throw new Error(
      `LLM generation failed after ${maxRetries} retries. Last error: ${lastError?.message}. OpenAI error: ${(error as Error).message}`
    );
  }
}

/**
 * Generiert Angebot mit OpenAI (Fallback)
 */
async function generateOfferWithOpenAI(request: LLMOfferRequest): Promise<Omit<LLMOfferResponse, 'provider' | 'costEstimate'>> {
  const { type, niche, targetAudience, features = [] } = request;

  const prompt = `Erstelle ein professionelles Verkaufsangebot für eine ${type} WordPress Website in der Nische "${niche}".

Zielgruppe: ${targetAudience || 'Allgemein'}
Features: ${features.join(', ') || 'Standard Features'}

Generiere:
1. Einen verkaufsstarken Titel (max 80 Zeichen)
2. Eine ausführliche Beschreibung (200-300 Wörter)
3. 5 Highlight-Punkte
4. Eine Preisempfehlung in Euro

Format: JSON
{
  "title": "...",
  "description": "...",
  "highlights": ["...", "...", "...", "...", "..."],
  "priceRecommendation": 149
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content:
          'Du bist ein erfahrener Copywriter für digitale Produkte. Erstelle überzeugende Verkaufstexte in deutscher Sprache.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.8,
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error('OpenAI returned empty response');
  }

  try {
    const parsed = JSON.parse(content);
    return {
      title: parsed.title,
      description: parsed.description,
      highlights: parsed.highlights,
      priceRecommendation: parsed.priceRecommendation,
    };
  } catch (error) {
    throw new Error(`Failed to parse OpenAI response: ${error}`);
  }
}

/**
 * Health Check: Prüft ob LLM Services verfügbar sind
 */
export async function checkLLMHealth(): Promise<{
  perplexity: boolean;
  openai: boolean;
  recommendation: 'perplexity' | 'openai' | 'none';
}> {
  const results = {
    perplexity: false,
    openai: false,
    recommendation: 'none' as 'perplexity' | 'openai' | 'none',
  };

  // Test Perplexity
  try {
    await generateOfferWithPerplexity({
      type: 'AFFILIATE',
      niche: 'test',
    });
    results.perplexity = true;
    results.recommendation = 'perplexity';
  } catch (error) {
    console.warn('Perplexity health check failed:', error);
  }

  // Test OpenAI
  try {
    await generateOfferWithOpenAI({
      type: 'AFFILIATE',
      niche: 'test',
    });
    results.openai = true;

    // Empfehle OpenAI nur wenn Perplexity nicht verfügbar
    if (!results.perplexity) {
      results.recommendation = 'openai';
    }
  } catch (error) {
    console.warn('OpenAI health check failed:', error);
  }

  return results;
}

/**
 * Kosten-Tracker: Speichert Nutzung und Kosten
 */
interface UsageLog {
  timestamp: Date;
  provider: 'perplexity' | 'openai';
  cost: number;
  success: boolean;
}

const usageLogs: UsageLog[] = [];

export function logUsage(provider: 'perplexity' | 'openai', cost: number, success: boolean = true): void {
  usageLogs.push({
    timestamp: new Date(),
    provider,
    cost,
    success,
  });

  // Halte nur die letzten 1000 Logs
  if (usageLogs.length > 1000) {
    usageLogs.shift();
  }
}

export function getUsageStats(days: number = 30): {
  perplexity: { requests: number; cost: number; successRate: number };
  openai: { requests: number; cost: number; successRate: number };
  total: { requests: number; cost: number; savings: number };
} {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const recentLogs = usageLogs.filter((log) => log.timestamp >= cutoff);

  const perplexityLogs = recentLogs.filter((log) => log.provider === 'perplexity');
  const openaiLogs = recentLogs.filter((log) => log.provider === 'openai');

  const perplexityStats = {
    requests: perplexityLogs.length,
    cost: perplexityLogs.reduce((sum, log) => sum + log.cost, 0),
    successRate: perplexityLogs.filter((log) => log.success).length / perplexityLogs.length || 0,
  };

  const openaiStats = {
    requests: openaiLogs.length,
    cost: openaiLogs.reduce((sum, log) => sum + log.cost, 0),
    successRate: openaiLogs.filter((log) => log.success).length / openaiLogs.length || 0,
  };

  // Berechne Einsparungen (wenn alles mit OpenAI gemacht worden wäre)
  const wouldHaveCost = perplexityStats.requests * 0.02;
  const savings = wouldHaveCost - perplexityStats.cost;

  return {
    perplexity: perplexityStats,
    openai: openaiStats,
    total: {
      requests: recentLogs.length,
      cost: perplexityStats.cost + openaiStats.cost,
      savings,
    },
  };
}
