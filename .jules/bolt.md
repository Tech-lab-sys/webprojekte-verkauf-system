## 2025-07-05 - LLM API Caching Pattern
**Learning:** External LLM API calls (like Perplexity) in this architecture create significant bottlenecks. Direct string caching of raw responses is required over parsed object caching to avoid redundant deep copy overheads and performance issues on cache hits.
**Action:** Always implement bounded Map-based caching with explicit `undefined` checks for keys during eviction to prevent memory leaks and type errors in strict mode when making LLM API calls.
