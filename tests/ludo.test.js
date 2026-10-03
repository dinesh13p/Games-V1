import test from 'node:test'
import assert from 'node:assert/strict'
import {
    BLUE,
    COLORS,
    GREEN,
    HOME_STRAIGHTS,
    MAIN_TRACK,
    RED,
    YELLOW,
    applyRoll,
    canMoveToken,
    createGameState,
    createPlayerConfiguration,
    createToken,
    getActiveColors,
    getGlobalTrackIndex,
    getHomeIndex,
    getMovableTokens,
    isMovable,
    moveToken,
    nextActiveColor,
    startMatch,
} from '../src/components/games/Ludo/Ludo.logic.js'

const playing = options => startMatch(createGameState({ playerCount: 4, ...options }))
const withSteps = (state, changes) => {
    const next = structuredClone(state)
    for (const [id, stepCounter] of Object.entries(changes)) {
        const color = id.split('-')[0]
        const token = next.tokens[color].find(candidate => candidate.id === id)
        token.stepCounter = stepCounter
    }
    return next
}

test('linear board arrays have the required lengths and step indices', () => {
    assert.equal(MAIN_TRACK.length, 52)
    assert.deepEqual(MAIN_TRACK, Array.from({ length: 52 }, (_, index) => index))
    for (const color of COLORS) {
        assert.equal(HOME_STRAIGHTS[color].length, 5)
        assert.deepEqual(HOME_STRAIGHTS[color], [0, 1, 2, 3, 4])
    }
})

test('two-player pairs and four-player configuration activate the right colors', () => {
    assert.deepEqual(new Set(getActiveColors(2, 'red-yellow')), new Set([RED, YELLOW]))
    assert.deepEqual(new Set(getActiveColors(2, 'blue-green')), new Set([BLUE, GREEN]))
    assert.deepEqual(getActiveColors(4), COLORS)
    const pair = createPlayerConfiguration(2, 'blue-green')
    assert.deepEqual(new Set(pair.inactiveColors), new Set([RED, YELLOW]))
    assert.equal(pair.activeColors.length, 2)
})

test('every color maps step one to its start and steps two through fifty-one clockwise', () => {
    assert.equal(getGlobalTrackIndex(RED, 1), 0)
    assert.equal(getGlobalTrackIndex(BLUE, 1), 13)
    assert.equal(getGlobalTrackIndex(YELLOW, 1), 26)
    assert.equal(getGlobalTrackIndex(GREEN, 1), 39)
    for (const color of COLORS) {
        assert.equal(getGlobalTrackIndex(color, 51), (getGlobalTrackIndex(color, 1) + 50) % 52)
        assert.equal(getHomeIndex(color, 52), 0)
        assert.equal(getHomeIndex(color, 56), 4)
        assert.equal(getGlobalTrackIndex(color, 0), null)
        assert.equal(getHomeIndex(color, 57), null)
    }
})

test('base tokens require six, six exits base, and normal moves advance linearly', () => {
    const token = createToken(RED, 1)
    assert.equal(isMovable(token, 5), false)
    assert.equal(canMoveToken(token, 6), true)
    assert.deepEqual(getMovableTokens([token], 5), [])
    assert.equal(getMovableTokens({ red: [token], green: [createToken(GREEN, 1, 1)] }, RED, 6).length, 1)

    let game = playing({ playerCount: 2, pair: 'red-yellow' })
    game = applyRoll(game, 6)
    assert.deepEqual(game.movableTokenIds, ['red-1', 'red-2', 'red-3', 'red-4'])
    game = moveToken(game, 'red-1')
    assert.equal(game.tokens[RED][0].stepCounter, 1)
    assert.equal(game.currentColor, RED)
    game = applyRoll(game, 2)
    game = moveToken(game, 'red-1')
    assert.equal(game.tokens[RED][0].stepCounter, 3)
})

