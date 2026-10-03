import test from 'node:test'
import assert from 'node:assert/strict'
import {
    BOARD_SIZE, DIRECTIONS, createSnakeState, moveSnake, queueDirection, randFood, snakeReducer, tickSnake,
} from '../src/components/games/SnakeGame/SnakeGame.logic.js'
import {
    calculateWinner, createTicTacToeState, getAiMove, getBestMove, ticTacToeReducer,
} from '../src/components/games/TicTacToe/TicTacToe.logic.js'
import {
    DIFFICULTIES, createBoard, createMinesweeperState, describeCell, floodReveal, minesweeperReducer,
    neighbors, revealCell, safeFirstClick, toggleFlag,
} from '../src/components/games/Minesweeper/Minesweeper.logic.js'

const fixedRandom = () => 0
const runningSnake = () => ({ ...createSnakeState(fixedRandom), status: 'running' })

test('Snake grows on food, scores once, and does not mutate its previous state', () => {
    const state = { ...runningSnake(), food: [10, 11] }
    const before = JSON.stringify(state)
    const next = tickSnake(state, fixedRandom)
    assert.equal(next.snake.length, state.snake.length + 1)
    assert.equal(next.score, 10)
    assert.deepEqual(next.snake[0], [10, 11])
    assert.ok(!next.snake.some(([r, c]) => next.food[0] === r && next.food[1] === c))
    assert.equal(JSON.stringify(state), before)
})

test('Snake accepts one turn per tick and prevents rapid reversal races', () => {
    const state = runningSnake()
    assert.equal(queueDirection(state, DIRECTIONS.left), state)
    const up = queueDirection(state, DIRECTIONS.up)
    assert.equal(queueDirection(up, DIRECTIONS.left), up)
    assert.equal(queueDirection(up, DIRECTIONS.down), up)
    const advanced = tickSnake(up)
    assert.deepEqual(advanced.snake[0], [9, 10])
    assert.deepEqual(queueDirection(advanced, DIRECTIONS.left).nextDirection, DIRECTIONS.left)
})

test('Snake can move into its vacating tail, but not a growing tail or its body', () => {
    const snake = [[1, 1], [1, 0], [2, 0], [2, 1]]
    assert.ok(moveSnake(snake, DIRECTIONS.down, [9, 9]))
    assert.equal(moveSnake(snake, DIRECTIONS.down, [9, 9], 1), null)
    assert.equal(moveSnake(snake, DIRECTIONS.left, [9, 9]), null)
    assert.equal(moveSnake([[0, 0]], DIRECTIONS.up, [9, 9]), null)
})

test('Snake full-board food selection is bounded and the final meal wins', () => {
    const path = Array.from({ length: BOARD_SIZE }, (_, row) =>
        Array.from({ length: BOARD_SIZE }, (_, col) => [row, row % 2 ? BOARD_SIZE - 1 - col : col])).flat()
    assert.equal(randFood(path, fixedRandom), null)
    const almostFull = { ...runningSnake(), snake: path.slice(1), direction: DIRECTIONS.left, nextDirection: DIRECTIONS.left, food: path[0] }
    assert.deepEqual(randFood(almostFull.snake, fixedRandom), [0, 0])
    const won = tickSnake(almostFull, fixedRandom)
    assert.equal(won.status, 'won')
    assert.equal(won.snake.length, BOARD_SIZE * BOARD_SIZE)
    assert.equal(won.food, null)
    assert.equal(tickSnake(won), won)
})

test('Snake pause, collision, and restart preserve the lifecycle', () => {
    const state = runningSnake()
    const paused = snakeReducer(state, { type: 'pause' })
    assert.equal(tickSnake(paused), paused)
    assert.equal(queueDirection(paused, DIRECTIONS.up), paused)
    assert.equal(snakeReducer(paused, { type: 'resume' }).status, 'running')
    const lost = tickSnake({ ...state, snake: [[10, 19], [10, 18]] })
    assert.equal(lost.status, 'lost')
    assert.equal(tickSnake(lost), lost)
    assert.equal(snakeReducer(lost, { type: 'resume' }), lost)
    const restarted = snakeReducer(lost, { type: 'restart', random: fixedRandom })
    assert.equal(restarted.status, 'running')
    assert.equal(restarted.score, 0)
    assert.equal(restarted.snake.length, 3)
})

