export const EMPTY = 0
export const GOAT = 1
export const TIGER = 2
const CORNERS = [0, 4, 20, 24]
const ORTHOGONAL = [[-1, 0], [1, 0], [0, -1], [0, 1]]
const DIAGONAL = [[-1, -1], [-1, 1], [1, -1], [1, 1]]
const validPosition = position => Number.isInteger(position) && position >= 0 && position < 25

function adjacents(position) {
    if (!validPosition(position)) return []
    const row = Math.floor(position / 5)
    const col = position % 5
    const directions = (row + col) % 2 === 0 ? [...ORTHOGONAL, ...DIAGONAL] : ORTHOGONAL
    return directions.flatMap(([dr, dc]) => {
        const r = row + dr
        const c = col + dc
        return r >= 0 && r < 5 && c >= 0 && c < 5 ? [r * 5 + c] : []
    })
}

const CONNECTIONS = Array.from({ length: 25 }, (_, position) => adjacents(position))
export const BOARD_EDGES = CONNECTIONS.flatMap((neighbors, from) => neighbors
    .filter(to => to > from).map(to => [from, to]))

export class BaghChalEngine {
    constructor() {
        this.BOARD_SIZE = 25
        this.TIGER_COUNT = 4
        this.GOAT_COUNT = 20
        this.GOATS_TO_CAPTURE = 5
        this.resetGame()
    }

    resetGame() {
        this.board = Array(25).fill(EMPTY)
        this.tigerPositions = [...CORNERS]
        CORNERS.forEach(position => { this.board[position] = TIGER })
        this.goatsPlaced = 0
        this.goatsCaptured = 0
        this.gamePhase = 'placement'
        this.currentPlayer = 'goat'
        this.moveHistory = []
        this.undoStates = []
        this.moveCounter = 0
        this.gameOver = false
        this.winner = null
        this.reason = null
        this.positionCounts = new Map([[this.positionKey(), 1]])
    }

    positionKey() {
        return `${this.board.join('')}:${this.currentPlayer}:${this.gamePhase}:${this.goatsPlaced}:${this.goatsCaptured}`
    }

    getValidAdjacents(position) {
        return validPosition(position) ? [...CONNECTIONS[position]] : []
    }

    // Geometry helpers are independent of the turn so they can detect trapping.
    getTigerCaptures(from) {
        if (!validPosition(from) || this.board[from] !== TIGER) return []
        const row = Math.floor(from / 5)
        const col = from % 5
        const captures = []
        for (const over of CONNECTIONS[from]) {
            if (this.board[over] !== GOAT) continue
            const r = 2 * Math.floor(over / 5) - row
            const c = 2 * (over % 5) - col
            if (r < 0 || r > 4 || c < 0 || c > 4) continue
            const to = r * 5 + c
            if (CONNECTIONS[over].includes(to) && this.board[to] === EMPTY) {
                captures.push({ type: 'capture', over, to })
            }
        }
        return captures
    }

    getTigerValidMoves(from) {
        if (!validPosition(from) || this.board[from] !== TIGER) return []
        return [
            ...CONNECTIONS[from].filter(to => this.board[to] === EMPTY).map(to => ({ type: 'move', to })),
            ...this.getTigerCaptures(from),
        ]
    }

    getGoatValidMoves(from) {
        if (this.gamePhase !== 'movement' || !validPosition(from) || this.board[from] !== GOAT) return []
        return CONNECTIONS[from].filter(to => this.board[to] === EMPTY)
    }

    canTigersMove() {
        return this.board.some((piece, position) => piece === TIGER && this.getTigerValidMoves(position).length > 0)
    }

    canGoatsMove() {
        if (this.gamePhase === 'placement') return this.goatsPlaced < this.GOAT_COUNT && this.board.includes(EMPTY)
        return this.board.some((piece, position) => piece === GOAT && this.getGoatValidMoves(position).length > 0)
    }

    checkGameState() {
        if (this.goatsCaptured >= this.GOATS_TO_CAPTURE) return { winner: 'tiger', reason: 'captured_goats' }
        // Trapping is a win even before all twenty goats have been placed.
        if (!this.canTigersMove()) return { winner: 'goat', reason: 'tigers_blocked' }
        if (this.currentPlayer === 'goat' && !this.canGoatsMove()) return { winner: 'tiger', reason: 'goats_blocked' }
        if ((this.positionCounts.get(this.positionKey()) || 0) >= 3) return { winner: null, reason: 'repetition' }
        return { winner: null, reason: null }
    }

