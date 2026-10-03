import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
    CANVAS_WIDTH, CANVAS_HEIGHT, DOODLER_WIDTH, DOODLER_HEIGHT,
    PLATFORM_WIDTH, PLATFORM_HEIGHT, GRAVITY, JUMP_FORCE,
    createPlatform, createFallingObject, initializePlatforms,
    generateNewPlatform, checkPlatformCollision, checkFallingObjectCollision
} from './DoodleJump.logic'
import './DoodleJump.css'

const DoodleJump = () => {
    const canvasRef = useRef(null)
    const animationRef = useRef(null)
    const touchStartX = useRef(0)

    const [gameStarted, setGameStarted] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [gameOver, setGameOver] = useState(false)
    const [score, setScore] = useState(0)
    const [highScore, setHighScore] = useState(0)
    const [isMobile, setIsMobile] = useState(false)

    const gameState = useRef({
        doodler: {
            x: CANVAS_WIDTH / 2 - DOODLER_WIDTH / 2,
            y: CANVAS_HEIGHT - 150,
            velocityX: 0,
            velocityY: -JUMP_FORCE,
            onPlatform: false,
            facingRight: true,
            canJump: true,
            flying: false,
            flyingTimer: 0
        },
        platforms: [],
        cameraY: 0,
        keys: { left: false, right: false },
        currentScore: 0,
        maxHeight: 0,
        fallingObjects: [],
        platformCount: 0
    })

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const startGame = useCallback(() => {
        setGameStarted(true)
        setIsPaused(false)
        setGameOver(false)
        setScore(0)
        if (animationRef.current) cancelAnimationFrame(animationRef.current)
        gameState.current = {
            doodler: {
                x: CANVAS_WIDTH / 2 - DOODLER_WIDTH / 2,
                y: CANVAS_HEIGHT - 150,
                velocityX: 0,
                velocityY: -JUMP_FORCE,
                onPlatform: false,
                facingRight: true,
                canJump: true,
                flying: false,
                flyingTimer: 0
            },
            platforms: initializePlatforms(CANVAS_WIDTH, CANVAS_HEIGHT),
            cameraY: 0,
            keys: { left: false, right: false },
            currentScore: 0,
            maxHeight: 0,
            fallingObjects: [],
            platformCount: 0
        }
        animationRef.current = requestAnimationFrame(gameLoop)
    }, [])

    const restartGame = useCallback(() => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current)
        setGameStarted(false)
        setIsPaused(false)
        setGameOver(false)
        setScore(0)
        setTimeout(() => startGame(), 0)
    }, [startGame])

    const togglePause = useCallback(() => {
        if (!gameStarted || gameOver) return
        setIsPaused(prev => {
            const next = !prev
            if (!next) animationRef.current = requestAnimationFrame(gameLoop)
            else if (animationRef.current) cancelAnimationFrame(animationRef.current)
            return next
        })
    }, [gameStarted, gameOver])

    const handleMobileControl = useCallback((direction) => {
        if (!gameStarted || isPaused || gameOver) return
        const state = gameState.current
        if (direction === 'left') {
            state.keys.left = true
            state.keys.right = false
            state.doodler.facingRight = false
            setTimeout(() => { state.keys.left = false }, 150)
        } else if (direction === 'right') {
            state.keys.right = true
            state.keys.left = false
            state.doodler.facingRight = true
            setTimeout(() => { state.keys.right = false }, 150)
        }
    }, [gameStarted, isPaused, gameOver])

    const render = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        const state = gameState.current

        // Clear with sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
        gradient.addColorStop(0, '#87CEEB')
        gradient.addColorStop(1, '#98D8E8')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

        ctx.save()
        ctx.translate(0, -state.cameraY)

        // Platforms
        state.platforms.forEach(platform => {
            if (platform.y > state.cameraY - 50 && platform.y < state.cameraY + CANVAS_HEIGHT + 50) {
                if (platform.type === 'spiked') {
                    ctx.fillStyle = '#8B0000'
                    ctx.strokeStyle = '#FF0000'
                } else if (platform.type === 'green') {
                    ctx.fillStyle = '#00AA00'
                    ctx.strokeStyle = '#00FF00'
                } else {
                    ctx.fillStyle = '#8B4513'
                    ctx.strokeStyle = '#654321'
                }
                ctx.lineWidth = 2
                ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
                ctx.strokeRect(platform.x, platform.y, platform.width, platform.height)

                if (platform.type === 'spiked') {
                    ctx.fillStyle = '#FF0000'
                    for (let i = 0; i < 6; i++) {
                        const spikeX = platform.x + (platform.width / 6) * i + (platform.width / 12)
                        ctx.beginPath()
                        ctx.moveTo(spikeX, platform.y)
                        ctx.lineTo(spikeX - 6, platform.y - 8)
                        ctx.lineTo(spikeX + 6, platform.y - 8)
                        ctx.closePath()
                        ctx.fill()
                    }
                } else if (platform.type === 'green') {
                    ctx.fillStyle = '#00FF00'
                    ctx.fillRect(platform.x + 2, platform.y + 2, platform.width - 4, 4)
                } else {
                    ctx.fillStyle = '#A0522D'
                    ctx.fillRect(platform.x + 2, platform.y + 2, platform.width - 4, 4)
                }
            }
        })

        // Falling objects
        state.fallingObjects.forEach(obj => {
            if (obj.y > state.cameraY - 50 && obj.y < state.cameraY + CANVAS_HEIGHT + 50) {
                ctx.fillStyle = '#444444'
                ctx.strokeStyle = '#000000'
                ctx.lineWidth = 2
                ctx.fillRect(obj.x, obj.y, obj.width, obj.height)
                ctx.strokeRect(obj.x, obj.y, obj.width, obj.height)
                ctx.fillStyle = '#666666'
                ctx.fillRect(obj.x + 2, obj.y + 2, obj.width - 4, 4)
                ctx.fillStyle = '#FF0000'
                ctx.beginPath()
                ctx.arc(obj.x + obj.width / 2, obj.y + obj.height / 2, 3, 0, Math.PI * 2)
                ctx.fill()
            }
        })

        // Doodler
        ctx.fillStyle = state.doodler.flying ? '#FFD700' : '#32CD32'
        ctx.strokeStyle = state.doodler.flying ? '#FFA500' : '#228B22'
        ctx.lineWidth = 2
        ctx.fillRect(state.doodler.x, state.doodler.y, DOODLER_WIDTH, DOODLER_HEIGHT)
        ctx.strokeRect(state.doodler.x, state.doodler.y, DOODLER_WIDTH, DOODLER_HEIGHT)
        ctx.fillStyle = '#000'
        if (state.doodler.facingRight) {
            ctx.fillRect(state.doodler.x + 12, state.doodler.y + 12, 10, 10)
            ctx.fillRect(state.doodler.x + 38, state.doodler.y + 12, 10, 10)
        } else {
            ctx.fillRect(state.doodler.x + 10, state.doodler.y + 12, 10, 10)
            ctx.fillRect(state.doodler.x + 36, state.doodler.y + 12, 10, 10)
        }
        ctx.beginPath()
        ctx.arc(state.doodler.x + 30, state.doodler.y + 40, 10, 0, Math.PI)
        ctx.fillStyle = '#000'
        ctx.fill()
        ctx.fillStyle = state.doodler.flying ? '#FFD700' : '#32CD32'
        ctx.fillRect(state.doodler.x + 15, state.doodler.y + DOODLER_HEIGHT, 8, 8)
        ctx.fillRect(state.doodler.x + 37, state.doodler.y + DOODLER_HEIGHT, 8, 8)

        ctx.restore()

        // HUD
        ctx.fillStyle = '#fff'
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 3
        ctx.font = 'bold 28px Arial'
        ctx.textAlign = 'center'
        ctx.strokeText(`Score: ${score}`, CANVAS_WIDTH / 2, 45)
        ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, 45)

        if (state.doodler.flying) {
            ctx.fillStyle = '#FFD700'
            ctx.strokeStyle = '#000'
            ctx.font = 'bold 16px Arial'
            ctx.strokeText('FLYING!', CANVAS_WIDTH / 2, 75)
            ctx.fillText('FLYING!', CANVAS_WIDTH / 2, 75)
        }

        if (isPaused && gameStarted) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
            ctx.fillStyle = '#fff'
            ctx.font = 'bold 48px Arial'
            ctx.textAlign = 'center'
            ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
            ctx.font = 'bold 20px Arial'
            ctx.fillText('Press P to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50)
        }

        if (!gameStarted && !gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
            ctx.fillStyle = '#fff'
            ctx.font = 'bold 36px Arial'
            ctx.textAlign = 'center'
            ctx.fillText('Doodle Jump', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 120)
            ctx.font = 'bold 18px Arial'
            ctx.fillText('Arrow Keys: Move Left/Right', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60)
            ctx.fillText('Red Platforms: DEADLY!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 35)
            ctx.fillText('Green Platforms: Flying Power!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10)
            ctx.fillText('Avoid Falling Objects!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 15)
            ctx.fillText('Click Start Game to Begin!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50)
            if (highScore > 0) {
                ctx.font = 'bold 16px Arial'
                ctx.fillText(`High Score: ${highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80)
            }
        }

        if (gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
            ctx.fillStyle = '#FF4444'
            ctx.font = 'bold 48px Arial'
            ctx.textAlign = 'center'
            ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60)
            ctx.fillStyle = '#fff'
            ctx.font = 'bold 24px Arial'
            ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
            if (score === highScore && score > 0) {
                ctx.fillStyle = '#FFD700'
                ctx.font = 'bold 20px Arial'
                ctx.fillText('NEW HIGH SCORE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40)
            } else if (highScore > 0) {
                ctx.fillStyle = '#fff'
                ctx.font = 'bold 18px Arial'
                ctx.fillText(`High Score: ${highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40)
            }
            ctx.font = 'bold 16px Arial'
            ctx.fillText('Click Restart to Play Again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80)
        }
    }, [gameStarted, isPaused, gameOver, score, highScore])

    const updateGame = useCallback(() => {
        if (!gameStarted || isPaused || gameOver) return

        const state = gameState.current
        const { doodler } = state

        // Horizontal input
        if (state.keys.left) {
            doodler.velocityX = Math.max(doodler.velocityX - 1.5, -8)
            doodler.facingRight = false
        } else if (state.keys.right) {
            doodler.velocityX = Math.min(doodler.velocityX + 1.5, 8)
            doodler.facingRight = true
        } else {
            doodler.velocityX *= 0.9
            if (Math.abs(doodler.velocityX) < 0.3) doodler.velocityX = 0
        }

        // Handle flying
        if (doodler.flying) {
            doodler.flyingTimer -= 1
            if (doodler.flyingTimer <= 0) {
                doodler.flying = false
                doodler.velocityY = 0
            }
        }

        // Gravity
        if (doodler.flying) {
            doodler.velocityY += GRAVITY * 0.1
        } else {
            doodler.velocityY += GRAVITY
        }

        // Update position
        doodler.x += doodler.velocityX
        doodler.y += doodler.velocityY

        // Horizontal wrap
        if (doodler.x < -DOODLER_WIDTH) doodler.x = CANVAS_WIDTH
        else if (doodler.x > CANVAS_WIDTH) doodler.x = -DOODLER_WIDTH

        // Camera
        if (doodler.y < state.cameraY + CANVAS_HEIGHT / 2) {
            const targetCameraY = doodler.y - CANVAS_HEIGHT / 2
            state.cameraY = targetCameraY
            const newHeight = Math.max(0, -state.cameraY / 10)
            if (newHeight > state.maxHeight) {
                const heightGain = Math.floor(newHeight - state.maxHeight)
                state.currentScore += heightGain
                state.maxHeight = newHeight
                setScore(state.currentScore)
            }
        }

        // Platform collisions
        let landed = false
        if (doodler.velocityY > 0) {
            for (let platform of state.platforms) {
                if (checkPlatformCollision(doodler, platform)) {
                    if (platform.type === 'spiked') {
                        setGameOver(true)
                        setGameStarted(false)
                        if (state.currentScore > highScore) setHighScore(state.currentScore)
                        return
                    } else if (platform.type === 'green') {
                        doodler.y = platform.y - DOODLER_HEIGHT
                        doodler.velocityY = -JUMP_FORCE * 1.5
                        doodler.flying = true
                        doodler.flyingTimer = 60
                        doodler.canJump = true
                        landed = true
                    } else {
                        doodler.y = platform.y - DOODLER_HEIGHT
                        doodler.velocityY = -JUMP_FORCE
                        doodler.canJump = true
                        landed = true
                    }
                    break
                }
            }
        }

        if (doodler.velocityY <= 0 || landed) doodler.canJump = true

        // Falling objects
        if (state.fallingObjects.length < 3 && Math.random() < 0.01) {
            const x = Math.random() * (CANVAS_WIDTH - 24)
            const y = state.cameraY - 30
            state.fallingObjects.push(createFallingObject(x, y))
        }
        state.fallingObjects.forEach(obj => obj.y += obj.velocityY)

        // Check falling object collisions
        for (let i = state.fallingObjects.length - 1; i >= 0; i--) {
            if (checkFallingObjectCollision(doodler, state.fallingObjects[i])) {
                setGameOver(true)
                setGameStarted(false)
                if (state.currentScore > highScore) setHighScore(state.currentScore)
                return
            }
        }
        state.fallingObjects = state.fallingObjects.filter(
            obj => obj.y < state.cameraY + CANVAS_HEIGHT + 200
        )

        // Manage platforms
        state.platforms = state.platforms.filter(
            p => p.y < state.cameraY + CANVAS_HEIGHT + 200
        )
        const maxPlatforms = Math.max(4, Math.floor(12 * 0.7))
        while (state.platforms.length < maxPlatforms) {
            state.platforms.push(generateNewPlatform(state.platforms, CANVAS_WIDTH))
        }

        // Game over if fallen
        if (doodler.y > state.cameraY + CANVAS_HEIGHT + 100) {
            setGameOver(true)
            setGameStarted(false)
            if (state.currentScore > highScore) setHighScore(state.currentScore)
        }
    }, [gameStarted, isPaused, gameOver, highScore])

    const gameLoop = useCallback(() => {
        updateGame()
        render()
        if ((gameStarted && !isPaused && !gameOver) || !gameStarted || gameOver) {
            animationRef.current = requestAnimationFrame(gameLoop)
        }
    }, [updateGame, render, gameStarted, isPaused, gameOver])

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!gameStarted && (e.key === ' ' || e.key === 'Enter')) {
                e.preventDefault()
                startGame()
                return
            }
            if (!gameStarted) return
            if ((e.key === 'p' || e.key === 'P') && !gameOver) {
                e.preventDefault()
                togglePause()
                return
            }
            if (isPaused || gameOver) return
            const state = gameState.current
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                e.preventDefault()
                state.keys.left = true
            }
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                e.preventDefault()
                state.keys.right = true
            }
        }
        const handleKeyUp = (e) => {
            const state = gameState.current
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') state.keys.left = false
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') state.keys.right = false
        }
        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [gameStarted, isPaused, gameOver, startGame, togglePause])

    // Touch controls
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const handleTouchStart = (e) => {
            e.preventDefault()
            if (!gameStarted) { startGame(); return }
            touchStartX.current = e.touches[0].clientX
        }
        const handleTouchMove = (e) => {
            e.preventDefault()
            if (!gameStarted || isPaused || gameOver) return
            const deltaX = e.touches[0].clientX - touchStartX.current
            if (Math.abs(deltaX) > 20) {
                if (deltaX > 0) handleMobileControl('right')
                else handleMobileControl('left')
                touchStartX.current = e.touches[0].clientX
            }
        }
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
        return () => {
            canvas.removeEventListener('touchstart', handleTouchStart)
            canvas.removeEventListener('touchmove', handleTouchMove)
        }
    }, [gameStarted, isPaused, gameOver, startGame, handleMobileControl])

    useEffect(() => {
        animationRef.current = requestAnimationFrame(gameLoop)
        return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current) }
    }, [gameLoop])

    return (
        <div className="doodle-jump-container">
            <div className="doodle-jump-header">
                <h1>🦘 Doodle Jump</h1>
                <div className="score-display">
                    <span>Score: {score}</span>
                    <span>High: {highScore}</span>
                </div>
            </div>

            <div className="doodle-jump-game-area">
                <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="doodle-jump-canvas"
                />

                {isMobile && (
                    <div className="doodle-jump-mobile-controls">
                        <button onTouchStart={() => handleMobileControl('left')}>←</button>
                        <button onTouchStart={() => handleMobileControl('right')}>→</button>
                    </div>
                )}

                <div className="doodle-jump-controls">
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

export default DoodleJump