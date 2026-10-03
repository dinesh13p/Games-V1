import { CANVAS_WIDTH, CANVAS_HEIGHT } from './Tetris.logic'
import { useTetris } from './Tetris.hooks'
import './Tetris.css'

export default function Tetris() {
    const { canvasRef, view, startGame, togglePause, action, holdDirection, resetScore, onPointerDown, onPointerUp, cancelPointer } = useTetris()
    const active = view.phase === 'playing'
    return (
        <section className="tetris-game" aria-label="Tetris game">
            <dl className="game-stats">
                <div><dt>Score</dt><dd>{view.score.toLocaleString()}</dd></div><div><dt>Best</dt><dd>{view.highScore.toLocaleString()}</dd></div>
                <div><dt>Level</dt><dd>{view.level}</dd></div><div><dt>Lines</dt><dd>{view.lines}</dd></div>
            </dl>
            <div className="game-toolbar">
                <button className="game-button" onClick={startGame}>{view.phase === 'ready' ? 'Start game' : 'Restart'}</button>
                <button className="game-button" onClick={togglePause} disabled={view.phase === 'ready' || view.phase === 'over'}>{view.phase === 'paused' ? 'Resume' : 'Pause'}</button>
                <button className="game-button" onClick={resetScore}>Reset best</button>
            </div>
            <p className="game-status" role="status">{view.phase === 'ready' ? 'Make room for the next piece.' : view.phase === 'paused' ? 'Paused. Plan your next move.' : view.phase === 'over' ? 'Stack complete. Ready for another round?' : `${10 - view.lines % 10} lines to the next level.`}</p>
            <div className="tetris-layout">
                <div className="tetris-field">
                    <canvas ref={canvasRef} tabIndex={0} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} onPointerDown={onPointerDown} onPointerUp={onPointerUp}
                        onPointerCancel={cancelPointer} onLostPointerCapture={cancelPointer} aria-label="Tetris board. Arrow keys move and rotate; Space drops." />
                    {!active && <div className="tetris-overlay"><span>{view.phase === 'ready' ? 'Ready' : view.phase === 'paused' ? 'Paused' : 'Game over'}</span></div>}
                </div>
                <aside className="tetris-side" aria-label="Piece preview">
                    {[['Next', view.next], ['Hold', view.hold]].map(([label, piece]) => <div className="tetris-preview-panel" key={label}>
                        <h2>{label}</h2>
                        <div className="tetris-preview" role="img" aria-label={piece ? `${piece.type} piece` : 'No piece'}>
                            {piece ? <div className="tetris-preview-grid" style={{ gridTemplateColumns: `repeat(${piece.shape[0].length}, 16px)` }}>
                                {piece.shape.flatMap((row, y) => row.map((cell, x) => <span key={`${y}-${x}`} style={{ background: cell ? piece.color : 'transparent', borderColor: cell ? 'var(--ink)' : 'transparent' }} />))}
                            </div> : <span className="tetris-empty">Empty</span>}
                        </div>
                    </div>)}
                    <button className="game-button" onClick={() => action('hold')} disabled={!active || view.holdUsed}>Hold <span aria-hidden="true">C</span></button>
                    <p>{view.holdUsed ? 'Available after this piece lands.' : 'Save a piece for later.'}</p>
                    <label className="tetris-progress">Level progress<progress max="10" value={view.lines % 10}>{view.lines % 10} / 10</progress></label>
                </aside>
            </div>
            <div className="tetris-pad" aria-label="Piece controls">
                {['left', 'down', 'right'].map(direction => <button key={direction} className="game-button" disabled={!active}
                    onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); holdDirection(direction, true) }}
                    onPointerUp={() => holdDirection(direction, false)} onPointerCancel={() => holdDirection(direction, false)} onLostPointerCapture={() => holdDirection(direction, false)}
                    onKeyDown={event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); holdDirection(direction, true) } }}
                    onKeyUp={() => holdDirection(direction, false)} onBlur={() => holdDirection(direction, false)}
                    aria-label={direction === 'down' ? 'Soft drop' : `Move ${direction}`}>{direction === 'left' ? '←' : direction === 'right' ? '→' : '↓'}</button>)}
                <button className="game-button" disabled={!active} onClick={() => action('rotate')}>Rotate</button>
                <button className="game-button" disabled={!active} onClick={() => action('drop')}>Drop</button>
            </div>
            <p className="game-help">← / → move · ↑ rotate · ↓ soft drop · Space hard drop · C hold · P pause. On touch: tap to rotate, swipe to move, double-tap to drop. Hold a direction below to repeat.</p>
        </section>
    )
}
