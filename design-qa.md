# Cómo funciona VEN — visual and interaction validation

The section follows the supplied `Cómo funciona VEN.pdf`: a magenta-and-white heading, three numbered cards, the optional third step, and a signup call to action.

## Evidence and normalization

- Source visual truth: `/tmp/voom-how-reference/reference.png`, normalized from the PDF's embedded 4320 × 2940 px image to 1440 × 980 px.
- Implementation: `/tmp/voom-how-qa/final-1440.png`, captured in Chromium from the production build at a 1440 × 1100 CSS px viewport, deviceScaleFactor 1. Only the section is cropped. It measures 1440 × 980.39 CSS px; its capture is 1440 × 982 px because the page position and crop bounds are fractional. The two images retain the same content scale.
- State: initial public landing, dark theme, local fonts and supplied icon artwork fully loaded.
- Full-view evidence: `/tmp/voom-how-qa/comparison-final.png` places source and implementation together at the same scale.
- Focused evidence: `/tmp/voom-how-qa/cards-final.png` compares the three source cards with the rendered cards, including text, numbers, icon badges and dividers.
- Responsive captures: `/tmp/voom-how-qa/final-1024.png`, `final-800.png`, `final-390.png` and `final-320.png` in the same directory, all at deviceScaleFactor 1. The supplied reference is desktop-only.

## Findings and comparison history

1. **P2, resolved — display weight and optical alignment.** The first implementation used weight 800 for the step numbers, which made them heavier than the reference. The final implementation uses locally hosted Barlow Condensed 600 for the numbers. Heading, number and card-title alignment were corrected without changing the card grid. Evidence: `comparison-first.png` and `cards-first.png`, followed by the final comparisons above.
2. **Resolved — call-to-action dimensions.** The first button's label was oversized, making the button wider than the source. Jost 18 px/600 restores the reference proportions. The eyebrow/headline and card-grid spacing were also adjusted against the source.
3. **Final comparison: no actionable P0/P1/P2 findings.** Minor P3 font rasterization, icon-stroke and fractional-crop differences remain. They do not change the copy, desktop wrapping, card proportions or layout hierarchy.

## Fidelity surfaces

- **Fonts and typography:** Barlow Condensed 800 for the display heading, 600 for the step numbers, Jost 600 for card headings/button, and Arial for card descriptions/notes. Sizes, weights, tracking, line heights and desktop line breaks were checked in the full and focused comparisons.
- **Spacing and layout:** 1280 px desktop content width, three 384 px cards, 24 px grid gaps and 32 px card padding. The title block, dividers and button follow the reference positions. Mobile uses a single column with natural text wrapping. No horizontal overflow at 1440, 1024, 800, 390 or 320 px.
- **Colors and tokens:** existing black canvas, dark panels and borders, magenta heading/button, pink eyebrow/privacy link and blue icon accents. Existing brand tokens are preserved.
- **Image quality and assets:** the three supplied icon badges are extracted at three-times display resolution and served locally as lossless WebP. Dimensions and aspect ratios are reserved. Check circles and the link arrow use standard Lucide icons.
- **Copy and content:** the heading, subtitle, all three steps, optional badge, reassurance notes and button copy follow the PDF. The policy and signup links are functional.

## Functional and accessibility checks

- Production build passes.
- All 30 existing browser checks pass, including signup validation, duplicate handling, plan selection and confirmation, using in-memory test storage.
- All five public pages pass initial-HTML crawl checks. All 21 automated accessibility scans pass with zero reported violations.
- The new CTA supports keyboard focus/activation on all four campaign pages, focuses the celebrity field, and preserves a name already entered.
- For an existing signup, the CTA returns focus to the current offer rather than resetting the signup flow.
- The new privacy link opens the policy page. Decorative artwork has empty alt text, decorative SVGs are hidden from assistive technology, and the ordered list has explicit list semantics.
- No console errors or uncaught browser errors were observed in the focused interaction checks.

## Implementation checklist

- [x] Match the supplied section's copy, layout, typography, colors and icons.
- [x] Compare the final desktop section and focused card regions against the PDF.
- [x] Verify mobile and tablet wrapping without overflow.
- [x] Verify CTA focus, privacy navigation and the existing signup flow.
- [x] Preserve prerendered content and pass accessibility/crawl checks.

Temporary captures remain outside the repository. No credentials, personal signup records or private attachment identifiers are included here.

final result: passed
