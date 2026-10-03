import { useBaghChal } from './BaghChalGame.hooks.js'
import { BOARD_EDGES, GOAT, TIGER } from './BaghChalGame.logic.js'
import './BaghChalGame.css'

const coordinate = position => `${String.fromCharCode(65 + position % 5)}${Math.floor(position / 5) + 1}`

export default function BaghChalGame() {
    const game = useBaghChal()
    const { engine } = game
    const last = engine.moveHistory.at(-1)
    return (
        <section className="bagh-game" aria-label="Bagh Chal">
            <div className="game-toolbar">
                <label>Players<select value={game.mode} onChange={event => game.changeMode(event.target.value)}>
                    <option value="pvc">Play computer</option><option value="pvp">Local two-player</option>
                </select></label>
                {game.mode === 'pvc' && <>
                    <label>Your side<select value={game.role} onChange={event => game.changeRole(event.target.value)}>
                        <option value="goat">Goats · first</option><option value="tiger">Tigers · second</option>
                    </select></label>
                    <label>Difficulty<select value={game.difficulty} onChange={event => game.setDifficulty(event.target.value)}>
                        <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                    </select></label>
                </>}
                <button className="game-button" onClick={game.undo} disabled={!game.canUndo}>Undo{game.mode === 'pvc' ? ' turn' : ''}</button>
                <button className="game-button" onClick={game.restart}>Restart</button>
            </div>
            <p className="game-status" role="status" aria-live="polite">{game.status}</p>
            <div className="bagh-play-area">
                <div className="bagh-board-panel" tabIndex={0} aria-label="Scrollable Bagh Chal board">
                    <div className="bagh-board" ref={game.boardRef} role="grid" aria-label="Five by five Bagh Chal intersections" aria-describedby="bagh-instructions" aria-busy={game.aiTurn}>
                        <svg className="bagh-lines" viewBox="0 0 500 500" aria-hidden="true">
                            {BOARD_EDGES.map(([from, to]) => <line key={`${from}-${to}`}
                                x1={50 + (from % 5) * 100} y1={50 + Math.floor(from / 5) * 100}
                                x2={50 + (to % 5) * 100} y2={50 + Math.floor(to / 5) * 100} />)}
                        </svg>
                        {Array.from({ length: 5 }, (_, row) => <div role="row" className="bagh-row" key={row}>
                            {engine.board.slice(row * 5, row * 5 + 5).map((piece, col) => {
                                const position = row * 5 + col
                                const selected = position === game.selected
                                const destination = !game.aiTurn && game.destinations.has(position)
                                const selectable = !game.aiTurn && game.legalMoves.some(move => move.from === position)
                                const lastMove = last?.to === position
                                const label = `${coordinate(position)}: ${piece === TIGER ? 'tiger' : piece === GOAT ? 'goat' : 'empty'}${selected ? ', selected' : ''}${destination ? ', legal destination' : ''}${lastMove ? ', last move' : ''}`
                                return <div role="gridcell" key={col}>
                                    <button type="button" className={`bagh-cell${selected ? ' selected' : ''}${destination ? ' destination' : ''}${selectable ? ' selectable' : ''}${lastMove ? ' last-move' : ''}${last?.from === position ? ' last-origin' : ''}`}
                                        data-position={position} aria-label={label} aria-pressed={selected} aria-disabled={!destination && !selectable}
                                        tabIndex={game.focus === position ? 0 : -1} onFocus={() => game.setFocus(position)}
                                        onKeyDown={event => game.moveFocus(event, position)} onClick={() => game.play(position)}>
                                        {piece !== 0 ? <span className={`bagh-piece ${piece === TIGER ? 'tiger' : 'goat'}`} aria-hidden="true">{piece === TIGER ? 'T' : 'G'}</span> : <span className="bagh-node" aria-hidden="true" />}
                                        {row === 4 && <span className="bagh-column-label" aria-hidden="true">{String.fromCharCode(65 + col)}</span>}
                                        {col === 0 && <span className="bagh-row-label" aria-hidden="true">{row + 1}</span>}
                                    </button>
                                </div>
                            })}
                        </div>)}
                    </div>
                    <p className="bagh-legend"><span>T · Tigers</span><span>G · Goats</span><span>Ring · last move</span></p>
                </div>
                <aside className="game-panel bagh-notes" aria-label="Match information">
                    <h2>Four hunters. Twenty goats.</h2>
                    <dl className="game-stats">
                        <div><dt>Phase</dt><dd>{engine.gamePhase === 'placement' ? 'Place goats' : 'Move goats'}</dd></div>
                        <div><dt>Goats to place</dt><dd>{20 - engine.goatsPlaced}</dd></div>
                        <div><dt>Goats on board</dt><dd>{engine.goatsPlaced - engine.goatsCaptured}</dd></div>
                        <div><dt>Captured</dt><dd>{engine.goatsCaptured} / 5</dd></div>
                        <div><dt>Last move</dt><dd>{last ? `${last.player === 'goat' ? 'Goat' : 'Tiger'} ${last.from !== undefined ? `${coordinate(last.from)} → ` : ''}${coordinate(last.to)}${last.type === 'capture' ? ' · capture' : ''}` : 'None yet'}</dd></div>
                    </dl>
                    <div className="game-help" id="bagh-instructions">
                        <p>Goats start by placing one goat per turn. After all 20 have been placed, goats move one step along a line. Tigers can move from their first turn.</p>
                        <p>Tigers capture by jumping over one adjacent goat to an empty point in a straight line. One jump per turn; captures are optional. Only drawn lines connect points.</p>
                        <p>Tigers win by capturing five goats. Goats win by trapping every tiger, including during placement. A side with no legal move loses. Three repeated positions with the same player to move are a draw.</p>
                        <p>Select a piece, then a marked destination. Arrow keys explore; Enter or Space selects; Escape clears selection. Changing players or sides restarts the match.</p>
                    </div>
                </aside>
            </div>
        </section>
    )
}