test('a turn with no legal move rotates, while a no-move six is a bonus turn', () => {
    const noMove = withSteps(playing({ playerCount: 2, pair: 'red-yellow' }), {
        'red-1': 57, 'red-2': 57, 'red-3': 57, 'red-4': 57,
    })
    const passed = applyRoll(noMove, 1)
    assert.equal(passed.currentColor, YELLOW)
    assert.equal(passed.pendingRoll, null)

    const bonus = applyRoll(noMove, 6)
    assert.equal(bonus.currentColor, RED)
    assert.equal(bonus.sixStreak, 1)
    assert.equal(bonus.pendingRoll, null)
})

test('home straight requires the exact roll to reach goal', () => {
    let game = withSteps(playing(), { 'red-1': 56 })
    game = applyRoll(game, 1)
    game = moveToken(game, 'red-1')
    assert.equal(game.tokens[RED][0].stepCounter, 57)

    const blocked = withSteps(playing(), { 'red-1': 56 })
    assert.equal(isMovable(blocked.tokens[RED][0], 2), false)
    assert.deepEqual(getMovableTokens(blocked.tokens[RED], 2), [])
})

test('exact landing resets an opponent and gives the attacker a bonus turn', () => {
    let game = withSteps(playing(), { 'red-1': 1, 'yellow-1': 28 })
    game = applyRoll(game, 1)
    game = moveToken(game, 'red-1')
    assert.equal(game.tokens[RED][0].stepCounter, 2)
    assert.equal(game.tokens[YELLOW][0].stepCounter, 0)
    assert.equal(game.currentColor, RED)
    assert.equal(game.lastMove.knockedOut[0], 'yellow-1')
})

test('own tokens are safe on an exact landing', () => {
    let game = withSteps(playing(), { 'red-1': 1, 'red-2': 2 })
    game = applyRoll(game, 1)
    game = moveToken(game, 'red-1')
    assert.equal(game.tokens[RED][0].stepCounter, 2)
    assert.equal(game.tokens[RED][1].stepCounter, 2)
    assert.equal(game.tokens[GREEN][0].stepCounter, 0)
    assert.equal(game.currentColor, BLUE)
})

test('three consecutive sixes skip the turn and reset the streak', () => {
    let game = playing({ playerCount: 2, pair: 'red-yellow' })
    game = moveToken(applyRoll(game, 6), 'red-1')
    assert.equal(game.sixStreak, 1)
    game = moveToken(applyRoll(game, 6), 'red-2')
    assert.equal(game.sixStreak, 2)
    game = applyRoll(game, 6)
    assert.equal(game.currentColor, YELLOW)
    assert.equal(game.sixStreak, 0)
    assert.equal(game.pendingRoll, null)
})

test('clockwise rotation skips inactive colors', () => {
    assert.equal(nextActiveColor(RED, [RED, YELLOW]), YELLOW)
    assert.equal(nextActiveColor(YELLOW, [RED, YELLOW]), RED)
    assert.equal(nextActiveColor(RED, [RED, GREEN, YELLOW, BLUE]), BLUE)
})

test('all four tokens at goal detect a winner', () => {
    let game = withSteps(playing({ playerCount: 2, pair: 'red-yellow' }), {
        'red-1': 57,
        'red-2': 57,
        'red-3': 57,
        'red-4': 56,
    })
    game = moveToken(applyRoll(game, 1), 'red-4')
    assert.equal(game.winner, RED)
    assert.equal(game.gameOver, true)
    assert.equal(game.phase, 'over')
})

test('illegal rolls and token choices do not mutate the game', () => {
    const game = playing()
    const before = JSON.stringify(game)
    assert.equal(applyRoll(game, 7), game)
    assert.equal(JSON.stringify(game), before)
    assert.equal(moveToken(game, 'red-1'), game)
    assert.equal(JSON.stringify(game), before)

    const rolled = applyRoll(game, 1)
    const rolledBefore = JSON.stringify(rolled)
    assert.equal(moveToken(rolled, 'red-1'), rolled)
    assert.equal(JSON.stringify(rolled), rolledBefore)
})
