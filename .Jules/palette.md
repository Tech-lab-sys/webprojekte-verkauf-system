## 2025-05-18 - Restoring Native Form Submission for Custom UI

**Learning:** When using custom styled interactive components like divs and individual buttons for data collection (e.g., a "Website-Typ" selector and "Nische" input), users lose native browser behaviors like Enter-key submission and semantic screen-reader context. The lack of standard HTML5 elements means the browser doesn't know these elements are related to a final "Submit" action.
**Action:** Always wrap logical data input clusters in a `<form>` tag and use `type="submit"` on the primary action button to restore Enter-key submission. Group custom selector buttons within a `<fieldset>` using `<legend>` to restore semantic meaning, and use `aria-pressed` to indicate selection state to screen readers.
