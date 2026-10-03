// Gomoku: five or more connected stones win. There are no territory or capture rules.
export const EMPTY = 0
export const BLACK = 1
export const WHITE = 2
const DIRECTIONS = [[0, 1], [1, 0], [1, 1], [1, -1]]
const otherPlayer = player => player === BLACK ? WHITE : BLACK

export class GoGameEngine {
    constructor(size = 9) {
        if (!Number.isInteger(size) || size < 5 || size > 19) {
            throw new RangeError('Choose a board size from 5 to 19.')
        }
        this.size = size
        this.board = this.createBoard()
        this.currentPlayer = BLACK
        this.moveHistory = []
        this.gameOver = false
        this.winner = null
    }

    createBoard() {
        return Array.from({ length: this.size }, () => Array(this.size).fill(EMPTY))
    }

    inBounds(row, col) {
        return Number.isInteger(row) && Number.isInteger(col) &&
            row >= 0 && col >= 0 && row < this.size && col < this.size
    }

    isValidMove(row, col) {
        return !this.gameOver && this.inBounds(row, col) && this.board[row][col] === EMPTY
    }

    makeMove(row, col) {
        if (!this.isValidMove(row, col)) return false
        const player = this.currentPlayer
        this.board[row][col] = player
        this.moveHistory.push({ row, col, player })
        if (this.checkWin(row, col, player)) {
            this.gameOver = true
            this.winner = player
        } else if (this.board.every(line => line.every(cell => cell !== EMPTY))) {
            this.gameOver = true
            this.winner = null
        }
        this.currentPlayer = otherPlayer(player)
        return true
    }

    lineLength(row, col, player, dr, dc) {
        let count = 1
        for (const sign of [-1, 1]) {
            let r = row + dr * sign
            let c = col + dc * sign
            while (this.inBounds(r, c) && this.board[r][c] === player) {
                count++
                r += dr * sign
                c += dc * sign
            }
        }
        return count
    }

    checkWin(row, col, player) {
        if (!this.inBounds(row, col) || ![BLACK, WHITE].includes(player) || this.board[row][col] !== player) return false
        return DIRECTIONS.some(([dr, dc]) => this.lineLength(row, col, player, dr, dc) >= 5)
    }

    getWinningLine() {
        if (!this.winner) return []
        const last = this.moveHistory.at(-1)
        if (!last) return []
        for (const [dr, dc] of DIRECTIONS) {
            if (this.lineLength(last.row, last.col, this.winner, dr, dc) < 5) continue
            const cells = [{ row: last.row, col: last.col }]
            for (const sign of [-1, 1]) {
                let r = last.row + dr * sign
                let c = last.col + dc * sign
                while (this.inBounds(r, c) && this.board[r][c] === this.winner) {
                    cells.push({ row: r, col: c })
                    r += dr * sign
                    c += dc * sign
                }
            }
            return cells
        }
        return []
    }

