# 14. Information Design Principles

## 1. Purpose
This document establishes the universal rules for transforming raw analytical data into a premium, cohesive editorial reading experience. It governs how information hierarchy, interpretation depth, narrative responsibility, and ViewModel boundaries must operate across all Ahaitsme premium relationship reports.

## 2. Scope
This SSOT applies to the entire presentation and data-contract layer for all premium reports, including Romantic, Friend, Coworker, and Family. It does not govern raw Saju/Astrology computation rules or pure CSS visual tokens.

## 3. Relationship to existing SSOT documents
*   Must be read alongside `05_NARRATIVE_STYLE_BIBLE.md` (which governs tone and language).
*   Operates independently of `15_Visual_Storytelling_System.md` (which governs exact UI styling).
*   Precedes `16_Premium_Interaction_Language.md` (which governs micro-interactions and animations).

## 4. Core Information Design philosophy
A premium report should feel *read, not operated*. Data availability is not equivalent to user understanding. The interface must quietly disappear, allowing the narrative, spacing, and editorial pacing to deliver the insights. Clarity always beats animation, and elegance is derived from restraint.

## 5. Information hierarchy model
Information must be progressively revealed through natural reading order (scrolling), not hidden behind interactive controls (e.g., accordions or toggle buttons). If a piece of insight is critical, it must be visible by default.

## 6. Section responsibility model
Every section must answer a distinct, single user question.
*   **Hero**: What is the definitive shape of our relationship? (Macroscopic overview).
*   **Body (e.g., Radar, Difference Map)**: Where do we align, and where do we clash? (Analytical breakdown).
*   **Climax (Hidden Heart)**: What is the deep, unspoken emotional truth? (Vulnerability).
*   **Ending (Save/Share)**: What is my final, lasting takeaway? (Memorable closure).

## 7. Evidence → Interpretation → Narrative → ViewModel → UI pipeline
Analytical interpretation must be produced upstream by the Saju/LLM engine, not invented by the UI components.
1.  **Evidence**: Saju indicators or traits.
2.  **Interpretation**: LLM determining impact.
3.  **Narrative**: LLM generating finalized strings.
4.  **ViewModel**: Structurally passing the narrative strings (and semantic IDs).
5.  **UI**: Purely presenting the strings visually.

## 8. Comparison and difference design
Comparison must include *meaning* and *relationship impact*, not merely two opposing traits (e.g., Me vs. Partner). Presenting raw contrast without interpretation forces the user to deduce the meaning themselves, which violates the premium promise.

## 9. Narrative ownership and localization
UI components must not assemble LLM prose using hardcoded connectors (e.g., `["우선, ", "그리고 "]`). Grammar, tone, and transitional connectors must be generated natively by the LLM as a cohesive paragraph within the ViewModel to ensure flawless localization between Korean and English.

## 10. Editorial pacing
Premium experience comes from interpretation clarity and editorial pacing (achieved through spacing, typography, and section-to-section flow), not interaction volume. Visual noise (like explicit chapter numbering or heavy decorative badges) should be stripped if it does not aid comprehension.

## 11. Hero and ending separation
The Hero, body, climax, and ending must have different editorial functions. Crucially, the ending must create a distinct, memorable closing insight rather than simply repeating the Hero text. The signature must leave a lasting emotional resonance.

## 12. ViewModel contract principles
ViewModels must provide presentation-ready meaning without containing visual styling decisions (e.g., no CSS classes or structural slicing directives). Narrative fields must remain grounded in identifiable evidence (e.g., `sourceKeys`), and fixtures must never conceal missing production fields by faking data.

## 13. Fixture and production parity rules
Dev fixtures must perfectly map to the exact capabilities of the production projector. If a projector hardcodes a field to `null` (e.g., `meant: null`), the fixture must reflect that limitation so the UI does not build features around non-existent data.

## 14. Cross-product application
These principles are universal. While the Romantic report may use a "Hidden Heart" climax and a Coworker report may use a "Professional Synergy" climax, both must obey the rule of static revelation, distinct editorial functions, and upstream interpretation.

## 15. Anti-patterns
*   **Interactive Hiding**: Hiding core data behind "Translate" buttons or "Show More" accordions.
*   **Skeuomorphism for Decoration**: Adding heavy drop-shadows or math icons (`+`, `=`) that decorate data rather than explain it.
*   **Blind Array Slicing**: Grouping UI items based on their array index (`slice(0,2)`) instead of their semantic ID.
*   **UI String Assembly**: Using React to concatenate sentences together.
*   **Fake Distances**: Drawing literal quantitative graphs when the engine only provides qualitative strings.

## 16. Implementation checklist
*   [ ] Does the ViewModel provide meaning, or just raw evidence?
*   [ ] Is the UI grouping by semantic ID?
*   [ ] Are all interactive hiders removed?
*   [ ] Are the LLM connectors natively generated?
*   [ ] Does the final signature differ from the Hero?

## 17. Acceptance criteria
A section passes Information Design validation only if a user can answer its core question within 3-5 seconds of scrolling into view, without clicking anything, and without needing external context.
