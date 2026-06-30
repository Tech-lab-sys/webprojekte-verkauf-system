## 2025-01-28 - Custom Form Control Accessibility
**Learning:** When using custom components (like buttons styled as cards or toggles) instead of native radio inputs, adding `role="group"`, an associated `aria-labelledby`, and explicitly managing `aria-pressed` for selection state is essential to ensure screen readers correctly interpret the component group and current selection.
**Action:** Always implement explicit accessibility roles and states (`role="group"`, `aria-labelledby`, `aria-pressed`) when converting native input patterns into custom toggle-style UI components.
