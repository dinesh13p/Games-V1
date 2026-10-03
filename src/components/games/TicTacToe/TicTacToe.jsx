import { useId } from 'react'
import { useTicTacToe } from './TicTacToe.hooks.js'
import './TicTacToe.css'

const TicTacToe = ({ embedded = false }) => {
    const { state, result, aiThinking, status, play, restart, setMode, setDifficulty, resetScores } = useTicTacToe()
    const id = useId()
    const scores = state.scores[state.mode]
    return (
        <section className={`tic-tac-toe${embedded ? ' tic-tac-toe-embedded' : ''}`} aria-label="Playable Tic-Tac-Toe">
            {!embedded && <div className="game-toolbar tic-tac-toe-toolbar">
                <label htmlFor={`${id}-mode`}>Opponent
                    <select id={`${id}-mode`} value={state.mode} onChange={event => setMode(event.target.value)}>
                        <option value="pvc">Computer</option><option value="pvp">Two players</option>
                    </select>
                </label>
                {state.mode === 'pvc' && <label htmlFor={`${id}-difficulty`}>Difficulty
                    <select id={`${id}-difficulty`} value={state.difficulty} onChange={event => setDifficulty(event.target.value)}>
                        <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                    </select>
                </label>}
                <button className="game-button" onClick={restart}>New round</button>
            </div>}
            <div className="tic-tac-toe-play">
                <div className="tic-tac-toe-match">
                    <p className="game-status tic-tac-toe-status" role="status" id={`${id}-status`}>{status}</p>
                    <div className="tic-tac-toe-board" role="group" aria-label="Three by three game board" aria-describedby={`${id}-status`}>
                        {state.squares.map((value, index) => <button
                            key={index}
                            className={`tic-tac-toe-cell${value ? ` tic-tac-toe-${value.toLowerCase()}` : ''}${result.line.includes(index) ? ' tic-tac-toe-winning' : ''}`}
                            onClick={() => play(index)}
                            aria-disabled={Boolean(value || result.winner || aiThinking)}
                            aria-label={`Row ${Math.floor(index / 3) + 1}, column ${index % 3 + 1}: ${value || 'empty'}${result.line.includes(index) ? ', winning square' : ''}`}
                        >{value || <span className="tic-tac-toe-empty" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>}</button>)}
                    </div>
                    {embedded && <button className="game-button tic-tac-toe-reset" onClick={restart}>Reset board</button>}
                </div>
                {!embedded && <aside className="tic-tac-toe-record" aria-label="Match scores">
                    <h2>The scorecard</h2>
                    <dl className="game-stats tic-tac-toe-scores">
                        <div><dt>{state.mode === 'pvc' ? 'You / X' : 'Player X'}</dt><dd>{scores.X}</dd></div>
                        <div><dt>{state.mode === 'pvc' ? 'Computer / O' : 'Player O'}</dt><dd>{scores.O}</dd></div>
                        <div><dt>Draws</dt><dd>{scores.draws}</dd></div>
                    </dl>
                    <button className="game-button" onClick={resetScores}>Clear scores</button>
                    <p className="game-help">Three in a row wins. X opens every round. Scores are saved locally for each opponent mode.</p>
                    {state.mode === 'pvc' && <p className="game-help">Easy explores. Medium spots wins and blocks. Hard plans every move.</p>}
                </aside>}
            </div>
        </section>
    )
}

TicTacToe.propTypes = {
    embedded: (props, name, component) => props[name] !== undefined && typeof props[name] !== 'boolean'
        ? new Error(`${component}.${name} must be a boolean`) : null,
}

export default TicTacToe