test('Tic-Tac-Toe reports each winning line and a full-board draw', () => {
    for (const line of [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]) {
        const board = Array(9).fill(null)
        for (const index of line) board[index] = 'X'
        assert.deepEqual(calculateWinner(board), { winner: 'X', line })
    }
    assert.deepEqual(calculateWinner(['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X']), { winner: 'Draw', line: [] })
})

test('Tic-Tac-Toe AI wins and blocks without modifying a frozen board', () => {
    const winning = Object.freeze(['O', 'O', null, 'X', 'X', null, 'X', null, null])
    const blocking = Object.freeze(['X', 'X', null, null, 'O', null, null, null, null])
    for (const difficulty of ['medium', 'hard']) {
        assert.equal(getAiMove(winning, difficulty, fixedRandom), 2)
        assert.equal(getAiMove(blocking, difficulty, fixedRandom), 2)
    }
    assert.equal(getAiMove(blocking, 'easy', fixedRandom), 2)
    assert.equal(getBestMove(['X', 'X', 'X', 'O', null, 'O', null, null, null]), null)
})

test('Hard Tic-Tac-Toe cannot lose against any legal human continuation', () => {
    const visit = board => {
        const result = calculateWinner(board)
        assert.notEqual(result.winner, 'X')
        if (result.winner) return
        for (let index = 0; index < 9; index++) {
            if (board[index] !== null) continue
            const next = board.slice()
            next[index] = 'X'
            const afterHuman = calculateWinner(next)
            assert.notEqual(afterHuman.winner, 'X')
            if (afterHuman.winner) continue
            const aiMove = getBestMove(next)
            assert.equal(next[aiMove], null)
            next[aiMove] = 'O'
            visit(next)
        }
    }
    visit(Array(9).fill(null))
})

const playTurn = (state, index, actor = 'human') => ticTacToeReducer(state, { type: 'move', index, actor, round: state.round })

test('Tic-Tac-Toe enforces AI turns and rejects stale moves after reset or mode change', () => {
    const start = createTicTacToeState()
    const thinking = playTurn(start, 0)
    assert.equal(playTurn(thinking, 1), thinking)
    assert.equal(playTurn(start, 0, 'ai'), start)
    const restarted = ticTacToeReducer(thinking, { type: 'restart' })
    assert.equal(ticTacToeReducer(restarted, { type: 'move', index: 4, actor: 'ai', round: thinking.round }), restarted)
    const local = ticTacToeReducer(thinking, { type: 'mode', mode: 'pvp' })
    assert.equal(ticTacToeReducer(local, { type: 'move', index: 4, actor: 'ai', round: thinking.round }), local)
    assert.deepEqual(local.squares, Array(9).fill(null))
})

test('Tic-Tac-Toe awards a result once, preserves scores on restart, and separates modes', () => {
    let state = ticTacToeReducer(createTicTacToeState(), { type: 'mode', mode: 'pvp' })
    for (const index of [0, 3, 1, 4, 2]) state = playTurn(state, index)
    assert.equal(state.scores.pvp.X, 1)
    assert.equal(state.scores.pvc.X, 0)
    assert.equal(playTurn(state, 8), state)
    state = ticTacToeReducer(state, { type: 'restart' })
    assert.equal(state.scores.pvp.X, 1)
    assert.equal(state.next, 'X')
    for (const index of [0, 1, 2, 4, 3, 5, 7, 6, 8]) state = playTurn(state, index)
    assert.equal(state.scores.pvp.draws, 1)
    assert.equal(ticTacToeReducer(state, { type: 'resetScores' }).scores.pvp.X, 0)
})

test('Minesweeper produces exact mine counts and adjacency for every difficulty', () => {
    for (const cfg of Object.values(DIFFICULTIES)) {
        const board = createBoard(cfg.rows, cfg.cols, cfg.mines, fixedRandom)
        assert.equal(board.flat().filter(cell => cell.isMine).length, cfg.mines)
        for (const cell of board.flat()) {
            if (cell.isMine) continue
            const count = neighbors(cell.r, cell.c, cfg.rows, cfg.cols).filter(([r, c]) => board[r][c].isMine).length
            assert.equal(cell.adjacent, count)
        }
    }
})