    getValidMoves() {
        if (this.gameOver) return []
        const moves = []
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.board[row][col] === EMPTY) moves.push({ row, col })
            }
        }
        return moves
    }

    // Hypothetical evaluation never writes to the live board.
    wouldWin(row, col, player) {
        return this.isValidMove(row, col) && [BLACK, WHITE].includes(player) &&
            DIRECTIONS.some(([dr, dc]) => this.lineLength(row, col, player, dr, dc) >= 5)
    }

    evaluateMove(row, col, player) {
        if (!this.isValidMove(row, col)) return -Infinity
        const weights = [0, 2, 15, 140, 2200, 100000]
        let score = 0
        for (const [dr, dc] of DIRECTIONS) {
            // Five-cell windows also recognize split lines, such as XX.XX.
            for (let offset = -4; offset <= 0; offset++) {
                const startR = row + offset * dr
                const startC = col + offset * dc
                if (!this.inBounds(startR, startC) || !this.inBounds(startR + dr * 4, startC + dc * 4)) continue
                let count = 0
                let blocked = false
                for (let step = 0; step < 5; step++) {
                    const r = startR + dr * step
                    const c = startC + dc * step
                    const cell = r === row && c === col ? player : this.board[r][c]
                    if (cell === player) count++
                    else if (cell !== EMPTY) blocked = true
                }
                if (!blocked) score += weights[count]
            }
        }
        const center = (this.size - 1) / 2
        return score + this.size - Math.abs(row - center) - Math.abs(col - center)
    }

    rankedMoves(limit = 10) {
        const moves = this.getValidMoves()
        const player = this.currentPlayer
        const opponent = otherPlayer(player)
        const wins = moves.filter(({ row, col }) => this.wouldWin(row, col, player))
        if (wins.length) return wins
        const blocks = moves.filter(({ row, col }) => this.wouldWin(row, col, opponent))
        if (blocks.length) return blocks
        return moves.map(move => ({
            ...move,
            score: this.evaluateMove(move.row, move.col, player) +
                0.9 * this.evaluateMove(move.row, move.col, opponent),
        })).sort((a, b) => b.score - a.score).slice(0, limit)
    }

    evaluatePosition(player) {
        if (this.gameOver) return this.winner === null ? 0 : this.winner === player ? 1000000 : -1000000
        const weights = [0, 1, 12, 120, 1800, 100000]
        let score = 0
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                for (const [dr, dc] of DIRECTIONS) {
                    if (!this.inBounds(row + dr * 4, col + dc * 4)) continue
                    let own = 0
                    let opponent = 0
                    for (let step = 0; step < 5; step++) {
                        const cell = this.board[row + dr * step][col + dc * step]
                        if (cell === player) own++
                        else if (cell !== EMPTY) opponent++
                    }
                    if (!opponent) score += weights[own]
                    if (!own) score -= weights[opponent]
                }
            }
        }
        return score
    }

    getAIMove(difficulty = 'medium') {
        const moves = this.rankedMoves(10)
        if (!moves.length) return null
        const player = this.currentPlayer
        const immediate = moves.find(move => this.wouldWin(move.row, move.col, player))
        if (immediate) return { row: immediate.row, col: immediate.col }
        if (difficulty === 'easy') {
            const move = moves[Math.floor(Math.random() * Math.min(4, moves.length))]
            return { row: move.row, col: move.col }
        }
        // A fixed depth, branch width and node budget keep hard mode interactive.
        const budget = { remaining: difficulty === 'hard' ? 1600 : 250 }
        const search = (state, remaining, alpha, beta) => {
            if (budget.remaining <= 0) return null
            budget.remaining--
            if (state.gameOver || remaining === 0) return state.evaluatePosition(player)
            const maximize = state.currentPlayer === player
            let best = maximize ? -Infinity : Infinity
            for (const move of state.rankedMoves(7)) {
                const child = state.clone(false)
                child.makeMove(move.row, move.col)
                const value = search(child, remaining - 1, alpha, beta)
                if (value === null) return null
                best = maximize ? Math.max(best, value) : Math.min(best, value)
                if (maximize) alpha = Math.max(alpha, best)
                else beta = Math.min(beta, best)
                if (beta <= alpha) break
            }
            return Number.isFinite(best) ? best : state.evaluatePosition(player)
        }
        let bestMove = moves[0]
        for (let depth = 2; depth <= (difficulty === 'hard' ? 4 : 2); depth++) {
            let bestScore = -Infinity
            let iterationMove = bestMove
            let complete = true
            for (const move of moves) {
                const child = this.clone(false)
                child.makeMove(move.row, move.col)
                const score = search(child, depth - 1, bestScore, Infinity)
                if (score === null) { complete = false; break }
                if (score > bestScore) {
                    bestScore = score
                    iterationMove = move
                }
            }
            if (!complete) break
            bestMove = iterationMove
        }
        return { row: bestMove.row, col: bestMove.col }
    }

    undo() {
        const move = this.moveHistory.pop()
        if (!move) return false
        this.board[move.row][move.col] = EMPTY
        this.currentPlayer = move.player
        this.gameOver = false
        this.winner = null
        return true
    }

    clone(includeHistory = true) {
        const clone = new GoGameEngine(this.size)
        clone.board = this.board.map(row => [...row])
        clone.currentPlayer = this.currentPlayer
        clone.moveHistory = includeHistory ? this.moveHistory.map(move => ({ ...move })) : []
        clone.gameOver = this.gameOver
        clone.winner = this.winner
        return clone
    }
}
