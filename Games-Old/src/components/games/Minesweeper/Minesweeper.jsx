import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
    DIFFICULTIES, createBoard, floodReveal, safeFirstClick, neighbors
} from './Minesweeper.logic'
import './Minesweeper.css'

const useTimer = (isRunning, resetKey) => {
    const [secs, setSecs] = useState(0)
    useEffect(() => setSecs(0), [resetKey])
    useEffect(() => {
        if (!isRunning) return
        const id = setInterval(() => setSecs(s => s + 1), 1000)
        return () => clearInterval(id)
    }, [isRunning, resetKey])
    return secs
}

const Minesweeper = () => {
    const [difficulty, setDifficulty] = useState('Beginner')
    const [isMobile, setIsMobile] = useState(false)
    const cfg = DIFFICULTIES[difficulty]

    const [resetKey, setResetKey] = useState(0)
    const [board, setBoard] = useState(() => createBoard(cfg.rows, cfg.cols, cfg.mines))
    const [gameOver, setGameOver] = useState(false)
    const [won, setWon] = useState(false)
    const [flagMode, setFlagMode] = useState(false)
    const firstRevealRef = useRef(true)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    useEffect(() => {
        setBoard(createBoard(cfg.rows, cfg.cols, cfg.mines))
        setGameOver(false)
        setWon(false)
        setFlagMode(false)
        firstRevealRef.current = true
    }, [difficulty, resetKey])

    const minesLeft = useMemo(() => {
        const flagged = board.flat().filter(c => c.isFlagged).length
        return Math.max(cfg.mines - flagged, 0)
    }, [board, cfg.mines])

    const revealedCount = useMemo(() => board.flat().filter(c => c.isRevealed).length, [board])
    const totalSafe = cfg.rows * cfg.cols - cfg.mines
    const time = useTimer(!gameOver && !won && revealedCount > 0, resetKey + difficulty)

    const adjacentColor = (n) => {
        const map = {
            1: 'text-blue-600',
            2: 'text-green-600',
            3: 'text-red-600',
            4: 'text-indigo-700',
            5: 'text-yellow-700',
            6: 'text-teal-700',
            7: 'text-fuchsia-700',
            8: 'text-gray-700'
        }
        return map[n] || ''
    }

    const reveal = (r, c) => {
        if (gameOver || won) return
        setBoard(prev => {
            let b = prev.map(row => row.map(cell => ({ ...cell })))
            if (firstRevealRef.current) {
                firstRevealRef.current = false
                b = safeFirstClick(b, r, c, cfg.rows, cfg.cols, cfg.mines)
            }
            const cell = b[r][c]
            if (cell.isRevealed || cell.isFlagged) return b
            if (cell.isMine) {
                for (const item of b.flat()) {
                    if (item.isMine) item.isRevealed = true
                }
                setGameOver(true)
                return b
            }
            floodReveal(b, r, c)
            const revealed = b.flat().filter(c => c.isRevealed && !c.isMine).length
            if (revealed === totalSafe) {
                for (const item of b.flat()) if (item.isMine) item.isFlagged = true
                setWon(true)
            }
            return b
        })
    }

    const toggleFlag = (r, c) => {
        if (gameOver || won) return
        setBoard(prev => {
            const b = prev.map(row => row.map(cell => ({ ...cell })))
            const cell = b[r][c]
            if (cell.isRevealed) return b
            cell.isFlagged = !cell.isFlagged
            return b
        })
    }

    const handleCellClick = (r, c) => {
        if (flagMode) toggleFlag(r, c)
        else reveal(r, c)
    }

    const handleContextMenu = (e, r, c) => {
        e.preventDefault()
        toggleFlag(r, c)
    }

    const reset = () => setResetKey(k => k + 1)

    const handleDifficultyChange = (e) => {
        const newDifficulty = e.target.value
        if (isMobile && (newDifficulty === 'Intermediate' || newDifficulty === 'Expert')) return
        setDifficulty(newDifficulty)
    }

    return (
        <div className="minesweeper-container">
            <div className="minesweeper-header">
                <h1>💣 Minesweeper</h1>
                <button onClick={reset} className="reset-btn">Reset</button>
            </div>

            <div className="minesweeper-stats">
                <div className="stat"><span>💣 Mines</span><span>{cfg.mines}</span></div>
                <div className="stat"><span>🚩 Flags</span><span>{board.flat().filter(c => c.isFlagged).length}</span></div>
                <div className="stat"><span>⏱️ Time</span><span>{time}s</span></div>
            </div>

            <div className="minesweeper-controls">
                <select value={difficulty} onChange={handleDifficultyChange} className="difficulty-select">
                    {Object.keys(DIFFICULTIES).map(k => (
                        <option key={k} value={k} disabled={isMobile && (k === 'Intermediate' || k === 'Expert')}>
                            {k}{isMobile && (k === 'Intermediate' || k === 'Expert') ? ' (Desktop Only)' : ''}
                        </option>
                    ))}
                </select>
                <button
                    onClick={() => setFlagMode(v => !v)}
                    className={`flag-toggle ${flagMode ? 'active' : ''}`}
                >
                    {flagMode ? '🚩 Flag Mode ON' : '🚩 Flag Mode'}
                </button>
            </div>

            <div className="minesweeper-game-area">
                <div
                    className="minesweeper-board"
                    style={{ gridTemplateColumns: `repeat(${cfg.cols}, 1fr)` }}
                >
                    {board.map((row, r) =>
                        row.map((cell, c) => (
                            <button
                                key={`${r}-${c}`}
                                onClick={() => handleCellClick(r, c)}
                                onContextMenu={(e) => handleContextMenu(e, r, c)}
                                disabled={gameOver || won}
                                className={`cell ${cell.isRevealed ? 'revealed' : 'hidden'} ${cell.isMine && cell.isRevealed ? 'mine' : ''}`}
                            >
                                {cell.isRevealed ? (
                                    cell.isMine ? '💣' : cell.adjacent > 0 ?
                                        <span className={adjacentColor(cell.adjacent)}>{cell.adjacent}</span> : ''
                                ) : cell.isFlagged ? '🚩' : ''}
                            </button>
                        ))
                    )}
                </div>

                <div className="minesweeper-actions">
                    {!gameOver && !won && (
                        <button onClick={reset} className="btn-primary">New Game</button>
                    )}
                    {gameOver && (
                        <button onClick={reset} className="btn-danger">Try Again</button>
                    )}
                    {won && (
                        <button onClick={reset} className="btn-success">Play Again</button>
                    )}
                </div>

                <div className="minesweeper-instructions">
                    <p>🎯 <strong>How to Play:</strong></p>
                    <p>Uncover all safe tiles without detonating a mine! Numbers show adjacent mines.</p>
                    <p className="text-xs">Left click to reveal • Right click to flag • On mobile: toggle Flag Mode</p>
                </div>
            </div>
        </div>
    )
}

export default Minesweeper