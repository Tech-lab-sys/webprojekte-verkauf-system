1. **Implement bounded caching for LLM API calls**
   - Create a `BoundedCache` class in `server/_core/perplexity.ts` with a maximum size limit to prevent memory leaks.
   - Implement `get` and `set` methods that use `JSON.parse(JSON.stringify())` to return and store deep copies, preventing downstream mutations.
   - Instantiate caches for `generateOffer` and `generateBlogArticle`.
   - Wrap the API calls in `generateOffer` and `generateBlogArticle` with cache checks and stores.
2. **Document learning in `.jules/bolt.md`**
   - Add a journal entry noting the importance of bounded caching for external LLM APIs to prevent performance bottlenecks from duplicate synchronous requests, as outlined in the memory.
3. **Verify and Pre-commit**
   - Run linter (`pnpm lint`) and tests (`pnpm test` or `pnpm test:ui` if applicable) to ensure nothing is broken.
   - Ensure pre commit steps are completed to make sure proper testing, verifications, reviews and reflections are done.
4. **Submit PR**
   - Create a PR with the title "⚡ Bolt: Add bounded caching for Perplexity LLM API requests".
   - Include description sections: 💡 What, 🎯 Why, 📊 Impact, and 🔬 Measurement.
