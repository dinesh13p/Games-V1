# Games / V1

A collection of fifteen browser games by Dinesh Poudel, built with React 18 and Vite. The platform opens in a deep green-charcoal dark appearance, with a top-right Appearance control for switching to the original warm paper light appearance. Both themes use rust and olive accents, square controls, editorial typography and original game diagrams.

## Run locally

Use Node.js 20.19+ or a current LTS release. Install the existing lockfile dependencies if needed:

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

Open the local URL Vite prints, normally `http://localhost:5173`. No account or API credentials are needed. The app uses locally available Georgia, Arial and Courier fonts, without remote font requests.

## Checks

```sh
npm test
npm run lint
npm run build
```

`npm test` covers rules, AI tactics, terminal states, lifecycle transitions, catalogue filtering and render-only integration. Render checks are not real-browser interaction or viewport-layout tests. `npm run build` writes local output to `dist/`; it does not publish anything.

## The collection

| Game | Route | Input |
| --- | --- | --- |
| Bagh Chal | `/baghchal` | Touch, keyboard; computer or local two-player |
| Snake | `/snake` | Swipe, direction buttons, keyboard |
| Tetris | `/tetris` | Touch gestures/buttons, keyboard |
| Go / Gomoku | `/go` | Touch, keyboard; computer or local two-player |
| Pac-Man | `/pacman` | Desktop keyboard only |
| Space Invaders | `/spaceinvaders` | Desktop keyboard only |
| Tic-Tac-Toe | `/tictactoe` | Touch, keyboard; computer or local two-player |
| Minesweeper | `/minesweeper` | Touch flag mode, pointer, keyboard |
| Ping-Pong | `/pong` | Touch, pointer, keyboard |
| Brick Breaker | `/brickbreaker` | Touch, pointer, keyboard |
| Flappy Bird | `/flappybird` | Tap, keyboard |
| Frogger | `/frogger` | Swipe, direction buttons, keyboard |
| Doodle Jump | `/doodlejump` | Touch controls, keyboard |
| Archery | `/archery` | Touch, pointer, keyboard power controls |
| Ludo | `/ludo` | Touch, keyboard; 2 or 4 local players |

The homepage contains a real, playable Tic-Tac-Toe board. Search, category and touch-only filters are reflected in the URL. “Last opened” is local browser history, not a saved match. Appearance preference is stored locally under `gamesv1-appearance`, defaulting to dark when absent or invalid.

## Game architecture

Each game owns a folder under `src/components/games/`:

- `Name.logic.js`: rules, state transitions, collisions, scoring and AI.
- `Name.hooks.js`: React state, input listeners, animation/timer lifecycle and local storage.
- `Name.jsx`: accessible controls and game structure.
- `Name.css`: scoped presentation and responsive layouts.
- `Name.render.js`: canvas drawing, present only for the nine canvas-based games.

The original React, canvas and board-engine approach is retained. There is no replacement game framework, WebGL dependency or backend. `src/data/games.js` is the central catalogue. `src/App.jsx` preserves existing URLs and loads games on demand; Tic-Tac-Toe is also included with the homepage demo.

For the full tree and exact changed-file inventory, see [Project structure](docs/PROJECT_STRUCTURE.md) and [File changes](docs/FILE_CHANGES.md).

## Strategy rules

### Go / Gomoku

The original project calls this game Go, but its engine implements Gomoku. That distinction is now explicit: five or more consecutive stones win, black starts, and there are no captures, ko, territory counting or komi. Boards are 9 × 9 or 13 × 13. Full boards without a line draw. Computer play supports both colours and three bounded search levels.

### Bagh Chal

Four tigers start in the corners. Goats place twenty pieces before moving. Both sides follow the board's orthogonal and alternating-node diagonal connections. Tigers capture by jumping one goat to an empty point on the same straight line. Five captures win for tigers; trapping all tigers wins for goats, including during placement. This implementation declares three repeated positions a draw. A goat side with no legal move loses. These end conditions are explained in the game notes.

AI searches use a consistent evaluation perspective, real placement-to-movement transitions, legal moves and a fixed search budget. The computer is a lightweight opponent, not an unbeatable solver. Undo restores a full human turn in computer mode and one move in local mode.

### Ludo

Ludo is local pass-and-play for two or four players. Two-player games use either Red versus Yellow or Blue versus Green; the other bases remain visibly inactive. Four-player games activate Red, Green, Yellow and Blue, and turns rotate clockwise among active colors.

The rules use one 52-index main track, four five-index home straights and token `stepCounter` values from base 0 through goal 57. A six exits base and grants another roll. Three consecutive sixes skip the turn. A direct opponent landing resets that token to base and grants a bonus roll; own-color stacks are safe. Reaching goal requires an exact roll, and all four tokens must reach step 57 to win.

## Dimensional rendering

Pac-Man and Space Invaders use animated, shallow orthographic 3D extrusion drawn on their existing 2D canvases. Side faces and height are calculated geometry, not CSS shadows. Their collision plane and camera remain fixed. This is 3D relief presentation, not a free-camera WebGL remake.

Both remain desktop-only. The UI provides a flat-view toggle and automatically uses flat rendering for reduced-motion preferences. Gameplay motion itself remains necessary to play.

## Local data and publishing

Existing score keys are retained where applicable. Some games keep best scores only for the current session; there is no cloud leaderboard or cross-device match storage. Clearing browser storage clears stored scores and the last-opened game.

Nothing has been pushed or deployed as part of this redesign. The existing manual `deploy` script remains available for the owner only. Its `predeploy` step builds first, and Vite copies `public/CNAME` into `dist/`. Before publishing, configure the static host to return `index.html` for deep routes because the app uses BrowserRouter.

See [Review notes](docs/REVIEW_NOTES.md) for completed checks and the outstanding real-device review checklist.
