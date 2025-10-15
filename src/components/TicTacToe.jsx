import React, { useState, useEffect } from 'react'

const Square = ({ value, onClick, isWinning }) => (
    <button
        className={`tic-tac-toe-cell w-20 h-20 text-3xl font-bold flex items-center justify-center rounded-lg transform transition-all duration-200 hover:scale-95 ${
            isWinning ? 'winning-cell' : ''
        }`}
        onClick={onClick}
        disabled={!!value}
        aria-label={value ? `Cell with ${value}` : 'Empty cell'}
    >
        <span className={value === 'X' ? 'text-blue-600' : value === 'O' ? 'text-red-500' : ''}>
            {value}
        </span>
    </button>
)

const calculateWinner = (squares) => {
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
const minimax = (squares, isMaximizing, depth) => {
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

const getBestMove = (squares) => {
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

const TicTacToe = () => {
    const [gameMode, setGameMode] = useState(null) // null, 'pvp' or 'pvc'
    const [history, setHistory] = useState([Array(9).fill(null)])
    const [step, setStep] = useState(0)
    const [xIsNext, setXIsNext] = useState(true)
    const [scores, setScores] = useState(() => {
        const saved = {}
        try {
            const savedPvP = window.localStorage?.getItem('ticTacToeScores')
            const savedPvC = window.localStorage?.getItem('ticTacToeScoresAI')
            saved.pvp = savedPvP ? JSON.parse(savedPvP) : { X: 0, O: 0, draws: 0 }
            saved.pvc = savedPvC ? JSON.parse(savedPvC) : { X: 0, O: 0, draws: 0 }
        } catch {
            saved.pvp = { X: 0, O: 0, draws: 0 }
            saved.pvc = { X: 0, O: 0, draws: 0 }
        }
        return saved
    })
    
    const squares = history[step]
    const gameResult = calculateWinner(squares)
    const { winner, line: winningLine } = gameResult

    // Save scores whenever they change
    useEffect(() => {
        try {
            if (window.localStorage) {
                window.localStorage.setItem('ticTacToeScores', JSON.stringify(scores.pvp))
                window.localStorage.setItem('ticTacToeScoresAI', JSON.stringify(scores.pvc))
            }
        } catch (error) {
            console.warn('Could not save scores:', error)
        }
    }, [scores])

    // AI move effect
    useEffect(() => {
        if (gameMode === 'pvc' && !xIsNext && !winner) {
            const timer = setTimeout(() => {
                const bestMove = getBestMove(squares)
                if (bestMove !== null) {
                    handleClick(bestMove)
                }
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [gameMode, xIsNext, winner, squares])

    const handleClick = (i) => {
        if (squares[i] || winner) return
        
        const newSquares = squares.slice()
        newSquares[i] = xIsNext ? "X" : "O"
        const newHistory = [...history.slice(0, step + 1), newSquares]
        setHistory(newHistory)
        setStep(newHistory.length - 1)
        setXIsNext(!xIsNext)
        
        // Update scores when game ends
        const result = calculateWinner(newSquares)
        if (result.winner && result.winner !== "Draw") {
            setScores(prev => ({
                ...prev,
                [gameMode]: {
                    ...prev[gameMode],
                    [result.winner]: prev[gameMode][result.winner] + 1
                }
            }))
        } else if (result.winner === "Draw") {
            setScores(prev => ({
                ...prev,
                [gameMode]: {
                    ...prev[gameMode],
                    draws: prev[gameMode].draws + 1
                }
            }))
        }
    }

    const newGame = () => {
        setHistory([Array(9).fill(null)])
        setStep(0)
        setXIsNext(true)
    }

    const resetScores = () => {
        setScores(prev => ({
            ...prev,
            [gameMode]: { X: 0, O: 0, draws: 0 }
        }))
        try {
            if (window.localStorage) {
                if (gameMode === 'pvp') {
                    window.localStorage.removeItem('ticTacToeScores')
                } else {
                    window.localStorage.removeItem('ticTacToeScoresAI')
                }
            }
        } catch (error) {
            console.warn('Could not clear scores:', error)
        }
    }

    const startGame = (mode) => {
        setGameMode(mode)
        newGame()
    }

    const backToMenu = () => {
        setGameMode(null)
        newGame()
    }

    const currentScores = gameMode ? scores[gameMode] : { X: 0, O: 0, draws: 0 }

    // Mode Selection Screen
    if (!gameMode) {
        return (
            <div className="min-h-screen bg-gray-900 text-white">
                <main className="flex items-center justify-center p-6">
                    <div className="p-8 rounded-2xl fade-in max-w-2xl w-full transform transition-all duration-500 bg-gray-800 border border-gray-700">
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-bold mb-4">⭕ Tic-Tac-Toe ✖️</h1>
                            <p className="text-gray-400 text-lg">Choose your game mode</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Player vs Player Card */}
                            <button
                                onClick={() => startGame('pvp')}
                                className="group bg-gray-700 hover:bg-gradient-to-br hover:from-blue-600 hover:to-purple-600 rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 border-2 border-gray-600 hover:border-transparent"
                            >
                                <div className="text-6xl mb-4">👥</div>
                                <h2 className="text-2xl font-bold mb-3">Player vs Player</h2>
                                <p className="text-gray-300 group-hover:text-white mb-4">
                                    Play with a friend on the same device
                                </p>
                                <div className="text-sm text-gray-400 group-hover:text-gray-200">
                                    Classic two-player mode
                                </div>
                            </button>

                            {/* Player vs Computer Card */}
                            <button
                                onClick={() => startGame('pvc')}
                                className="group bg-gray-700 hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-600 rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 border-2 border-gray-600 hover:border-transparent"
                            >
                                <div className="text-6xl mb-4">🤖</div>
                                <h2 className="text-2xl font-bold mb-3">Player vs Computer</h2>
                                <p className="text-gray-300 group-hover:text-white mb-4">
                                    Challenge our unbeatable AI
                                </p>
                                <div className="text-sm text-gray-400 group-hover:text-gray-200">
                                    Powered by minimax algorithm
                                </div>
                            </button>
                        </div>

                        <div className="mt-8 text-center text-gray-500 text-sm bg-gray-700 p-4 rounded-xl">
                            <p className="mb-2">🎯 <strong>How to Play:</strong></p>
                            <p>Get three of your marks in a row (horizontal, vertical, or diagonal) to win!</p>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    // Game Board Screen
    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <main className="flex items-center justify-center p-6">
                <div className="game-board p-8 rounded-2xl fade-in max-w-2xl w-full transform transition-all duration-500 bg-gray-800 border border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={backToMenu}
                                className="text-white px-3 py-1 rounded text-sm transform transition-all duration-200 hover:scale-105 bg-gray-700 hover:bg-gray-600"
                                aria-label="Back to menu"
                            >
                                ← Back
                            </button>
                            <h1 className="text-3xl font-bold text-black">⭕ Tic-Tac-Toe ✖️</h1>
                        </div>
                        <div className="text-right">
                            <button 
                                className="btn-secondary text-white px-3 py-1 rounded text-sm transform transition-all duration-200 hover:scale-105"
                                onClick={resetScores}
                                aria-label="Reset scores"
                            >
                                Reset Scores
                            </button>
                        </div>
                    </div>

                    {/* Mode Indicator */}
                    <div className="mb-6 text-center">
                        <div className="inline-block bg-purple-600 px-4 py-2 rounded-lg">
                            <span className="font-semibold">
                                {gameMode === 'pvp' ? '👥 Player vs Player' : '🤖 Player vs Computer'}
                            </span>
                        </div>
                    </div>

                    {/* Scoreboard */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-blue-100 rounded-xl transform transition-all duration-300 hover:scale-105">
                            <div className="text-3xl font-bold text-blue-600 mb-1">X</div>
                            <div className="text-xl font-semibold text-gray-700">{currentScores.X}</div>
                            <div className="text-xs text-gray-500">{gameMode === 'pvp' ? 'Player 1' : 'You'}</div>
                        </div>
                        <div className="text-center p-4 bg-gray-100 rounded-xl transform transition-all duration-300 hover:scale-105">
                            <div className="text-xl font-bold text-gray-600 mb-1">Draws</div>
                            <div className="text-xl font-semibold text-gray-700">{currentScores.draws}</div>
                            <div className="text-xs text-gray-500">Ties</div>
                        </div>
                        <div className="text-center p-4 bg-red-100 rounded-xl transform transition-all duration-300 hover:scale-105">
                            <div className="text-3xl font-bold text-red-600 mb-1">O</div>
                            <div className="text-xl font-semibold text-gray-700">{currentScores.O}</div>
                            <div className="text-xs text-gray-500">{gameMode === 'pvp' ? 'Player 2' : 'Computer'}</div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center">
                        <h2 className="text-2xl font-bold mb-6 text-center transform transition-all duration-300">
                            {winner === "Draw" ? (
                                <span className="text-yellow-600 animate-bounce-slow">🤝 It's a Draw!</span>
                            ) : winner ? (
                                <span className={`${winner === 'X' ? 'text-blue-600' : 'text-red-500'} animate-pulse-slow`}>
                                    🎉 Winner: {winner === 'X' && gameMode === 'pvc' ? 'You' : winner === 'O' && gameMode === 'pvc' ? 'Computer' : winner}
                                </span>
                            ) : (
                                <span className={`${xIsNext ? 'text-blue-600' : 'text-red-500'} animate-pulse`}>
                                    {xIsNext ? "🔵" : "🔴"} Next Player: {gameMode === 'pvc' ? (xIsNext ? 'You (X)' : 'Computer (O)') : (xIsNext ? "X" : "O")}
                                </span>
                            )}
                        </h2>

                        {/* Game Board */}
                        <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-gray-50 rounded-xl shadow-lg" role="presentation" aria-label="Tic-Tac-Toe game board">
                            {squares.map((val, i) => (
                                <Square 
                                    key={i} 
                                    value={val} 
                                    onClick={() => handleClick(i)}
                                    isWinning={winningLine.includes(i)}
                                />
                            ))}
                        </div>

                        {/* Game Controls */}
                        <div className="flex gap-4 mb-6">
                            <button
                                className="bg-emerald-500 hover:bg-emerald-600 rounded-md text-sm font-semibold transform transition active:scale-95 text-white px-6 py-3"
                                onClick={newGame}
                                aria-label="Start a new game"
                            >
                                🎮 Start Game
                            </button>
                        </div>

                        {/* Instructions */}
                        <div className="mt-6 text-center text-gray-600 text-sm bg-gray-50 p-4 rounded-xl">
                            <p className="mb-2">🎯 <strong>How to Play:</strong></p>
                            <p>Get three of your marks in a row (horizontal, vertical, or diagonal) to win!</p>
                            {gameMode === 'pvc' && (
                                <p className="mt-2 text-xs text-purple-600 font-semibold">Playing against AI using minimax algorithm - good luck! 🤖</p>
                            )}
                            <p className="mt-2 text-xs text-gray-500">Click on any empty square to make your move</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default TicTacToe