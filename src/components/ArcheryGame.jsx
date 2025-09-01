import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const ArcheryGame = () => {
    const navigate = useNavigate()
    const canvasRef = useRef(null)
    const animCanvasRef = useRef(null)
    const gameLoopRef = useRef(null)
    const timerRef = useRef(null)
    const touchStartX = useRef(0)
    const touchStartY = useRef(0)

    // Game state
    const [gameStarted, setGameStarted] = useState(false)
    const [gameOver, setGameOver] = useState(false)
    const [score, setScore] = useState(0)
    const [arrows, setArrows] = useState(10)
    const [isPaused, setIsPaused] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [highScore, setHighScore] = useState(0)

    // Game objects
    const gameState = useRef({
        arc: { x: 80, y: 200, dy: 3, r: 50 },
        board: { x: 740, y: 250, dy: 4, height: 150, width: 7 },
        arrow: { x: 55, y: 200, dx: 15, status: false, visible: true },
        autoMove: false,
        moveArrowCheck: false,
        arrowMoveWithBoard: false,
        dimensions: { width: 800, height: 500 }
    })

    // Check for mobile device
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768
            setIsMobile(mobile)

            // Set canvas dimensions based on screen size
            const width = mobile ? Math.min(window.innerWidth - 40, 600) : 800
            const height = mobile ? Math.min(window.innerHeight - 200, 400) : 500

            gameState.current.dimensions = { width, height }
            gameState.current.arc.x = 80
            gameState.current.arc.y = height / 2
            gameState.current.board.x = width - 60
            gameState.current.board.y = height / 2
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Initialize canvas and start continuous rendering
    useEffect(() => {
        const canvas = canvasRef.current
        const animCanvas = animCanvasRef.current
        if (!canvas || !animCanvas) return

        const { width, height } = gameState.current.dimensions
        // Set canvas element size attributes (not just style)
        canvas.width = width
        canvas.height = height
        animCanvas.width = width
        animCanvas.height = height

        // Always set board and arc positions on mount
        gameState.current.arc.x = 80
        gameState.current.arc.y = height / 2
        gameState.current.board.x = width - 60
        gameState.current.board.y = height / 2

        // Draw initial static scene so canvas is not blank before game starts
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, width, height)
        ctx.strokeStyle = '#8B4513'
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.arc(80, height / 2, 50, Math.PI + Math.PI / 2, Math.PI - Math.PI / 2)
        ctx.stroke()
        ctx.strokeStyle = '#654321'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(80, height / 2 - 50)
        ctx.lineTo(55, height / 2)
        ctx.lineTo(80, height / 2 + 50)
        ctx.stroke()
        ctx.fillStyle = '#4F46E5'
        ctx.fillRect(width - 60, height / 2 - 5, 40, 10)
        ctx.fillRect(width - 60, height / 2 - 75, 7, 150)
        ctx.strokeStyle = '#FFF'
        ctx.lineWidth = 2
        for (let i = 1; i <= 3; i++) {
            ctx.beginPath()
            ctx.rect(width - 95, height / 2 - 75 + (i * 150 / 4) - 10, 75, 20)
            ctx.stroke()
        }

        // Start continuous rendering loop
        startRenderLoop()

        return () => {
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current)
            }
        }
    }, [gameState.current.dimensions])

    // Keyboard controls
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault()
                if (!gameStarted) {
                    startGame()
                } else if (!gameOver && arrows > 0) {
                    shoot()
                }
            }
            if (e.key === 'p' || e.key === 'P') {
                togglePause()
            }
        }

        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [gameStarted, gameOver, arrows])

    // Touch controls for mobile
    useEffect(() => {
        const canvas = animCanvasRef.current
        if (!canvas) return

        const handleTouchStart = (e) => {
            e.preventDefault()
            touchStartX.current = e.touches[0].clientX
            touchStartY.current = e.touches[0].clientY
        }

        const handleTouchEnd = (e) => {
            e.preventDefault()
            if (!gameStarted) {
                startGame()
            } else if (!gameOver && arrows > 0 && !isPaused) {
                shoot()
            }
        }

        canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false })

        return () => {
            canvas.removeEventListener('touchstart', handleTouchStart)
            canvas.removeEventListener('touchend', handleTouchEnd)
        }
    }, [gameStarted, gameOver, arrows, isPaused])

    const startGame = () => {
        setGameStarted(true)
        setGameOver(false)
        setScore(0)
        setArrows(10)
        setIsPaused(false)

        // Reset game objects
        const { width, height } = gameState.current.dimensions
        gameState.current.arc.x = 80
        gameState.current.arc.y = height / 2
        gameState.current.board.x = width - 60
        gameState.current.board.y = height / 2
        gameState.current.arrow.status = false
        gameState.current.arrow.visible = true
        gameState.current.arrow.x = 55
        gameState.current.autoMove = false
        gameState.current.moveArrowCheck = false
        gameState.current.arrowMoveWithBoard = false
    }

    const shoot = () => {
        if (!gameStarted || gameOver || isPaused || arrows <= 0) return
        if (gameState.current.arrow.status) return // Arrow already in motion

        gameState.current.arrow.status = true
        gameState.current.arrow.y = gameState.current.arc.y
        gameState.current.moveArrowCheck = true
        setArrows(prev => prev - 1)

        // Start shot timer
        startShotTimer()
    }

    const startShotTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
            if (gameState.current.arrow.status) {
                resetArrow()
            }
        }, 3000) // 3 seconds to hit target
    }

    const resetArrow = () => {
        gameState.current.arrow.status = false
        gameState.current.arrow.x = 55
        gameState.current.moveArrowCheck = false
        gameState.current.arrowMoveWithBoard = false

        if (arrows <= 0) {
            endGame()
        }
    }

    const togglePause = () => {
        if (gameStarted && !gameOver) {
            setIsPaused(!isPaused)
        }
    }

    const endGame = () => {
        setGameOver(true)
        if (score > highScore) {
            setHighScore(score)
        }
    }

    const restartGame = () => {
        setGameStarted(false)
        setGameOver(false)
        setScore(0)
        setArrows(10)
        setIsPaused(false)

        // Reset board and arc position so it's visible after restart
        const { width, height } = gameState.current.dimensions
        gameState.current.arc.x = 80
        gameState.current.arc.y = height / 2
        gameState.current.board.x = width - 60
        gameState.current.board.y = height / 2
        gameState.current.arrow.status = false
        gameState.current.arrow.x = 55
        gameState.current.autoMove = false
        gameState.current.moveArrowCheck = false
        gameState.current.arrowMoveWithBoard = false

        if (timerRef.current) {
            clearTimeout(timerRef.current)
        }
    }

    const startRenderLoop = () => {
        const canvas = canvasRef.current
        const animCanvas = animCanvasRef.current
        if (!canvas || !animCanvas) return

        const ctx = canvas.getContext('2d')
        const animCtx = animCanvas.getContext('2d')
        const { width, height } = gameState.current.dimensions

        const renderLoop = () => {
            // Clear canvases
            ctx.clearRect(0, 0, width, height)
            animCtx.clearRect(0, 0, width, height)

            const { arc, board, arrow } = gameState.current

            // Update positions only if game is active and not paused
            if (gameStarted && !gameOver && !isPaused) {
                // Update arc position
                if (arc.y > height - 60 || arc.y < 60) {
                    arc.dy *= -1
                }
                arc.y += arc.dy

                // Update board position (auto move after score 30)
                if (gameState.current.autoMove) {
                    if (board.y >= height - 75 || board.y <= 75) {
                        board.dy *= -1
                    }
                    board.y += board.dy

                    // Move arrow with board if attached
                    if (gameState.current.arrowMoveWithBoard) {
                        arrow.y += board.dy
                    }
                }

                // Move arrow if in flight
                if (arrow.status && gameState.current.moveArrowCheck) {
                    arrow.x += arrow.dx

                    // Check if arrow hits target
                    if (arrow.x >= board.x - 50) {
                        if (arrow.y >= board.y - board.height / 2 && arrow.y <= board.y + board.height / 2) {
                            // Hit target - calculate score based on distance from center
                            const distance = Math.abs(arrow.y - board.y)
                            const maxDistance = board.height / 2
                            const hitScore = Math.max(1, Math.round(10 - (distance / maxDistance) * 9))

                            setScore(prev => prev + hitScore)

                            // Attach arrow to board
                            gameState.current.arrowMoveWithBoard = true

                            // Increase difficulty
                            if (score >= 30) {
                                gameState.current.autoMove = true
                                arc.dy = Math.min(6, arc.dy + 0.5)
                            }
                            if (score >= 50) {
                                board.dy = Math.min(6, board.dy + 0.5)
                            }
                        }
                        resetArrow()
                    } else if (arrow.x > width) {
                        resetArrow()
                    }
                }
            }

            // Always draw the game elements
            // Draw arc (bow)
            ctx.strokeStyle = '#8B4513'
            ctx.lineWidth = 4
            ctx.beginPath()
            ctx.arc(arc.x, arc.y, arc.r, Math.PI + Math.PI / 2, Math.PI - Math.PI / 2)
            ctx.stroke()

            // Draw bow string
            ctx.strokeStyle = '#654321'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(arc.x, arc.y - arc.r)
            if (arrow.visible && !arrow.status) {
                ctx.lineTo(arrow.x, arc.y)
            }
            ctx.lineTo(arc.x, arc.y + arc.r)
            ctx.stroke()

            // Draw target board
            ctx.fillStyle = '#4F46E5'
            ctx.fillRect(board.x, board.y - 5, 40, board.width + 3)
            ctx.fillRect(board.x, board.y - board.height / 2, board.width, board.height)

            // Draw target rings
            ctx.strokeStyle = '#FFF'
            ctx.lineWidth = 2
            for (let i = 1; i <= 3; i++) {
                ctx.beginPath()
                ctx.rect(board.x - 35, board.y - (board.height / 2) + (i * board.height / 4) - 10, 75, 20)
                ctx.stroke()
            }

            // Draw arrow
            if (arrow.visible) {
                ctx.fillStyle = '#8B4513'

                if (arrow.status) {
                    // Arrow in flight
                    ctx.fillRect(arrow.x, arrow.y - 3, 10, 6)
                    ctx.fillRect(arrow.x, arrow.y - 1, 85, 2)

                    // Arrow head
                    ctx.beginPath()
                    ctx.moveTo(arrow.x + 85, arrow.y - 4)
                    ctx.lineTo(arrow.x + 97, arrow.y)
                    ctx.lineTo(arrow.x + 85, arrow.y + 4)
                    ctx.fill()
                } else {
                    // Arrow ready to shoot
                    ctx.fillRect(55, arc.y - 3, 10, 6)
                    ctx.fillRect(55, arc.y - 1, 85, 2)

                    // Arrow head
                    ctx.beginPath()
                    ctx.moveTo(140, arc.y - 4)
                    ctx.lineTo(152, arc.y)
                    ctx.lineTo(140, arc.y + 4)
                    ctx.fill()
                }
            }

            gameLoopRef.current = requestAnimationFrame(renderLoop)
        }

        renderLoop()
    }

    const handleCanvasClick = () => {
        if (!gameStarted) {
            startGame()
        } else if (!gameOver && arrows > 0 && !isPaused) {
            shoot()
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="game-board p-8 rounded-2xl fade-in max-w-4xl w-full transform transition-all duration-500">
                <div className="flex justify-between items-center mb-6">
                    <button
                        className="btn-secondary text-white px-4 py-2 rounded-lg font-semibold transform transition-all duration-200 hover:scale-105"
                        onClick={() => navigate('/')}
                        aria-label="Back to Home"
                    >
                        ← Back to Home
                    </button>
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-800">🏹 Archery Game</h1>
                    </div>
                    <div className="text-right">
                        <div className="text-lg font-semibold text-gray-700">Score: {score}</div>
                        <div className="text-sm text-gray-600">High: {highScore}</div>
                    </div>
                </div>

                {/* Game Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-100 rounded-xl transform transition-all duration-300 hover:scale-105">
                        <div className="text-2xl font-bold text-blue-600 mb-1">🎯</div>
                        <div className="text-xl font-semibold text-gray-700">{score}</div>
                        <div className="text-xs text-gray-500">Score</div>
                    </div>
                    <div className="text-center p-4 bg-green-100 rounded-xl transform transition-all duration-300 hover:scale-105">
                        <div className="text-2xl font-bold text-green-600 mb-1">🏹</div>
                        <div className="text-xl font-semibold text-gray-700">{arrows}</div>
                        <div className="text-xs text-gray-500">Arrows Left</div>
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    {/* Game Canvas Container */}
                    <div className="relative mb-6 border-4 border-gray-300 rounded-lg overflow-hidden bg-gradient-to-b from-sky-200 to-green-200 shadow-lg">
                        <canvas
                            ref={canvasRef}
                            className="absolute top-0 left-0"
                            width={gameState.current.dimensions.width}
                            height={gameState.current.dimensions.height}
                            style={{
                                width: `${gameState.current.dimensions.width}px`,
                                height: `${gameState.current.dimensions.height}px`
                            }}
                        />
                        <canvas
                            ref={animCanvasRef}
                            className="absolute top-0 left-0 cursor-pointer"
                            width={gameState.current.dimensions.width}
                            height={gameState.current.dimensions.height}
                            style={{
                                width: `${gameState.current.dimensions.width}px`,
                                height: `${gameState.current.dimensions.height}px`
                            }}
                            onClick={handleCanvasClick}
                        />

                        {/* Shot Timer Bar */}
                        {gameStarted && !gameOver && !isPaused && (
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-1/2 h-2 bg-gray-300 rounded-full border border-gray-400">
                                <div className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full animate-pulse"></div>
                            </div>
                        )}
                    </div>

                    {/* Mobile Shoot Button */}
                    {isMobile && gameStarted && !gameOver && !isPaused && (
                        <button
                            className="btn-primary text-white px-8 py-4 rounded-full font-bold text-xl mb-4 transform transition-all duration-200 hover:scale-105"
                            onClick={shoot}
                            disabled={arrows <= 0}
                            aria-label="Shoot arrow"
                        >
                            🏹 SHOOT
                        </button>
                    )}

                    {/* Game Controls */}
                    <div className="flex flex-wrap gap-4 mb-6 justify-center">
                        {!gameStarted ? (
                            <button
                                className="btn-primary text-white px-6 py-3 rounded-lg font-bold transform transition-all duration-200 hover:scale-105"
                                onClick={startGame}
                                aria-label="Start the game"
                            >
                                🎮 Start Game
                            </button>
                        ) : (
                            <button
                                className="btn-secondary text-white px-6 py-3 rounded-lg font-bold transform transition-all duration-200 hover:scale-105"
                                onClick={togglePause}
                                disabled={gameOver}
                                aria-label={isPaused ? "Resume the game" : "Pause the game"}
                            >
                                {isPaused ? "▶️ Resume" : "⏸️ Pause"}
                            </button>
                        )}

                        <button
                            className="btn-danger text-white px-6 py-3 rounded-lg font-bold transform transition-all duration-200 hover:scale-105"
                            onClick={restartGame}
                            aria-label="Restart the game"
                        >
                            🔄 Restart
                        </button>
                    </div>

                    {/* Game Status Messages */}
                    {gameOver && (
                        <div className="text-center mb-4 game-over bg-red-50 p-6 rounded-xl border-2 border-red-200">
                            <h2 className="text-2xl font-bold text-red-600 mb-2">🎯 Game Over!</h2>
                            <p className="text-gray-700">Final Score: {score}</p>
                            <p className="text-gray-700">Arrows Used: {10 - arrows}</p>
                            {score === highScore && score > 0 && (
                                <p className="text-yellow-600 font-bold animate-bounce">🏆 New High Score!</p>
                            )}
                        </div>
                    )}

                    {isPaused && !gameOver && gameStarted && (
                        <div className="text-center mb-4 bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                            <h2 className="text-xl font-bold text-blue-600">⏸️ Game Paused</h2>
                            <p className="text-sm text-gray-600 mt-2">Press 'P' to resume</p>
                        </div>
                    )}

                    {!gameStarted && (
                        <div className="text-center mb-4 bg-green-50 p-4 rounded-xl border-2 border-green-200">
                            <h2 className="text-xl font-bold text-green-600">🎯 Ready to Shoot!</h2>
                            <p className="text-sm text-gray-600 mt-2">
                                {isMobile ? 'Tap the screen or SHOOT button' : 'Press spacebar or click canvas'} to shoot arrows
                            </p>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="text-center text-gray-600 text-sm max-w-md">
                        <div className="bg-gray-50 p-4 rounded-xl">
                            <p className="mb-2">🎯 <strong>How to Play:</strong></p>
                            <p className="mb-1">• {isMobile ? 'Tap to shoot' : 'Press spacebar to shoot'} arrows at the moving target</p>
                            <p className="mb-1">• Hit the center for maximum points (10 points)</p>
                            <p className="mb-1">• Target moves faster as your score increases</p>
                            <p className="mb-2">• You have 10 arrows - make them count!</p>
                            <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                                <div className="bg-yellow-100 p-2 rounded">
                                    <span className="font-semibold">Accuracy:</span> {arrows < 10 ? Math.round((score / (10 - arrows)) * 10) / 10 : 0}
                                </div>
                                <div className="bg-purple-100 p-2 rounded">
                                    <span className="font-semibold">Level:</span> {score < 30 ? 1 : score < 50 ? 2 : 3}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .game-board {
                    background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.9));
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.3);
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
                }
                .fade-in {
                    animation: fadeIn 0.8s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .btn-primary {
                    background: linear-gradient(135deg, #3B82F6, #1D4ED8);
                    box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.4);
                    border: none;
                    transition: all 0.3s ease;
                }
                .btn-primary:hover {
                    background: linear-gradient(135deg, #2563EB, #1E40AF);
                    box-shadow: 0 6px 20px 0 rgba(59, 130, 246, 0.6);
                }
                .btn-secondary {
                    background: linear-gradient(135deg, #6B7280, #374151);
                    box-shadow: 0 4px 14px 0 rgba(107, 114, 128, 0.4);
                    border: none;
                    transition: all 0.3s ease;
                }
                .btn-secondary:hover {
                    background: linear-gradient(135deg, #4B5563, #1F2937);
                    box-shadow: 0 6px 20px 0 rgba(107, 114, 128, 0.6);
                }
                .btn-danger {
                    background: linear-gradient(135deg, #EF4444, #DC2626);
                    box-shadow: 0 4px 14px 0 rgba(239, 68, 68, 0.4);
                    border: none;
                    transition: all 0.3s ease;
                }
                .btn-danger:hover {
                    background: linear-gradient(135deg, #DC2626, #B91C1C);
                    box-shadow: 0 6px 20px 0 rgba(239, 68, 68, 0.6);
                }
                .game-over {
                    animation: bounceIn 0.6s ease-out;
                }
                @keyframes bounceIn {
                    0% { transform: scale(0.3); opacity: 0; }
                    50% { transform: scale(1.05); }
                    70% { transform: scale(0.9); }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    )
}

export default ArcheryGame