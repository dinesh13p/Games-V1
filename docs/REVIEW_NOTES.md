# Redesign review notes

## Scope delivered

- A paper-and-ink game catalogue replaces the original purple gradient/card interface.
- Fifteen real games, consistent page navigation, descriptive controls and a live homepage demo.
- Dark is now the default appearance. The header has a persistent, keyboard-accessible Appearance control; light preserves the previous paper-and-ink variables.
- Ludo adds a two/four-player lobby, opposing pair selection, clockwise pass-and-play, linear token rules and responsive board UI.
- Search/category/touch-only filters, honest desktop-only labels and local last-opened history.
- Each game has separate rules, lifecycle/input, structural view and scoped styles. Canvas rendering is also separated.
- Go/Gomoku and Bagh Chal are complete rather than empty views; Snake and Tic-Tac-Toe are restored.
- Bagh Chal adjacency, capture geometry, phase transitions, terminal state handling and AI perspective are corrected.
- Gomoku draw handling, legal moves, immediate tactics, bounded lookahead, clone-safe state and undo are covered by tests.
- Pac-Man and Space Invaders receive animated projected 3D relief without a new game framework or changed input platform.
- Existing mobile games have touch controls and responsive playfields. Compact 9 × 9 boards fit narrow screens; larger boards scroll within their frame.
- Reduced-motion handling, visible focus, board keyboard navigation, pause/reset controls, and mobile flagging are included.

## Verification

Original baseline: build passed, ESLint reported 131 errors and 13 warnings. Go and Snake returned no view; Bagh Chal rendered an empty container.

After integration:

- `npm test`: 97 tests passed, including appearance, Ludo, game-rule regressions and render-only integration.
- `npm run lint`: passes with zero errors or warnings.
- `npm run build`: passes; game-specific chunks are generated in local `dist/`.
- Local Vite server returned HTTP 200 at `http://localhost:5173`.
- Render-only checks instantiate all fifteen game views at simulated widths 320, 390 and 1280, verify desktop gates, board cell counts, game-page framing, homepage demo, filtering and empty results.
- One local timing sample: hard Gomoku opening after a centre move took 19ms on 9 × 9 and 31ms on 13 × 13; hard Bagh Chal opening took 25ms. These are development-machine samples, not mobile performance guarantees.

The installed Browserslist database produces an age warning during compilation. It is not a build failure; dependencies and the lockfile were intentionally not upgraded in this redesign.

## Important verification gap

The built-in browser timed out on two attempts to open the local preview, with no tab created. No visual screenshots, real-pointer/touch interaction checks, real-device layout assertions or complete end-to-end matches are claimed. Server rendering cannot prove CSS layout, canvas appearance, sound playback or browser input behaviour.

## Evaluate before publishing

1. Open the local preview on desktop and a phone-sized browser. Check 320, 390, 768 and 1280px widths, portrait/landscape and zoom.
2. Play the homepage Tic-Tac-Toe demo, reset it during a computer turn, and test search, category filters, touch-only filter and an empty search.
3. Play Ludo with 2 players in both opposing-pair configurations, then with 4 players. Check inactive bases, six-to-exit, exact home entry, triple-six skip, captures, own stacks, bonus turns and clockwise rotation.
4. Play Go/Gomoku as black and white, then in local mode. Test undo during thinking, board-size changes, a five-stone win and restart.
5. Play Bagh Chal as both sides. Check the twentieth placement, captures, selected-piece indicators, trapping, AI response, undo and restart.
6. Check every canvas game's start, pause/resume, restart and terminal screen. Change tabs while moving to confirm automatic pause and released input.
7. Use Minesweeper's flag button on touch, keyboard F and right-click on desktop. Check first-click safety and scrolling on larger fields.
8. Open Pac-Man and Space Invaders at desktop size, test keyboard controls and 3D/flat toggle, then confirm the desktop-required message on touch devices.
9. Toggle Appearance from the header, reload in both modes, and test with storage unavailable.
10. Turn on reduced motion. Review score persistence after reload.
11. Test Flappy Bird sound with the mute control and the browser's autoplay policy.
12. Test deep-link loading on the intended static host configuration before publishing.

## Boundaries retained

- This remains a client-side React 18 + Vite project, with no new dependencies, backend or accounts.
- “Go” remains the project's Gomoku rules, not territory Go.
- 3D is projected relief geometry over the original 2D collision planes, not a WebGL rewrite.
- Pac-Man and Space Invaders have no added mobile gameplay.
- Bounded AI is intentionally imperfect; no claim of expert-level play is made.
- Scores may be local or session-only. Matches do not resume across navigation or devices.
- Nothing was pushed to GitHub or deployed. Generated `dist/` is local build output only.
