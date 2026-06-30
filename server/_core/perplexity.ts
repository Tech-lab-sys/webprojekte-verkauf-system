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

// Bounded FIFO cache to prevent memory leaks while caching expensive LLM API calls
const MAX_CACHE_SIZE = 100;
const offerCache = new Map<string, any>();

/**
 * Generate offer with Perplexity AI
 * Performance optimization: Implemented bounded caching to avoid duplicate expensive API calls.
 */
export async function generateOffer(packageType: string, basePrice: number): Promise<any> {
  const cacheKey = `${packageType}-${basePrice}`;
  if (offerCache.has(cacheKey)) {
    // Return a deep copy to prevent downstream mutations
    return JSON.parse(JSON.stringify(offerCache.get(cacheKey)));
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

    // Manage cache size (FIFO)
    if (offerCache.size >= MAX_CACHE_SIZE) {
      const firstKey = offerCache.keys().next().value;
      offerCache.delete(firstKey);
    }

    offerCache.set(cacheKey, parsedContent);
    // Return a deep copy to prevent downstream mutations
    return JSON.parse(JSON.stringify(parsedContent));
  } catch (error) {
    console.error('Perplexity API error:', error);
    throw new Error('Failed to generate offer');
  }
}

/**
 * Generate blog article with Perplexity AI
 */
export async function generateBlogArticle(topic: string): Promise<string> {
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

    return response.data.choices[0]?.message.content || '';
  } catch (error) {
    console.error('Perplexity API error:', error);
    throw new Error('Failed to generate article');
  }
}
