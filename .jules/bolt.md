## 2024-07-01 - Bounded Caching for External LLM APIs
**Learning:** External LLM API calls (like Perplexity) can become severe performance bottlenecks and cause memory leaks if not properly cached, especially with synchronous requests.
**Action:** Always implement a `BoundedCache` (using Map with FIFO size limits) and return deep copies (`JSON.parse(JSON.stringify())`) to prevent downstream mutations when dealing with external LLM APIs.
