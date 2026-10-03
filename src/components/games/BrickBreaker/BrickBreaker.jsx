import { CANVAS_WIDTH, CANVAS_HEIGHT } from './BrickBreaker.logic'
import { useBrickBreaker } from './BrickBreaker.hooks'
import './BrickBreaker.css'

export default function BrickBreaker() {
    const { canvasRef, view, startGame, togglePause, setDirection, movePaddle, resetScore } = useBrickBreaker()
    const active = view.phase === 'playing'
    const message = view.phase === 'ready' ? 'Ready to clear the field?' : view.phase === 'paused' ? 'Paused. Take your time.'
        : view.phase === 'over' ? (view.won ? 'Field cleared. Well played.' : 'Out of lives. Try another round.') : 'Keep the ball in play.'
    return (
        <section className="brick-breaker-game" aria-label="Brick Breaker game">
            <dl className="game-stats">
                <div><dt>Score</dt><dd>{view.score}</dd></div><div><dt>Best</dt><dd>{view.highScore}</dd></div>
                <div><dt>Lives</dt><dd>{view.lives}</dd></div><div><dt>Bricks</dt><dd>{view.bricks}</dd></div>
            </dl>
            <div className="game-toolbar">
                <button className="game-button" onClick={startGame}>{view.phase === 'ready' ? 'Start game' : 'Restart'}</button>
                <button className="game-button" disabled={view.phase === 'ready' || view.phase === 'over'} onClick={togglePause}>{view.phase === 'paused' ? 'Resume' : 'Pause'}</button>
                <button className="game-button" onClick={resetScore}>Reset best</button>
            </div>
            <p className="game-status" role="status">{message}</p>
            <div className="brick-breaker-field">
                <canvas ref={canvasRef} tabIndex={0} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} onPointerDown={movePaddle} onPointerMove={movePaddle}
                    aria-label="Brick field. Use left and right arrows or drag the paddle." />
                {!active && <div className="brick-breaker-overlay"><span>{view.phase === 'ready' ? 'Ready' : view.phase === 'paused' ? 'Paused' : view.won ? 'Field cleared' : 'Round complete'}</span></div>}
            </div>
            <div className="brick-breaker-pad" aria-label="Paddle controls">
                {['left', 'right'].map(direction => <button key={direction} className="game-button" disabled={!active}
                    onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); setDirection(direction, true) }}
                    onPointerUp={() => setDirection(direction, false)} onPointerCancel={() => setDirection(direction, false)} onLostPointerCapture={() => setDirection(direction, false)}
                    onKeyDown={event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); setDirection(direction, true) } }}
                    onKeyUp={() => setDirection(direction, false)} onBlur={() => setDirection(direction, false)}>{direction === 'left' ? '← Left' : 'Right →'}</button>)}
            </div>
            <p className="game-help">Move with ← / → or A / D. On touch, drag across the field or hold a direction below. Space pauses.</p>
        </section>
    )
}
