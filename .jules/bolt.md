## 2025-02-18 - Avoid Redundant External LLM Generation
**Learning:** External LLM calls for generating website offers are a major bottleneck causing high latency and unnecessary API costs for identical queries (type + niche).
**Action:** Implemented a simple bounded in-memory cache to skip redundant generation for previously requested `type` + `niche` combinations. Before making any external generative API calls, always verify if caching identical parameters is applicable.
