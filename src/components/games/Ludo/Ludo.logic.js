export const RED = 'red'
export const GREEN = 'green'
export const YELLOW = 'yellow'
export const BLUE = 'blue'

// Clockwise around the reference board: top left, top right, bottom right, bottom left.
export const COLORS = Object.freeze([RED, BLUE, YELLOW, GREEN])
export const TOKENS_PER_COLOR = 4
export const MAIN_TRACK = Object.freeze(Array.from({ length: 52 }, (_, index) => index))
export const COLOR_STARTS = Object.freeze({ [RED]: 0, [BLUE]: 13, [YELLOW]: 26, [GREEN]: 39 })
// Home indices are local to each color. They never participate in track collisions.
export const HOME_STRAIGHTS = Object.freeze(Object.fromEntries(COLORS.map(color => [
    color,
    Object.freeze(Array.from({ length: 5 }, (_, index) => index)),
])))
export const HOME_STRAIGHT_STEPS = Object.freeze(Array.from({ length: 5 }, (_, index) => 52 + index))
export const BASE_STEP = 0
export const GOAL_STEP = 57

const PLAYER_PAIRS = {
    'red-yellow': [RED, YELLOW],
    'blue-green': [BLUE, GREEN],
}

const colorName = color => String(color || '').toLowerCase()

export function getGlobalTrackIndex(color, stepCounter) {
    const start = COLOR_STARTS[colorName(color)]
    if (!Number.isInteger(stepCounter) || stepCounter < 1 || stepCounter > 51 || !Number.isInteger(start)) return null
    return (start + stepCounter - 1) % MAIN_TRACK.length
}

export function getHomeIndex(color, stepCounter) {
    const straight = HOME_STRAIGHTS[colorName(color)]
    if (!straight || !Number.isInteger(stepCounter) || stepCounter < 52 || stepCounter > 56) return null
    return straight[stepCounter - 52]
}

export function createToken(color, number = 1, stepCounter = BASE_STEP) {
    return { id: `${color}-${number}`, color, number, stepCounter }
}

export function createTokens() {
    return Object.fromEntries(COLORS.map(color => [
        color,
        Array.from({ length: TOKENS_PER_COLOR }, (_, index) => createToken(color, index + 1)),
    ]))
}

export function isMovable(token, roll) {
    if (!token || !Number.isInteger(roll) || roll < 1 || roll > 6) return false
    const step = token.stepCounter
    if (!Number.isInteger(step) || step < BASE_STEP || step > GOAL_STEP || step === GOAL_STEP) return false
    if (step === BASE_STEP) return roll === 6
    return step + roll <= GOAL_STEP
}

export function getMovableTokens(tokens, colorOrRoll, maybeRoll) {
    const filterColor = maybeRoll === undefined ? null : colorName(colorOrRoll)
    const roll = maybeRoll === undefined ? colorOrRoll : maybeRoll
    const collection = Array.isArray(tokens)
        ? tokens
        : tokens && Object.prototype.hasOwnProperty.call(tokens, 'stepCounter')
            ? [tokens]
            : Object.values(tokens || {}).flat()
    return collection.filter(token => (!filterColor || token.color === filterColor) && isMovable(token, roll))
}

export function canMoveToken(token, roll) {
    return isMovable(token, roll)
}

export function getActiveColors(playerCount = 2, pair = 'red-yellow') {
    if (Number(playerCount) === 4) return [...COLORS]
    const selected = PLAYER_PAIRS[pair] || PLAYER_PAIRS['red-yellow']
    return COLORS.filter(color => selected.includes(color))
}

export function createPlayerConfiguration(playerCount = 2, pair = 'red-yellow') {
    const activeColors = getActiveColors(playerCount, pair)
    return {
        playerCount: Number(playerCount) === 4 ? 4 : 2,
        pair: PLAYER_PAIRS[pair] ? pair : 'red-yellow',
        activeColors,
        inactiveColors: COLORS.filter(color => !activeColors.includes(color)),
    }
}

export const configurePlayers = createPlayerConfiguration
export const getPlayerConfiguration = createPlayerConfiguration

export function nextActiveColor(color, activeColors = COLORS) {
    const index = COLORS.indexOf(colorName(color))
    for (let offset = 1; offset <= COLORS.length; offset++) {
        const candidate = COLORS[(index + offset) % COLORS.length]
        if (activeColors.includes(candidate)) return candidate
    }
    return null
}

function cloneTokens(tokens) {
    return Object.fromEntries(COLORS.map(color => [
        color,
        (tokens?.[color] || []).map(token => ({ ...token })),
    ]))
}

function getTokenById(tokens, tokenRef) {
    const id = typeof tokenRef === 'string' ? tokenRef : tokenRef?.id
    if (!id) return null
    for (const color of COLORS) {
        const token = (tokens?.[color] || []).find(candidate => candidate.id === id)
        if (token) return token
    }
    return null
}

function withTurnReset(state, nextColor, message, sixStreak = 0) {
    return {
        ...state,
        currentColor: nextColor,
        pendingRoll: null,
        movableTokenIds: [],
        selectedTokenId: null,
        sixStreak,
        turnNumber: (state.turnNumber || 1) + (nextColor === state.currentColor ? 0 : 1),
        message,
    }
}

function playerTokens(state, color) {
    return state.tokens?.[color] || []
}

