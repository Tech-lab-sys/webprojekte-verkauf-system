## 2025-07-03 - Button Group Accessibility Pattern
**Learning:** For custom toggle button groups (like the Website-Typ selector), adding `role="group"` and `aria-labelledby` to the container, along with `aria-pressed` on the individual buttons, provides correct semantic meaning for screen readers. Using `htmlFor` and `id` properly associates labels with inputs.
**Action:** Always apply these ARIA attributes and native HTML label associations when creating custom form controls or toggle groups in this app's components to ensure proper keyboard and screen reader accessibility.
