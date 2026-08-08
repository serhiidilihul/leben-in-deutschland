# Leben in Deutschland — Prüfungssimulation

Static HTML/CSS/JavaScript project for GitHub Pages.

## Current task
Application shell and core UI/UX are implemented. The question bank is intentionally empty until the supplied PDF is converted into structured data.

## Planned tasks
1. Foundation + UI shell (current)
2. Extract and validate all 300 general + 10 Berlin questions from the supplied PDF
3. Complete test engine, timer, scoring and error review
4. Polish desktop/mobile UX, images and animations
5. Final QA and GitHub Pages deployment

## Run locally
Open `index.html` in a browser. For local development, a simple static server is preferable, e.g. VS Code Live Server or `python -m http.server`.

## Task 4
Polished responsive UI, answer cards, timer states, result dashboard, error modal, image-aware question rendering, and mobile-specific navigation styling.

## Viewport behavior
All primary screens are designed as fixed viewport screens without page scrolling. Question images are displayed with viewport-relative maximum heights, and long questions automatically enter compact layout levels. Only the error-review modal may scroll internally.
## Visual palette
The interface uses a teal/mint/navy palette sampled from the supplied SwipeMind reference images.
