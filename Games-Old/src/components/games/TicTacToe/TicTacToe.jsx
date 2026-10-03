import React, { useState, useEffect } from 'react'
import { calculateWinner, getBestMove } from './TicTacToe.logic'
import './TicTacToe.css'

const Square = ({ value, onClick, isWinning }) => (
    <button
        className={`tic-tac-toe-cell ${isWinning ? 'winning-cell' : ''}`}
        onClick={onClick}
        disabled={!!value}
        aria-label={value ? `Cell with ${value}` : 'Empty cell'}
    >
        <span className={value === 'X' ? 'text-blue-600' : value === 'O' ? 'text-red-500' : ''}>
            {value}
        </span>
    </button>
)

const TicTacToe = () => {
    const [gameMode, setGameMode] = useState(null)
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

    // ... rest of component
}

export default TicTacToe