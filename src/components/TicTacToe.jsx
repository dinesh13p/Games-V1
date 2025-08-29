import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

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

const TicTacToe = () => {
    const navigate = useNavigate()
    const [history, setHistory] = useState([Array(9).fill(null)])
    const [step, setStep] = useState(0)
    const [xIsNext, setXIsNext] = useState(true)
    const [scores, setScores] = useState(() => {
        try {
            const saved = localStorage.getItem('ticTacToeScores')
            return saved ? JSON.parse(saved) : { X: 0, O: 0, draws: 0 }
        } catch {
            return { X: 0, O: 0, draws: 0 }
        }
    })
    
    const squares = history[step]
    const gameResult = calculateWinner(squares)
    const { winner, line: winningLine } = gameResult

    // Save scores to localStorage whenever scores change
    useEffect(() => {
        try {
            localStorage.setItem('ticTacToeScores', JSON.stringify(scores))
        } catch (error) {
            console.warn('Could not save scores to localStorage:', error)
        }
    }, [scores])

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
                [result.winner]: prev[result.winner] + 1
            }))
        } else if (result.winner === "Draw") {
            setScores(prev => ({
                ...prev,
                draws: prev.draws + 1
            }))
        }
    }

    const newGame = () => {
        setHistory([Array(9).fill(null)])
        setStep(0)
        setXIsNext(true)
    }

    const resetScores = () => {
        setScores({ X: 0, O: 0, draws: 0 })
        try {
            localStorage.removeItem('ticTacToeScores')
        } catch (error) {
            console.warn('Could not clear scores from localStorage:', error)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="game-board p-8 rounded-2xl fade-in max-w-2xl w-full transform transition-all duration-500">
                <div className="flex justify-between items-center mb-6">
                    <button 
                        className="btn-secondary text-white px-4 py-2 rounded-lg font-semibold transform transition-all duration-200 hover:scale-105"
                        onClick={() => navigate('/')}
                        aria-label="Back to Home"
                    >
                        ← Back to Home
                    </button>
                    <h1 className="text-3xl font-bold text-gray-800">⭕ Tic-Tac-Toe ✖️</h1>
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

                {/* Scoreboard */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-100 rounded-xl transform transition-all duration-300 hover:scale-105">
                        <div className="text-3xl font-bold text-blue-600 mb-1">X</div>
                        <div className="text-xl font-semibold text-gray-700">{scores.X}</div>
                        <div className="text-xs text-gray-500">Player 1</div>
                    </div>
                    <div className="text-center p-4 bg-gray-100 rounded-xl transform transition-all duration-300 hover:scale-105">
                        <div className="text-xl font-bold text-gray-600 mb-1">Draws</div>
                        <div className="text-xl font-semibold text-gray-700">{scores.draws}</div>
                        <div className="text-xs text-gray-500">Ties</div>
                    </div>
                    <div className="text-center p-4 bg-red-100 rounded-xl transform transition-all duration-300 hover:scale-105">
                        <div className="text-3xl font-bold text-red-600 mb-1">O</div>
                        <div className="text-xl font-semibold text-gray-700">{scores.O}</div>
                        <div className="text-xs text-gray-500">Player 2</div>
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    <h2 className="text-2xl font-bold mb-6 text-center transform transition-all duration-300">
                        {winner === "Draw" ? (
                            <span className="text-yellow-600 animate-bounce-slow">🤝 It's a Draw!</span>
                        ) : winner ? (
                            <span className={`${winner === 'X' ? 'text-blue-600' : 'text-red-500'} animate-pulse-slow`}>
                                🎉 Winner: {winner}
                            </span>
                        ) : (
                            <span className={`${xIsNext ? 'text-blue-600' : 'text-red-500'} animate-pulse`}>
                                {xIsNext ? "🔵" : "🔴"} Next Player: {xIsNext ? "X" : "O"}
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
                            className="btn-primary text-white px-6 py-3 rounded-lg font-bold transform transition-all duration-200 hover:scale-105"
                            onClick={newGame}
                            aria-label="Start a new game"
                        >
                            🎮 New Game
                        </button>
                    </div>

                    {/* Instructions */}
                    <div className="mt-6 text-center text-gray-600 text-sm bg-gray-50 p-4 rounded-xl">
                        <p className="mb-2">🎯 <strong>How to Play:</strong></p>
                        <p>Get three of your marks in a row (horizontal, vertical, or diagonal) to win!</p>
                        <p className="mt-2 text-xs text-gray-500">Click on any empty square to make your move</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TicTacToe