    isFinished() {
        return this.gameOver || this.checkGameState().reason !== null
    }

    finishMove(move) {
        this.moveHistory.push({ player: this.currentPlayer, ...move })
        this.moveCounter++
        this.gamePhase = this.goatsPlaced >= this.GOAT_COUNT ? 'movement' : 'placement'
        this.currentPlayer = this.currentPlayer === 'goat' ? 'tiger' : 'goat'
        this.tigerPositions = this.board.flatMap((piece, position) => piece === TIGER ? [position] : [])
        const key = this.positionKey()
        this.positionCounts.set(key, (this.positionCounts.get(key) || 0) + 1)
        const result = this.checkGameState()
        this.gameOver = result.reason !== null
        this.winner = result.winner
        this.reason = result.reason
        return { success: true, ...result }
    }

    placeGoat(position) {
        if (this.isFinished() || this.currentPlayer !== 'goat' || this.gamePhase !== 'placement' ||
            this.goatsPlaced >= this.GOAT_COUNT || !validPosition(position) || this.board[position] !== EMPTY) return { success: false }
        this.rememberPosition()
        this.board[position] = GOAT
        this.goatsPlaced++
        return this.finishMove({ type: 'place', position, to: position })
    }

    moveTiger(from, move) {
        if (this.isFinished() || this.currentPlayer !== 'tiger' || !move) return { success: false }
        const legal = this.getTigerValidMoves(from).find(candidate => candidate.type === move.type &&
            candidate.to === move.to && (candidate.type !== 'capture' || candidate.over === move.over))
        if (!legal) return { success: false }
        this.rememberPosition()
        this.board[from] = EMPTY
        this.board[legal.to] = TIGER
        if (legal.type === 'capture') {
            this.board[legal.over] = EMPTY
            this.goatsCaptured++
        }
        return this.finishMove({ from, ...legal, ...(legal.type === 'capture' ? { captured: legal.over } : {}) })
    }

    moveGoat(from, to) {
        if (this.isFinished() || this.currentPlayer !== 'goat' || !this.getGoatValidMoves(from).includes(to)) return { success: false }
        this.rememberPosition()
        this.board[from] = EMPTY
        this.board[to] = GOAT
        return this.finishMove({ type: 'move', from, to })
    }

    getLegalMoves() {
        if (this.isFinished()) return []
        if (this.currentPlayer === 'goat' && this.gamePhase === 'placement') {
            return this.board.flatMap((piece, to) => piece === EMPTY ? [{ type: 'place', to }] : [])
        }
        return this.board.flatMap((piece, from) => {
            if (this.currentPlayer === 'tiger' && piece === TIGER) {
                return this.getTigerValidMoves(from).map(move => ({ from, ...move }))
            }
            if (this.currentPlayer === 'goat' && piece === GOAT) {
                return this.getGoatValidMoves(from).map(to => ({ type: 'move', from, to }))
            }
            return []
        })
    }

    applyMove(move) {
        if (!move) return { success: false }
        if (move.type === 'place') return this.placeGoat(move.to)
        if (this.currentPlayer === 'tiger') return this.moveTiger(move.from, move)
        if (move.type !== 'move') return { success: false }
        return this.moveGoat(move.from, move.to)
    }

    getGameState() {
        return {
            board: [...this.board], gamePhase: this.gamePhase, currentPlayer: this.currentPlayer,
            goatsPlaced: this.goatsPlaced, goatsCaptured: this.goatsCaptured, moveCounter: this.moveCounter,
            gameOver: this.gameOver, winner: this.winner, reason: this.reason,
        }
    }

    clone(includeHistory = true) {
        const clone = new BaghChalEngine()
        clone.board = [...this.board]
        clone.tigerPositions = [...this.tigerPositions]
        clone.goatsPlaced = this.goatsPlaced
        clone.goatsCaptured = this.goatsCaptured
        clone.gamePhase = this.gamePhase
        clone.currentPlayer = this.currentPlayer
        clone.moveHistory = includeHistory ? this.moveHistory.map(move => ({ ...move })) : []
        clone.undoStates = includeHistory ? this.undoStates.map(state => ({
            ...state, board: [...state.board], positionCounts: new Map(state.positionCounts),
        })) : []
        clone.moveCounter = this.moveCounter
        clone.gameOver = this.gameOver
        clone.winner = this.winner
        clone.reason = this.reason
        clone.positionCounts = new Map(this.positionCounts)
        return clone
    }

    rememberPosition() {
        this.undoStates.push({ ...this.getGameState(), positionCounts: new Map(this.positionCounts) })
    }

