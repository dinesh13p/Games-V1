import { WIDTH, HEIGHT } from './FlappyBird.logic'
import { useFlappyBird } from './FlappyBird.hooks'
import './FlappyBird.css'

export default function FlappyBird() {
    const { canvasRef, view, startGame, flap, togglePause, resetScore, soundEnabled, toggleSound } = useFlappyBird()
    return (
        <section className="flappy-game" aria-label="Flappy Bird game">
            <dl className="game-stats">
                <div><dt>Pipes passed</dt><dd>{view.score}<small> / 100</small></dd></div><div><dt>Best</dt><dd>{view.highScore}</dd></div>
            </dl>
            <div className="game-toolbar">
                <button className="game-button" onClick={startGame}>{view.phase === 'ready' ? 'Start game' : 'Restart'}</button>
                <button className="game-button" onClick={togglePause} disabled={view.phase === 'ready' || view.phase === 'over'}>{view.phase === 'paused' ? 'Resume' : 'Pause'}</button>
                <button className="game-button" onClick={toggleSound} aria-pressed={soundEnabled}>Sound {soundEnabled ? 'on' : 'off'}</button>
                <button className="game-button" onClick={resetScore}>Reset best</button>
            </div>
            <p className="game-status" role="status">{view.phase === 'ready' ? 'Find your rhythm, one flap at a time.' : view.phase === 'paused' ? 'Paused. Ready when you are.' : view.phase === 'over' ? (view.won ? 'All 100 pipes complete. Well flown.' : 'Flight complete. Try another round.') : 'Stay between the pipes.'}</p>
            <div className="flappy-field">
                <canvas ref={canvasRef} tabIndex={0} width={WIDTH} height={HEIGHT} onPointerDown={event => { if (event.button === 0) { event.preventDefault(); flap() } }}
                    aria-label="Flight field. Tap or press Space to flap." />
                {view.phase !== 'playing' && <div className="flappy-overlay"><span>{view.phase === 'ready' ? 'Ready for takeoff' : view.phase === 'paused' ? 'Paused' : view.won ? 'Flight complete' : 'Try again'}</span></div>}
            </div>
            <button className="game-button flappy-flap" onClick={flap} disabled={view.phase === 'paused'}>{view.phase === 'ready' ? 'Take flight' : view.phase === 'over' ? 'Fly again' : 'Flap ↑'}</button>
            <p className="game-help">Tap the field, press Space or ↑, or use the flap button. Short, steady taps keep you airborne. P pauses.</p>
        </section>
    )
}
