import { CANVAS_WIDTH, CANVAS_HEIGHT } from './PongGame.logic'
import { usePong } from './PongGame.hooks'
import './PongGame.css'

export default function PongGame() {
    const { canvasRef, view, startGame, togglePause, setDirection, movePaddle, releasePointer } = usePong()
    const active = view.phase === 'playing'
    return (
        <section className="pong-game" aria-label="Pong game">
            <dl className="game-stats">
                <div><dt>You</dt><dd>{view.player}</dd></div><div><dt>Computer</dt><dd>{view.ai}</dd></div><div><dt>Play to</dt><dd>10</dd></div>
            </dl>
            <div className="game-toolbar">
                <button className="game-button" onClick={startGame}>{view.phase === 'ready' ? 'Start match' : 'Restart'}</button>
                <button className="game-button" onClick={togglePause} disabled={view.phase === 'ready' || view.phase === 'over'}>{view.phase === 'paused' ? 'Resume' : 'Pause'}</button>
            </div>
            <p className="game-status" role="status">{view.phase === 'ready' ? 'Your paddle is on the left. First to ten wins.' : view.phase === 'paused' ? 'Paused. The rally can wait.' : view.phase === 'over' ? (view.player >= 10 ? 'You win the match. Well played.' : 'The computer wins this match. Play again?') : 'Return the ball. Find the opening.'}</p>
            <div className="pong-field">
                <canvas ref={canvasRef} tabIndex={0} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} onPointerDown={movePaddle} onPointerMove={movePaddle}
                    onPointerUp={releasePointer} onPointerCancel={releasePointer} onLostPointerCapture={releasePointer}
                    aria-label="Pong court. Move your left paddle with up and down or drag on the court." />
                {!active && <div className="pong-overlay"><span>{view.phase === 'ready' ? 'Ready to serve' : view.phase === 'paused' ? 'Paused' : view.player >= 10 ? 'You win' : 'Match complete'}</span></div>}
            </div>
            <div className="pong-pad" aria-label="Paddle controls">
                {['up', 'down'].map(direction => <button key={direction} className="game-button" disabled={!active}
                    onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); setDirection(direction, true) }}
                    onPointerUp={() => setDirection(direction, false)} onPointerCancel={() => setDirection(direction, false)} onLostPointerCapture={() => setDirection(direction, false)}
                    onKeyDown={event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); setDirection(direction, true) } }}
                    onKeyUp={() => setDirection(direction, false)} onBlur={() => setDirection(direction, false)}>{direction === 'up' ? '↑ Up' : '↓ Down'}</button>)}
            </div>
            <p className="game-help">↑ / ↓ move your paddle. Drag anywhere on the court or hold a control below. Space pauses the match.</p>
        </section>
    )
}
