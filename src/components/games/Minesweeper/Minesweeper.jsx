import { useId } from 'react'
import { DIFFICULTIES, describeCell } from './Minesweeper.logic.js'
import { useMinesweeper } from './Minesweeper.hooks.js'
import './Minesweeper.css'

const Minesweeper = () => {
    const game = useMinesweeper()
    const { state, cfg, flags, revealed, activeCell, boardRef } = game
    const id = useId()
    const finished = state.status === 'won' || state.status === 'lost'
    const status = state.status === 'won' ? 'Field cleared. Every safe square is uncovered.'
        : state.status === 'lost' ? 'A mine was uncovered. Restart to try a new field.'
            : state.status === 'ready' ? 'Choose your first square. The first reveal is always safe.'
                : `${revealed} of ${cfg.rows * cfg.cols - cfg.mines} safe squares uncovered.`

    return (
        <section className="minesweeper" aria-label="Minesweeper game">
            <div className="game-toolbar minesweeper-toolbar">
                <label htmlFor={`${id}-difficulty`}>Difficulty
                    <select id={`${id}-difficulty`} value={state.difficulty} onChange={event => game.setDifficulty(event.target.value)}>
                        {Object.entries(DIFFICULTIES).map(([name, settings]) => <option key={name} value={name}>{name} / {settings.mines} mines</option>)}
                    </select>
                </label>
                <button className="game-button minesweeper-flag-toggle" aria-pressed={state.flagMode} onClick={game.toggleFlagMode} disabled={finished}>
                    {state.flagMode ? 'Flag mode: on' : 'Flag mode: off'}
                </button>
                <button className="game-button" onClick={game.restart}>Restart</button>
            </div>
            <dl className="game-stats minesweeper-stats">
                <div><dt>Mines minus flags</dt><dd>{cfg.mines - flags}</dd></div>
                <div><dt>Flags placed</dt><dd>{flags}</dd></div>
                <div><dt>Time</dt><dd>{state.elapsed}<span> s</span></dd></div>
            </dl>
            <p className="game-status minesweeper-status" role="status">{status}</p>
            <p className="minesweeper-mode" id={`${id}-mode`}>{state.flagMode ? 'Tap a covered square to place or remove a flag.' : 'Tap a covered square to reveal it. Turn on flag mode to mark a mine.'}</p>
            <div className="minesweeper-scroll" role="region" aria-label="Scrollable minefield" style={{ '--mine-columns': cfg.cols }}>
                <div className="minesweeper-board" ref={boardRef} role="grid" aria-label={`${state.difficulty} minefield`} aria-rowcount={cfg.rows} aria-colcount={cfg.cols} aria-describedby={`${id}-keyboard ${id}-mode`}>
                    {state.board.map((row, r) => <div className="minesweeper-row" role="row" key={r}>
                        {row.map((cell, c) => {
                            const index = r * cfg.cols + c
                            const wrongFlag = state.status === 'lost' && cell.isFlagged && !cell.isMine
                            const exploded = state.exploded?.[0] === r && state.exploded?.[1] === c
                            const content = cell.isRevealed ? cell.isMine ? 'M' : cell.adjacent || '' : wrongFlag ? '!' : cell.isFlagged ? 'F' : ''
                            return <div role="gridcell" key={c} aria-rowindex={r + 1} aria-colindex={c + 1}>
                                <button
                                    data-cell={index}
                                    tabIndex={activeCell === index ? 0 : -1}
                                    className={`minesweeper-cell${cell.isRevealed ? ' minesweeper-revealed' : ''}${cell.isFlagged ? ' minesweeper-flagged' : ''}${exploded ? ' minesweeper-exploded' : ''}${wrongFlag ? ' minesweeper-wrong' : ''}`}
                                    aria-label={describeCell(cell, state.status)}
                                    aria-disabled={finished || cell.isRevealed}
                                    onFocus={() => game.setActiveCell(index)}
                                    onKeyDown={event => game.onCellKeyDown(event, r, c)}
                                    onClick={() => game.activateCell(r, c)}
                                    onContextMenu={event => game.flagCell(event, r, c)}
                                >{content}</button>
                            </div>
                        })}
                    </div>)}
                </div>
            </div>
            <div className="minesweeper-legend" aria-label="Minefield legend"><span>F = flag</span><span>M = mine</span><span>! = incorrect flag</span></div>
            <p className="game-help" id={`${id}-keyboard`}>Numbers count nearby mines, including diagonals. Reveal all safe squares to win. Right-click or press F to flag. Use arrow keys to move between squares, then Enter or Space to play. Wide fields scroll inside the frame.</p>
        </section>
    )
}

export default Minesweeper
