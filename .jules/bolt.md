## 2024-06-23 - Bounded Caching for External LLM APIs
**Learning:** Making duplicate synchronous requests to external LLM APIs (like Perplexity) causes significant performance bottlenecks and risks memory leaks if not handled properly.
**Action:** Always wrap external LLM API calls with a bounded cache (like a Map with a maximum FIFO size limit) to prevent duplicates while avoiding memory bloat over time.
