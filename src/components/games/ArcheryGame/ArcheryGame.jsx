import { CANVAS_WIDTH, CANVAS_HEIGHT } from './ArcheryGame.logic'
import { useArchery } from './ArcheryGame.hooks'
import './ArcheryGame.css'

export default function ArcheryGame() {
    const { canvasRef, view, startGame, togglePause, onPointerDown, aim, release, cancelCharge, resetScore } = useArchery()
    return (
        <section className="archery-game" aria-label="Archery game">
            <dl className="game-stats">
                <div><dt>Score</dt><dd>{view.score}</dd></div><div><dt>Best</dt><dd>{view.highScore}</dd></div>
                <div><dt>Level</dt><dd>{view.level}</dd></div><div><dt>Arrows</dt><dd>{view.arrows}</dd></div>
            </dl>
            <div className="game-toolbar">
                <button className="game-button" onClick={startGame}>{view.phase === 'ready' ? 'Start game' : 'Restart'}</button>
                <button className="game-button" onClick={togglePause} disabled={view.phase === 'ready' || view.phase === 'over'}>{view.phase === 'paused' ? 'Resume' : 'Pause'}</button>
                <button className="game-button" onClick={resetScore}>Reset best</button>
            </div>
            <p className="game-status" role="status">{view.phase === 'ready' ? 'Take aim. Make every arrow count.' : view.phase === 'paused' ? 'Paused. Your bow is at rest.' : view.phase === 'over' ? 'Out of arrows. Try another round.' : 'Clear every target to advance. Avoid the figures.'}</p>
            <div className="archery-range">
                <canvas ref={canvasRef} tabIndex={0} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} onPointerDown={onPointerDown} onPointerMove={aim}
                    onPointerUp={release} onPointerCancel={cancelCharge} onLostPointerCapture={cancelCharge}
                    aria-label="Archery range. Aim with your pointer, hold to charge, release to shoot." />
                {view.phase !== 'playing' && <div className="archery-overlay"><span>{view.phase === 'ready' ? 'Ready to aim' : view.phase === 'paused' ? 'Paused' : 'Round complete'}</span></div>}
            </div>
            <div className="archery-readout">
                <label>Power <meter min="0" max="100" value={view.power}>{view.power}%</meter><span>{view.power}%</span></label>
                <span>Wind {view.wind < 0 ? '←' : '→'} {Math.abs(view.wind).toFixed(1)}</span>
            </div>
            <p className="game-help">Aim with mouse or touch. Hold for power, then release. Keyboard: ↑ / ↓ aim, hold Space to charge, release to shoot. P pauses.</p>
        </section>
    )
}
