import test from 'node:test'
import assert from 'node:assert/strict'
import { BaghChalEngine, BOARD_EDGES, GOAT, TIGER } from '../src/components/games/BaghChalGame/BaghChalGame.logic.js'

const snapshot = game => JSON.stringify({ ...game, positionCounts: [...game.positionCounts],
    undoStates: game.undoStates.map(state => ({ ...state, positionCounts: [...state.positionCounts] })) })

function nearTrap() {
    const game = new BaghChalEngine()
    for (const position of [1, 2, 3, 5, 6, 8, 9, 10, 14, 15, 16, 18, 19, 21, 22, 23]) game.board[position] = GOAT
    game.goatsPlaced = 16
    return game
}

function movementPosition() {
    const game = new BaghChalEngine()
    const empty = [1, 6, 11, 13, 17]
    for (let position = 0; position < 25; position++) {
        if (!game.board[position] && !empty.includes(position)) game.board[position] = GOAT
    }
    game.goatsPlaced = 20
    game.goatsCaptured = 4
    game.gamePhase = 'movement'
    game.currentPlayer = 'tiger'
    game.positionCounts = new Map([[game.positionKey(), 1]])
    return game
}

test('traditional board has 40 orthogonal edges and 16 parity-node diagonals', () => {
    const game = new BaghChalEngine()
    assert.equal(BOARD_EDGES.length, 56)
    assert.deepEqual(game.getValidAdjacents(0).sort((a, b) => a - b), [1, 5, 6])
    assert.deepEqual(game.getValidAdjacents(1).sort((a, b) => a - b), [0, 2, 6])
    assert.deepEqual(game.getValidAdjacents(12).sort((a, b) => a - b), [6, 7, 8, 11, 13, 16, 17, 18])
    for (let from = 0; from < 25; from++) {
        for (const to of game.getValidAdjacents(from)) {
            assert.ok(game.getValidAdjacents(to).includes(from), `${from} to ${to} must be bidirectional`)
            const dr = Math.abs(Math.floor(to / 5) - Math.floor(from / 5))
            const dc = Math.abs(to % 5 - from % 5)
            assert.ok(dr <= 1 && dc <= 1)
            if (dr && dc) assert.equal((Math.floor(from / 5) + from % 5) % 2, 0)
        }
    }
    assert.deepEqual(game.getValidAdjacents(-1), [])
    assert.deepEqual(game.getValidAdjacents(2.5), [])
})

test('placement validates turns, coordinates, occupied points and immobile goats', () => {
    const game = new BaghChalEngine()
    const before = snapshot(game)
    for (const position of [-1, 25, 1.5, NaN, undefined, 0]) assert.equal(game.placeGoat(position).success, false)
    assert.equal(game.moveTiger(0, { type: 'move', to: 1 }).success, false)
    assert.equal(snapshot(game), before)
    assert.equal(game.placeGoat(12).success, true)
    assert.equal(game.goatsPlaced, 1)
    assert.equal(game.currentPlayer, 'tiger')
    assert.equal(game.placeGoat(7).success, false)
    assert.deepEqual(game.getGoatValidMoves(12), [])
    assert.equal(game.moveTiger(0, { type: 'move', to: 1 }).success, true)
    assert.equal(game.moveGoat(12, 7).success, false)
    // Once a tiger leaves a corner, a goat may be placed there.
    assert.equal(game.placeGoat(0).success, true)
})

test('tigers jump one goat along two connected straight segments only', () => {
    const game = new BaghChalEngine()
    game.placeGoat(6)
    assert.ok(game.getTigerCaptures(0).some(move => move.to === 12 && move.over === 6))
    const before = snapshot(game)
    assert.equal(game.moveTiger(0, { type: 'capture', over: 6, to: 7 }).success, false)
    assert.equal(game.moveTiger(0, { type: 'capture', over: 5, to: 12 }).success, false)
    assert.equal(game.moveTiger(-1, null).success, false)
    assert.equal(snapshot(game), before)
    assert.equal(game.moveTiger(0, { type: 'capture', over: 6, to: 12 }).success, true)
    assert.equal(game.board[6], 0)
    assert.equal(game.board[12], TIGER)
    assert.equal(game.goatsCaptured, 1)
    assert.equal(game.goatsPlaced, 1)
    assert.equal(game.currentPlayer, 'goat')
    assert.deepEqual(game.tigerPositions, [4, 12, 20, 24])

    const odd = new BaghChalEngine()
    odd.board[0] = 0
    odd.board[1] = TIGER
    odd.board[7] = GOAT
    odd.goatsPlaced = 1
    odd.currentPlayer = 'tiger'
    assert.equal(odd.getTigerCaptures(1).some(move => move.to === 13), false)
    assert.equal(odd.moveTiger(1, { type: 'capture', over: 7, to: 13 }).success, false)
})

