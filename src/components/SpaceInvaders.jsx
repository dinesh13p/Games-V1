import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const SpaceInvaders = () => {
    const navigate = useNavigate()
    const canvasRef = useRef(null)
    const [gameStarted, setGameStarted] = useState(false)
    const [gameOver, setGameOver] = useState(false)
    const [won, setWon] = useState(false)
    const [score, setScore] = useState(0)
    const [level, setLevel] = useState(1)
    const [lives, setLives] = useState(3)
    const [isMobile, setIsMobile] = useState(false)
    const [highScore, setHighScore] = useState(() => {
        try {
            const saved = localStorage.getItem('spaceInvadersHighScore')
            return saved ? parseInt(saved) : 0
        } catch {
            return 0
        }
    })
    const [showInstructions, setShowInstructions] = useState(true)

    // Persistent stars for background
    const starsRef = useRef([])

    const gameStateRef = useRef({
        player: { x: 300, y: 550, width: 40, height: 20, speed: 300, invincible: false, invincibleUntil: 0 },
        bullets: [],
        enemies: [],
        enemyBullets: [],
        enemyDirection: 1,
        enemySpeed: 30,
        enemyDropDistance: 20,
        leftPressed: false,
        rightPressed: false,
        spacePressed: false,
        lastBulletTime: 0,
        lastEnemyShot: 0,
        gameRunning: false
    })

    // Check if mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Save high score whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem('spaceInvadersHighScore', highScore.toString())
        } catch (error) {
            console.warn('Could not save high score:', error)
        }
    }, [highScore])

    // === Create 120 enemies (10x12) and fit inside 600x600 ===
    const createEnemies = useCallback(() => {
    const enemies = []
    const rows = 10
    const cols = 10
        const startX = 40
        const startY = 60
        const stepX = 45
        const stepY = 35

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                enemies.push({
                    x: startX + c * stepX,
                    y: startY + r * stepY,
                    width: 30,
                    height: 20,
                    alive: true,
                    type: r < 2 ? 'small' : 'large',
                    points: r < 2 ? 10 : 20
                })
            }
        }
        return enemies
    }, [])

    const initializeGame = useCallback(() => {
        const state = gameStateRef.current
        state.player = {
            x: 280,
            y: 550,
            width: 40,
            height: 20,
            speed: 300,
            invincible: false,
            invincibleUntil: 0
        }
        state.bullets = []
        state.enemies = createEnemies()
        state.enemyBullets = []
        state.enemyDirection = 1
        state.enemySpeed = Math.min(30 + level * 8, 120)
        state.enemyDropDistance = 25
        state.lastBulletTime = 0
        state.lastEnemyShot = 0
        state.gameRunning = true

        // Create stars once
        if (starsRef.current.length === 0) {
            for (let i = 0; i < 100; i++) {
                starsRef.current.push({
                    x: Math.random() * 600,
                    y: Math.random() * 600,
                    size: Math.random() * 1.5 + 0.5,
                    speed: 20 + Math.random() * 30,
                    opacity: Math.random() * 0.8 + 0.2
                })
            }
        }
    }, [createEnemies, level])

    const startGame = useCallback(() => {
        setGameStarted(true)
        setGameOver(false)
        setWon(false)
        setScore(0)
        setLevel(1)
        setLives(3)
        setShowInstructions(false)
        initializeGame()
    }, [initializeGame])

    const restartGame = useCallback(() => {
        setLevel(1)
        setScore(0)
        setLives(3)
        setGameOver(false)
        setWon(false)
        initializeGame()
    }, [initializeGame])

    // (Keep nextLevel around but unused; you asked to show YOU WON instead of advancing)
    const nextLevel = useCallback(() => {
        setLevel(prev => prev + 1)
        setScore(prev => prev + level * 50)
    }, [level])

    const resetScores = () => {
        setHighScore(0)
        try {
            localStorage.removeItem('spaceInvadersHighScore')
        } catch (error) {
            console.warn('Could not clear high score:', error)
        }
    }

    const handleBackToHome = () => {
        navigate('/')
    }

    // === Keyboard event handlers (prevent Space default on keydown & keyup) ===
    useEffect(() => {
        if (isMobile) return; // Don't add keyboard listeners on mobile

        const handleKeyDown = (e) => {
            if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space', 'KeyR', 'Escape'].includes(e.code)) {
                e.preventDefault()
            }
            const state = gameStateRef.current

            switch (e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    state.leftPressed = true
                    break
                case 'ArrowRight':
                case 'KeyD':
                    state.rightPressed = true
                    break
                case 'Space':
                    if (!gameStarted && !gameOver) {
                        startGame()
                    } else if (gameStarted && !gameOver) {
                        state.spacePressed = true
                    } else if (gameOver) {
                        restartGame()
                    }
                    break
                case 'KeyR':
                    if (gameStarted) restartGame()
                    break
                case 'Escape':
                    if (gameStarted && !gameOver) {
                        state.gameRunning = !state.gameRunning
                    }
                    break
                default:
                    break
            }
        }

        const handleKeyUp = (e) => {
            if (e.code === 'Space') e.preventDefault() // stop focused button "click"
            const state = gameStateRef.current
            switch (e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    state.leftPressed = false
                    break
                case 'ArrowRight':
                case 'KeyD':
                    state.rightPressed = false
                    break
                case 'Space':
                    state.spacePressed = false
                    break
                default:
                    break
            }
        }

        document.addEventListener("keydown", handleKeyDown)
        document.addEventListener("keyup", handleKeyUp)

        return () => {
            document.removeEventListener("keydown", handleKeyDown)
            document.removeEventListener("keyup", handleKeyUp)
        }
    }, [gameStarted, gameOver, startGame, restartGame, isMobile])

    // === Main game loop ===
    useEffect(() => {
        if (!gameStarted || gameOver || isMobile) return

        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        let animationId
        let lastTime = performance.now()

        const loop = (time) => {
            const dt = Math.min((time - lastTime) / 1000, 1 / 30) // Cap at ~30fps
            lastTime = time
            const state = gameStateRef.current

            if (!state.gameRunning) {
                animationId = requestAnimationFrame(loop)
                return
            }

            // Player movement
            const acceleration = state.player.speed * 2
            if (state.leftPressed && state.player.x > 0) {
                state.player.x = Math.max(0, state.player.x - acceleration * dt)
            }
            if (state.rightPressed && state.player.x < canvas.width - state.player.width) {
                state.player.x = Math.min(canvas.width - state.player.width, state.player.x + acceleration * dt)
            }

            // Player shooting
            if (state.spacePressed && time - state.lastBulletTime > 250) {
                state.bullets.push({
                    x: state.player.x + state.player.width / 2 - 2,
                    y: state.player.y,
                    width: 4,
                    height: 12,
                    speed: 500
                })
                state.lastBulletTime = time
            }

            // Update player bullets
            state.bullets = state.bullets.filter(bullet => {
                bullet.y -= bullet.speed * dt
                return bullet.y > -bullet.height
            })

            // Enemy shooting
            const shootingInterval = Math.max(800 - level * 50, 300)
            if (time - state.lastEnemyShot > shootingInterval) {
                const aliveEnemiesShooters = state.enemies.filter(e => e.alive)
                if (aliveEnemiesShooters.length > 0) {
                    const frontEnemies = aliveEnemiesShooters.filter(e =>
                        !aliveEnemiesShooters.some(other => other.alive && other.x === e.x && other.y > e.y)
                    )
                    const shooter = frontEnemies[Math.floor(Math.random() * frontEnemies.length)]

                    state.enemyBullets.push({
                        x: shooter.x + shooter.width / 2 - 2,
                        y: shooter.y + shooter.height,
                        width: 4,
                        height: 8,
                        speed: 150 + level * 15
                    })
                    state.lastEnemyShot = time
                }
            }

            // Update enemy bullets & check player collision
            state.enemyBullets = state.enemyBullets.filter(bullet => {
                bullet.y += bullet.speed * dt

                if (!state.player.invincible &&
                    bullet.x < state.player.x + state.player.width &&
                    bullet.x + bullet.width > state.player.x &&
                    bullet.y < state.player.y + state.player.height &&
                    bullet.y + bullet.height > state.player.y) {

                    setLives(prevLives => {
                        const newLives = prevLives - 1
                        if (newLives > 0) {
                            state.player.invincible = true
                            state.player.invincibleUntil = time + 2000
                        } else {
                            state.gameRunning = false
                            setGameOver(true)
                            setWon(false)
                            setHighScore(prev => Math.max(prev, score))
                        }
                        return newLives
                    })
                    return false
                }

                return bullet.y < canvas.height + bullet.height
            })

            // Remove invincibility when expired
            if (state.player.invincible && time > state.player.invincibleUntil) {
                state.player.invincible = false
            }

            // Enemy movement
            let shouldDropDown = false
            const aliveEnemiesBeforeMove = state.enemies.filter(e => e.alive)

            aliveEnemiesBeforeMove.forEach(enemy => {
                const newX = enemy.x + state.enemyDirection * state.enemySpeed * dt
                if (newX <= 10 || newX + enemy.width >= canvas.width - 10) {
                    shouldDropDown = true
                }
            })

            if (shouldDropDown) {
                state.enemyDirection *= -1
                state.enemies.forEach(enemy => {
                    if (enemy.alive) {
                        enemy.y += state.enemyDropDistance
                        // Reached player?
                        if (enemy.y + enemy.height >= state.player.y - 10) {
                            state.gameRunning = false
                            setGameOver(true)
                            setWon(false)
                            setHighScore(prev => Math.max(prev, score))
                        }
                    }
                })
            } else {
                state.enemies.forEach(enemy => {
                    if (enemy.alive) {
                        enemy.x += state.enemyDirection * state.enemySpeed * dt
                    }
                })
            }

            // Bullet-enemy collisions
            state.bullets = state.bullets.filter(bullet => {
                let bulletExists = true
                state.enemies.forEach(enemy => {
                    if (enemy.alive &&
                        bullet.x < enemy.x + enemy.width &&
                        bullet.x + bullet.width > enemy.x &&
                        bullet.y < enemy.y + enemy.height &&
                        bullet.y + bullet.height > enemy.y) {

                        enemy.alive = false
                        bulletExists = false
                        setScore(prevScore => prevScore + enemy.points)
                    }
                })
                return bulletExists
            })

            // Win check: all enemies dead
            if (state.enemies.every(e => !e.alive)) {
                state.gameRunning = false
                setWon(true)
                setGameOver(true)
                setHighScore(prev => Math.max(prev, score))
            }

            // ===== DRAWING =====
            // Background
            ctx.fillStyle = "#0a0a1a"
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            // Stars
            starsRef.current.forEach(star => {
                star.y += star.speed * dt
                if (star.y > canvas.height) {
                    star.y = -star.size
                    star.x = Math.random() * canvas.width
                }
                ctx.globalAlpha = star.opacity
                ctx.fillStyle = "white"
                ctx.fillRect(star.x, star.y, star.size, star.size)
            })
            ctx.globalAlpha = 1

            // Player
            const playerAlpha = state.player.invincible ? Math.abs(Math.sin(time / 100)) * 0.7 + 0.3 : 1
            ctx.globalAlpha = playerAlpha
            ctx.fillStyle = "#00ff88"
            ctx.fillRect(state.player.x, state.player.y, state.player.width, state.player.height)
            // Player cannon
            ctx.fillStyle = "#00aa55"
            ctx.fillRect(state.player.x + state.player.width / 2 - 3, state.player.y - 10, 6, 10)
            ctx.globalAlpha = 1

            // Player bullets
            ctx.fillStyle = "#ffff44"
            state.bullets.forEach(bullet => {
                ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height)
                // Trail
                ctx.fillStyle = "rgba(255, 255, 68, 0.5)"
                ctx.fillRect(bullet.x, bullet.y + bullet.height, bullet.width, 6)
                ctx.fillStyle = "#ffff44"
            })

            // Enemy bullets
            ctx.fillStyle = "#ff4444"
            state.enemyBullets.forEach(bullet => {
                ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height)
            })

            // Enemies
            state.enemies.forEach(enemy => {
                if (enemy.alive) {
                    // Body
                    ctx.fillStyle = enemy.type === 'small' ? "#ff6600" : "#dd0000"
                    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height)
                    // Details
                    ctx.fillStyle = "#ffffff"
                    ctx.fillRect(enemy.x + 4, enemy.y + 3, 3, 3)
                    ctx.fillRect(enemy.x + enemy.width - 7, enemy.y + 3, 3, 3)
                    ctx.fillStyle = enemy.type === 'small' ? "#ff8800" : "#ff2222"
                    ctx.fillRect(enemy.x + enemy.width / 2 - 1, enemy.y - 2, 2, 2)
                }
            })

            // UI Elements
            const enemiesLeft = state.enemies.filter(e => e.alive).length
            ctx.fillStyle = "#ffffff"
            ctx.font = "bold 18px 'Courier New', monospace"
            ctx.fillText(`SCORE: ${score.toLocaleString()}`, 20, 30)
            ctx.fillText(`LIVES: ${lives}`, 20, 55)
            ctx.fillText(`LEVEL: ${level}`, 20, 80)
            ctx.fillText(`HIGH: ${highScore.toLocaleString()}`, canvas.width - 160, 30)
            ctx.fillText(`ENEMIES LEFT: ${enemiesLeft}`, canvas.width - 220, 55)

            // Lives indicator
            for (let i = 0; i < lives; i++) {
                ctx.fillStyle = "#00ff88"
                ctx.fillRect(500 + i * 25, 45, 20, 12)
            }

            // Paused overlay
            if (!state.gameRunning && !gameOver) {
                ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
                ctx.fillRect(0, 0, canvas.width, canvas.height)
                ctx.fillStyle = "#ffffff"
                ctx.font = "bold 24px Arial"
                ctx.textAlign = "center"
                ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2)
                ctx.fillText("Press ESC to resume", canvas.width / 2, canvas.height / 2 + 30)
                ctx.textAlign = "left"
            }

            animationId = requestAnimationFrame(loop)
        }

        // NOTE: We purposely do NOT call initializeGame() here to avoid re-initializing
        // on every score/lives/highScore update (which felt like a reload).
        animationId = requestAnimationFrame(loop)

        return () => {
            if (animationId) cancelAnimationFrame(animationId)
        }
        // Keep these deps so HUD reflects latest values without re-initializing the game.
    }, [gameStarted, gameOver, score, level, lives, highScore, isMobile])

    // Mobile restriction message
    if (isMobile) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="p-8 rounded-2xl fade-in max-w-3xl w-full transform transition-all duration-500" style={{
                    background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
                    border: "1px solid #e2e8f0"
                }}>
                    <div className="flex justify-between items-center mb-6">
                        <button 
                            className="btn-secondary text-white px-4 py-2 rounded-lg font-semibold transform transition-all duration-200 hover:scale-105"
                            onClick={handleBackToHome}
                            aria-label="Back to Home"
                        >
                            ← Back to Home
                        </button>
                        <h1 className="text-3xl font-bold text-gray-800">👾 Space Invaders</h1>
                        <div className="w-20"></div>
                    </div>

                    <div className="text-center">
                        <div className="mb-8 bg-blue-50 p-8 rounded-xl border-2 border-blue-200">
                            <h2 className="text-2xl font-bold text-blue-600 mb-4">⌨️ Desktop Experience Required</h2>
                            <p className="text-lg text-gray-700 mb-4">
                                This game requires keyboard controls for precise movement and shooting.
                            </p>
                            <p className="text-gray-600">
                                Please access this game on a desktop or laptop computer to enjoy the full Space Invaders experience with arrow key movement and spacebar shooting.
                            </p>
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    .fade-in {
                        animation: fadeIn 0.5s ease-in;
                    }
                    .btn-secondary {
                        background: linear-gradient(135deg, #6b7280, #4b5563);
                        box-shadow: 0 2px 8px rgba(107, 114, 128, 0.3);
                    }
                    .btn-secondary:hover {
                        background: linear-gradient(135deg, #4b5563, #374151);
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}</style>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="p-8 rounded-2xl fade-in max-w-3xl w-full transform transition-all duration-500" style={{
                background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
                border: "1px solid #e2e8f0"
            }}>
                <div className="flex justify-between items-center mb-6">
                    <button 
                        className="btn-secondary text-white px-4 py-2 rounded-lg font-semibold transform transition-all duration-200 hover:scale-105"
                        onClick={handleBackToHome}
                        aria-label="Back to Home"
                    >
                        ← Back to Home
                    </button>
                    <h1 className="text-3xl font-bold text-gray-800">👾 Space Invaders</h1>
                    <div className="text-right">
                        <button 
                            className="btn-secondary text-white px-3 py-1 rounded text-sm transform transition-all duration-200 hover:scale-105"
                            onClick={resetScores}
                            aria-label="Reset high score"
                        >
                            Reset High Score
                        </button>
                    </div>
                </div>

                {/* Game Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-100 rounded-xl transform transition-all duration-300 hover:scale-105">
                        <div className="text-xl font-bold text-blue-600 mb-1">Current Score</div>
                        <div className="text-3xl font-semibold text-gray-700">{score.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">This Game</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-100 rounded-xl transform transition-all duration-300 hover:scale-105">
                        <div className="text-xl font-bold text-yellow-600 mb-1">🏆 High Score</div>
                        <div className="text-3xl font-semibold text-gray-700">{highScore.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Best Ever</div>
                    </div>
                    <div className="text-center p-4 bg-green-100 rounded-xl transform transition-all duration-300 hover:scale-105">
                        <div className="text-xl font-bold text-green-600 mb-1">Level {level}</div>
                        <div className="text-3xl font-semibold text-gray-700">{lives}</div>
                        <div className="text-xs text-gray-500">Lives Left</div>
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    <h2 className="text-2xl font-bold mb-6 text-center transform transition-all duration-300">
                        {gameOver ? (
                            won ? (
                                <span className="text-green-600 animate-pulse-slow">🎉 Victory! You Won!</span>
                            ) : (
                                <span className="text-red-500 animate-bounce-slow">💀 You Lose!</span>
                            )
                        ) : gameStarted ? (
                            <span className="text-blue-600 animate-pulse">🚀 Battle in Progress...</span>
                        ) : (
                            <span className="text-green-600 animate-pulse">🎮 Ready for Battle!</span>
                        )}
                    </h2>

                    <canvas
                        ref={canvasRef}
                        width={600}
                        height={600}
                        style={{
                            border: '2px solid #E5E7EB',
                            borderRadius: '16px',
                            display: 'block',
                            margin: '0 auto 20px',
                            background: '#000',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                        }}
                    />

                    <div className="flex gap-4 mb-6">
                        {!gameStarted ? (
                            <button
                                className="btn-primary text-white px-6 py-3 rounded-lg font-bold transform transition-all duration-200 hover:scale-105"
                                onClick={startGame}
                                aria-label="Start game"
                            >
                                🎮 Start Game
                            </button>
                        ) : (
                            <button
                                className="btn-primary text-white px-6 py-3 rounded-lg font-bold transform transition-all duration-200 hover:scale-105"
                                onClick={restartGame}
                                aria-label="Restart game"
                            >
                                🔄 Restart
                            </button>
                        )}
                    </div>

                    {showInstructions && (
                        <div className="mt-6 text-center text-gray-600 text-sm bg-gray-50 p-4 rounded-xl">
                            <p className="mb-2">🎯 <strong>Controls:</strong></p>
                            <p className="mb-2">← → or A D: Move • SPACE: Shoot • R: Restart • ESC: Pause</p>
                            <p className="mt-2 text-xs text-gray-500">Destroy all invaders to win! Avoid their bullets and don't let them reach you!</p>
                        </div>
                    )}

                    {gameOver && (
                        <div className="mt-6 text-center text-gray-600 bg-gray-50 p-6 rounded-xl">
                            <h3 className={`text-2xl font-bold mb-4 ${won ? 'text-green-600' : 'text-red-500'}`}>
                                {won ? '🎉 Victory!' : '💀 You Lose!'}
                            </h3>
                            <p className="text-lg mb-2">
                                Final Score: <strong>{score.toLocaleString()}</strong>
                            </p>
                            <p className="text-lg mb-2">
                                Level Reached: <strong>{level}</strong>
                            </p>
                            {score === highScore && score > 0 && (
                                <p className="text-yellow-600 font-bold text-lg mb-4">
                                    🎉 New High Score! 🎉
                                </p>
                            )}
                            <p className="text-sm text-gray-500">
                                Press SPACE or click RESTART to play again!
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .fade-in {
                    animation: fadeIn 0.5s ease-in;
                }
                .btn-primary {
                    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }
                .btn-primary:hover {
                    background: linear-gradient(135deg, #2563eb, #1e40af);
                    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
                }
                .btn-secondary {
                    background: linear-gradient(135deg, #6b7280, #4b5563);
                    box-shadow: 0 2px 8px rgba(107, 114, 128, 0.3);
                }
                .btn-secondary:hover {
                    background: linear-gradient(135deg, #4b5563, #374151);
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-pulse-slow {
                    animation: pulse 2s infinite;
                }
                .animate-bounce-slow {
                    animation: bounce 1s infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                @keyframes bounce {
                    0%, 20%, 53%, 80%, 100% {
                        transform: translate3d(0, 0, 0);
                    }
                    40%, 43% {
                        transform: translate3d(0, -8px, 0);
                    }
                    70% {
                        transform: translate3d(0, -4px, 0);
                    }
                    90% {
                        transform: translate3d(0, -2px, 0);
                    }
                }
            `}</style>
        </div>
    )
}

export default SpaceInvaders