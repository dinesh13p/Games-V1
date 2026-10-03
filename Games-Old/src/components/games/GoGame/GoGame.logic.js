// Enhanced Go Game (Gomoku) Logic with Improved AI

export const EMPTY = 0
export const BLACK = 1
export const WHITE = 2

export class GoGameEngine {
    constructor(size = 9) {
        this.size = size
        this.board = this.createBoard()
        this.currentPlayer = BLACK
        this.moveHistory = []
        this.gameOver = false
        this.winner = null
    }

    createBoard() {
        return Array.from({ length: this.size }, () =>
            Array(this.size).fill(EMPTY)
        )
    }

    isValidMove(row, col) {
        if (this.gameOver) return false
        if (row < 0 || row >= this.size || col < 0 || col >= this.size) return false
        if (this.board[row][col] !== EMPTY) return false
        return true
    }

    makeMove(row, col) {
        if (!this.isValidMove(row, col)) return false

        this.board[row][col] = this.currentPlayer
        this.moveHistory.push({ row, col, player: this.currentPlayer })

        if (this.checkWin(row, col, this.currentPlayer)) {
            this.gameOver = true
            this.winner = this.currentPlayer
        }

        this.currentPlayer = this.currentPlayer === BLACK ? WHITE : BLACK
        return true
    }

    checkWin(row, col, player) {
        const directions = [
            [0, 1],  // horizontal
            [1, 0],  // vertical
            [1, 1],  // diagonal down-right
            [1, -1], // diagonal down-left
        ]

        for (const [dr, dc] of directions) {
            let count = 1
            // Check forward
            for (let i = 1; i < 5; i++) {
                const r = row + dr * i
                const c = col + dc * i
                if (r < 0 || r >= this.size || c < 0 || c >= this.size) break
                if (this.board[r][c] !== player) break
                count++
            }
            // Check backward
            for (let i = 1; i < 5; i++) {
                const r = row - dr * i
                const c = col - dc * i
                if (r < 0 || r >= this.size || c < 0 || c >= this.size) break
                if (this.board[r][c] !== player) break
                count++
            }
            if (count >= 5) return true
        }
        return false
    }

    getValidMoves() {
        const moves = []
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.board[r][c] === EMPTY) {
                    moves.push({ row: r, col: c })
                }
            }
        }
        return moves
    }

    // Enhanced AI with better pattern recognition
    getAIMove(difficulty = 'medium') {
        const validMoves = this.getValidMoves()
        if (validMoves.length === 0) return null

        const opponent = this.currentPlayer === BLACK ? WHITE : BLACK

        // Check for immediate winning move
        for (const move of validMoves) {
            const { row, col } = move
            if (this.wouldWin(row, col, this.currentPlayer)) {
                return move
            }
        }

        // Check for immediate blocking move
        for (const move of validMoves) {
            const { row, col } = move
            if (this.wouldWin(row, col, opponent)) {
                return move
            }
        }

        // Score each move
        const scoredMoves = validMoves.map(move => ({
            ...move,
            score: this.evaluateMove(move.row, move.col, this.currentPlayer) +
                this.evaluateMove(move.row, move.col, opponent) * 0.7
        }))

        // Sort by score
        scoredMoves.sort((a, b) => b.score - a.score)

        // Add some randomness based on difficulty
        const topN = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 3 : 1
        const topMoves = scoredMoves.slice(0, Math.min(topN, scoredMoves.length))
        return topMoves[Math.floor(Math.random() * topMoves.length)]
    }

    wouldWin(row, col, player) {
        const original = this.board[row][col]
        this.board[row][col] = player
        const win = this.checkWin(row, col, player)
        this.board[row][col] = original
        return win
    }

    evaluateMove(row, col, player) {
        let score = 0
        const directions = [
            [0, 1],
            [1, 0],
            [1, 1],
            [1, -1]
        ]

        for (const [dr, dc] of directions) {
            let count = 1
            let openEnds = 0

            // Check forward
            for (let i = 1; i < 5; i++) {
                const r = row + dr * i
                const c = col + dc * i
                if (r < 0 || r >= this.size || c < 0 || c >= this.size) break
                if (this.board[r][c] === player) count++
                else if (this.board[r][c] === EMPTY) { openEnds++; break }
                else break
            }

            // Check backward
            for (let i = 1; i < 5; i++) {
                const r = row - dr * i
                const c = col - dc * i
                if (r < 0 || r >= this.size || c < 0 || c >= this.size) break
                if (this.board[r][c] === player) count++
                else if (this.board[r][c] === EMPTY) { openEnds++; break }
                else break
            }

            // Score based on pattern
            if (count >= 5) score += 10000
            else if (count === 4 && openEnds >= 1) score += 5000
            else if (count === 4) score += 1000
            else if (count === 3 && openEnds >= 2) score += 500
            else if (count === 3 && openEnds >= 1) score += 100
            else if (count === 2) score += 10
        }

        // Center bias
        const center = this.size / 2
        const distanceFromCenter = Math.abs(row - center) + Math.abs(col - center)
        score += Math.max(0, (this.size - distanceFromCenter) * 2)

        return score
    }

    clone() {
        const clone = new GoGameEngine(this.size)
        clone.board = this.board.map(row => [...row])
        clone.currentPlayer = this.currentPlayer
        clone.moveHistory = [...this.moveHistory]
        clone.gameOver = this.gameOver
        clone.winner = this.winner
        return clone
    }
}