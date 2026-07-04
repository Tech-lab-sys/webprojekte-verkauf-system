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

const CACHE_SIZE_LIMIT = 100;
const offerCache = new Map<string, string>();
const articleCache = new Map<string, string>();

function setWithLimit(cache: Map<string, string>, key: string, value: string) {
  if (cache.size >= CACHE_SIZE_LIMIT) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) {
      cache.delete(firstKey);
    }
  }
  cache.set(key, value);
}

/**
 * Generate offer with Perplexity AI
 */
export async function generateOffer(packageType: string, basePrice: number): Promise<any> {
  const cacheKey = `${packageType}:${basePrice}`;
  const cached = offerCache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
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

    const content = response.data.choices[0]?.message.content || '{}';
    setWithLimit(offerCache, cacheKey, content);
    return JSON.parse(content);
  } catch (error) {
    console.error('Perplexity API error:', error);
    throw new Error('Failed to generate offer');
  }
}

/**
 * Generate blog article with Perplexity AI
 */
export async function generateBlogArticle(topic: string): Promise<string> {
  const cached = articleCache.get(topic);
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

    const content = response.data.choices[0]?.message.content || '';
    setWithLimit(articleCache, topic, content);
    return content;
  } catch (error) {
    console.error('Perplexity API error:', error);
    throw new Error('Failed to generate article');
  }
}
