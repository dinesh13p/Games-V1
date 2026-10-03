import React, { useState, useEffect, useCallback } from 'react'
import {
    initialMaze, PACMAN_BASE_START, GHOST_BASE_STARTS, DIFFICULTIES,
    scaleMaze, findNearestOpenCell, getDistance
} from './PacMan.logic'
import './PacMan.css'

export default function PacMan() {
    const [difficulty, setDifficulty] = useState('Beginner')
    const [maze, setMaze] = useState(() => initialMaze.map(row => [...row]))
    const [pacman, setPacman] = useState({ x: 1, y: 13 })
    const [ghosts, setGhosts] = useState([
        { x: 6, y: 7, color: 'red', direction: { dx: 1, dy: 0 }, mode: 'chase', targetX: 1, targetY: 13 },
        { x: 8, y: 7, color: 'pink', direction: { dx: -1, dy: 0 }, mode: 'chase', targetX: 1, targetY: 13 }
    ])
    const [score, setScore] = useState(0)
    const [gameState, setGameState] = useState('waiting')
    const [powerMode, setPowerMode] = useState(false)
    const [powerTimer, setPowerTimer] = useState(0)
    const [isMobile, setIsMobile] = useState(false)
    const [highScore, setHighScore] = useState(0)
    const [lastDirection, setLastDirection] = useState({ dx: 0, dy: 0 })
    const [ambushAhead, setAmbushAhead] = useState(DIFFICULTIES['Beginner'].ambushAhead)
    let GHOST_BASE_SPEED = 200, GHOST_POWER_SPEED = 350

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    useEffect(() => {
        if (score > highScore) setHighScore(score)
    }, [score, highScore])

    const createLevelState = useCallback((levelKey) => {
        const cfg = DIFFICULTIES[levelKey]
        const scaled = scaleMaze(initialMaze, cfg.scale)
        const w = scaled[0].length, h = scaled.length
        GHOST_BASE_SPEED = cfg.baseSpeed
        GHOST_POWER_SPEED = cfg.powerSpeed
        const px = Math.min(w - 1, Math.max(0, Math.round(PACMAN_BASE_START.x * cfg.scale)))
        const py = Math.min(h - 1, Math.max(0, Math.round(PACMAN_BASE_START.y * cfg.scale)))
        const pacStart = findNearestOpenCell(scaled, px, py)
        const ghostList = []
        for (let i = 0; i < cfg.ghosts; i++) {
            const base = GHOST_BASE_STARTS[i % GHOST_BASE_STARTS.length]
            const gx = Math.min(w - 1, Math.max(0, Math.round(base.x * cfg.scale)))
            const gy = Math.min(h - 1, Math.max(0, Math.round(base.y * cfg.scale)))
            const gStart = findNearestOpenCell(scaled, gx, gy)
            ghostList.push({
                x: gStart.x,
                y: gStart.y,
                color: base.color,
                direction: { ...base.direction },
                mode: 'chase',
                targetX: pacStart.x,
                targetY: pacStart.y
            })
        }
        return { scaled, pacStart, ghostList, cfg }
    }, [])

    const startGame = useCallback(() => {
        setGameState('playing')
        setScore(0)
        setPowerMode(false)
        setPowerTimer(0)
        const { scaled, pacStart, ghostList, cfg } = createLevelState(difficulty)
        setMaze(scaled)
        setPacman({ x: pacStart.x, y: pacStart.y })
        setGhosts(ghostList)
        setLastDirection({ dx: 0, dy: 0 })
        setAmbushAhead(cfg.ambushAhead)
    }, [difficulty, createLevelState])

    const movePacman = useCallback((dx, dy) => {
        if (gameState !== 'playing') return
        setLastDirection({ dx, dy })
        const newX = pacman.x + dx, newY = pacman.y + dy
        const width = maze[0].length, height = maze.length
        let finalX = newX
        if (newX < 0) finalX = width - 1
        if (newX > width - 1) finalX = 0
        if (newY < 0 || newY >= height) return
        if (maze[newY] && maze[newY][finalX] === "W") return
        let updatedMaze = maze.map(row => [...row])
        let newScore = score
        if (maze[newY][finalX] === "P") {
            newScore += 10
            updatedMaze[newY][finalX] = "E"
        }
        if (maze[newY][finalX] === "O") {
            newScore += 50
            updatedMaze[newY][finalX] = "E"
            setPowerMode(true)
            setPowerTimer(5000)
        }
        setMaze(updatedMaze)
        setPacman({ x: finalX, y: newY })
        setScore(newScore)
    }, [maze, pacman, gameState, score])

    const handleMobileControl = (direction) => {
        switch (direction) {
            case 'up': movePacman(0, -1); break
            case 'down': movePacman(0, 1); break
            case 'left': movePacman(-1, 0); break
            case 'right': movePacman(1, 0); break
        }
    }

    useEffect(() => {
        if (isMobile) return
        const handleKey = (e) => {
            e.preventDefault()
            switch (e.key) {
                case "ArrowUp": case "w": case "W": movePacman(0, -1); break
                case "ArrowDown": case "s": case "S": movePacman(0, 1); break
                case "ArrowLeft": case "a": case "A": movePacman(-1, 0); break
                case "ArrowRight": case "d": case "D": movePacman(1, 0); break
                case " ":
                    if (gameState === 'waiting') startGame()
                    else if (gameState !== 'playing') restartGame()
                    break
            }
        }
        window.addEventListener("keydown", handleKey)
        return () => window.removeEventListener("keydown", handleKey)
    }, [movePacman, gameState, isMobile, startGame])

    const restartGame = useCallback(() => {
        setMaze(initialMaze.map(row => [...row]))
        setPacman({ x: 1, y: 13 })
        setGhosts([
            { x: 6, y: 7, color: 'red', direction: { dx: 1, dy: 0 }, mode: 'chase', targetX: 1, targetY: 13 },
            { x: 8, y: 7, color: 'pink', direction: { dx: -1, dy: 0 }, mode: 'chase', targetX: 1, targetY: 13 }
        ])
        setScore(0)
        setGameState('playing')
        setPowerMode(false)
        setPowerTimer(0)
    }, [])

    useEffect(() => {
        if (powerTimer > 0) {
            const interval = setInterval(() => {
                setPowerTimer(prev => {
                    if (prev <= 100) {
                        setPowerMode(false)
                        return 0
                    }
                    return prev - 100
                })
            }, 100)
            return () => clearInterval(interval)
        }
    }, [powerTimer])

    const isValidMove = (x, y) => {
        const width = maze[0].length, height = maze.length
        let finalX = x
        if (x < 0) finalX = width - 1
        if (x > width - 1) finalX = 0
        if (y < 0 || y >= height) return false
        if (maze[y] && maze[y][finalX] === "W") return false
        return true
    }

    const findBestPathToTarget = (ghost, targetX, targetY) => {
        const directions = [
            { dx: 0, dy: -1 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }
        ]
        let validDirections = directions.filter(dir => {
            const newX = ghost.x + dir.dx, newY = ghost.y + dir.dy
            if (!isValidMove(newX, newY)) return false
            const isReverse = (dir.dx === -ghost.direction.dx && dir.dy === -ghost.direction.dy)
            return !isReverse
        })
        if (validDirections.length === 0)
            validDirections = directions.filter(dir => isValidMove(ghost.x + dir.dx, ghost.y + dir.dy))
        if (validDirections.length === 0) return ghost.direction
        validDirections.forEach(dir => {
            let finalX = ghost.x + dir.dx
            if (finalX < 0) finalX = 14
            if (finalX > 14) finalX = 0
            dir.distance = getDistance(finalX, ghost.y + dir.dy, targetX, targetY)
        })
        if (powerMode && ghost.mode === 'flee')
            validDirections.sort((a, b) => b.distance - a.distance)
        else
            validDirections.sort((a, b) => a.distance - b.distance)
        if (Math.random() < 0.2 && validDirections.length > 1)
            return validDirections[Math.floor(Math.random() * Math.min(2, validDirections.length))]
        return validDirections[0]
    }

    const updateGhostBehavior = (ghost) => {
        let targetX = pacman.x, targetY = pacman.y
        const width = maze[0].length, height = maze.length
        if (ghost.color === 'red') {
            targetX = Math.max(0, Math.min(width - 1, pacman.x + lastDirection.dx))
            targetY = Math.max(0, Math.min(height - 1, pacman.y + lastDirection.dy))
        } else if (ghost.color === 'pink') {
            targetX = Math.max(0, Math.min(width - 1, pacman.x + lastDirection.dx * ambushAhead))
            targetY = Math.max(0, Math.min(height - 1, pacman.y + lastDirection.dy * ambushAhead))
        } else if (ghost.color === 'cyan') {
            const offset = { dx: lastDirection.dy, dy: -lastDirection.dx }
            targetX = Math.max(0, Math.min(width - 1, pacman.x + lastDirection.dx * (ambushAhead - 1) + offset.dx * 2))
            targetY = Math.max(0, Math.min(height - 1, pacman.y + lastDirection.dy * (ambushAhead - 1) + offset.dy * 2))
        } else if (ghost.color === 'orange') {
            const dist = getDistance(ghost.x, ghost.y, pacman.x, pacman.y)
            if (dist <= Math.max(6, Math.round(ambushAhead))) {
                targetX = 0
                targetY = height - 1
            }
        } else if (ghost.color === 'green') {
            targetX = Math.max(0, Math.min(width - 1, pacman.x + lastDirection.dx * (ambushAhead - 2) + Math.sign(Math.random() - 0.5)))
            targetY = Math.max(0, Math.min(height - 1, pacman.y + lastDirection.dy * (ambushAhead - 2) + Math.sign(Math.random() - 0.5)))
        }
        if (powerMode) {
            ghost.mode = 'flee'
            targetX = ghost.x < Math.floor(width / 2) ? width - 1 : 0
            targetY = ghost.y < Math.floor(height / 2) ? height - 1 : 0
        } else ghost.mode = 'chase'
        ghost.targetX = targetX
        ghost.targetY = targetY
        return findBestPathToTarget(ghost, targetX, targetY)
    }

    useEffect(() => {
        if (gameState !== 'playing') return
        const width = maze[0].length
        const interval = setInterval(() => {
            setGhosts(prevGhosts => prevGhosts.map(ghost => {
                const newDirection = updateGhostBehavior(ghost)
                if (!newDirection) return ghost
                let finalX = ghost.x + newDirection.dx
                if (finalX < 0) finalX = width - 1
                if (finalX > width - 1) finalX = 0
                const newY = ghost.y + newDirection.dy
                if (isValidMove(finalX, newY))
                    return { ...ghost, x: finalX, y: newY, direction: newDirection }
                return ghost
            }))
        }, powerMode ? GHOST_POWER_SPEED : GHOST_BASE_SPEED)
        return () => clearInterval(interval)
    }, [gameState, pacman, powerMode, maze, lastDirection])

    useEffect(() => {
        if (gameState !== 'playing') return
        const collidingGhostIndex = ghosts.findIndex(ghost =>
            Math.abs(ghost.x - pacman.x) <= 0.8 && Math.abs(ghost.y - pacman.y) <= 0.8
        )
        if (collidingGhostIndex !== -1) {
            if (powerMode) {
                setScore(prev => prev + 200)
                setGhosts(prevGhosts => prevGhosts.map((ghost, index) => {
                    if (index === collidingGhostIndex) return { ...ghost, x: 7, y: 7 }
                    return ghost
                }))
            } else setGameState('gameOver')
        }
        const hasRemainingPellets = maze.some(row => row.some(cell => cell === "P" || cell === "O"))
        if (!hasRemainingPellets) setGameState('won')
    }, [pacman, ghosts, gameState, powerMode, maze])

    const resetScores = () => setHighScore(0)

    const handleDifficultyChange = (e) => {
        const key = e.target.value
        if (isMobile && (key === "Intermediate" || key === "Advanced")) return
        setDifficulty(key)
        const { scaled, pacStart, ghostList, cfg } = createLevelState(key)
        setMaze(scaled)
        setPacman({ x: pacStart.x, y: pacStart.y })
        setGhosts(ghostList)
        setScore(0)
        setGameState('waiting')
        setPowerMode(false)
        setPowerTimer(0)
        setLastDirection({ dx: 0, dy: 0 })
        setAmbushAhead(cfg.ambushAhead)
    }

    const getCellDisplay = (cell, x, y) => {
        if (Math.abs(pacman.x - x) < 0.1 && Math.abs(pacman.y - y) < 0.1)
            return <div className="pacman-cell pacman">🟡</div>
        const ghostOnCell = ghosts.find(ghost => Math.abs(ghost.x - x) < 0.1 && Math.abs(ghost.y - y) < 0.1)
        if (ghostOnCell) {
            if (powerMode)
                return <div className="pacman-cell ghost frightened">👻</div>
            else {
                const ghostColor = ghostOnCell.color === 'red' ? 'red' : 'pink'
                return <div className={`pacman-cell ghost ${ghostColor}`}>{ghostOnCell.color === 'red' ? '🔴' : '🩷'}</div>
            }
        }
        switch (cell) {
            case "W": return <div className="pacman-cell wall"></div>
            case "P": return <div className="pacman-cell pellet"><div className="pellet-dot"></div></div>
            case "O": return <div className="pacman-cell power-pellet"><div className="power-dot"></div></div>
            default: return <div className="pacman-cell empty"></div>
        }
    }

    return (
        <div className="pacman-container">
            <div className="pacman-header">
                <h1>🥠 Pac-Man</h1>
                <button onClick={resetScores} className="reset-btn">Reset High Score</button>
            </div>

            <div className="pacman-stats">
                <div className="stat"><span>Score</span><span>{score}</span></div>
                <div className="stat"><span>High Score</span><span>{highScore}</span></div>
                <div className="stat"><span>Power</span><span>{powerMode ? `${Math.ceil(powerTimer / 1000)}s` : "Off"}</span></div>
            </div>

            <div className="pacman-game-area">
                <h2 className="pacman-status">
                    {gameState === 'waiting' ? '🎮 Ready to Play!' :
                        gameState === 'playing' ? '🎮 Playing...' :
                            gameState === 'gameOver' ? '💥 Game Over!' :
                                '🎉 You Win!'}
                </h2>

                <div className="pacman-board-wrapper">
                    <div className="pacman-board" style={{ gridTemplateColumns: `repeat(${maze[0]?.length || 15}, 1fr)` }}>
                        {maze.map((row, y) => row.map((cell, x) => (
                            <div key={`${x}-${y}`} className="pacman-cell-wrapper">
                                {getCellDisplay(cell, x, y)}
                            </div>
                        )))}
                    </div>
                </div>

                {isMobile && (
                    <div className="pacman-mobile-controls">
                        <div className="pacman-dpad">
                            <button onClick={() => handleMobileControl('up')} className="dpad-btn up">⬆</button>
                            <button onClick={() => handleMobileControl('left')} className="dpad-btn left">⬅</button>
                            <button onClick={() => handleMobileControl('down')} className="dpad-btn down">⬇</button>
                            <button onClick={() => handleMobileControl('right')} className="dpad-btn right">➡</button>
                        </div>
                    </div>
                )}

                <div className="pacman-actions">
                    {gameState === 'waiting' && (
                        <>
                            <button onClick={startGame} className="btn-primary">🎮 Start Game</button>
                            <div className="difficulty-selector">
                                <label>Difficulty:</label>
                                <select value={difficulty} onChange={handleDifficultyChange}>
                                    {Object.keys(DIFFICULTIES).map(k => (
                                        <option key={k} value={k} disabled={isMobile && (k === "Intermediate" || k === "Advanced")}>
                                            {k}{isMobile && (k === "Intermediate" || k === "Advanced") ? " (Desktop Only)" : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}
                    {gameState !== 'playing' && gameState !== 'waiting' && (
                        <>
                            <button onClick={restartGame} className="btn-primary">
                                {gameState === 'gameOver' ? 'Try Again' : 'Play Again'}
                            </button>
                            <div className="difficulty-selector">
                                <label>Difficulty:</label>
                                <select value={difficulty} onChange={handleDifficultyChange}>
                                    {Object.keys(DIFFICULTIES).map(k => (
                                        <option key={k} value={k} disabled={isMobile && (k === "Intermediate" || k === "Advanced")}>
                                            {k}{isMobile && (k === "Intermediate" || k === "Advanced") ? " (Desktop Only)" : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}
                </div>

                <div className="pacman-instructions">
                    <p>🎯 <strong>How to Play:</strong></p>
                    <p>{isMobile ? "Use the control buttons below" : "Use Arrow Keys or WASD"} to move Pac-Man</p>
                    <p>Collect all pellets while avoiding ghosts</p>
                    <p className="text-xs">💛 Power pellets make ghosts vulnerable!</p>
                </div>
            </div>
        </div>
    )
}