import React, { useRef, useEffect, useState, useCallback } from 'react'
import {
    createEnemies, createStars, createPlayer, createBullet, createEnemyBullet,
    updateBullets, updateEnemyBullets, updateEnemies, checkBulletEnemyCollisions
} from './SpaceInvaders.logic'
import './SpaceInvaders.css'

const SpaceInvaders = () => {
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
        } catch { return 0 }
    })
    const [showInstructions, setShowInstructions] = useState(true)

    const starsRef = useRef([])
    const gameStateRef = useRef({
        player: createPlayer(),
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

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    useEffect(() => {
        try {
            localStorage.setItem('spaceInvadersHighScore', highScore.toString())
        } catch (error) {
            console.warn('Could not save high score:', error)
        }
    }, [highScore])

    const initializeGame = useCallback(() => {
        const state = gameStateRef.current
        state.player = createPlayer()
        state.bullets = []
        state.enemies = createEnemies()
        state.enemyBullets = []
        state.enemyDirection = 1
        state.enemySpeed = Math.min(30 + level * 8, 120)
        state.enemyDropDistance = 25
        state.lastBulletTime = 0
        state.lastEnemyShot = 0
        state.gameRunning = true
        if (starsRef.current.length === 0) {
            starsRef.current = createStars()
        }
    }, [level])

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

    const resetScores = () => {
        setHighScore(0)
        localStorage.removeItem('spaceInvadersHighScore')
    }

    useEffect(() => {
        if (isMobile) return
        const handleKeyDown = (e) => {
            if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space', 'KeyR', 'Escape'].includes(e.code)) {
                e.preventDefault()
            }
            const state = gameStateRef.current
            switch (e.code) {
                case 'ArrowLeft': case 'KeyA': state.leftPressed = true; break
                case 'ArrowRight': case 'KeyD': state.rightPressed = true; break
                case 'Space':
                    if (!gameStarted && !gameOver) startGame()
                    else if (gameStarted && !gameOver) state.spacePressed = true
                    else if (gameOver) restartGame()
                    break
                case 'KeyR': if (gameStarted) restartGame(); break
                case 'Escape': if (gameStarted && !gameOver) state.gameRunning = !state.gameRunning; break
                default: break
            }
        }
        const handleKeyUp = (e) => {
            if (e.code === 'Space') e.preventDefault()
            const state = gameStateRef.current
            switch (e.code) {
                case 'ArrowLeft': case 'KeyA': state.leftPressed = false; break
                case 'ArrowRight': case 'KeyD': state.rightPressed = false; break
                case 'Space': state.spacePressed = false; break
                default: break
            }
        }
        document.addEventListener("keydown", handleKeyDown)
        document.addEventListener("keyup", handleKeyUp)
        return () => {
            document.removeEventListener("keydown", handleKeyDown)
            document.removeEventListener("keyup", handleKeyUp)
        }
    }, [gameStarted, gameOver, startGame, restartGame, isMobile])

    useEffect(() => {
        if (!gameStarted || gameOver || isMobile) return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        let animationId
        let lastTime = performance.now()

        const loop = (time) => {
            const dt = Math.min((time - lastTime) / 1000, 1 / 30)
            lastTime = time
            const state = gameStateRef.current
            if (!state.gameRunning) { animationId = requestAnimationFrame(loop); return }

            const acceleration = state.player.speed * 2
            if (state.leftPressed && state.player.x > 0) {
                state.player.x = Math.max(0, state.player.x - acceleration * dt)
            }
            if (state.rightPressed && state.player.x < canvas.width - state.player.width) {
                state.player.x = Math.min(canvas.width - state.player.width, state.player.x + acceleration * dt)
            }

            if (state.spacePressed && time - state.lastBulletTime > 250) {
                state.bullets.push(createBullet(state.player.x, state.player.y))
                state.lastBulletTime = time
            }

            state.bullets = updateBullets(state.bullets, dt, canvas.height)

            const shootingInterval = Math.max((800 - level * 50) * (1 / 1.2) / 1.5, 300 * (1 / 1.2) / 1.5)
            if (time - state.lastEnemyShot > shootingInterval) {
                const aliveEnemiesShooters = state.enemies.filter(e => e.alive)
                if (aliveEnemiesShooters.length > 0) {
                    const frontEnemies = aliveEnemiesShooters.filter(e =>
                        !aliveEnemiesShooters.some(other => other.alive && other.x === e.x && other.y > e.y)
                    )
                    const shooter = frontEnemies[Math.floor(Math.random() * frontEnemies.length)]
                    state.enemyBullets.push(createEnemyBullet(shooter.x, shooter.y, 150 + level * 15))
                    state.lastEnemyShot = time
                }
            }

            state.enemyBullets = updateEnemyBullets(
                state.enemyBullets, dt, canvas.height, state.player,
                setLives, setGameOver, setScore, setHighScore, score, time
            )

            if (state.player.invincible && time > state.player.invincibleUntil) {
                state.player.invincible = false
            }

            const enemyResult = updateEnemies(
                state.enemies, state.enemyDirection, state.enemySpeed,
                state.enemyDropDistance, dt, canvas.width,
                state.player.y - 10, setGameOver, setScore, setHighScore, score
            )
            state.enemies = enemyResult.enemies
            state.enemyDirection = enemyResult.direction

            const collisionResult = checkBulletEnemyCollisions(state.bullets, state.enemies, setScore)
            state.bullets = collisionResult.bullets
            state.enemies = collisionResult.enemies

            if (state.enemies.every(e => !e.alive)) {
                state.gameRunning = false
                setWon(true)
                setGameOver(true)
                setHighScore(prev => Math.max(prev, score))
            }

            // Drawing
            ctx.fillStyle = "#0a0a1a"
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            starsRef.current.forEach(star => {
                star.y += star.speed * dt
                if (star.y > canvas.height) { star.y = -star.size; star.x = Math.random() * canvas.width }
                ctx.globalAlpha = star.opacity
                ctx.fillStyle = "white"
                ctx.fillRect(star.x, star.y, star.size, star.size)
            })
            ctx.globalAlpha = 1

            const playerAlpha = state.player.invincible ? Math.abs(Math.sin(time / 100)) * 0.7 + 0.3 : 1
            ctx.globalAlpha = playerAlpha
            ctx.fillStyle = "#00ff88"
            ctx.fillRect(state.player.x, state.player.y, state.player.width, state.player.height)
            ctx.fillStyle = "#00aa55"
            ctx.fillRect(state.player.x + state.player.width / 2 - 3, state.player.y - 10, 6, 10)
            ctx.globalAlpha = 1

            ctx.fillStyle = "#ffff44"
            state.bullets.forEach(bullet => {
                ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height)
                ctx.fillStyle = "rgba(255, 255, 68, 0.5)"
                ctx.fillRect(bullet.x, bullet.y + bullet.height, bullet.width, 6)
                ctx.fillStyle = "#ffff44"
            })

            ctx.fillStyle = "#ff4444"
            state.enemyBullets.forEach(bullet => {
                ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height)
            })

            state.enemies.forEach(enemy => {
                if (enemy.alive) {
                    ctx.fillStyle = enemy.type === 'small' ? "#ff6600" : "#dd0000"
                    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height)
                    ctx.fillStyle = "#ffffff"
                    ctx.fillRect(enemy.x + 4, enemy.y + 3, 3, 3)
                    ctx.fillRect(enemy.x + enemy.width - 7, enemy.y + 3, 3, 3)
                    ctx.fillStyle = enemy.type === 'small' ? "#ff8800" : "#ff2222"
                    ctx.fillRect(enemy.x + enemy.width / 2 - 1, enemy.y - 2, 2, 2)
                }
            })

            const enemiesLeft = state.enemies.filter(e => e.alive).length
            ctx.fillStyle = "#ffffff"
            ctx.font = "bold 18px 'Courier New', monospace"
            ctx.fillText(`SCORE: ${score.toLocaleString()}`, 20, 30)
            ctx.fillText(`LIVES: ${lives}`, 20, 55)
            ctx.fillText(`LEVEL: ${level}`, 20, 80)
            ctx.fillText(`HIGH: ${highScore.toLocaleString()}`, canvas.width - 160, 30)
            ctx.fillText(`ENEMIES LEFT: ${enemiesLeft}`, canvas.width - 220, 55)

            for (let i = 0; i < lives; i++) {
                ctx.fillStyle = "#00ff88"
                ctx.fillRect(500 + i * 25, 45, 20, 12)
            }

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

        animationId = requestAnimationFrame(loop)
        return () => { if (animationId) cancelAnimationFrame(animationId) }
    }, [gameStarted, gameOver, score, level, lives, highScore, isMobile])

    if (isMobile) {
        return (
            <div className="space-invaders-mobile">
                <h1>👾 Space Invaders</h1>
                <div className="mobile-restriction">
                    <h2>⌨️ Desktop Experience Required</h2>
                    <p>This game requires keyboard controls for precise movement and shooting.</p>
                    <p>Please access this game on a desktop or laptop computer.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-invaders-container">
            <div className="space-invaders-header">
                <h1>👾 Space Invaders</h1>
                <button onClick={resetScores} className="reset-btn">Reset High Score</button>
            </div>

            <div className="space-invaders-stats">
                <div className="stat"><span>Score</span><span>{score.toLocaleString()}</span></div>
                <div className="stat"><span>High Score</span><span>{highScore.toLocaleString()}</span></div>
                <div className="stat"><span>Level</span><span>{level}</span></div>
                <div className="stat"><span>Lives</span><span>{lives}</span></div>
            </div>

            <div className="space-invaders-game-area">
                <h2 className="game-status">
                    {gameOver ? (won ? '🎉 Victory! You Won!' : '💀 You Lose!') :
                        gameStarted ? '🚀 Battle in Progress...' : '🎮 Ready for Battle!'}
                </h2>

                <canvas
                    ref={canvasRef}
                    width={600}
                    height={600}
                    className="space-invaders-canvas"
                />

                <div className="space-invaders-controls">
                    {!gameStarted ? (
                        <button onClick={startGame} className="btn-primary">Start Game</button>
                    ) : (
                        <button onClick={restartGame} className="btn-warning">Restart</button>
                    )}
                </div>

                {showInstructions && (
                    <div className="space-invaders-instructions">
                        <p>🎯 <strong>Controls:</strong></p>
                        <p>← → or A D: Move • SPACE: Shoot • R: Restart • ESC: Pause</p>
                        <p className="text-xs">Destroy all invaders to win!</p>
                    </div>
                )}

                {gameOver && (
                    <div className={`space-invaders-result ${won ? 'win' : 'lose'}`}>
                        <h3>{won ? '🎉 Victory!' : '💀 You Lose!'}</h3>
                        <p>Final Score: <strong>{score.toLocaleString()}</strong></p>
                        <p>Level Reached: <strong>{level}</strong></p>
                        {score === highScore && score > 0 && (
                            <p className="new-high">🎉 New High Score! 🎉</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default SpaceInvaders