import { useGoGame } from './GoGame.hooks.js'
import './GoGame.css'

export default function GoGame() {
    const game = useGoGame()
    const { engine } = game
    const last = engine.moveHistory.at(-1)
    const winning = new Set(engine.getWinningLine().map(({ row, col }) => `${row}-${col}`))

    return (
        <section className="go-game" aria-label="Go / Gomoku">
            <div className="game-toolbar">
                <label>Players<select value={game.mode} onChange={event => game.changeMode(event.target.value)}>
                    <option value="pvc">Play computer</option><option value="pvp">Local two-player</option>
                </select></label>
                {game.mode === 'pvc' && <>
                    <label>Your stones<select value={game.humanPlayer} onChange={event => game.changeSide(event.target.value)}>
                        <option value={game.BLACK}>Black · first</option><option value={game.WHITE}>White · second</option>
                    </select></label>
                    <label>Difficulty<select value={game.difficulty} onChange={event => game.setDifficulty(event.target.value)}>
                        <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                    </select></label>
                </>}
                <label>Board<select value={engine.size} onChange={event => game.changeSize(event.target.value)}>
                    <option value="9">9 × 9</option><option value="13">13 × 13</option>
                </select></label>
                <button className="game-button" onClick={game.undo} disabled={!game.canUndo}>Undo{game.mode === 'pvc' ? ' turn' : ''}</button>
                <button className="game-button" onClick={game.restart}>Restart</button>
            </div>
            <p className="game-status" role="status" aria-live="polite">{game.status}</p>
            <div className="go-play-area">
                <div className="go-board-scroll" tabIndex={0} aria-label="Scrollable Gomoku board">
                    <div className="go-board" ref={game.boardRef} role="grid" aria-label={`${engine.size} by ${engine.size} intersections`} aria-describedby="go-instructions" aria-busy={game.aiTurn} style={{ '--go-size': engine.size }}>
                        {engine.board.map((row, r) => <div className="go-row" role="row" key={r}>
                            {row.map((cell, c) => {
                                const isLast = last?.row === r && last?.col === c
                                const isWinning = winning.has(`${r}-${c}`)
                                const legal = !cell && !engine.gameOver && !game.aiTurn
                                const label = `${String.fromCharCode(65 + c)}${r + 1}: ${cell === game.BLACK ? 'black stone' : cell === game.WHITE ? 'white stone' : 'empty'}${isLast ? ', last move' : ''}${isWinning ? ', winning line' : ''}`
                                return <div role="gridcell" key={c}>
                                    <button type="button" className={`go-cell${cell ? ' occupied' : ''}${legal ? ' legal' : ''}${isLast ? ' last-move' : ''}${isWinning ? ' winning' : ''}`}
                                        data-cell={`${r}-${c}`} aria-label={label} aria-disabled={!legal}
                                        tabIndex={game.focus.row === r && game.focus.col === c ? 0 : -1}
                                        onFocus={() => game.setFocus({ row: r, col: c })} onKeyDown={event => game.moveFocus(event, r, c)} onClick={() => game.play(r, c)}>
                                        {cell !== 0 && <span className={`go-stone ${cell === game.BLACK ? 'black' : 'white'}`} aria-hidden="true">{isLast ? '·' : ''}</span>}
                                        {r === engine.size - 1 && <span className="go-column-label" aria-hidden="true">{String.fromCharCode(65 + c)}</span>}
                                        {c === 0 && <span className="go-row-label" aria-hidden="true">{r + 1}</span>}
                                    </button>
                                </div>
                            })}
                        </div>)}
                    </div>
                </div>
                <aside className="game-panel go-notes" aria-label="Match information">
                    <h2>Five makes a line.</h2>
                    <dl className="game-stats">
                        <div><dt>Moves played</dt><dd>{engine.moveHistory.length}</dd></div>
                        <div><dt>Open intersections</dt><dd>{engine.board.flat().filter(cell => cell === 0).length}</dd></div>
                        <div><dt>Last move</dt><dd>{last ? `${last.player === game.BLACK ? 'Black' : 'White'} · ${String.fromCharCode(65 + last.col)}${last.row + 1}` : 'None yet'}</dd></div>
                    </dl>
                    <div className="game-help" id="go-instructions">
                        <p>This is Gomoku: place a stone on any open intersection. Connect five or more horizontally, vertically, or diagonally to win. Black starts.</p>
                        <p>Use arrow keys to explore the board, then Enter or Space to place. The marked stone is the last move.</p>
                        <p>Undo takes back your last turn against the computer, or one move in local play. Changing players, sides, or board size starts a new match.</p>
                    </div>
                </aside>
            </div>
        </section>
    )
}
