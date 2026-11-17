# Preguntas frecuentes — visual and interaction validation

The FAQ section follows `Preguntas frecuentes.pdf`: a two-column introduction and five directly visible answers, with supplied blue icon badges and working contact/privacy links. The footer is preserved.

## Evidence and normalization

- Source visual truth: `/tmp/voom-faq-reference/reference.png`, normalized from the PDF's embedded 4320 × 3420 px image to 1440 × 1140 px.
- Implementation: `/tmp/voom-faq-qa/final-1440.png`, captured from the production build in Chromium at a 1440 × 1200 CSS px viewport, deviceScaleFactor 1. The section measures 1440 × 1140 CSS px; the element screenshot includes one extra edge pixel because its page position is fractional. Both images retain the same content scale.
- State: public initial landing, dark theme, fonts and all FAQ artwork loaded. All five answers are visible without interaction.
- Full-view comparison: `/tmp/voom-faq-qa/comparison-final.png`, with source and implementation together at the same scale.
- Focused comparison: `/tmp/voom-faq-qa/details-final.png`, with all five source questions/answers beside the rendered versions, including the legal email and privacy link.
- Responsive captures: `/tmp/voom-faq-qa/final-1024.png`, `final-800.png`, `final-390.png` and `final-320.png` in the same directory. The supplied reference is desktop-only; all captures use deviceScaleFactor 1.

## Findings and comparison history

- The initial comparison matched the content, column positions, question sizes and row spacing. A P3 divider-color difference was corrected to the reference's darker neutral treatment. Evidence: `comparison-first.png` and `details-first.png`, followed by the final comparisons above.
- The final comparison has no actionable P0/P1/P2 findings. Minor P3 browser text rasterization and fractional-pixel differences remain. These do not alter the desktop line breaks, content hierarchy or section proportions.

## Fidelity surfaces

- **Fonts and typography:** local Barlow Condensed 800 for the display heading, Jost for the eyebrow/questions/introduction, and Arial 17 px for answers. Weights, tracking, line heights, bold lead-ins and desktop line breaks were checked in the full and focused comparisons.
- **Spacing and layout:** 1280 px desktop content width, 480/732 px column proportions, a 68 px gap, 52 px icon badges and the reference's row rhythm. Tablet/mobile adapt to a stacked layout. Mobile answers span the available width for readability. No horizontal overflow at 1440, 1024, 800, 390 or 320 px.
- **Colors and tokens:** black canvas, existing magenta heading, pink eyebrow/links, muted answer copy and subtle neutral dividers. Existing global brand tokens are preserved.
- **Image quality:** all five icon badges come from the supplied artwork, extracted at three-times display resolution and served as local lossless WebP with reserved dimensions and lazy loading. No substitute illustrations are introduced.
- **Copy and content:** all five questions, answer text, bold lead-ins, introduction and links follow the PDF. The answers remain in the initial HTML and are directly readable without JavaScript.

## Footer preservation

- The footer renderer, page footer markup and social-profile source are unchanged.
- Runtime footer HTML is identical before/after at 1440, 1024, 800, 390 and 320 px.
- Visible footer dimensions and relative element positions match the baseline. Style comparison normalizes resolved automatic margins and ignores coordinates of hidden zero-size nodes; the authored footer CSS is unchanged.
- Visual evidence: `/tmp/voom-faq-qa/footer-comparison.png`, plus `footer-before-*` and `footer-final-*` captures in the same directory. The footer follows the updated section in normal page flow.

## Functional and accessibility checks

- Production build and all 30 existing browser checks pass, using in-memory test storage.
- All five public pages pass initial-HTML crawl checks. The four campaign pages expose all five FAQ answers without JavaScript.
- All 21 automated accessibility scans pass with zero reported violations.
- The legal email link has the correct mailto destination. Keyboard navigation reaches the privacy link, and activating it opens the policy page on all four campaign routes. No email is sent during verification.
- Questions use H3 headings under the section H2. Decorative icon images have empty alt text. Existing page H1s are preserved.
- No console errors or uncaught browser errors were observed in the focused checks.

## Implementation checklist

- [x] Match the PDF's copy, layout, typography, colors and icons.
- [x] Keep all five answers directly readable.
- [x] Verify responsive layout, keyboard links and policy navigation.
- [x] Verify footer markup, styling and visible layout remain unchanged.
- [x] Pass production build, browser, accessibility and crawl checks.

Temporary captures remain outside the repository. No credentials, personal signup records or private attachment identifiers are included here.

final result: passed