test('Minesweeper first reveals are guaranteed clear with a constant random source', () => {
    for (const cfg of Object.values(DIFFICULTIES)) {
        const board = createBoard(cfg.rows, cfg.cols, cfg.mines, fixedRandom)
        board[cfg.rows - 1][cfg.cols - 1].isFlagged = true
        const safe = safeFirstClick(board, 0, 0, cfg.rows, cfg.cols, cfg.mines, fixedRandom)
        assert.equal(safe[0][0].isMine, false)
        assert.equal(safe[0][0].adjacent, 0)
        assert.equal(safe.flat().filter(cell => cell.isMine).length, cfg.mines)
        assert.equal(safe[cfg.rows - 1][cfg.cols - 1].isFlagged, true)
        assert.equal(board[0][0].isMine, true)
    }
})

test('Minesweeper dense boards keep the first cell safe when a clear opening is impossible', () => {
    const board = createBoard(2, 2, 3, fixedRandom)
    const safe = safeFirstClick(board, 0, 0, 2, 2, 3, fixedRandom)
    assert.equal(safe[0][0].isMine, false)
    assert.equal(safe.flat().filter(cell => cell.isMine).length, 3)
})

test('Minesweeper flagging does not consume first-click safety or mutate the field', () => {
    const state = createMinesweeperState('Beginner', fixedRandom)
    const flagged = toggleFlag(state, 0, 0)
    assert.equal(state.board[0][0].isFlagged, false)
    assert.equal(revealCell(flagged, 0, 0, fixedRandom), flagged)
    assert.equal(flagged.status, 'ready')
    const unflagged = toggleFlag(flagged, 0, 0)
    const revealed = revealCell(unflagged, 0, 0, fixedRandom)
    assert.equal(revealed.board[0][0].isMine, false)
    assert.equal(revealed.board[0][0].isRevealed, true)
    assert.notEqual(revealed.status, 'lost')
})

test('Minesweeper flood reveal leaves mines and flagged safe cells covered', () => {
    const board = createBoard(4, 4, 1, fixedRandom)
    board[3][2].isFlagged = true
    floodReveal(board, 3, 3)
    assert.equal(board[0][0].isRevealed, false)
    assert.equal(board[3][2].isRevealed, false)
    assert.equal(board[3][3].isRevealed, true)
    assert.equal(board[0][1].isRevealed, true)
})

test('Minesweeper loses on a mine, reveals mines, and freezes terminal state', () => {
    const start = { ...createMinesweeperState('Beginner', fixedRandom), status: 'running' }
    const lost = revealCell(start, 0, 0)
    assert.equal(lost.status, 'lost')
    assert.ok(lost.board.flat().filter(cell => cell.isMine).every(cell => cell.isRevealed))
    assert.equal(revealCell(lost, 8, 8), lost)
    assert.equal(toggleFlag(lost, 8, 8), lost)
    assert.equal(minesweeperReducer(lost, { type: 'tick' }), lost)
    const restarted = minesweeperReducer(lost, { type: 'restart', random: fixedRandom })
    assert.equal(restarted.status, 'ready')
    assert.equal(restarted.elapsed, 0)
    assert.equal(restarted.exploded, null)
})

test('Minesweeper wins only after the last safe square and automatically flags mines', () => {
    let state = { ...createMinesweeperState('Beginner', fixedRandom), status: 'running' }
    for (const cell of state.board.flat()) {
        if (!cell.isMine) cell.isRevealed = true
    }
    state.board[1][2].isRevealed = false
    state = revealCell(state, 1, 2)
    assert.equal(state.status, 'won')
    assert.ok(state.board.flat().filter(cell => cell.isMine).every(cell => cell.isFlagged))
    assert.equal(toggleFlag(state, 0, 0), state)
})

test('Minesweeper mobile flag mode and difficulty reset are real game actions', () => {
    let state = createMinesweeperState('Beginner', fixedRandom)
    state = minesweeperReducer(state, { type: 'flagMode' })
    state = minesweeperReducer(state, { type: 'activate', r: 0, c: 0 })
    assert.equal(state.board[0][0].isFlagged, true)
    assert.equal(state.board[0][0].isRevealed, false)
    const expert = minesweeperReducer(state, { type: 'difficulty', difficulty: 'Expert', random: fixedRandom })
    assert.equal(expert.board.length, 16)
    assert.equal(expert.board[0].length, 30)
    assert.equal(expert.flagMode, false)
    assert.equal(expert.status, 'ready')
    assert.match(describeCell(state.board[0][0], state.status), /Row 1, column 1, flagged/)
})
