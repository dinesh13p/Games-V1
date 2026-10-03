// Enhanced Bagh Chal Game Logic with Improved AI

export class BaghChalEngine {
    constructor() {
        this.BOARD_SIZE = 25
        this.TIGER_COUNT = 4
        this.GOAT_COUNT = 20
        this.GOATS_TO_CAPTURE = 5

        this.board = new Array(25).fill(0)
        this.tigerPositions = [0, 4, 20, 24]
        this.tigerPositions.forEach(pos => this.board[pos] = 2)

        this.goatsPlaced = 0
        this.goatsCaptured = 0
        this.gamePhase = 'placement'
        this.currentPlayer = 'goat'
        this.moveHistory = []
        this.moveCounter = 0
    }

    getValidAdjacents(pos) {
        const validMoves = {
            0: [1, 5, 6], 1: [0, 2, 6, 7], 2: [1, 3, 7, 8], 3: [2, 4, 8, 9], 4: [3, 9, 8],
            5: [0, 6, 10, 11], 6: [0, 1, 5, 7, 10, 11, 12], 7: [1, 2, 6, 8, 11, 12, 13],
            8: [2, 3, 7, 9, 12, 13, 14], 9: [3, 4, 8, 13, 14],
            10: [5, 6, 11, 15, 16], 11: [5, 6, 7, 10, 12, 15, 16, 17], 12: [6, 7, 8, 11, 13, 16, 17, 18],
            13: [7, 8, 9, 12, 14, 17, 18, 19], 14: [8, 9, 13, 18, 19],
            15: [10, 11, 16, 20, 21], 16: [10, 11, 12, 15, 17, 20, 21, 22], 17: [11, 12, 13, 16, 18, 21, 22, 23],
            18: [12, 13, 14, 17, 19, 22, 23, 24], 19: [13, 14, 18, 23, 24],
            20: [15, 16, 21], 21: [15, 16, 17, 20, 22], 22: [16, 17, 18, 21, 23],
            23: [17, 18, 19, 22, 24], 24: [18, 19, 23]
        }
        return validMoves[pos] || []
    }

    placeGoat(position) {
        if (this.gamePhase !== 'placement') return { success: false }
        if (this.currentPlayer !== 'goat') return { success: false }
        if (this.board[position] !== 0) return { success: false }

        this.board[position] = 1
        this.goatsPlaced++
        this.moveHistory.push({ player: 'goat', type: 'place', position })
        this.moveCounter++

        if (this.goatsPlaced === this.GOAT_COUNT) {
            this.gamePhase = 'movement'
            this.currentPlayer = 'tiger'
        } else {
            this.currentPlayer = 'tiger'
        }

        return { success: true }
    }

    getTigerValidMoves(tigerPos) {
        const moves = []
        const adjacent = this.getValidAdjacents(tigerPos)

        for (const pos of adjacent) {
            if (this.board[pos] === 0) {
                moves.push({ type: 'move', to: pos })
            }
        }

        const captures = this.getTigerCaptures(tigerPos)
        moves.push(...captures)
        return moves
    }

    getTigerCaptures(tigerPos) {
        const captures = []
        const adjacent = this.getValidAdjacents(tigerPos)
        const adjacentSet = new Set(adjacent)

        for (const midPos of adjacent) {
            if (this.board[midPos] === 1 && ![0, 4, 20, 24].includes(midPos)) {
                const midAdjacent = this.getValidAdjacents(midPos)
                for (const landPos of midAdjacent) {
                    if (adjacentSet.has(midPos) && this.board[landPos] === 0) {
                        const row1 = Math.floor(tigerPos / 5)
                        const col1 = tigerPos % 5
                        const row2 = Math.floor(midPos / 5)
                        const col2 = midPos % 5
                        const row3 = Math.floor(landPos / 5)
                        const col3 = landPos % 5

                        const dRow = row2 - row1
                        const dCol = col2 - col1
                        if (row3 === row2 + dRow && col3 === col2 + dCol) {
                            captures.push({ type: 'capture', over: midPos, to: landPos })
                        }
                    }
                }
            }
        }

        return captures
    }

    moveTiger(from, move) {
        if (this.currentPlayer !== 'tiger') return { success: false }
        if (this.board[from] !== 2) return { success: false }

        const validMoves = this.getTigerValidMoves(from)
        const validMove = validMoves.find(m =>
            m.to === move.to && m.type === move.type &&
            (move.type === 'move' || m.over === move.over)
        )

        if (!validMove) return { success: false }

        this.board[from] = 0
        this.board[move.to] = 2

        if (move.type === 'capture') {
            this.board[move.over] = 0
            this.goatsCaptured++
            this.moveHistory.push({
                player: 'tiger',
                type: 'capture',
                from,
                to: move.to,
                captured: move.over
            })
        } else {
            this.moveHistory.push({
                player: 'tiger',
                type: 'move',
                from,
                to: move.to
            })
        }

        this.moveCounter++
        this.currentPlayer = 'goat'
        return { success: true }
    }