    undo() {
        const state = this.undoStates.pop()
        if (!state) return false
        Object.assign(this, state)
        this.tigerPositions = this.board.flatMap((piece, position) => piece === TIGER ? [position] : [])
        this.moveHistory.pop()
        return true
    }

    evaluatePosition(perspective = 'tiger') {
        const result = this.checkGameState()
        let score = 0
        if (result.reason) score = result.winner === 'tiger' ? 1000000 : result.winner === 'goat' ? -1000000 : 0
        else {
            score = this.goatsCaptured * 350
            const vulnerable = new Set()
            for (let position = 0; position < 25; position++) {
                if (this.board[position] !== TIGER) continue
                const moves = this.getTigerValidMoves(position)
                score += moves.length * 10
                if (moves.length === 0) score -= 100
                score += (4 - Math.abs(Math.floor(position / 5) - 2) - Math.abs(position % 5 - 2)) * 4
                moves.filter(move => move.type === 'capture').forEach(move => vulnerable.add(move.over))
            }
            score += vulnerable.size * 65
        }
        return perspective === 'goat' ? -score : score
    }

    chooseAIMove(difficulty = 'medium') {
        const moves = this.getLegalMoves()
        if (!moves.length) return null
        const maximize = this.currentPlayer === 'tiger'
        const orderedChildren = (state, options) => options.map(move => {
            const child = state.clone(false)
            child.applyMove(move)
            return { move, child, score: child.evaluatePosition('tiger') }
        }).sort((a, b) => state.currentPlayer === 'tiger' ? b.score - a.score : a.score - b.score)
        const roots = orderedChildren(this, moves)
        const win = roots.find(({ child }) => child.winner === this.currentPlayer)
        if (win) return win.move
        if (difficulty === 'easy') return roots[Math.floor(Math.random() * Math.min(4, roots.length))].move

        // Every node uses the same tiger-positive score; goats minimize, tigers maximize.
        const budget = { remaining: difficulty === 'hard' ? 1800 : 350 }
        const search = (state, depth, alpha, beta) => {
            if (budget.remaining <= 0) return null
            budget.remaining--
            if (state.gameOver || depth === 0) return state.evaluatePosition('tiger')
            const children = orderedChildren(state, state.getLegalMoves()).slice(0, 8)
            if (!children.length) return state.evaluatePosition('tiger')
            const maximizing = state.currentPlayer === 'tiger'
            let best = maximizing ? -Infinity : Infinity
            for (const { child } of children) {
                const score = search(child, depth - 1, alpha, beta)
                if (score === null) return null
                best = maximizing ? Math.max(best, score) : Math.min(best, score)
                if (maximizing) alpha = Math.max(alpha, best)
                else beta = Math.min(beta, best)
                if (beta <= alpha) break
            }
            return best
        }
        let bestMove = roots[0].move
        // Keep only completed depths, so a budget cutoff cannot favor an unsearched root.
        for (let depth = 2; depth <= (difficulty === 'hard' ? 4 : 2); depth++) {
            let iterationMove = bestMove
            let bestScore = maximize ? -Infinity : Infinity
            let complete = true
            let alpha = -Infinity
            let beta = Infinity
            for (const { move, child } of roots) {
                const score = search(child, depth - 1, alpha, beta)
                if (score === null) { complete = false; break }
                if (maximize ? score > bestScore : score < bestScore) {
                    bestScore = score
                    iterationMove = move
                }
                if (maximize) alpha = Math.max(alpha, bestScore)
                else beta = Math.min(beta, bestScore)
            }
            if (!complete) break
            bestMove = iterationMove
        }
        return bestMove
    }

    getBestAIMove(difficulty = 'medium') {
        const move = this.chooseAIMove(difficulty)
        if (!move) return null
        if (move.type === 'place') return { place: move.to, from: null, to: null }
        if (this.currentPlayer === 'tiger') {
            const { from, ...action } = move
            return { from, move: action }
        }
        return { from: move.from, to: move.to }
    }

    getBestTigerMove(difficulty = 'medium') {
        return this.currentPlayer === 'tiger' ? this.getBestAIMove(difficulty) : null
    }

    getBestGoatPlacement(difficulty = 'medium') {
        return this.currentPlayer === 'goat' && this.gamePhase === 'placement' ? this.getBestAIMove(difficulty) : null
    }

    getBestGoatMove(difficulty = 'medium') {
        return this.currentPlayer === 'goat' && this.gamePhase === 'movement' ? this.getBestAIMove(difficulty) : null
    }
}
