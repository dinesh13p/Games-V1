import { useLudoGame } from './Ludo.hooks.js'
import { BLUE, COLORS, GREEN, HOME_STRAIGHTS, MAIN_TRACK, RED, YELLOW, getGlobalTrackIndex, getHomeIndex } from './Ludo.logic.js'
import './Ludo.css'

// Presentation only. All token positions and collisions come from the linear rules.
const TRACK_COORDINATES = [
    [6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
    [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
    [0, 7], [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
    [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
    [7, 14], [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
    [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
    [14, 7], [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
    [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
    [7, 0],
]

const HOME_COORDINATES = {
    [RED]: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
    [BLUE]: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
    [YELLOW]: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
    [GREEN]: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
}

const BASE_COORDINATES = {
    [RED]: { row: 1, column: 1 },
    [BLUE]: { row: 1, column: 10 },
    [YELLOW]: { row: 10, column: 10 },
    [GREEN]: { row: 10, column: 1 },
}

const colorLabel = color => color.charAt(0).toUpperCase() + color.slice(1)

function tokenStepLabel(token) {
    if (token.stepCounter === 0) return 'base'
    if (token.stepCounter === 57) return 'goal'
    if (token.stepCounter >= 52) return `home ${token.stepCounter - 51}`
    return `track step ${token.stepCounter}`
}

export default function Ludo() {
    const ludo = useLudoGame()
    const { game } = ludo
    const active = game.activeColors
    const isLobby = game.phase === 'lobby'
    const isPlaying = game.phase === 'playing'
    const pending = game.pendingRoll !== null

    const tokenButton = (token, location, inactive = false) => {
        const legal = isPlaying && !inactive && game.movableTokenIds.includes(token.id)
        const selected = game.selectedTokenId === token.id
        return <button
            type="button"
            key={`${location}-${token.id}`}
            className={`ludo-token ${token.color}${legal ? ' legal' : ''}${selected ? ' selected' : ''}`}
            disabled={!legal}
            aria-label={`${colorLabel(token.color)} token ${token.number}, ${tokenStepLabel(token)}${legal ? ', movable' : ''}`}
            data-token-id={token.id}
            data-step-counter={token.stepCounter}
            aria-pressed={selected}
            onClick={() => ludo.chooseToken(token.id)}
        >{token.number}</button>
    }

    const tokensAtStep = (color, step) => game.tokens[color].filter(token => token.stepCounter === step)

    const renderBase = color => {
        const inactive = !active.includes(color)
        const base = BASE_COORDINATES[color]
        return <section
            className={`ludo-base ${color}${inactive ? ' inactive' : ''}${!isLobby && !game.gameOver && game.currentColor === color ? ' current' : ''}`}
            key={`base-${color}`}
            aria-label={`${colorLabel(color)} base${inactive ? ', inactive' : ''}`}
            aria-disabled={inactive}
            style={{ gridRow: `${base.row} / span 6`, gridColumn: `${base.column} / span 6` }}
            data-base-color={color}
        >
            <h3>{colorLabel(color)}<span>{inactive ? 'Inactive' : `${game.tokens[color].filter(token => token.stepCounter === 57).length}/4 home`}</span></h3>
            <div className="ludo-base-tokens">
                {game.tokens[color].map(token => <div className="ludo-base-slot" key={token.id}>
                    {token.stepCounter === 0 ? tokenButton(token, `base-${color}`, inactive) : <span aria-hidden="true">{token.number}</span>}
                </div>)}
            </div>
        </section>
    }

    const renderTrackCell = (trackIndex, [row, column]) => {
        const tokenList = COLORS.flatMap(color => game.tokens[color].filter(token => getGlobalTrackIndex(color, token.stepCounter) === trackIndex))
        const startColor = COLORS.find(color => getGlobalTrackIndex(color, 1) === trackIndex)
        return <div
            className={`ludo-track-cell${startColor ? ` start-${startColor}` : ''}`}
            key={`track-${trackIndex}`}
            style={{ gridRow: row + 1, gridColumn: column + 1 }}
            data-track-index={trackIndex}
            data-stack-size={tokenList.length}
            aria-label={`Main track index ${trackIndex}${startColor ? `, ${colorLabel(startColor)} start` : ''}`}
        >
            {startColor && !tokenList.length && <span className="ludo-start-label" aria-hidden="true">{startColor.charAt(0).toUpperCase()}</span>}
            {tokenList.map(token => tokenButton(token, `track-${trackIndex}`))}
        </div>
    }

    const renderHomeCell = (color, step, [row, column]) => {
        return <div
            className={`ludo-home-cell ${color}`}
            key={`home-${color}-${step}`}
            style={{ gridRow: row + 1, gridColumn: column + 1 }}
            data-home-index={getHomeIndex(color, step)}
            data-home-color={color}
            data-stack-size={tokensAtStep(color, step).length}
            aria-label={`${colorLabel(color)} home step ${step - 51}`}
        >
            {tokensAtStep(color, step).map(token => tokenButton(token, `home-${color}-${step}`))}
        </div>
    }

    const renderGoal = () => <div className="ludo-goal" style={{ gridRow: '7 / span 3', gridColumn: '7 / span 3' }} aria-label="Goal area">
        {COLORS.map(color => <div className={`ludo-goal-color ${color}`} key={`goal-${color}`} data-goal-color={color}>
            {game.tokens[color].filter(token => token.stepCounter === 57).map(token => tokenButton(token, `goal-${color}`))}
        </div>)}
    </div>

    return <section className="ludo-game" aria-label="Ludo">
        <div className="game-toolbar ludo-toolbar">
            <label>Players<select value={game.playerCount} disabled={!isLobby} onChange={event => ludo.choosePlayers(event.target.value)}>
                <option value="2">2 Players</option>
                <option value="4">4 Players</option>
            </select></label>
            {game.playerCount === 2 && <label>Opposing pair<select value={game.pair} disabled={!isLobby} onChange={event => ludo.choosePair(event.target.value)}>
                <option value="red-yellow">Red vs Yellow</option>
                <option value="blue-green">Blue vs Green</option>
            </select></label>}
            {isLobby && <button type="button" className="game-button" onClick={ludo.begin} ref={ludo.actionRef}>Ready / start match</button>}
            {!isLobby && <button type="button" className="game-button" onClick={ludo.newMatch} ref={game.gameOver ? ludo.actionRef : undefined}>New match</button>}
        </div>

        <p className="game-status" role="status" aria-live="polite">
            {isLobby ? `Pre-match lobby: ${active.map(colorLabel).join(' and ')} are ready. ${colorLabel(game.currentColor)} starts.` : game.gameOver ? `${colorLabel(game.winner)} wins. All four tokens reached the goal.` : `${colorLabel(game.currentColor)} to play. ${game.message}`}
        </p>

        <div className="ludo-play-area">
            <div className="ludo-board-wrap">
                <div className="ludo-board" role="group" aria-label="Cross-shaped Ludo board" aria-describedby="ludo-help">
                    {COLORS.map(renderBase)}
                    {MAIN_TRACK.map(index => renderTrackCell(index, TRACK_COORDINATES[index]))}
                    {COLORS.flatMap(color => HOME_STRAIGHTS[color].map((homeIndex, offset) => renderHomeCell(color, 52 + homeIndex, HOME_COORDINATES[color][offset])))}
                    {renderGoal()}
                </div>
                <p className="ludo-board-caption">R / G / Y / B mark the starting tiles. Outlined tokens can move.</p>
            </div>

            <aside className="game-panel ludo-panel" aria-label="Match information">
                <h2>{isLobby ? 'Pass and play' : game.gameOver ? `${colorLabel(game.winner)} wins` : `${colorLabel(game.currentColor)} turn`}</h2>
                <dl className="game-stats">
                    <div><dt>{pending ? 'Held dice' : 'Last dice'}</dt><dd aria-label={`Dice ${game.dice ?? 'not rolled'}`}>{game.dice ?? '-'}</dd></div>
                    <div><dt>Last selected</dt><dd>{game.selectedTokenId ? colorLabel(game.selectedTokenId.replace('-', ' ')) : 'None'}</dd></div>
                    <div><dt>Six streak</dt><dd>{game.sixStreak}/3</dd></div>
                </dl>
                {game.dice !== null && <p className="ludo-dice-note">{colorLabel(game.lastRollColor)} rolled {game.dice}.{pending ? ' Choose one token to use this roll.' : ''}</p>}
                {isPlaying && <>
                    <p className="ludo-pass-message"><strong>Pass and play: {colorLabel(game.currentColor)} has the device.</strong></p>
                    <button type="button" className="game-button ludo-roll-button" onClick={ludo.roll} disabled={pending} ref={ludo.actionRef}>
                        {pending ? `Dice held: ${game.pendingRoll}` : `Roll for ${colorLabel(game.currentColor)}`}
                    </button>
                    <div className="ludo-token-choices" ref={ludo.choicesRef} role="group" aria-label={`${colorLabel(game.currentColor)} token choices`}>
                        {game.tokens[game.currentColor].map(token => {
                            const legal = game.movableTokenIds.includes(token.id)
                            return <button type="button" className="game-button ludo-choice" key={token.id} disabled={!legal} onClick={() => ludo.chooseToken(token.id)}>
                                <strong>Token {token.number}</strong><span>{tokenStepLabel(token)}{legal ? ` · move ${game.pendingRoll}` : ''}</span>
                            </button>
                        })}
                    </div>
                </>}
                {isLobby && <p className="ludo-pass-message">Local pass-and-play. Share one device and take turns clockwise through the active colors.</p>}
                {game.gameOver && <p className="ludo-pass-message">Match over. Choose New match to return to the lobby.</p>}
                <div className="ludo-active-colors" aria-label="Active bases">
                    {COLORS.map(color => <span className={`ludo-color-key ${color}${active.includes(color) ? ' active' : ' inactive'}`} key={color}>{colorLabel(color)}{active.includes(color) ? ` · ${game.tokens[color].filter(token => token.stepCounter === 57).length}/4` : ' · off'}</span>)}
                </div>
                <div className="game-help" id="ludo-help">
                    <p>Each token follows one linear path: base 0, main track steps 1 to 51, home steps 52 to 56, then goal 57. Step 1 is the starting tile for each color.</p>
                    <p>Roll six to leave base. Sixes give another turn. Three consecutive sixes skip the turn. Landing exactly on an opponent on any main-track tile, including starts, sends it to base and gives a bonus turn. Your own tokens can share a tile.</p>
                    <p>Dice stays held until a legal token is chosen. A roll with no legal move passes clockwise, except a six with no legal move grants the same player another roll.</p>
                    <p>Reach goal 57 with an exact roll. All four tokens must finish to win. Use Tab to choose a button, then Enter or Space to roll or move. The token buttons work even when pieces share a tile.</p>
                </div>
            </aside>
        </div>
    </section>
}
