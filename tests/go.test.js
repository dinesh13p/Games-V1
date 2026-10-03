import test from 'node:test'
import assert from 'node:assert/strict'
import { BLACK, WHITE, GoGameEngine } from '../src/components/games/GoGame/GoGame.logic.js'

test('Gomoku validates coordinates, occupied intersections and alternating players', () => {
    const game = new GoGameEngine()
    assert.equal(game.currentPlayer, BLACK)
    for (const [row, col] of [[-1, 0], [9, 0], [0, 9], [0.5, 2], [NaN, 0], [0, undefined]]) {
        assert.equal(game.makeMove(row, col), false)
    }
    assert.equal(game.makeMove(4, 4), true)
    assert.equal(game.board[4][4], BLACK)
    assert.equal(game.currentPlayer, WHITE)
    assert.equal(game.makeMove(4, 4), false)
    assert.equal(game.moveHistory.length, 1)
    assert.equal(game.makeMove(4, 5), true)
    assert.equal(game.board[4][5], WHITE)
})

test('five in every direction wins, and completed games reject moves and AI', () => {
    for (const [dr, dc, row, col] of [[0, 1, 4, 0], [1, 0, 0, 4], [1, 1, 0, 0], [1, -1, 0, 8]]) {
        const game = new GoGameEngine()
        for (let step = 0; step < 4; step++) game.board[row + step * dr][col + step * dc] = BLACK
        assert.equal(game.makeMove(row + 4 * dr, col + 4 * dc), true)
        assert.equal(game.winner, BLACK)
        assert.equal(game.gameOver, true)
        assert.equal(game.getWinningLine().length, 5)
        const before = JSON.stringify(game)
        assert.equal(game.makeMove(8, 4), false)
        assert.deepEqual(game.getValidMoves(), [])
        assert.equal(game.getAIMove('hard'), null)
        assert.equal(JSON.stringify(game), before)
    }
})

test('a line longer than five is a Gomoku win', () => {
    const game = new GoGameEngine()
    for (const col of [1, 2, 3, 5, 6]) game.board[4][col] = BLACK
    game.makeMove(4, 4)
    assert.equal(game.winner, BLACK)
    assert.equal(game.getWinningLine().length, 6)
})

test('a full board without a line ends in a draw and can be undone', () => {
    const game = new GoGameEngine(5)
    const finalBoard = [
        [1, 1, 2, 2, 1],
        [2, 2, 1, 1, 2],
        [1, 2, 1, 2, 1],
        [2, 2, 1, 1, 2],
        [1, 2, 1, 2, 1],
    ]
    const black = []
    const white = []
    finalBoard.forEach((row, r) => row.forEach((piece, c) => {
        if (r === 4 && c === 4) return
        ;(piece === BLACK ? black : white).push([r, c])
    }))
    for (let i = 0; i < 12; i++) {
        assert.equal(game.makeMove(...black[i]), true)
        assert.equal(game.makeMove(...white[i]), true)
    }
    assert.equal(game.makeMove(4, 4), true)
    assert.equal(game.gameOver, true)
    assert.equal(game.winner, null)
    finalBoard.forEach((row, r) => row.forEach((piece, c) => assert.equal(game.checkWin(r, c, piece), false)))
    assert.equal(game.getAIMove(), null)
    assert.equal(game.undo(), true)
    assert.equal(game.gameOver, false)
    assert.equal(game.currentPlayer, BLACK)
    assert.equal(game.isValidMove(4, 4), true)
})

test('every AI level takes an immediate win before blocking', () => {
    for (const difficulty of ['easy', 'medium', 'hard']) {
        const game = new GoGameEngine()
        game.board[2] = [WHITE, BLACK, BLACK, BLACK, BLACK, 0, 0, 0, 0]
        game.board[6] = [BLACK, WHITE, WHITE, WHITE, WHITE, 0, 0, 0, 0]
        assert.deepEqual(game.getAIMove(difficulty), { row: 2, col: 5 })
        game.board[2][3] = 0
        assert.deepEqual(game.getAIMove(difficulty), { row: 6, col: 5 })
    }
})

test('AI blocks broken four-stone lines, including white to play', () => {
    for (const difficulty of ['easy', 'medium', 'hard']) {
        const game = new GoGameEngine()
        game.board[3] = [WHITE, BLACK, BLACK, 0, BLACK, BLACK, WHITE, 0, 0]
        game.currentPlayer = WHITE
        assert.deepEqual(game.getAIMove(difficulty), { row: 3, col: 3 })
    }
})

test('hard AI finds an open four with two winning continuations without mutating state', () => {
    const game = new GoGameEngine()
    game.board[4][2] = BLACK
    game.board[4][3] = BLACK
    game.board[4][5] = BLACK
    game.board[2][2] = WHITE
    game.board[6][6] = WHITE
    const before = JSON.stringify(game)
    const move = game.getAIMove('hard')
    assert.deepEqual(move, { row: 4, col: 4 })
    assert.equal(JSON.stringify(game), before)
    game.makeMove(move.row, move.col)
    assert.equal(game.wouldWin(4, 1, BLACK), true)
    assert.equal(game.wouldWin(4, 6, BLACK), true)
})

test('AI returns legal moves on both board sizes and leaves live state untouched', () => {
    for (const size of [9, 13]) {
        const game = new GoGameEngine(size)
        game.makeMove(4, 4)
        const before = JSON.stringify(game)
        for (const difficulty of ['easy', 'medium', 'hard']) {
            const move = game.getAIMove(difficulty)
            assert.equal(game.isValidMove(move.row, move.col), true)
        }
        assert.equal(game.wouldWin(-1, 0, WHITE), false)
        assert.equal(game.wouldWin(4, 4, WHITE), false)
        assert.equal(JSON.stringify(game), before)
    }
})

test('clones preserve the engine prototype and isolate board, history and undo', () => {
    const original = new GoGameEngine()
    original.makeMove(4, 4)
    const clone = original.clone()
    assert.ok(clone instanceof GoGameEngine)
    assert.equal(clone.makeMove(4, 5), true)
    clone.moveHistory[0].row = 3
    assert.equal(original.moveHistory[0].row, 4)
    assert.equal(original.board[4][5], 0)
    assert.equal(clone.undo(), true)
    assert.equal(clone.board[4][5], 0)
    assert.equal(clone.currentPlayer, WHITE)
    assert.equal(original.undo(), true)
    assert.equal(original.currentPlayer, BLACK)
    assert.equal(original.undo(), false)
})
