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
export const minimax = (squares, isMaximizing, depth) => {
    const result = calculateWinner(squares)

    if (result.winner === 'O') return 10 - depth
    if (result.winner === 'X') return depth - 10
    if (result.winner === 'Draw') return 0

    if (isMaximizing) {
        let bestScore = -Infinity
        for (let i = 0; i < 9; i++) {
            if (squares[i] === null) {
                squares[i] = 'O'
                const score = minimax(squares, false, depth + 1)
                squares[i] = null
                bestScore = Math.max(score, bestScore)
            }
        }
        return bestScore
    } else {
        let bestScore = Infinity
        for (let i = 0; i < 9; i++) {
            if (squares[i] === null) {
                squares[i] = 'X'
                const score = minimax(squares, true, depth + 1)
                squares[i] = null
                bestScore = Math.min(score, bestScore)
            }
        }
        return bestScore
    }
}

export const getBestMove = (squares) => {
    let bestScore = -Infinity
    let bestMove = null

    for (let i = 0; i < 9; i++) {
        if (squares[i] === null) {
            squares[i] = 'O'
            const score = minimax(squares, false, 0)
            squares[i] = null

            if (score > bestScore) {
                bestScore = score
                bestMove = i
            }
        }
    }

    return bestMove
}