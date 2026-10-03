import { CANVAS_WIDTH, CANVAS_HEIGHT } from './FroggerGame.logic'
import { useFrogger } from './FroggerGame.hooks'
import './FroggerGame.css'

export default function FroggerGame() {
    const { canvasRef, view, startGame, togglePause, move, onPointerDown, onPointerMove, onPointerUp, resetScore } = useFrogger()
    const active = view.phase === 'playing'
    return (
        <section className="frogger-game" aria-label="Frogger game">
            <dl className="game-stats">
                <div><dt>Score</dt><dd>{view.score}</dd></div><div><dt>Best</dt><dd>{view.highScore}</dd></div>
                <div><dt>Time left</dt><dd>{view.timeLeft}s</dd></div><div><dt>Crossings</dt><dd>{view.completions}</dd></div>
            </dl>
            <div className="game-toolbar">
                <button className="game-button" onClick={startGame}>{view.phase === 'ready' ? 'Start game' : 'Restart'}</button>
                <button className="game-button" onClick={togglePause} disabled={view.phase === 'ready' || view.phase === 'over'}>{view.phase === 'paused' ? 'Resume' : 'Pause'}</button>
                <button className="game-button" onClick={resetScore}>Reset best</button>
            </div>
            <p className="game-status" role="status">{view.phase === 'ready' ? 'Find a safe route home.' : view.phase === 'paused' ? 'Paused. The crossing can wait.' : view.phase === 'over' ? (view.timeLeft === 0 ? 'Time is up. Try another crossing.' : 'Round complete. Watch for a clear path.') : `Crossing ${view.completions + 1}. Row ${view.progress + 1} of 12.`}</p>
            <div className="frogger-field">
                <canvas ref={canvasRef} tabIndex={0} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} onPointerDown={onPointerDown} onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onLostPointerCapture={onPointerUp}
                    aria-label="Road and river crossing. Use the arrow keys or direction controls." />
                {!active && <div className="frogger-overlay"><span>{view.phase === 'ready' ? 'Ready to cross' : view.phase === 'paused' ? 'Paused' : 'Round complete'}</span></div>}
            </div>
            <div className="frogger-pad" aria-label="Movement controls">
                <button className="game-button frogger-up" disabled={!active} onClick={() => move('up')} aria-label="Move up">↑</button>
                <button className="game-button" disabled={!active} onClick={() => move('left')} aria-label="Move left">←</button>
                <button className="game-button" disabled={!active} onClick={() => move('down')} aria-label="Move down">↓</button>
                <button className="game-button" disabled={!active} onClick={() => move('right')} aria-label="Move right">→</button>
            </div>
            <p className="game-help">Arrow keys move one step. Swipe the field or use the pad on touch. Avoid traffic, ride the logs, and reach home before time runs out. Space pauses.</p>
        </section>
    )
}
