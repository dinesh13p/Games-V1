# Project structure

Each of the fifteen games has its own folder. `Home` is now a page, not a game. The full maintained source tree and file roles follow below; dependency caches and generated output are excluded from the detailed listing.

## File roles

| Suffix | Responsibility |
| --- | --- |
| `.logic.js` | Pure mechanics, rules, AI and state transitions |
| `.hooks.js` | React lifecycle, timers, input and storage |
| `.jsx` | Game structure and controls |
| `.css` | Scoped visual design and responsive layout |
| `.render.js` | Canvas rendering for canvas-based games only |

## Tree

```text
Games-V1/
  index.html
  package.json
  package-lock.json
  vite.config.js
  .eslintrc.cjs
  postcss.config.js
  tailwind.config.js
  README.md
  docs/
    PROJECT_STRUCTURE.md
    FILE_CHANGES.md
    REVIEW_NOTES.md
  wrangler.jsonc                Cloudflare Pages output configuration
  public/
    favicon.svg
    vite.svg                       retained original unused asset
    FlappyBird/
      die.mp3
      hit.mp3
      point.mp3
      whoosh.mp3
  src/
    main.jsx
    App.jsx
    index.css
    assets/
      GamesV1.png                   retained original unused asset
    data/
      games.js
    styles/
      globals.css
      themes.css
    hooks/
      useGame.js                    retained existing utility
      useLocalStorage.js            retained existing utility
    utils/
      constants.js
      helpers.js
      propTypes.js
    pages/
      Home/
        Home.jsx
        Home.logic.js
        Home.hooks.js
        Home.css
    components/
      index.js
      common/
        Header.jsx
        AppearanceToggle.jsx
        Footer.jsx
        GameLayout.jsx
        GameCard.jsx
        GameArtwork.jsx
        ErrorBoundary.jsx
      games/
        ArcheryGame/
          ArcheryGame.jsx
          ArcheryGame.logic.js
          ArcheryGame.hooks.js
          ArcheryGame.render.js
          ArcheryGame.css
        BaghChalGame/
          BaghChalGame.jsx
          BaghChalGame.logic.js
          BaghChalGame.hooks.js
          BaghChalGame.css
        BrickBreaker/
          BrickBreaker.jsx
          BrickBreaker.logic.js
          BrickBreaker.hooks.js
          BrickBreaker.render.js
          BrickBreaker.css
        DoodleJump/
          DoodleJump.jsx
          DoodleJump.logic.js
          DoodleJump.hooks.js
          DoodleJump.render.js
          DoodleJump.css
        FlappyBird/
          FlappyBird.jsx
          FlappyBird.logic.js
          FlappyBird.hooks.js
          FlappyBird.render.js
          FlappyBird.css
        FroggerGame/
          FroggerGame.jsx
          FroggerGame.logic.js
          FroggerGame.hooks.js
          FroggerGame.render.js
          FroggerGame.css
        GoGame/
          GoGame.jsx
          GoGame.logic.js
          GoGame.hooks.js
          GoGame.css
        Minesweeper/
          Minesweeper.jsx
          Minesweeper.logic.js
          Minesweeper.hooks.js
          Minesweeper.css
        PacMan/
          PacMan.jsx
          PacMan.logic.js
          PacMan.hooks.js
          PacMan.render.js
          PacMan.css
        PongGame/
          PongGame.jsx
          PongGame.logic.js
          PongGame.hooks.js
          PongGame.render.js
          PongGame.css
        SnakeGame/
          SnakeGame.jsx
          SnakeGame.logic.js
          SnakeGame.hooks.js
          SnakeGame.css
        SpaceInvaders/
          SpaceInvaders.jsx
          SpaceInvaders.logic.js
          SpaceInvaders.hooks.js
          SpaceInvaders.render.js
          SpaceInvaders.css
        Tetris/
          Tetris.jsx
          Tetris.logic.js
          Tetris.hooks.js
          Tetris.render.js
          Tetris.css
        TicTacToe/
          TicTacToe.jsx
          TicTacToe.logic.js
          TicTacToe.hooks.js
          TicTacToe.css
        Ludo/
          Ludo.jsx
          Ludo.logic.js
          Ludo.hooks.js
          Ludo.css
  tests/
    arcade.test.js
    baghchal.test.js
    catalogue.test.js
    classics.test.js
    desktop-arcade.test.js
    go.test.js
    ludo.test.js
    appearance.test.js
    render-smoke.test.js
  dist/                            generated locally by npm run build
  node_modules/                    installed dependencies, unchanged
```

The existing `.gitignore`, `.vscode/` editor settings and system metadata remain untouched. The temporary `.omnirush/` coordination board is not application source or a deliverable.

## Navigation and imports

The existing fourteen public routes are unchanged and `/ludo` is added as route fifteen. `src/data/games.js` supplies their metadata; `src/App.jsx` maps them to views inside the shared `GameLayout`. Every game is loaded on demand except Tic-Tac-Toe, which also provides the playable homepage demo. Shared styles are imported once via `src/index.css`. Each game imports only its own stylesheet, state hook and relevant constants. `AppearanceToggle.jsx` owns local preference persistence and applies `data-appearance` to the document root.

## Adding or changing a game

Keep rule changes in the game's `.logic.js` and add regression tests under `tests/`. Put input and timer handling in its `.hooks.js`, canvas drawing in `.render.js` when needed, and view markup in `.jsx`. For a new game, add a catalogue entry in `src/data/games.js`, its import in `src/App.jsx` and a small diagram in `GameArtwork.jsx`. Run the three checks from README before evaluation.
