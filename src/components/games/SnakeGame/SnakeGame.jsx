import { BOARD_SIZE, DIRECTIONS } from './SnakeGame.logic.js'
import { useSnakeGame } from './SnakeGame.hooks.js'
import './SnakeGame.css'

const STATUS = {
    ready: 'Ready when you are. Start to begin.',
    running: 'Collect the red squares. Keep moving.',
    paused: 'Paused. Resume when you are ready.',
    lost: 'Game over. Start a new run.',
    won: 'Board complete. A perfect run.',
}

const SnakeGame = () => {
    const { state, best, boardRef, turn, control, swipeHandlers } = useSnakeGame()
    const { snake, food, status, score } = state
    return (
        <section className="snake-game" aria-label="Snake game">
            <div className="game-toolbar">
                <dl className="game-stats snake-stats">
                    <div><dt>Score</dt><dd>{score}</dd></div>
                    <div><dt>Local best</dt><dd>{best}</dd></div>
                </dl>
                <div className="snake-controls">
                    {status === 'ready' && <button className="game-button" onClick={() => control('start')}>Start</button>}
                    {status === 'running' && <button className="game-button" onClick={() => control('pause')}>Pause</button>}
                    {status === 'paused' && <button className="game-button" onClick={() => control('resume')}>Resume</button>}
                    <button className="game-button" onClick={() => control('restart')}>Restart</button>
                </div>
            </div>
            <p className="game-status" role="status">{STATUS[status]}</p>
            <div className="snake-play-area">
                <div className="snake-board" ref={boardRef} tabIndex={0} aria-label="Snake board. Use arrow keys or W A S D to steer. Space pauses." {...swipeHandlers}>
                    <svg viewBox={`0 0 ${BOARD_SIZE * 20} ${BOARD_SIZE * 20}`} role="img" aria-label={`Snake length ${snake.length}, score ${score}`}>
                        {food && <rect className="snake-food" x={food[1] * 20 + 3} y={food[0] * 20 + 3} width="14" height="14" />}
                        {snake.map(([row, col], index) => (
                            <rect key={`${row}-${col}`} className={index === 0 ? 'snake-head' : 'snake-body'} x={col * 20 + 1} y={row * 20 + 1} width="18" height="18" />
                        ))}
                    </svg>
                    {status !== 'running' && <div className="snake-overlay" aria-hidden="true"><span>{status === 'ready' ? 'Your next move' : status === 'paused' ? 'On pause' : status === 'won' ? 'Well played' : 'End of the line'}</span></div>}
                </div>
                <div className="snake-guide">
                    <p className="snake-guide-label">Direction controls</p>
                    <div className="snake-dpad" aria-label="Snake direction controls">
                        {Object.entries(DIRECTIONS).map(([name, direction]) => <button key={name} className={`game-button snake-direction snake-direction-${name}`} onClick={() => turn(direction)} disabled={status !== 'running'} aria-label={`Move ${name}`}>{name}</button>)}
                    </div>
                    <p className="game-help">Arrow keys or W A S D to steer. On touch screens, use the controls or swipe on the board. Space pauses.</p>
                    <p className="game-help">Food adds 10 points. Avoid the walls and your own trail.</p>
                </div>
            </div>
        </section>
    )
}

export default SnakeGame
