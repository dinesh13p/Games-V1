import React, { useState, useEffect } from 'react'

// ============================================================================
// BAGH CHAL GAME LOGIC
// ============================================================================

class BaghChalEngine {
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
        this.moveHistory.push({ player: 'goat', type: 'place', position, timestamp: Date.now() })
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
                captured: move.over,
                timestamp: Date.now()
            })
        } else {
            this.moveHistory.push({
                player: 'tiger',
                type: 'move',
                from,
                to: move.to,
                timestamp: Date.now()
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
        this.moveHistory.push({ player: 'goat', type: 'move', from, to, timestamp: Date.now() })
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
            const centerBonus = pos === 12 ? 2 : ([6,7,8,11,13,16,17,18].includes(pos) ? 1 : 0)
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
            const moves = this._orderTigerMoves(this.getTigerValidMoves(i))
            for (const move of moves) {
                const score = this.evaluateTigerMove(i, move, depth - 1, -Infinity, Infinity)
                if (score > bestScore) {
                    bestScore = score
                    bestMove = move
                    bestFromPos = i
                }
            }
        }

        return { from: bestFromPos, move: bestMove, score: bestScore }
    }

    evaluateTigerMove(from, move, depth, alpha, beta) {
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
                    const goatScore = this.evaluateGoatMove(i, gMove, depth - 1, alpha, beta)
                    minScore = Math.min(minScore, goatScore)
                    beta = Math.min(beta, minScore)
                    if (alpha >= beta) break
                }
                if (alpha >= beta) break
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
            const moves = this._orderGoatMoves(i, this.getGoatValidMoves(i))
            for (const to of moves) {
                const score = this.evaluateGoatMove(i, to, depth - 1, -Infinity, Infinity)
                if (score < bestScore) {
                    bestScore = score
                    bestMove = to
                    bestFromPos = i
                }
            }
        }

        return { from: bestFromPos, to: bestMove, score: bestScore }
    }

    evaluateGoatMove(from, to, depth, alpha, beta) {
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
                    const tigerScore = this.evaluateTigerMove(i, tMove, depth - 1, alpha, beta)
                    maxScore = Math.max(maxScore, tigerScore)
                    alpha = Math.max(alpha, maxScore)
                    if (alpha >= beta) break
                }
                if (alpha >= beta) break
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

    _orderTigerMoves(moves) {
        return [...moves].sort((a, b) => {
            if (a.type !== b.type) return a.type === 'capture' ? -1 : 1
            const center = 12
            const da = Math.abs((a.to % 5) - (center % 5)) + Math.abs(Math.floor(a.to / 5) - Math.floor(center / 5))
            const db = Math.abs((b.to % 5) - (center % 5)) + Math.abs(Math.floor(b.to / 5) - Math.floor(center / 5))
            return da - db
        })
    }

    _orderGoatMoves(from, moves) {
        const scored = moves.map(to => {
            const original = this.board.slice()
            this.board[from] = 0
            this.board[to] = 1
            const mobility = this._computeTigerMobility()
            const vuln = this._goatVulnerabilityAt(to)
            const score = -3 * mobility - 10 * vuln
            this.board = original
            return { to, score }
        })
        scored.sort((a, b) => b.score - a.score)
        return scored.map(s => s.to)
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
            if (this.getValidAdjacents(pos).includes(land) && this.board[land] === 0 && ![0,4,20,24].includes(pos)) vulnerable++
        }
        return vulnerable
    }
}

// ============================================================================
// REACT COMPONENT
// ============================================================================

