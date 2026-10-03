import { CANVAS_WIDTH, CANVAS_HEIGHT } from './DoodleJump.logic'
import { useDoodleJump } from './DoodleJump.hooks'
import './DoodleJump.css'

export default function DoodleJump() {
    const { canvasRef, view, startGame, togglePause, setDirection, onPointerDown, onPointerMove, onPointerUp } = useDoodleJump()
    const active = view.phase === 'playing'
    return (
        <section className="doodle-game" aria-label="Doodle Jump game">
            <dl className="game-stats">
                <div><dt>Height score</dt><dd>{view.score}</dd></div><div><dt>Session best</dt><dd>{view.highScore}</dd></div>
                <div><dt>Jump</dt><dd>{view.flying ? 'Boost' : 'Normal'}</dd></div>
            </dl>
            <div className="game-toolbar">
                <button className="game-button" onClick={startGame}>{view.phase === 'ready' ? 'Start game' : 'Restart'}</button>
                <button className="game-button" onClick={togglePause} disabled={view.phase === 'ready' || view.phase === 'over'}>{view.phase === 'paused' ? 'Resume' : 'Pause'}</button>
            </div>
            <p className="game-status" role="status">{view.phase === 'ready' ? 'A little higher with every jump.' : view.phase === 'paused' ? 'Paused. Ready when you are.' : view.phase === 'over' ? 'Round complete. Try for a higher climb.' : view.flying ? 'Boost active. Keep climbing.' : 'Find your next landing.'}</p>
            <div className="doodle-field">
                <canvas ref={canvasRef} tabIndex={0} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} onPointerDown={onPointerDown} onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onLostPointerCapture={onPointerUp}
                    aria-label="Jumping field. Steer left and right to land on platforms." />
                {!active && <div className="doodle-overlay"><span>{view.phase === 'ready' ? 'Ready to climb' : view.phase === 'paused' ? 'Paused' : 'Round complete'}</span></div>}
            </div>
            <div className="doodle-pad" aria-label="Movement controls">
                {['left', 'right'].map(direction => <button key={direction} className="game-button" disabled={!active}
                    onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); setDirection(direction, true) }}
                    onPointerUp={() => setDirection(direction, false)} onPointerCancel={() => setDirection(direction, false)} onLostPointerCapture={() => setDirection(direction, false)}
                    onKeyDown={event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); setDirection(direction, true) } }}
                    onKeyUp={() => setDirection(direction, false)} onBlur={() => setDirection(direction, false)}>{direction === 'left' ? '← Left' : 'Right →'}</button>)}
            </div>
            <p className="game-help">← / → or A / D to steer. Drag or hold the controls on touch. Olive platforms marked ↑ boost your jump; avoid spikes and falling blocks. P pauses.</p>
        </section>
    )
}
