## 2025-02-12 - External LLM API Caching
**Learning:** External LLM APIs like Perplexity create significant performance bottlenecks and memory leaks from duplicate synchronous requests. Caching responses reduces latency but mutable cache objects can cause downstream bugs.
**Action:** Implemented a bounded FIFO cache (using Map) limiting to 100 items for Perplexity API calls in `server/_core/perplexity.ts`. Used JSON.parse/JSON.stringify for deep copying to prevent downstream mutations of cached objects.
