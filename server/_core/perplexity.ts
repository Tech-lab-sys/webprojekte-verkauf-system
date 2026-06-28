import axios from "axios";

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

class BoundedCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number = 50) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    return this.cache.get(key);
  }

  set(key: K, value: V): void {
    if (!this.cache.has(key) && this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }
}

const offerCache = new BoundedCache<string, any>(50);
const articleCache = new BoundedCache<string, string>(50);

export interface PerplexityMessage {
  role: "system" | "user" | "assistant";
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
export async function generateOffer(
  packageType: string,
  basePrice: number,
): Promise<any> {
  const cacheKey = `${packageType}:${basePrice}`;
  const cached = offerCache.get(cacheKey);
  if (cached) {
    return JSON.parse(JSON.stringify(cached));
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
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "system",
            content: "You are a sales copywriter. Return ONLY valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const content = response.data.choices[0]?.message.content;
    const result = JSON.parse(content || "{}");
    offerCache.set(cacheKey, result);
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    console.error("Perplexity API error:", error);
    throw new Error("Failed to generate offer");
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
        model: "llama-3.1-sonar-large-128k-online",
        messages: [
          {
            role: "user",
            content: `Write a 500-word blog article about: ${topic}`,
          },
        ],
        temperature: 0.8,
      },
      {
        headers: {
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const result = response.data.choices[0]?.message.content || "";
    articleCache.set(topic, result);
    return result;
  } catch (error) {
    console.error("Perplexity API error:", error);
    throw new Error("Failed to generate article");
  }
}