test('the twentieth placement starts real movement with correct surviving goat counts', () => {
    const game = new BaghChalEngine()
    for (let position = 0; position < 25; position++) {
        if (!game.board[position] && ![1, 7, 13].includes(position)) game.board[position] = GOAT
    }
    game.goatsPlaced = 19
    game.goatsCaptured = 1
    assert.equal(game.placeGoat(7).success, true)
    assert.equal(game.gamePhase, 'movement')
    assert.equal(game.goatsPlaced, 20)
    assert.equal(game.board.filter(piece => piece === GOAT).length, 19)
    assert.equal(game.currentPlayer, 'tiger')
    assert.equal(game.moveTiger(0, { type: 'move', to: 1 }).success, true)
    assert.equal(game.placeGoat(0).success, false)
    assert.ok(game.getGoatValidMoves(6).includes(0))
    assert.equal(game.moveGoat(6, 0).success, true)
    assert.equal(game.goatsPlaced, 20)
    assert.equal(game.goatsCaptured, 1)
    assert.equal(game.undo(), true)
    assert.equal(game.undo(), true)
    assert.equal(game.undo(), true)
    assert.equal(game.gamePhase, 'placement')
    assert.equal(game.goatsPlaced, 19)
})

test('all tigers can be trapped during placement; terminal moves and AI are rejected', () => {
    const game = nearTrap()
    assert.equal(game.canTigersMove(), true)
    assert.equal(game.placeGoat(12).success, true)
    assert.equal(game.goatsPlaced, 17)
    assert.equal(game.gamePhase, 'placement')
    assert.equal(game.winner, 'goat')
    assert.equal(game.reason, 'tigers_blocked')
    assert.equal(game.gameOver, true)
    const before = snapshot(game)
    assert.deepEqual(game.getLegalMoves(), [])
    assert.equal(game.getBestAIMove('hard'), null)
    assert.equal(game.moveTiger(0, { type: 'move', to: 1 }).success, false)
    assert.equal(game.placeGoat(7).success, false)
    assert.equal(snapshot(game), before)
    assert.equal(game.undo(), true)
    assert.equal(game.gameOver, false)
    assert.equal(game.board[12], 0)
    assert.equal(game.goatsPlaced, 16)
})

test('all AI levels find fifth-capture wins and goat trapping wins', () => {
    for (const difficulty of ['easy', 'medium', 'hard']) {
        const tiger = new BaghChalEngine()
        tiger.board[1] = GOAT
        tiger.goatsPlaced = 5
        tiger.goatsCaptured = 4
        tiger.currentPlayer = 'tiger'
        const before = snapshot(tiger)
        const move = tiger.getBestAIMove(difficulty)
        assert.equal(snapshot(tiger), before)
        assert.equal(tiger.moveTiger(move.from, move.move).success, true)
        assert.equal(tiger.winner, 'tiger')
        assert.equal(tiger.goatsCaptured, 5)
        assert.equal(tiger.gameOver, true)
        assert.equal(tiger.getBestAIMove(), null)

        const goat = nearTrap()
        assert.equal(goat.getBestAIMove(difficulty).place, 12)
    }
})

test('goat AI blocks the fifth capture instead of maximizing the tiger score', () => {
    for (const difficulty of ['medium', 'hard']) {
        const game = new BaghChalEngine()
        game.board[1] = GOAT
        game.goatsPlaced = 5
        game.goatsCaptured = 4
        const before = snapshot(game)
        const move = game.chooseAIMove(difficulty)
        assert.equal(move.type, 'place')
        assert.equal(move.to, 2)
        assert.equal(snapshot(game), before)
        game.applyMove(move)
        assert.equal(game.getLegalMoves().some(candidate => candidate.type === 'capture'), false)
    }
})

