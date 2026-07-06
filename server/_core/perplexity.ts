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

/**
 * Generate offer with Perplexity AI
 */
// Bounded cache to avoid memory leaks while caching LLM responses
const CACHE_LIMIT = 100;
const llmCache = new Map<string, string>();

function setCache(key: string, value: string) {
  if (llmCache.size >= CACHE_LIMIT) {
    // Evict oldest (FIFO)
    const oldestKey = llmCache.keys().next().value;
    if (oldestKey !== undefined) {
      llmCache.delete(oldestKey);
    }
  }
  llmCache.set(key, value);
}

export async function generateOffer(packageType: string, basePrice: number): Promise<any> {
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

  // Cache key based on input parameters
  const cacheKey = `offer:${packageType}:${basePrice}`;
  const cachedResponse = llmCache.get(cacheKey);
  if (cachedResponse) {
    try {
      // ⚡ Bolt: Using cache to avoid expensive/slow duplicate Perplexity API calls
      return JSON.parse(cachedResponse);
    } catch (e) {
      // Invalid JSON in cache somehow, fall through to fetch
    }
  }

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
    if (content) {
      // Validate JSON before caching
      JSON.parse(content);
      setCache(cacheKey, content);
      return JSON.parse(content);
    }
    return {};
  } catch (error) {
    console.error('Perplexity API error:', error);
    throw new Error('Failed to generate offer');
  }
}

/**
 * Generate blog article with Perplexity AI
 */
export async function generateBlogArticle(topic: string): Promise<string> {
  const cacheKey = `blog:${topic}`;
  const cachedResponse = llmCache.get(cacheKey);
  if (cachedResponse) {
    // ⚡ Bolt: Using cache to avoid expensive/slow duplicate Perplexity API calls
    return cachedResponse;
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

    const content = response.data.choices[0]?.message.content || '';
    if (content) {
      setCache(cacheKey, content);
    }
    return content;
  } catch (error) {
    console.error('Perplexity API error:', error);
    throw new Error('Failed to generate article');
  }
}
