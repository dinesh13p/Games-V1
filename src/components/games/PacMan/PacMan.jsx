import { DIFFICULTIES } from './PacMan.logic'
import { usePacman } from './PacMan.hooks'
import './PacMan.css'

export default function PacMan() {
    const game = usePacman()
    const { state, canvasRef, isMobile, flat, reducedMotion, highScore, remaining, paused } = game

    if (isMobile) return (
        <section className="game-panel pacman-desktop-message">
            <p className="pacman-eyebrow">Keyboard arcade / 01</p>
            <h2>Desktop required</h2>
            <p>Pac-Man uses Arrow keys or WASD. Open this game on a desktop or laptop with a keyboard and a wider window.</p>
        </section>
    )

    const status = state.status === 'waiting' ? 'The maze is ready.'
        : state.status === 'won' ? 'Maze cleared. Well played.'
            : state.status === 'gameOver' ? 'Caught. One more round?'
                : paused ? 'Paused. Your place is saved.'
                    : state.powerTimer > 0 ? 'Power is yours. Chase the ghosts.' : 'Follow the trail. Watch the corners.'

    return (
        <section className="pacman-game">
            <div className="game-toolbar">
                <label className="pacman-difficulty" htmlFor="pacman-difficulty">Difficulty
                    <select id="pacman-difficulty" value={state.difficulty} onChange={event => game.changeDifficulty(event.target.value)} disabled={state.status === 'playing'}>
                        {Object.keys(DIFFICULTIES).map(key => <option key={key}>{key}</option>)}
                    </select>
                </label>
                <button type="button" className="game-button" aria-pressed={flat} onClick={game.toggleFlat} disabled={reducedMotion}>
                    {flat ? 'Flat view' : '3D view'}{reducedMotion ? ' · Reduced motion' : ''}
                </button>
                <button type="button" className="game-button" onClick={game.resetHighScore}>Reset best</button>
            </div>

            <div className="game-stats pacman-stats" aria-label="Game statistics">
                <div><span>Score</span><strong>{state.score.toLocaleString()}</strong></div>
                <div><span>Best</span><strong>{highScore.toLocaleString()}</strong></div>
                <div><span>Pellets left</span><strong>{remaining}</strong></div>
                <div><span>Power</span><strong>{state.powerTimer > 0 ? `${Math.ceil(state.powerTimer / 1000)}s` : 'Off'}</strong></div>
            </div>

            <div className="pacman-cabinet">
                <div className="pacman-field-label"><span>MAZE / {state.maze.length} × {state.maze[0].length}</span><span>{flat ? 'PLAN VIEW' : 'RELIEF VIEW'}</span></div>
                <canvas ref={canvasRef} width="720" height="720" className="pacman-canvas" tabIndex="0" role="img" aria-label={`Pac-Man maze. ${remaining} pellets remain. Use Arrow keys or WASD to move.`} aria-describedby="pacman-controls">
                    Pac-Man maze. Use the keyboard to collect pellets and avoid ghosts.
                </canvas>
                <div className="pacman-field-label"><span>10 / PELLET</span><span>50 / POWER</span><span>200 / GHOST</span></div>
            </div>

            <div className="pacman-bottom-bar">
                <p className="game-status" role="status">{status}</p>
                <div className="game-toolbar">
                    <button type="button" className="game-button" onClick={game.startGame}>{state.status === 'waiting' ? 'Start game' : state.status === 'playing' ? 'Restart' : 'Play again'}</button>
                    {state.status === 'playing' && <button type="button" className="game-button" onClick={game.togglePause}>{paused ? 'Resume' : 'Pause'}</button>}
                </div>
            </div>
            <p id="pacman-controls" className="game-help"><kbd>↑ ↓ ← →</kbd> or <kbd>W A S D</kbd> move · <kbd>Space</kbd> start · <kbd>Esc</kbd> pause. Collect every pellet to clear the maze. Click the field to return keyboard focus.</p>
        </section>
    )
}