test('AI searches the last placement through the real phase transition', () => {
    const game = new BaghChalEngine()
    for (let position = 0; position < 25; position++) {
        if (!game.board[position] && ![1, 2, 13].includes(position)) game.board[position] = GOAT
    }
    game.goatsPlaced = 19
    game.goatsCaptured = 1
    const before = snapshot(game)
    for (const difficulty of ['medium', 'hard']) {
        const move = game.chooseAIMove(difficulty)
        const child = game.clone()
        assert.equal(child.applyMove(move).success, true)
        assert.equal(child.gamePhase, 'movement')
        assert.equal(child.goatsPlaced, 20)
        assert.equal(child.currentPlayer, 'tiger')
        assert.equal(child.gameOver, false)
        const reply = child.chooseAIMove(difficulty)
        assert.equal(child.applyMove(reply).success, true)
        assert.equal(child.currentPlayer, 'goat')
        assert.ok(child.getLegalMoves().every(candidate => candidate.type === 'move'))
    }
    assert.equal(snapshot(game), before)
})

test('threefold repetition is a draw; undo restores playable repetition state', () => {
    const game = movementPosition()
    for (let cycle = 0; cycle < 2; cycle++) {
        assert.equal(game.moveTiger(0, { type: 'move', to: 1 }).success, true)
        assert.equal(game.moveGoat(7, 6).success, true)
        assert.equal(game.moveTiger(1, { type: 'move', to: 0 }).success, true)
        assert.equal(game.moveGoat(6, 7).success, true)
    }
    assert.equal(game.gameOver, true)
    assert.equal(game.winner, null)
    assert.equal(game.reason, 'repetition')
    assert.equal(game.chooseAIMove('hard'), null)
    assert.equal(game.undo(), true)
    assert.equal(game.gameOver, false)
    assert.equal(game.currentPlayer, 'goat')
    assert.equal(game.moveGoat(6, 7).success, true)
    assert.equal(game.reason, 'repetition')
})

test('clone, undo and restart preserve prototypes and isolate all mutable game state', () => {
    const game = new BaghChalEngine()
    game.placeGoat(1)
    game.moveTiger(0, { type: 'capture', over: 1, to: 2 })
    const before = snapshot(game)
    const clone = game.clone()
    assert.ok(clone instanceof BaghChalEngine)
    assert.equal(clone.undo(), true)
    assert.equal(clone.board[0], TIGER)
    assert.equal(clone.board[1], GOAT)
    assert.equal(clone.goatsCaptured, 0)
    clone.moveHistory[0].to = 8
    clone.positionCounts.clear()
    clone.undoStates[0].board[4] = 0
    assert.equal(snapshot(game), before)
    clone.resetGame()
    assert.equal(clone.moveCounter, 0)
    assert.equal(clone.gamePhase, 'placement')
    assert.equal(clone.gameOver, false)
    assert.equal(clone.undo(), false)
    assert.deepEqual(clone.tigerPositions, [0, 4, 20, 24])
})

test('bounded AI returns legal moves without mutations for both roles and phases', () => {
    const fixtures = [new BaghChalEngine(), new BaghChalEngine(), movementPosition(), movementPosition()]
    fixtures[1].placeGoat(12)
    fixtures[3].moveTiger(0, { type: 'move', to: 1 })
    for (const game of fixtures) {
        const before = snapshot(game)
        assert.equal(game.evaluatePosition('goat'), -game.evaluatePosition('tiger'))
        for (const difficulty of ['easy', 'medium', 'hard']) {
            const move = game.chooseAIMove(difficulty)
            assert.ok(game.getLegalMoves().some(legal => JSON.stringify(legal) === JSON.stringify(move)))
            const copy = game.clone()
            assert.equal(copy.applyMove(move).success, true)
            assert.equal(copy.board.filter(piece => piece === TIGER).length, 4)
            assert.equal(copy.board.filter(piece => piece === GOAT).length, copy.goatsPlaced - copy.goatsCaptured)
        }
        assert.equal(snapshot(game), before)
    }
})