const BaghChalGame = () => {
    const [gameMode, setGameMode] = useState(null)
    const [playerRole, setPlayerRole] = useState(null)
    const [difficulty, setDifficulty] = useState('medium')
    const [game, setGame] = useState(new BaghChalEngine())
    const [selectedPiece, setSelectedPiece] = useState(null)
    const [validMoves, setValidMoves] = useState([])
    const [gameState, setGameState] = useState(game.getGameState())
    const [scores, setScores] = useState({ tigers: 0, goats: 0, draws: 0 })
    const [aiThinking, setAiThinking] = useState(false)
    const [lastMove, setLastMove] = useState(null)
    const [gameOver, setGameOver] = useState(false)

    useEffect(() => {
        const shouldAIMove = gameMode === 'pvc' &&
            ((playerRole === 'tiger' && gameState.currentPlayer === 'goat') ||
                (playerRole === 'goat' && gameState.currentPlayer === 'tiger'))

        if (shouldAIMove && !aiThinking && !gameOver) {
            setAiThinking(true)
            const aiMove = game.getBestAIMove(difficulty)
            if (aiMove) {
                if (gameState.currentPlayer === 'goat' && gameState.gamePhase === 'placement' && aiMove.place !== undefined) {
                    const gameCopy = new BaghChalEngine()
                    Object.assign(gameCopy, game)
                    gameCopy.board = game.board.slice()
                    gameCopy.placeGoat(aiMove.place)
                    setLastMove({ type: 'place', position: aiMove.place })
                    setGame(gameCopy)
                    setGameState(gameCopy.getGameState())
                    setSelectedPiece(null)
                    setValidMoves([])
                    const result = gameCopy.checkGameState()
                    if (result.winner) handleGameEnd(result)
                } else {
                    executeMove(aiMove)
                }
            }
            setAiThinking(false)
        }
    }, [gameState, gameMode, playerRole, aiThinking])

    const executeMove = (aiMove) => {
        if (gameOver) return
        const gameCopy = new BaghChalEngine()
        Object.assign(gameCopy, game)
        gameCopy.board = game.board.slice()

        if (gameState.currentPlayer === 'tiger') {
            gameCopy.moveTiger(aiMove.from, aiMove.move)
        } else {
            gameCopy.moveGoat(aiMove.from, aiMove.to)
        }

        setLastMove({ from: aiMove.from, to: aiMove.move?.to || aiMove.to })
        setGame(gameCopy)
        setGameState(gameCopy.getGameState())
        setSelectedPiece(null)
        setValidMoves([])

        const result = gameCopy.checkGameState()
        if (result.winner) {
            handleGameEnd(result)
        }
    }

    const handleSquareClick = (position) => {
        if (aiThinking || gameOver) return
        
        if (gameMode === 'pvc') {
            const isAITurn = (playerRole === 'tiger' && gameState.currentPlayer === 'goat') ||
                           (playerRole === 'goat' && gameState.currentPlayer === 'tiger')
            if (isAITurn) return
        }

        const piece = game.board[position]

        if (gameState.gamePhase === 'placement' && gameState.currentPlayer === 'goat') {
            if (piece === 0) {
                const gameCopy = new BaghChalEngine()
                Object.assign(gameCopy, game)
                gameCopy.board = game.board.slice()
                gameCopy.placeGoat(position)

                setLastMove({ type: 'place', position })
                setGame(gameCopy)
                setGameState(gameCopy.getGameState())
                setSelectedPiece(null)
                setValidMoves([])

                const result = gameCopy.checkGameState()
                if (result.winner) {
                    handleGameEnd(result)
                }
            }
            return
        }

        if (gameState.gamePhase === 'movement') {
            if (validMoves.some(m => (m.type === 'move' && m.to === position) || (m.type === 'capture' && m.to === position))) {
                const gameCopy = new BaghChalEngine()
                Object.assign(gameCopy, game)
                gameCopy.board = game.board.slice()

                const move = validMoves.find(m => m.to === position)

                if (gameState.currentPlayer === 'tiger') {
                    gameCopy.moveTiger(selectedPiece, move)
                } else {
                    gameCopy.moveGoat(selectedPiece, position)
                }

                setLastMove({ from: selectedPiece, to: position })
                setGame(gameCopy)
                setGameState(gameCopy.getGameState())
                setSelectedPiece(null)
                setValidMoves([])

                const result = gameCopy.checkGameState()
                if (result.winner) {
                    handleGameEnd(result)
                }
                return
            }

            if ((gameState.currentPlayer === 'tiger' && piece === 2) ||
                (gameState.currentPlayer === 'goat' && piece === 1)) {
                setSelectedPiece(position)

                const moves = gameState.currentPlayer === 'tiger'
                    ? game.getTigerValidMoves(position)
                    : game.getGoatValidMoves(position)

                setValidMoves(moves)
            }
        }
    }

    const handleGameEnd = (result) => {
        if (gameOver) return
        setGameOver(true)
        if (result.winner === 'tiger') {
            setScores(prev => ({ ...prev, tigers: prev.tigers + 1 }))
        } else if (result.winner === 'goat') {
            setScores(prev => ({ ...prev, goats: prev.goats + 1 }))
        } else {
            setScores(prev => ({ ...prev, draws: prev.draws + 1 }))
        }
    }

    const newGame = () => {
        const newGameInstance = new BaghChalEngine()
        setGame(newGameInstance)
        setGameState(newGameInstance.getGameState())
        setSelectedPiece(null)
        setValidMoves([])
        setLastMove(null)
        setGameOver(false)
    }

    const resetScores = () => {
        setScores({ tigers: 0, goats: 0, draws: 0 })
    }

    const backToMenu = () => {
        if (gameMode === 'pvp') {
            setGameMode(null)
            setPlayerRole(null)
        } else {
            setPlayerRole(null)
        }
        newGame()
    }

    if (!gameMode) {
        return (
            <div className="min-h-screen bg-gray-900 text-white">
                <main className="flex items-center justify-center p-6 min-h-screen">
                    <div className="p-8 rounded-2xl max-w-3xl w-full bg-gray-800 border border-gray-700">
                        <div className="text-center mb-8">
                            <h1 className="text-5xl font-bold mb-4">🐯 Bagh Chal 🐐</h1>
                            <p className="text-gray-400 text-lg">The Ancient Nepali Strategic Board Game</p>
                            <p className="text-gray-500 text-sm mt-2">Tiger vs Goat - Can you outwit your opponent?</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <button
                                onClick={() => {
                                    setGameMode('pvp')
                                    setPlayerRole('both')
                                }}
                                className="group bg-gray-700 hover:bg-gradient-to-br hover:from-blue-600 hover:to-purple-600 rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 border-2 border-gray-600 hover:border-transparent"
                            >
                                <div className="text-6xl mb-4">👥</div>
                                <h2 className="text-2xl font-bold mb-3">Player vs Player</h2>
                                <p className="text-gray-300 group-hover:text-white mb-4">
                                    Play with a friend on the same device
                                </p>
                                <div className="text-sm text-gray-400 group-hover:text-gray-200">
                                    Both players control their pieces
                                </div>
                            </button>

                            <button
                                onClick={() => setGameMode('pvc')}
                                className="group bg-gray-700 hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-600 rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 border-2 border-gray-600 hover:border-transparent"
                            >
                                <div className="text-6xl mb-4">🤖</div>
                                <h2 className="text-2xl font-bold mb-3">Player vs Computer</h2>
                                <p className="text-gray-300 group-hover:text-white mb-4">
                                    Challenge our AI opponent
                                </p>
                                <div className="text-sm text-gray-400 group-hover:text-gray-200">
                                    Powered by Minimax algorithm
                                </div>
                            </button>
                        </div>

                        <div className="text-center text-gray-500 text-sm bg-gray-700 p-4 rounded-xl">
                            <p className="mb-2">📜 <strong>How to Play:</strong></p>
                            <p className="mb-2">🐯 <strong>Tigers</strong> win by capturing 5 goats</p>
                            <p>🐐 <strong>Goats</strong> win by blocking all tiger movements</p>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    if (gameMode === 'pvc' && !playerRole) {
        return (
            <div className="min-h-screen bg-gray-900 text-white">
                <main className="flex items-center justify-center p-6 min-h-screen">
                    <div className="p-8 rounded-2xl max-w-2xl w-full bg-gray-800 border border-gray-700">
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-bold mb-4">🐯 Bagh Chal 🐐</h1>
                            <p className="text-gray-400 text-lg">Choose your role</p>
                        </div>

                        <div className="mb-6 p-4 bg-purple-600/20 border border-purple-600/50 rounded-lg">
                            <p className="text-center text-purple-200">Select Difficulty</p>
                            <div className="flex gap-3 justify-center mt-3">
                                {['easy', 'medium', 'hard'].map(diff => (
                                    <button
                                        key={diff}
                                        onClick={() => setDifficulty(diff)}
                                        className={`px-4 py-2 rounded-md capitalize font-semibold transition-all ${difficulty === diff
                                                ? 'bg-purple-600 border border-purple-400'
                                                : 'bg-gray-700 border border-gray-600 hover:border-purple-500'
                                            }`}
                                    >
                                        {diff}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button
                                onClick={() => setPlayerRole('tiger')}
                                className="group bg-orange-500/20 hover:bg-orange-500/40 border-2 border-orange-500/50 hover:border-orange-400 rounded-2xl p-8 transition-all duration-300 transform hover:scale-105"
                            >
                                <div className="text-6xl mb-4">🐯</div>
                                <h2 className="text-2xl font-bold mb-3 text-orange-400">Play as Tiger</h2>
                                <p className="text-gray-300 group-hover:text-white">
                                    Hunt the goats strategically. Capture 5 goats to win!
                                </p>
                            </button>

                            <button
                                onClick={() => setPlayerRole('goat')}
                                className="group bg-green-500/20 hover:bg-green-500/40 border-2 border-green-500/50 hover:border-green-400 rounded-2xl p-8 transition-all duration-300 transform hover:scale-105"
                            >
                                <div className="text-6xl mb-4">🐐</div>
                                <h2 className="text-2xl font-bold mb-3 text-green-400">Play as Goat</h2>
                                <p className="text-gray-300 group-hover:text-white">
                                    Defend wisely. Block all tiger movements to win!
                                </p>
                            </button>
                        </div>

                        <button
                            onClick={() => setGameMode(null)}
                            className="w-full mt-8 px-4 py-2 rounded-md border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white transition-colors"
                        >
                            ← Back
                        </button>
                    </div>
                </main>
            </div>
        )
    }

    const gameResult = game.checkGameState()
    const { winner } = gameResult

    return (
        <div className="min-h-screen bg-gray-900 text-white py-6">
            <main className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setPlayerRole(null)}
                            className="text-white px-3 py-1 rounded text-sm transform transition-all duration-200 hover:scale-105 bg-gray-700 hover:bg-gray-600"
                        >
                            ← Back
                        </button>
                        <h1 className="text-3xl font-bold">🐯 Bagh Chal 🐐</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={resetScores}
                            className="text-white px-3 py-1 rounded text-sm transform transition-all duration-200 hover:scale-105 bg-gray-700 hover:bg-gray-600"
                        >
                            Reset Scores
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3">
                        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8">
                            <div className="mb-6 text-center">
                                <div className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 rounded-lg mb-2">
                                    <span className="font-semibold">
                                        {gameMode === 'pvp' ? '👥 Player vs Player' : '🤖 Player vs Computer'}
                                    </span>
                                </div>
                                {gameMode === 'pvc' && (
                                    <div className="text-gray-400 text-sm">
                                        {playerRole === 'tiger' ? '🐯 You are Tiger' : '🐐 You are Goat'}
                                    </div>
                                )}
                            </div>

                            <div className="mb-6 text-center p-4 bg-gray-700 rounded-lg">
                                {winner ? (
                                    <div>
                                        <h2 className="text-2xl font-bold mb-2">
                                            {winner === 'tiger' ? '🐯 Tigers Win!' : '🐐 Goats Win!'}
                                        </h2>
                                        <p className="text-gray-300 text-sm mb-4">
                                            {winner === 'tiger'
                                                ? `Tiger captured ${gameState.goatsCaptured} goats`
                                                : 'Goats successfully blocked all tiger movements'}
                                        </p>
                                        <button
                                            onClick={newGame}
                                            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold transition-colors"
                                        >
                                            Play Again
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="text-lg font-semibold mb-2">
                                            {gameState.gamePhase === 'placement' ? '📍 Placement Phase' : '🎮 Movement Phase'}
                                        </div>
                                        <div className="flex justify-center gap-8 text-sm">
                                            <div>
                                                <span className="text-gray-400">Goats Placed:</span>
                                                <span className="ml-2 font-bold">{gameState.goatsPlaced}/20</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">Tigers Captured:</span>
                                                <span className="ml-2 font-bold">{gameState.goatsCaptured}/5</span>
                                            </div>
                                        </div>
                                        <div className="mt-3">
                                            {aiThinking ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                                                    <span className="text-sm text-gray-400">AI is thinking...</span>
                                                </div>
                                            ) : (
                                                <span className={`text-sm font-semibold ${gameState.currentPlayer === 'tiger' ? 'text-orange-400' : 'text-green-400'
                                                    }`}>
                                                    {gameState.currentPlayer === 'tiger' ? '🐯 Tiger Turn' : '🐐 Goat Turn'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-center">
                                <div className="relative w-full max-w-lg" style={{ aspectRatio: '1' }}>
                                    <svg
                                        viewBox="0 0 400 400"
                                        className="absolute inset-0 w-full h-full"
                                        style={{ pointerEvents: 'none' }}
                                    >
                                        <g stroke="#4B5563" strokeWidth="2" fill="none">
                                            <line x1="50" y1="50" x2="350" y2="50" />
                                            <line x1="50" y1="125" x2="350" y2="125" />
                                            <line x1="50" y1="200" x2="350" y2="200" />
                                            <line x1="50" y1="275" x2="350" y2="275" />
                                            <line x1="50" y1="350" x2="350" y2="350" />

                                            <line x1="50" y1="50" x2="50" y2="350" />
                                            <line x1="125" y1="50" x2="125" y2="350" />
                                            <line x1="200" y1="50" x2="200" y2="350" />
                                            <line x1="275" y1="50" x2="275" y2="350" />
                                            <line x1="350" y1="50" x2="350" y2="350" />

                                            <line x1="50" y1="50" x2="350" y2="350" />
                                            <line x1="350" y1="50" x2="50" y2="350" />
                                        </g>
                                    </svg>

                                    <div className="absolute inset-0 grid grid-cols-5 grid-rows-5">
                                        {Array.from({ length: 25 }).map((_, pos) => {
                                            const piece = game.board[pos]
                                            const isSelected = selectedPiece === pos
                                            const isValidMove = validMoves.some(m => m.to === pos)
                                            const isLastMove = lastMove && (lastMove.from === pos || lastMove.to === pos)

                                            return (
                                                <button
                                                    key={pos}
                                                    onClick={() => handleSquareClick(pos)}
                                                    disabled={aiThinking}
                                                    className={`relative flex items-center justify-center transition-all duration-200 ${isSelected ? 'ring-2 ring-yellow-400 rounded-lg' : ''
                                                        } ${isValidMove ? 'ring-2 ring-green-400 rounded-lg' : ''
                                                        } ${isLastMove ? 'bg-gray-600/30 rounded-lg' : ''
                                                        }`}
                                                >
                                                    {piece === 2 && (
                                                        <div className={`text-4xl transform transition-transform ${isSelected ? 'scale-125' : 'hover:scale-110'}`}>
                                                            🐯
                                                        </div>
                                                    )}
                                                    {piece === 1 && (
                                                        <div className={`text-4xl transform transition-transform ${isSelected ? 'scale-125' : 'hover:scale-110'}`}>
                                                            🐐
                                                        </div>
                                                    )}
                                                    {isValidMove && !piece && (
                                                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 text-center text-gray-400 text-xs bg-gray-700 p-3 rounded-lg">
                                <p className="mb-1">
                                    {gameState.gamePhase === 'placement'
                                        ? '🐐 Click on empty squares to place goats'
                                        : gameState.currentPlayer === 'tiger'
                                            ? '🐯 Click a tiger to select, then click destination or opponent to capture'
                                            : '🐐 Click a goat to select, then click destination to move'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
                            <h3 className="text-lg font-bold mb-4 text-center">Scoreboard</h3>
                            <div className="space-y-3">
                                <div className="p-3 bg-orange-500/20 border border-orange-500/50 rounded-lg text-center transform transition-all hover:scale-105">
                                    <div className="text-3xl font-bold text-orange-400">🐯</div>
                                    <div className="text-sm text-gray-400">Tiger Wins</div>
                                    <div className="text-2xl font-bold text-orange-300">{scores.tigers}</div>
                                </div>

                                <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-center transform transition-all hover:scale-105">
                                    <div className="text-3xl font-bold text-green-400">🐐</div>
                                    <div className="text-sm text-gray-400">Goat Wins</div>
                                    <div className="text-2xl font-bold text-green-300">{scores.goats}</div>
                                </div>

                                <div className="p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg text-center transform transition-all hover:scale-105">
                                    <div className="text-3xl font-bold text-blue-400">🤝</div>
                                    <div className="text-sm text-gray-400">Draws</div>
                                    <div className="text-2xl font-bold text-blue-300">{scores.draws}</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
                            <h3 className="text-lg font-bold mb-3">Rules</h3>
                            <div className="space-y-2 text-xs text-gray-400">
                                <div>
                                    <span className="font-semibold text-orange-400">🐯 Tiger:</span>
                                    <p>• Capture 5 goats to win</p>
                                    <p>• Jump over goats</p>
                                </div>
                                <div>
                                    <span className="font-semibold text-green-400">🐐 Goat:</span>
                                    <p>• Place 20 goats first</p>
                                    <p>• Block all tigers</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
                            <button
                                onClick={() => backToMenu()}
                                className="w-full px-4 py-3 rounded-md bg-purple-600 hover:bg-purple-700 transition-colors font-semibold"
                            >
                                Back to Menu
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default BaghChalGame