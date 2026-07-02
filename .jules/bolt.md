## 2024-07-02 - Bounded LLM API Caching
**Learning:** External LLM API calls like Perplexity can cause performance bottlenecks and consume unnecessary resources for duplicate requests. Caching is crucial.
**Action:** Always implement a bounded in-memory cache (like Map with MAX_CACHE_SIZE) for synchronous LLM API generation functions. Ensure deep copy using JSON parse/stringify when retrieving from cache to prevent mutations.