    getGoatValidMoves(goatPos) {
        if (this.gamePhase !== 'movement' || this.board[goatPos] !== 1) return []
        const moves = []
        const adjacent = this.getValidAdjacents(goatPos)
        for (const pos of adjacent) {
            if (this.board[pos] === 0) moves.push(pos)
        }
        return moves
    }

    moveGoat(from, to) {
        if (this.currentPlayer !== 'goat') return { success: false }
        if (this.board[from] !== 1) return { success: false }

        const validMoves = this.getGoatValidMoves(from)
        if (!validMoves.includes(to)) return { success: false }

        this.board[from] = 0
        this.board[to] = 1
        this.moveHistory.push({ player: 'goat', type: 'move', from, to })
        this.moveCounter++
        this.currentPlayer = 'tiger'
        return { success: true }
    }

    checkGameState() {
        if (this.goatsCaptured >= this.GOATS_TO_CAPTURE) {
            return { winner: 'tiger', reason: 'captured_goats' }
        }

        if (this.gamePhase === 'movement' && !this.canTigersMove()) {
            return { winner: 'goat', reason: 'tigers_blocked' }
        }

        if (this.gamePhase === 'movement' && !this.canGoatsMove()) {
            return { winner: 'tiger', reason: 'goats_blocked' }
        }

        if (this.moveCounter > 100) {
            const recentMoves = this.moveHistory.slice(-50)
            const hasCapture = recentMoves.some(m => m.type === 'capture')
            if (!hasCapture) return { winner: null, reason: 'repetitive_moves' }
        }

        return { winner: null, reason: null }
    }

    canTigersMove() {
        for (let i = 0; i < this.BOARD_SIZE; i++) {
            if (this.board[i] === 2 && this.getTigerValidMoves(i).length > 0) return true
        }
        return false
    }

    canGoatsMove() {
        for (let i = 0; i < this.BOARD_SIZE; i++) {
            if (this.board[i] === 1 && this.getGoatValidMoves(i).length > 0) return true
        }
        return false
    }

    getGameState() {
        return {
            board: this.board.slice(),
            gamePhase: this.gamePhase,
            currentPlayer: this.currentPlayer,
            goatsPlaced: this.goatsPlaced,
            goatsCaptured: this.goatsCaptured,
            moveCounter: this.moveCounter
        }
    }

    resetGame() {
        this.board = new Array(25).fill(0)
        this.tigerPositions.forEach(pos => this.board[pos] = 2)
        this.goatsPlaced = 0
        this.goatsCaptured = 0
        this.gamePhase = 'placement'
        this.currentPlayer = 'goat'
        this.moveHistory = []
        this.moveCounter = 0
    }

    // Enhanced AI with better move evaluation
    getBestAIMove(difficulty = 'medium') {
        if (this.currentPlayer === 'tiger') {
            return this.getBestTigerMove(difficulty)
        } else {
            if (this.gamePhase === 'placement') {
                return this.getBestGoatPlacement(difficulty)
            }
            return this.getBestGoatMove(difficulty)
        }
    }

    getBestGoatPlacement(difficulty) {
        const candidatePositions = []
        for (let pos = 0; pos < this.BOARD_SIZE; pos++) {
            if (this.board[pos] !== 0) continue
            if ([0, 4, 20, 24].includes(pos)) continue
            candidatePositions.push(pos)
        }

        const scored = candidatePositions.map(pos => {
            const original = this.board.slice()
            this.board[pos] = 1
            const tigerMobility = this._computeTigerMobility()
            const vulnerability = this._goatVulnerabilityAt(pos)
            const centerBonus = pos === 12 ? 2 : ([6, 7, 8, 11, 13, 16, 17, 18].includes(pos) ? 1 : 0)
            const score = -3 * tigerMobility - 5 * vulnerability + 2 * centerBonus
            this.board = original
            return { pos, score }
        })

        scored.sort((a, b) => b.score - a.score)
        const top = difficulty === 'easy' ? Math.min(4, scored.length) : 1
        const choiceIdx = Math.floor(Math.random() * Math.max(1, top))
        const choice = scored[choiceIdx] || scored[0]
        return { from: null, to: null, place: choice?.pos ?? scored[0]?.pos ?? 12, score: choice?.score ?? 0 }
    }

    getBestTigerMove(difficulty) {
        const depth = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 4 : 6
        let bestScore = -Infinity
        let bestMove = null
        let bestFromPos = null

        for (let i = 0; i < this.BOARD_SIZE; i++) {
            if (this.board[i] !== 2) continue
            const moves = this.getTigerValidMoves(i)
            for (const move of moves) {
                const score = this.evaluateTigerMove(i, move, depth - 1)
                if (score > bestScore) {
                    bestScore = score
                    bestMove = move
                    bestFromPos = i
                }
            }
        }

        // Add some randomness based on difficulty
        if (difficulty === 'easy' && Math.random() < 0.3) {
            const allMoves = []
            for (let i = 0; i < this.BOARD_SIZE; i++) {
                if (this.board[i] !== 2) continue
                const moves = this.getTigerValidMoves(i)
                for (const move of moves) {
                    allMoves.push({ from: i, move })
                }
            }
            if (allMoves.length > 0) {
                const randomMove = allMoves[Math.floor(Math.random() * allMoves.length)]
                return { from: randomMove.from, move: randomMove.move }
            }
        }

        return { from: bestFromPos, move: bestMove, score: bestScore }
    }

