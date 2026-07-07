## 2026-07-07 - Avoiding Global Formatting Noise
**Learning:** Running `pnpm format` formatted the entire repository including `tsconfig.json`, which caused unnecessary noisy diffs and violated explicit constraints.
**Action:** In the future, I will avoid running global formatting tools on repositories with poor baseline formatting unless strictly necessary, and instead format only the specifically modified files.
