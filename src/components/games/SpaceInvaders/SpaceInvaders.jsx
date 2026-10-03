import { useSpaceInvaders } from './SpaceInvaders.hooks'
import './SpaceInvaders.css'

export default function SpaceInvaders() {
    const game = useSpaceInvaders()
    const { canvasRef, hud, highScore, isMobile, flat, reducedMotion } = game

    if (isMobile) return (
        <section className="game-panel invaders-desktop-message">
            <p className="invaders-eyebrow">Keyboard arcade / 02</p>
            <h2>Desktop required</h2>
            <p>Space Invaders needs a keyboard for precise movement and firing. Open it on a desktop or laptop with a wider window.</p>
        </section>
    )

    const status = hud.status === 'ready' ? 'The formation is approaching.'
        : hud.status === 'paused' ? 'Paused. Ready when you are.'
            : hud.status === 'won' ? 'Sector clear. Every invader down.'
                : hud.status === 'lost' ? 'Defence lost. Try another sortie.' : 'Hold the line. Clear the formation.'

    return (
        <section className="invaders-game">
            <div className="game-toolbar">
                <span className="invaders-mode-label">Fixed formation / Level {hud.level}</span>
                <button type="button" className="game-button" aria-pressed={flat} onClick={game.toggleFlat} disabled={reducedMotion}>
                    {flat ? 'Flat view' : '3D view'}{reducedMotion ? ' · Reduced motion' : ''}
                </button>
                <button type="button" className="game-button" onClick={game.resetHighScore}>Reset best</button>
            </div>

            <div className="game-stats invaders-stats" aria-label="Game statistics">
                <div><span>Score</span><strong>{hud.score.toLocaleString()}</strong></div>
                <div><span>Best</span><strong>{highScore.toLocaleString()}</strong></div>
                <div><span>Lives</span><strong>{hud.lives} / 3</strong></div>
                <div><span>Invaders</span><strong>{hud.remaining}</strong></div>
            </div>

            <div className="invaders-cabinet">
                <div className="invaders-field-label"><span>SECTOR / 01</span><span>{flat ? 'PLAN VIEW' : 'RELIEF VIEW'}</span></div>
                <canvas ref={canvasRef} width="600" height="600" tabIndex="0" role="img" className="invaders-canvas" aria-label={`Space Invaders playfield. ${hud.remaining} invaders and ${hud.lives} lives remaining.`} aria-describedby="invaders-controls">
                    Space Invaders playfield. Arrow keys move and Space fires.
                </canvas>
                <div className="invaders-field-label"><span>10 / SCOUT</span><span>20 / INVADER</span><span>HOLD YOUR GROUND</span></div>
            </div>

            <div className="invaders-bottom-bar">
                <p className="game-status" role="status">{status}</p>
                <div className="game-toolbar">
                    <button type="button" className="game-button" onClick={game.startGame}>{hud.status === 'ready' ? 'Start game' : hud.status === 'playing' || hud.status === 'paused' ? 'Restart' : 'Play again'}</button>
                    {(hud.status === 'playing' || hud.status === 'paused') && <button type="button" className="game-button" onClick={game.togglePause}>{hud.status === 'paused' ? 'Resume' : 'Pause'}</button>}
                </div>
            </div>
            <p id="invaders-controls" className="game-help"><kbd>← →</kbd> or <kbd>A D</kbd> move · <kbd>Space</kbd> fire · <kbd>R</kbd> restart · <kbd>Esc</kbd> pause. Destroy the formation before it reaches your line. Click the field to return keyboard focus.</p>
        </section>
    )
}
