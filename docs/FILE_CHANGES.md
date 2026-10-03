# File changes

Exact source-file inventory for the redesign, compared with the local pre-edit snapshot. No Git repository was present. Generated `dist/`, dependency caches, editor files, and the temporary coordination board are not source deliverables.

**56 updated files, 49 new files, 2 old homepage files removed.** The homepage was relocated to `src/pages/Home/`. No dependency versions or lockfile contents changed.

## Updated files

```text
README.md
index.html
package.json
src/App.jsx
src/components/common/Footer.jsx
src/components/common/GameCard.jsx
src/components/common/GameLayout.jsx
src/components/common/Header.jsx
src/components/games/ArcheryGame/ArcheryGame.css
src/components/games/ArcheryGame/ArcheryGame.jsx
src/components/games/ArcheryGame/ArcheryGame.logic.js
src/components/games/BaghChalGame/BaghChalGame.css
src/components/games/BaghChalGame/BaghChalGame.jsx
src/components/games/BaghChalGame/BaghChalGame.logic.js
src/components/games/BrickBreaker/BrickBreaker.css
src/components/games/BrickBreaker/BrickBreaker.jsx
src/components/games/BrickBreaker/BrickBreaker.logic.js
src/components/games/DoodleJump/DoodleJump.css
src/components/games/DoodleJump/DoodleJump.jsx
src/components/games/DoodleJump/DoodleJump.logic.js
src/components/games/FlappyBird/FlappyBird.css
src/components/games/FlappyBird/FlappyBird.jsx
src/components/games/FlappyBird/FlappyBird.logic.js
src/components/games/FroggerGame/FroggerGame.css
src/components/games/FroggerGame/FroggerGame.jsx
src/components/games/FroggerGame/FroggerGame.logic.js
src/components/games/GoGame/GoGame.css
src/components/games/GoGame/GoGame.jsx
src/components/games/GoGame/GoGame.logic.js
src/components/games/Minesweeper/Minesweeper.css
src/components/games/Minesweeper/Minesweeper.jsx
src/components/games/Minesweeper/Minesweeper.logic.js
src/components/games/PacMan/PacMan.css
src/components/games/PacMan/PacMan.jsx
src/components/games/PacMan/PacMan.logic.js
src/components/games/PongGame/PongGame.css
src/components/games/PongGame/PongGame.jsx
src/components/games/PongGame/PongGame.logic.js
src/components/games/SnakeGame/SnakeGame.css
src/components/games/SnakeGame/SnakeGame.jsx
src/components/games/SnakeGame/SnakeGame.logic.js
src/components/games/SpaceInvaders/SpaceInvaders.css
src/components/games/SpaceInvaders/SpaceInvaders.jsx
src/components/games/SpaceInvaders/SpaceInvaders.logic.js
src/components/games/Tetris/Tetris.css
src/components/games/Tetris/Tetris.jsx
src/components/games/Tetris/Tetris.logic.js
src/components/games/TicTacToe/TicTacToe.css
src/components/games/TicTacToe/TicTacToe.jsx
src/components/games/TicTacToe/TicTacToe.logic.js
src/components/index.js
src/index.css
src/styles/globals.css
src/styles/themes.css
src/utils/helpers.js
tailwind.config.js
```

## New files

```text
docs/FILE_CHANGES.md
docs/PROJECT_STRUCTURE.md
docs/REVIEW_NOTES.md
public/favicon.svg
src/components/common/ErrorBoundary.jsx
src/components/common/AppearanceToggle.jsx
src/components/common/GameArtwork.jsx
src/components/games/ArcheryGame/ArcheryGame.hooks.js
src/components/games/ArcheryGame/ArcheryGame.render.js
src/components/games/BaghChalGame/BaghChalGame.hooks.js
src/components/games/BrickBreaker/BrickBreaker.hooks.js
src/components/games/BrickBreaker/BrickBreaker.render.js
src/components/games/DoodleJump/DoodleJump.hooks.js
src/components/games/DoodleJump/DoodleJump.render.js
src/components/games/FlappyBird/FlappyBird.hooks.js
src/components/games/FlappyBird/FlappyBird.render.js
src/components/games/FroggerGame/FroggerGame.hooks.js
src/components/games/FroggerGame/FroggerGame.render.js
src/components/games/GoGame/GoGame.hooks.js
src/components/games/Ludo/Ludo.css
src/components/games/Ludo/Ludo.hooks.js
src/components/games/Ludo/Ludo.jsx
src/components/games/Ludo/Ludo.logic.js
src/components/games/Minesweeper/Minesweeper.hooks.js
src/components/games/PacMan/PacMan.hooks.js
src/components/games/PacMan/PacMan.render.js
src/components/games/PongGame/PongGame.hooks.js
src/components/games/PongGame/PongGame.render.js
src/components/games/SnakeGame/SnakeGame.hooks.js
src/components/games/SpaceInvaders/SpaceInvaders.hooks.js
src/components/games/SpaceInvaders/SpaceInvaders.render.js
src/components/games/Tetris/Tetris.hooks.js
src/components/games/Tetris/Tetris.render.js
src/components/games/TicTacToe/TicTacToe.hooks.js
src/data/games.js
src/pages/Home/Home.css
src/pages/Home/Home.hooks.js
src/pages/Home/Home.jsx
src/pages/Home/Home.logic.js
src/utils/propTypes.js
tests/appearance.test.js
tests/arcade.test.js
tests/baghchal.test.js
tests/catalogue.test.js
tests/classics.test.js
tests/desktop-arcade.test.js
tests/go.test.js
tests/ludo.test.js
tests/render-smoke.test.js
```

## Removed old locations

```text
src/components/games/Home/Home.css
src/components/games/Home/Home.jsx
```

The replacement is the four-file `src/pages/Home/` page module, not a removed game.

## Preserved

All original game URLs, React/Vite dependencies, `package-lock.json`, Vite configuration, lint rules, Flappy Bird audio, CNAME and original image assets remain. `package.json` adds the test command and corrects the existing manual deployment lifecycle to build before publishing, but neither publishing nor Git commands were run. `dist/` was rebuilt locally for verification and is not included in the maintained-source file counts.
