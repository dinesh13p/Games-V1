// TicTacToe Game Logic

export const calculateWinner = (squares) => {
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6],
    ]

    for (let [a, b, c] of lines) {
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return { winner: squares[a], line: [a, b, c] }
        }
    }

    return squares.includes(null)
        ? { winner: null, line: [] }
        : { winner: "Draw", line: [] }
}

// Minimax algorithm for AI
export const minimax = (squares, isMaximizing, depth = 0) => {
    const result = calculateWinner(squares)

    if (result.winner === 'O') return 10 - depth
    if (result.winner === 'X') return depth - 10
    if (result.winner === 'Draw') return 0

    if (isMaximizing) {
        let bestScore = -Infinity
        for (let i = 0; i < 9; i++) {
            if (squares[i] === null) {
                const next = squares.slice()
                next[i] = 'O'
                const score = minimax(next, false, depth + 1)
                bestScore = Math.max(score, bestScore)
            }
        }
        return bestScore
    } else {
        let bestScore = Infinity
        for (let i = 0; i < 9; i++) {
            if (squares[i] === null) {
                const next = squares.slice()
                next[i] = 'X'
                const score = minimax(next, true, depth + 1)
                bestScore = Math.min(score, bestScore)
            }
        }
        return bestScore
    }
}

export const getBestMove = (squares) => {
    if (calculateWinner(squares).winner) return null
    let bestScore = -Infinity
    let bestMove = null

    for (let i = 0; i < 9; i++) {
        if (squares[i] === null) {
            const next = squares.slice()
            next[i] = 'O'
            const score = minimax(next, false, 0)

            if (score > bestScore) {
                bestScore = score
                bestMove = i
            }
        }
    }

    return bestMove
}

export const getAiMove = (squares, difficulty = 'hard', random = Math.random) => {
    if (calculateWinner(squares).winner) return null
    if (difficulty === 'hard') return getBestMove(squares)
    const available = squares.flatMap((value, index) => value === null ? [index] : [])
    if (difficulty === 'medium') {
        for (const player of ['O', 'X']) {
            for (const index of available) {
                const next = squares.slice()
                next[index] = player
                if (calculateWinner(next).winner === player) return index
            }
        }
    }
    return available[Math.min(available.length - 1, Math.floor(random() * available.length))] ?? null
}

export const emptyScores = () => ({ X: 0, O: 0, draws: 0 })

export const createTicTacToeState = (scores = { pvp: emptyScores(), pvc: emptyScores() }) => ({
    squares: Array(9).fill(null),
    next: 'X',
    mode: 'pvc',
    difficulty: 'medium',
    round: 0,
    scores,
})

export const ticTacToeReducer = (state, action) => {
    if (action.type === 'restart' || action.type === 'mode' || action.type === 'difficulty') {
        return {
            ...state,
            squares: Array(9).fill(null),
            next: 'X',
            round: state.round + 1,
            mode: action.type === 'mode' ? action.mode : state.mode,
            difficulty: action.type === 'difficulty' ? action.difficulty : state.difficulty,
        }
    }
    if (action.type === 'resetScores') {
        return { ...state, scores: { ...state.scores, [state.mode]: emptyScores() } }
    }
    if (action.type !== 'move' || action.round !== state.round
        || !Number.isInteger(action.index) || action.index < 0 || action.index > 8
        || state.squares[action.index] !== null || calculateWinner(state.squares).winner) return state

    const aiTurn = state.mode === 'pvc' && state.next === 'O'
    if ((aiTurn && action.actor !== 'ai') || (!aiTurn && action.actor !== 'human')) return state
    const squares = state.squares.slice()
    squares[action.index] = state.next
    const { winner } = calculateWinner(squares)
    const key = winner === 'Draw' ? 'draws' : winner
    const scores = winner ? {
        ...state.scores,
        [state.mode]: { ...state.scores[state.mode], [key]: state.scores[state.mode][key] + 1 },
    } : state.scores
    return { ...state, squares, scores, next: state.next === 'X' ? 'O' : 'X' }
}