    evaluateTigerMove(from, move, depth) {
        const originalBoard = this.board.slice()
        const originalCaptured = this.goatsCaptured

        this.board[from] = 0
        this.board[move.to] = 2

        if (move.type === 'capture') {
            this.board[move.over] = 0
            this.goatsCaptured++
        }

        let score

        if (this.goatsCaptured >= this.GOATS_TO_CAPTURE) {
            score = 10000
        } else if (depth === 0) {
            score = this.evaluatePosition('tiger')
        } else {
            let minScore = Infinity
            for (let i = 0; i < this.BOARD_SIZE; i++) {
                if (this.board[i] !== 1) continue
                const moves = this.getGoatValidMoves(i)
                for (const gMove of moves) {
                    const goatScore = this.evaluateGoatMove(i, gMove, depth - 1)
                    minScore = Math.min(minScore, goatScore)
                }
            }
            score = minScore === Infinity ? this.evaluatePosition('tiger') : minScore
        }

        this.board = originalBoard
        this.goatsCaptured = originalCaptured

        return score
    }

    getBestGoatMove(difficulty) {
        const depth = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 5
        let bestScore = Infinity
        let bestMove = null
        let bestFromPos = null

        for (let i = 0; i < this.BOARD_SIZE; i++) {
            if (this.board[i] !== 1) continue
            const moves = this.getGoatValidMoves(i)
            for (const to of moves) {
                const score = this.evaluateGoatMove(i, to, depth - 1)
                if (score < bestScore) {
                    bestScore = score
                    bestMove = to
                    bestFromPos = i
                }
            }
        }

        return { from: bestFromPos, to: bestMove, score: bestScore }
    }

    evaluateGoatMove(from, to, depth) {
        const originalBoard = this.board.slice()

        this.board[from] = 0
        this.board[to] = 1

        let score

        if (!this.canTigersMove()) {
            score = -10000
        } else if (depth === 0) {
            score = this.evaluatePosition('goat')
        } else {
            let maxScore = -Infinity
            for (let i = 0; i < this.BOARD_SIZE; i++) {
                if (this.board[i] !== 2) continue
                const moves = this.getTigerValidMoves(i)
                for (const tMove of moves) {
                    const tigerScore = this.evaluateTigerMove(i, tMove, depth - 1)
                    maxScore = Math.max(maxScore, tigerScore)
                }
            }
            score = maxScore === -Infinity ? this.evaluatePosition('goat') : maxScore
        }

        this.board = originalBoard
        return score
    }

    evaluatePosition(perspective) {
        let score = 0

        score += this.goatsCaptured * 200

        let tigerMobility = 0
        for (let i = 0; i < this.BOARD_SIZE; i++) {
            if (this.board[i] === 2) {
                const moves = this.getTigerValidMoves(i)
                tigerMobility += moves.length
                if (i === 12) score += 15
                else if ([6, 7, 8, 11, 13, 16, 17, 18].includes(i)) score += 8
            }
        }
        score += tigerMobility * 8

        let vulnerableGoats = 0
        for (let i = 0; i < this.BOARD_SIZE; i++) {
            if (this.board[i] === 1) vulnerableGoats += this._goatVulnerabilityAt(i)
        }
        score += vulnerableGoats * 25

        if (this.gamePhase === 'movement' && !this.canTigersMove()) score -= 10000

        if (perspective === 'goat') return -score
        return score
    }

    _computeTigerMobility() {
        let mobility = 0
        for (let i = 0; i < this.BOARD_SIZE; i++) {
            if (this.board[i] === 2) mobility += this.getTigerValidMoves(i).length
        }
        return mobility
    }

    _goatVulnerabilityAt(pos) {
        let vulnerable = 0
        const adj = this.getValidAdjacents(pos)
        for (const t of adj) {
            if (this.board[t] !== 2) continue
            const rowT = Math.floor(t / 5), colT = t % 5
            const rowG = Math.floor(pos / 5), colG = pos % 5
            const dRow = rowG - rowT, dCol = colG - colT
            const rowL = rowG + dRow, colL = colG + dCol
            if (rowL < 0 || rowL > 4 || colL < 0 || colL > 4) continue
            const land = rowL * 5 + colL
            if (this.getValidAdjacents(pos).includes(land) && this.board[land] === 0 && ![0, 4, 20, 24].includes(pos)) vulnerable++
        }
        return vulnerable
    }
}