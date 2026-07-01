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

class BoundedCache<T> {
  private cache = new Map<string, T>();
  constructor(private maxSize: number = 50) {}

  get(key: string): T | undefined {
    const val = this.cache.get(key);
    if (val !== undefined) {
      if (typeof val === 'string') {
        return val; // No need to deep copy primitive strings
      }
      return JSON.parse(JSON.stringify(val));
    }
    return undefined;
  }

  set(key: string, value: T): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    let valToStore = value;
    if (typeof value !== 'string') {
      valToStore = JSON.parse(JSON.stringify(value));
    }
    this.cache.set(key, valToStore);
  }
}

const offerCache = new BoundedCache<any>(50);
const articleCache = new BoundedCache<string>(50);

/**
 * Generate offer with Perplexity AI
 */
export async function generateOffer(packageType: string, basePrice: number): Promise<any> {
  const cacheKey = `${packageType}-${basePrice}`;
  const cachedOffer = offerCache.get(cacheKey);
  if (cachedOffer !== undefined) {
    return cachedOffer;
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
    const parsedContent = JSON.parse(content || '{}');
    offerCache.set(cacheKey, parsedContent);
    return parsedContent;
  } catch (error) {
    console.error('Perplexity API error:', error);
    throw new Error('Failed to generate offer');
  }
}

/**
 * Generate blog article with Perplexity AI
 */
export async function generateBlogArticle(topic: string): Promise<string> {
  const cachedArticle = articleCache.get(topic);
  if (cachedArticle !== undefined) {
    return cachedArticle;
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
    articleCache.set(topic, content);
    return content;
  } catch (error) {
    console.error('Perplexity API error:', error);
    throw new Error('Failed to generate article');
  }
}
