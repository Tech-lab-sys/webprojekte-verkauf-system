## 2024-07-06 - Bounded Caching for External LLM APIs
**Learning:** External LLM APIs like Perplexity create severe performance bottlenecks and cost overhead when duplicate requests are made. Storing parsed JSON in caches can cause deep copy overhead, and unbounded caches lead to memory leaks.
**Action:** Implemented a bounded Map cache (FIFO, max 100 entries) storing raw strings to avoid deep copy overhead. Eviction logic explicitly checks for undefined keys to satisfy TypeScript strict mode.
