import axios from 'axios';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

export interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface PerplexityResponse {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message: PerplexityMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ⚡ Bolt: Cache external LLM API calls to prevent performance bottlenecks
// and duplicate synchronous requests. Bounded to 100 items to prevent memory leaks.
const MAX_CACHE_SIZE = 100;
const llmCache = new Map<string, any>();

function getFromCache<T>(key: string): T | null {
  if (llmCache.has(key)) {
    // Return deep copy to prevent downstream mutations
    return JSON.parse(JSON.stringify(llmCache.get(key)));
  }
  return null;
}

function setInCache(key: string, value: any): void {
  // Enforce bounded FIFO cache limit
  if (llmCache.size >= MAX_CACHE_SIZE) {
    const firstKey = llmCache.keys().next().value;
    llmCache.delete(firstKey);
  }
  // Store deep copy to prevent downstream mutations
  llmCache.set(key, JSON.parse(JSON.stringify(value)));
}

/**
 * Generate offer with Perplexity AI
 */
export async function generateOffer(packageType: string, basePrice: number): Promise<any> {
  const cacheKey = `offer_${packageType}_${basePrice}`;
  const cached = getFromCache<any>(cacheKey);
  if (cached) {
    return cached;
  }

  const prompt = `Generate a sales offer for a ${packageType} website package.
Base price: ${basePrice}€

Return JSON with:
{
  "title": "compelling title",
  "description": "detailed description",
  "highlightFeatures": ["feature1", "feature2", "feature3"],
  "discountPercent": 40-80,
  "urgencyText": "limited time offer text"
}`;

  try {
    const response = await axios.post<PerplexityResponse>(
      PERPLEXITY_API_URL,
      {
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a sales copywriter. Return ONLY valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0]?.message.content;
    const result = JSON.parse(content || '{}');
    setInCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Perplexity API error:', error);
    throw new Error('Failed to generate offer');
  }
}

/**
 * Generate blog article with Perplexity AI
 */
export async function generateBlogArticle(topic: string): Promise<string> {
  const cacheKey = `article_${topic}`;
  const cached = getFromCache<string>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await axios.post<PerplexityResponse>(
      PERPLEXITY_API_URL,
      {
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'user',
            content: `Write a 500-word blog article about: ${topic}`
          }
        ],
        temperature: 0.8
      },
      {
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = response.data.choices[0]?.message.content || '';
    setInCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Perplexity API error:', error);
    throw new Error('Failed to generate article');
  }
}
