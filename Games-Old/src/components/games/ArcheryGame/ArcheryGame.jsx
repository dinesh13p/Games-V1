import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
    CANVAS_WIDTH, CANVAS_HEIGHT, BOW_X, BOW_Y,
    ARROW_SPEED, TARGET_SIZE, ENEMY_SIZE, WIND_STRENGTH,
    TARGET_TYPES, createParticles, generateTargets, generateEnemies, checkCollisions
} from './ArcheryGame.logic'
import './ArcheryGame.css'

const ArcheryGame = () => {
    const canvasRef = useRef(null)
    const animationRef = useRef(null)
    const mousePos = useRef({ x: 0, y: 0 })

    const [gameStarted, setGameStarted] = useState(false)
    const [gameOver, setGameOver] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [score, setScore] = useState(0)
    const [arrows, setArrows] = useState(10)
    const [level, setLevel] = useState(1)
    const [wind, setWind] = useState(0)
    const [power, setPower] = useState(0)
    const [isCharging, setIsCharging] = useState(false)
    const [highScore, setHighScore] = useState(() => {
        try {
            const saved = localStorage.getItem('archeryHighScore')
            return saved ? parseInt(saved) : 0
        } catch {
            return 0
        }
    })

    const [isMobile, setIsMobile] = useState(false)

    const gameState = useRef({
        arrows: [],
        targets: [],
        enemies: [],
        particles: [],
        bowAngle: 0,
        powerCharging: false,
        chargingStartTime: 0
    })

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const initializeLevel = useCallback(() => {
        gameState.current.targets = generateTargets(level, CANVAS_WIDTH, CANVAS_HEIGHT)
        gameState.current.enemies = generateEnemies(level, CANVAS_WIDTH, CANVAS_HEIGHT)
        gameState.current.arrows = []
        gameState.current.particles = []
        setArrows(10 + level)
        setWind((Math.random() - 0.5) * WIND_STRENGTH)
    }, [level])

    useEffect(() => {
        initializeLevel()
    }, [initializeLevel])

    const updateBowAngle = useCallback((clientX, clientY) => {
        const canvas = canvasRef.current
        if (!canvas) return

        const rect = canvas.getBoundingClientRect()
        const scaleX = CANVAS_WIDTH / rect.width
        const scaleY = CANVAS_HEIGHT / rect.height

        const x = (clientX - rect.left) * scaleX
        const y = (clientY - rect.top) * scaleY

        mousePos.current = { x, y }

        const dx = x - BOW_X
        const dy = y - BOW_Y
        gameState.current.bowAngle = Math.atan2(dy, dx)
    }, [])

    const startCharging = useCallback(() => {
        if (!gameStarted || gameOver || isPaused || arrows <= 0) return
        setIsCharging(true)
        gameState.current.powerCharging = true
        gameState.current.chargingStartTime = Date.now()
    }, [gameStarted, gameOver, isPaused, arrows])

    const releaseArrow = useCallback(() => {
        if (!gameStarted || gameOver || isPaused || !isCharging || arrows <= 0) return

        const chargeDuration = Date.now() - gameState.current.chargingStartTime
        const arrowPower = Math.min(chargeDuration / 1000, 2)

        const angle = gameState.current.bowAngle
        const speed = ARROW_SPEED * (0.5 + arrowPower * 0.5)

        gameState.current.arrows.push({
            x: BOW_X + 50,
            y: BOW_Y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            angle: angle,
            id: Math.random(),
            gravity: 0.15,
            windEffect: 0
        })

        setArrows(prev => prev - 1)
        setIsCharging(false)
        setPower(0)
        gameState.current.powerCharging = false
    }, [gameStarted, gameOver, isPaused, isCharging, arrows])

    useEffect(() => {
        if (!isCharging) return

        const interval = setInterval(() => {
            const chargeDuration = Date.now() - gameState.current.chargingStartTime
            const currentPower = Math.min(chargeDuration / 1000, 2) * 50
            setPower(currentPower)
        }, 16)

        return () => clearInterval(interval)
    }, [isCharging])

    const render = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        const state = gameState.current

        // Clear canvas with sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
        gradient.addColorStop(0, '#87ceeb')
        gradient.addColorStop(0.7, '#98fb98')
        gradient.addColorStop(1, '#228b22')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

        // Draw clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
        const clouds = [
            [{ x: 200, y: 100, r: 40 }, { x: 240, y: 100, r: 50 }, { x: 280, y: 100, r: 40 }],
            [{ x: 500, y: 80, r: 30 }, { x: 530, y: 80, r: 40 }, { x: 560, y: 80, r: 30 }]
        ]
        clouds.forEach(cloudGroup => {
            ctx.beginPath()
            cloudGroup.forEach(({ x, y, r }) => ctx.arc(x, y, r, 0, Math.PI * 2))
            ctx.fill()
        })

        // Draw wind indicator
        ctx.fillStyle = '#000'
        ctx.font = 'bold 16px Arial'
        ctx.fillText(`Wind: ${wind > 0 ? '→' : '←'} ${Math.abs(wind).toFixed(1)}`, 20, 30)

        // Draw bow
        const bowEndX = BOW_X + Math.cos(state.bowAngle) * 60
        const bowEndY = BOW_Y + Math.sin(state.bowAngle) * 60

        ctx.strokeStyle = '#8b4513'
        ctx.lineWidth = 8
        ctx.beginPath()
        ctx.arc(BOW_X, BOW_Y, 40, state.bowAngle - Math.PI / 3, state.bowAngle + Math.PI / 3)
        ctx.stroke()

        // Draw bowstring
        ctx.strokeStyle = '#654321'
        ctx.lineWidth = 2
        const stringOffset = isCharging ? power * 0.3 : 0
        const stringX = BOW_X - Math.cos(state.bowAngle) * stringOffset
        const stringY = BOW_Y - Math.sin(state.bowAngle) * stringOffset

        ctx.beginPath()
        ctx.moveTo(BOW_X + Math.cos(state.bowAngle - Math.PI / 3) * 40, BOW_Y + Math.sin(state.bowAngle - Math.PI / 3) * 40)
        ctx.lineTo(stringX, stringY)
        ctx.lineTo(BOW_X + Math.cos(state.bowAngle + Math.PI / 3) * 40, BOW_Y + Math.sin(state.bowAngle + Math.PI / 3) * 40)
        ctx.stroke()

        // Draw aim line when charging
        if (isCharging) {
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'
            ctx.lineWidth = 2
            ctx.setLineDash([5, 5])
            ctx.beginPath()
            ctx.moveTo(BOW_X + 50, BOW_Y)
            ctx.lineTo(bowEndX + 100, bowEndY + 100)
            ctx.stroke()
            ctx.setLineDash([])
        }

        // Draw targets
        state.targets.forEach(target => {
            if (target.hit) return

            const targetInfo = TARGET_TYPES[target.type]
            const size = TARGET_SIZE * targetInfo.size

            // Target rings
            ctx.fillStyle = '#fff'
            ctx.beginPath()
            ctx.arc(target.x, target.y, size / 2, 0, Math.PI * 2)
            ctx.fill()

            ctx.fillStyle = targetInfo.color
            ctx.beginPath()
            ctx.arc(target.x, target.y, size / 3, 0, Math.PI * 2)
            ctx.fill()

            ctx.fillStyle = '#fff'
            ctx.beginPath()
            ctx.arc(target.x, target.y, size / 6, 0, Math.PI * 2)
            ctx.fill()

            // Target stand
            ctx.fillStyle = '#8b4513'
            ctx.fillRect(target.x - 2, target.y + size / 2, 4, 30)
        })

        // Draw enemies (stick figures)
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 3
        state.enemies.forEach(enemy => {
            if (enemy.hit) return

            const x = enemy.x
            const y = enemy.y

            // Head
            ctx.beginPath()
            ctx.arc(x, y - 30, 8, 0, Math.PI * 2)
            ctx.stroke()

            // Body
            ctx.beginPath()
            ctx.moveTo(x, y - 22)
            ctx.lineTo(x, y - 5)
            ctx.stroke()

            // Arms
            ctx.beginPath()
            ctx.moveTo(x - 10, y - 15)
            ctx.lineTo(x + 10, y - 15)
            ctx.stroke()

            // Legs
            ctx.beginPath()
            ctx.moveTo(x, y - 5)
            ctx.lineTo(x - 8, y + 5)
            ctx.moveTo(x, y - 5)
            ctx.lineTo(x + 8, y + 5)
            ctx.stroke()
        })

        // Draw arrows
        ctx.fillStyle = '#8b4513'
        ctx.strokeStyle = '#654321'
        ctx.lineWidth = 3
        state.arrows.forEach(arrow => {
            ctx.save()
            ctx.translate(arrow.x, arrow.y)
            ctx.rotate(arrow.angle)

            // Arrow shaft
            ctx.beginPath()
            ctx.moveTo(-15, 0)
            ctx.lineTo(15, 0)
            ctx.stroke()

            // Arrow head
            ctx.fillStyle = '#c0c0c0'
            ctx.beginPath()
            ctx.moveTo(15, 0)
            ctx.lineTo(10, -3)
            ctx.lineTo(10, 3)
            ctx.closePath()
            ctx.fill()

            // Fletching
            ctx.fillStyle = '#ff0000'
            ctx.beginPath()
            ctx.moveTo(-15, 0)
            ctx.lineTo(-10, -2)
            ctx.lineTo(-10, 2)
            ctx.closePath()
            ctx.fill()

            ctx.restore()
        })

        // Draw particles
        state.particles.forEach(particle => {
            ctx.fillStyle = particle.color
            ctx.globalAlpha = particle.life / 30
            ctx.beginPath()
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
            ctx.fill()
        })
        ctx.globalAlpha = 1

        // Draw power meter
        if (isCharging) {
            const meterWidth = 200
            const meterHeight = 20
            const meterX = CANVAS_WIDTH / 2 - meterWidth / 2
            const meterY = 50

            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
            ctx.fillRect(meterX - 2, meterY - 2, meterWidth + 4, meterHeight + 4)

            ctx.fillStyle = '#333'
            ctx.fillRect(meterX, meterY, meterWidth, meterHeight)

            const powerWidth = (power / 100) * meterWidth
            ctx.fillStyle = power < 30 ? '#ff0000' : power < 70 ? '#ffff00' : '#00ff00'
            ctx.fillRect(meterX, meterY, powerWidth, meterHeight)

            ctx.fillStyle = '#fff'
            ctx.font = 'bold 12px Arial'
            ctx.textAlign = 'center'
            ctx.fillText('POWER', CANVAS_WIDTH / 2, meterY + 35)
        }

        // Draw UI
        ctx.fillStyle = '#000'
        ctx.font = 'bold 18px Arial'
        ctx.textAlign = 'left'
        ctx.fillText(`Score: ${score}`, 20, 60)
        ctx.fillText(`Arrows: ${arrows}`, 20, 85)
        ctx.fillText(`Level: ${level}`, 20, 110)

        ctx.textAlign = 'right'
        ctx.fillText(`High Score: ${highScore}`, CANVAS_WIDTH - 20, 60)

        // Draw overlays
        if (!gameStarted && !gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

            ctx.fillStyle = '#fff'
            ctx.font = 'bold 36px Arial'
            ctx.textAlign = 'center'
            ctx.fillText('Archery Master', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80)

            ctx.font = '18px Arial'
            ctx.fillText('Aim with mouse/touch, hold to charge power', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30)
            ctx.fillText('Hit all targets to advance levels', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 5)
            ctx.fillText('Avoid hitting the stick figures!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20)
            ctx.fillText('Click Start Game or press Space to begin', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60)
        }

        if (gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

            ctx.fillStyle = '#fff'
            ctx.font = 'bold 36px Arial'
            ctx.textAlign = 'center'
            ctx.fillText('Game Over!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60)

            ctx.font = '20px Arial'
            ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20)
            ctx.fillText(`Level Reached: ${level}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 5)

            if (score === highScore && score > 0) {
                ctx.fillStyle = '#ffd700'
                ctx.fillText('New High Score!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35)
            }

            ctx.fillStyle = '#fff'
            ctx.font = '16px Arial'
            ctx.fillText('Click Restart or press Space to play again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70)
        }

        if (isPaused && gameStarted && !gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

            ctx.fillStyle = '#fff'
            ctx.font = 'bold 32px Arial'
            ctx.textAlign = 'center'
            ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)

            ctx.font = '16px Arial'
            ctx.fillText('Press P to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40)
        }
    }, [power, isCharging, score, arrows, level, highScore, wind, gameStarted, gameOver, isPaused])

    const updateGame = useCallback(() => {
        if (!gameStarted || gameOver || isPaused) return

        const state = gameState.current

        // Update arrows
        state.arrows = state.arrows.filter(arrow => {
            arrow.x += arrow.vx
            arrow.y += arrow.vy
            arrow.vy += arrow.gravity
            arrow.vx += wind * 0.1
            arrow.angle = Math.atan2(arrow.vy, arrow.vx)
            return arrow.x < CANVAS_WIDTH + 100 && arrow.y < CANVAS_HEIGHT + 100
        })

        // Update moving targets
        state.targets.forEach(target => {
            if (target.moving && !target.hit) {
                target.x += target.vx
                target.y += target.vy
                if (target.x < 300 || target.x > CANVAS_WIDTH - 50) target.vx = -target.vx
                if (target.y < 50 || target.y > CANVAS_HEIGHT - 50) target.vy = -target.vy
            }
        })

        // Update enemies
        state.enemies.forEach(enemy => {
            if (!enemy.hit) {
                enemy.x += enemy.vx
                if (enemy.x < 400 || enemy.x > CANVAS_WIDTH - 50) enemy.vx = -enemy.vx
            }
        })

        // Update particles
        state.particles = state.particles.filter(particle => {
            particle.x += particle.vx
            particle.y += particle.vy
            particle.vx *= 0.98
            particle.vy *= 0.98
            particle.life--
            particle.size *= 0.95
            return particle.life > 0 && particle.size > 0.5
        })

        // Check collisions
        const result = checkCollisions(
            state.arrows,
            state.targets,
            state.enemies,
            (x, y, color, count) => {
                state.particles.push(...createParticles(x, y, color, count))
            }
        )

        state.arrows = result.arrows
        state.targets = result.targets
        state.enemies = result.enemies
        setScore(prev => Math.max(0, prev + result.scoreGained))

        // Check level completion
        const allTargetsHit = state.targets.every(target => target.hit)
        const noArrowsLeft = arrows <= 0 && state.arrows.length === 0

        if (allTargetsHit) {
            setScore(prev => prev + arrows * 10)
            setLevel(prev => prev + 1)
            initializeLevel()
        } else if (noArrowsLeft) {
            setGameOver(true)
            if (score > highScore) {
                setHighScore(score)
                try {
                    localStorage.setItem('archeryHighScore', score.toString())
                } catch (error) {
                    console.warn('Could not save high score:', error)
                }
            }
        }
    }, [gameStarted, gameOver, isPaused, wind, arrows, score, highScore, level, initializeLevel])

    const gameLoop = useCallback(() => {
        updateGame()
        render()
        animationRef.current = requestAnimationFrame(gameLoop)
    }, [updateGame, render])

    const startGame = useCallback(() => {
        setGameStarted(true)
        setGameOver(false)
        setIsPaused(false)
        setScore(0)
        setLevel(1)
        initializeLevel()
        animationRef.current = requestAnimationFrame(gameLoop)
    }, [initializeLevel, gameLoop])

    const restartGame = useCallback(() => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current)
        setGameStarted(false)
        setGameOver(false)
        setIsPaused(false)
        setScore(0)
        setLevel(1)
        setTimeout(() => startGame(), 0)
    }, [startGame])

    const togglePause = useCallback(() => {
        if (!gameStarted || gameOver) return
        setIsPaused(prev => !prev)
    }, [gameStarted, gameOver])

    const resetScore = () => {
        setHighScore(0)
        try {
            localStorage.removeItem('archeryHighScore')
        } catch (error) {
            console.warn('Could not clear high score:', error)
        }
    }

    // Mouse/Touch controls
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const handleMouseMove = (e) => updateBowAngle(e.clientX, e.clientY)
        const handleMouseDown = (e) => {
            e.preventDefault()
            if (!gameStarted && !gameOver) { startGame(); return }
            if (gameOver) { restartGame(); return }
            startCharging()
        }
        const handleMouseUp = (e) => { e.preventDefault(); releaseArrow() }
        const handleTouchMove = (e) => {
            e.preventDefault()
            const touch = e.touches[0]
            updateBowAngle(touch.clientX, touch.clientY)
        }
        const handleTouchStart = (e) => {
            e.preventDefault()
            const touch = e.touches[0]
            updateBowAngle(touch.clientX, touch.clientY)
            if (!gameStarted && !gameOver) { startGame(); return }
            if (gameOver) { restartGame(); return }
            startCharging()
        }
        const handleTouchEnd = (e) => { e.preventDefault(); releaseArrow() }

        canvas.addEventListener('mousemove', handleMouseMove)
        canvas.addEventListener('mousedown', handleMouseDown)
        canvas.addEventListener('mouseup', handleMouseUp)
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false })

        return () => {
            canvas.removeEventListener('mousemove', handleMouseMove)
            canvas.removeEventListener('mousedown', handleMouseDown)
            canvas.removeEventListener('mouseup', handleMouseUp)
            canvas.removeEventListener('touchmove', handleTouchMove)
            canvas.removeEventListener('touchstart', handleTouchStart)
            canvas.removeEventListener('touchend', handleTouchEnd)
        }
    }, [updateBowAngle, startCharging, releaseArrow, gameStarted, gameOver, startGame, restartGame])

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === ' ') {
                e.preventDefault()
                if (!gameStarted && !gameOver) startGame()
                else if (gameOver) restartGame()
                else if (gameStarted && !isPaused) startCharging()
                return
            }
            if (e.key === 'p' || e.key === 'P') { e.preventDefault(); togglePause() }
        }
        const handleKeyUp = (e) => {
            if (e.key === ' ') { e.preventDefault(); releaseArrow() }
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [gameStarted, gameOver, isPaused, startGame, restartGame, togglePause, startCharging, releaseArrow])

    useEffect(() => {
        animationRef.current = requestAnimationFrame(gameLoop)
        return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current) }
    }, [gameLoop])

    return (
        <div className="archery-container">
            <div className="archery-header">
                <h1>🏹 Archery Master</h1>
                <button onClick={resetScore} className="reset-btn">Reset High Score</button>
            </div>

            <div className="archery-stats">
                <div className="stat"><span>Score</span><span>{score}</span></div>
                <div className="stat"><span>High Score</span><span>{highScore}</span></div>
                <div className="stat"><span>Level</span><span>{level}</span></div>
                <div className="stat"><span>Arrows</span><span>{arrows}</span></div>
            </div>

            <div className="archery-game-area">
                <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="archery-canvas"
                />

                <div className="archery-controls">
                    {!gameStarted ? (
                        <button onClick={startGame} className="btn-primary">Start Game</button>
                    ) : (
                        <>
                            <button onClick={togglePause} disabled={gameOver} className="btn-warning">
                                {isPaused ? 'Resume' : 'Pause'}
                            </button>
                            {gameOver && (
                                <button onClick={restartGame} className="btn-danger">Restart</button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ArcheryGame