export function createGameState({ playerCount = 2, pair = 'red-yellow', phase = 'lobby' } = {}) {
    const players = createPlayerConfiguration(playerCount, pair)
    return {
        ...players,
        phase,
        tokens: createTokens(),
        currentColor: players.activeColors[0],
        dice: null,
        lastRollColor: null,
        pendingRoll: null,
        movableTokenIds: [],
        selectedTokenId: null,
        sixStreak: 0,
        winner: null,
        gameOver: false,
        turnNumber: 1,
        lastMove: null,
        message: phase === 'lobby' ? 'Choose players, then start the match.' : 'Roll the dice to begin.',
    }
}

export function startMatch(state) {
    return createGameState({ playerCount: state?.playerCount, pair: state?.pair, phase: 'playing' })
}

export function applyRoll(state, roll) {
    if (!state || state.phase !== 'playing' || state.gameOver || state.pendingRoll !== null) return state
    if (!Number.isInteger(roll) || roll < 1 || roll > 6) return state

    const nextSixStreak = roll === 6 ? (state.sixStreak || 0) + 1 : 0
    const activeColors = state.activeColors || COLORS
    const nextColor = nextActiveColor(state.currentColor, activeColors)
    if (nextSixStreak >= 3) {
        return withTurnReset(
            { ...state, dice: roll, lastRollColor: state.currentColor, lastMove: { type: 'triple-six', roll } },
            nextColor,
            'Three sixes. The turn passes clockwise.',
            0,
        )
    }

    const movable = getMovableTokens(playerTokens(state, state.currentColor), roll)
    if (!movable.length) {
        const bonus = roll === 6
        return withTurnReset(
            { ...state, dice: roll, lastRollColor: state.currentColor, lastMove: { type: 'no-move', roll, bonus } },
            bonus ? state.currentColor : nextColor,
            bonus ? `${state.currentColor} rolled six but has no legal move. Roll again.` : `${state.currentColor} rolled ${roll} and has no legal move. Turn passes clockwise.`,
            bonus ? nextSixStreak : 0,
        )
    }

    return {
        ...state,
        dice: roll,
        lastRollColor: state.currentColor,
        pendingRoll: roll,
        movableTokenIds: movable.map(token => token.id),
        selectedTokenId: null,
        sixStreak: nextSixStreak,
        message: `${state.currentColor} rolled ${roll}. Choose a highlighted token.`,
    }
}

export function moveToken(state, tokenRef) {
    if (!state || state.phase !== 'playing' || state.gameOver || state.pendingRoll === null) return state
    const token = getTokenById(state.tokens, tokenRef)
    const activeColors = state.activeColors || COLORS
    if (!token || token.color !== state.currentColor || !activeColors.includes(token.color) ||
        !state.movableTokenIds?.includes(token.id) || !canMoveToken(token, state.pendingRoll)) return state

    const roll = state.pendingRoll
    const nextStep = token.stepCounter === BASE_STEP ? 1 : token.stepCounter + roll
    const nextTokens = cloneTokens(state.tokens)
    const movedToken = nextTokens[token.color].find(candidate => candidate.id === token.id)
    movedToken.stepCounter = nextStep
    const destination = getGlobalTrackIndex(token.color, nextStep)
    const knockedOut = []

    if (destination !== null) {
        // Every main-track tile, including starts, can be captured. Passing over is safe.
        for (const color of activeColors) {
            if (color === token.color) continue
            for (const opponent of nextTokens[color]) {
                if (opponent.stepCounter === BASE_STEP || opponent.stepCounter === GOAL_STEP) continue
                if (getGlobalTrackIndex(color, opponent.stepCounter) === destination) {
                    opponent.stepCounter = BASE_STEP
                    knockedOut.push(opponent.id)
                }
            }
        }
    }

    const winner = nextTokens[token.color].length === TOKENS_PER_COLOR &&
        nextTokens[token.color].every(candidate => candidate.stepCounter === GOAL_STEP)
    if (winner) {
        return {
            ...state,
            tokens: nextTokens,
            dice: roll,
            pendingRoll: null,
            movableTokenIds: [],
            selectedTokenId: token.id,
            lastMove: { type: 'move', tokenId: token.id, from: token.stepCounter, to: nextStep, roll, knockedOut },
            winner: token.color,
            gameOver: true,
            phase: 'over',
            message: `${token.color} wins the match with all four tokens home.`,
        }
    }

    const bonus = roll === 6 || knockedOut.length > 0
    const nextColor = bonus ? token.color : nextActiveColor(token.color, activeColors)
    const nextStreak = bonus && roll === 6 ? (state.sixStreak || 0) : 0
    return {
        ...state,
        tokens: nextTokens,
        dice: roll,
        pendingRoll: null,
        movableTokenIds: [],
        selectedTokenId: token.id,
        currentColor: nextColor,
        sixStreak: nextStreak,
        turnNumber: bonus ? (state.turnNumber || 1) : (state.turnNumber || 1) + 1,
        lastMove: { type: 'move', tokenId: token.id, from: token.stepCounter, to: nextStep, roll, knockedOut, bonus },
        message: knockedOut.length
            ? `${token.color} sent an opponent home and rolls again.`
            : bonus
                ? `${token.color} gets a bonus turn.`
                : `${nextColor} to play. Pass the device to ${nextColor}.`,
    }
}
