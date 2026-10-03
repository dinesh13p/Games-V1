import React, { useRef, useEffect, useState } from 'react'
import {
    WIDTH, HEIGHT, GRAVITY, FLAP_VELOCITY, MAX_DROP_SPEED,
    BIRD_RADIUS, PIPE_WIDTH, PIPE_GAP, PIPE_MIN_GAP_Y,
    PIPE_SPAWN_INTERVAL, PIPE_SPEED, GROUND_HEIGHT, HS_KEY,
    createPipe, checkCollision, shouldPipeMove
} from './FlappyBird.logic'
import './FlappyBird.css'

const FlappyBird = () => {
    const canvasRef = useRef(null)
    const rafRef = useRef(null)
    const lastTimeRef = useRef(0)

    const [scale, setScale] = useState(1)
    const [score, setScore] = useState(0)
    const [highScore, setHighScore] = useState(() => {
        try {
            const saved = localStorage.getItem(HS_KEY)
            return saved ? parseInt(saved) : 0
        } catch { return 0 }
    })
    const [state, setState] = useState('ready')
    const [isDarkMode, setIsDarkMode] = useState(false)
    const [isGameWon, setIsGameWon] = useState(false)

    const pipesRef = useRef([])
    const birdRef = useRef({
        x: WIDTH * 0.28,
        y: HEIGHT / 2,
        vy: 0,
        rotation: 0
    })
    const spawnTimerRef = useRef(0)
    const passedPipeIndexRef = useRef(0)
    const scoreRef = useRef(0)
    const pipeCountRef = useRef(0)
    const sounds = useRef({})

    useEffect(() => {
        sounds.current = {
            die: new Audio('/FlappyBird/die.mp3'),
            hit: new Audio('/FlappyBird/hit.mp3'),
            point: new Audio('/FlappyBird/point.mp3'),
            whoosh: new Audio('/FlappyBird/whoosh.mp3')
        }
    }, [])

    useEffect(() => {
        function handleResize() {
            const container = canvasRef.current?.parentElement
            if (!container) return
            const rect = container.getBoundingClientRect()
            const newScale = Math.min(rect.width / WIDTH, (rect.height || 9999) / HEIGHT)
            setScale(newScale)
            const canvas = canvasRef.current
            if (!canvas) return
            const dpr = window.devicePixelRatio || 1
            canvas.width = Math.round(WIDTH * dpr)
            canvas.height = Math.round(HEIGHT * dpr)
            canvas.style.width = Math.round(WIDTH * newScale) + 'px'
            canvas.style.height = Math.round(HEIGHT * newScale) + 'px'
            const ctx = canvas.getContext('2d')
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const playSound = (name) => {
        const sound = sounds.current[name]
        if (sound) {
            const clone = sound.cloneNode()
            clone.volume = 0.5
            clone.play().catch(() => { })
        }
    }

    const flap = () => {
        if (state === 'ready') {
            startGame()
        }
        if (state === 'playing') {
            birdRef.current.vy = FLAP_VELOCITY
            playSound('whoosh')
        }
        if (state === 'over') {
            if (isGameWon) setIsGameWon(false)
            restartGame()
        }
    }

    const startGame = () => {
        setState('playing')
        pipesRef.current = []
        spawnTimerRef.current = 0
        scoreRef.current = 0
        setScore(0)
        passedPipeIndexRef.current = 0
        pipeCountRef.current = 0
        birdRef.current = {
            x: WIDTH * 0.28,
            y: HEIGHT / 2,
            vy: FLAP_VELOCITY,
            rotation: -0.5
        }
    }

    const restartGame = () => {
        setState('ready')
        pipesRef.current = []
        spawnTimerRef.current = 0
        scoreRef.current = 0
        setScore(0)
        passedPipeIndexRef.current = 0
        pipeCountRef.current = 0
        birdRef.current = {
            x: WIDTH * 0.28,
            y: HEIGHT / 2,
            vy: 0,
            rotation: 0
        }
    }

    useEffect(() => {
        const onKey = (e) => {
            if (e.code === 'Space' || e.key === ' ' || e.code === 'ArrowUp') {
                e.preventDefault()
                flap()
            }
        }
        const onCanvasClick = (e) => { e.preventDefault(); flap() }
        const onCanvasTouch = (e) => { e.preventDefault(); flap() }

        window.addEventListener('keydown', onKey)
        const canvas = canvasRef.current
        if (canvas) {
            canvas.addEventListener('mousedown', onCanvasClick)
            canvas.addEventListener('touchstart', onCanvasTouch, { passive: false })
        }
        return () => {
            window.removeEventListener('keydown', onKey)
            if (canvas) {
                canvas.removeEventListener('mousedown', onCanvasClick)
                canvas.removeEventListener('touchstart', onCanvasTouch)
            }
        }
    }, [state])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')

        const drawBackground = (t) => {
            const g = ctx.createLinearGradient(0, 0, 0, HEIGHT)
            if (isDarkMode) {
                g.addColorStop(0, '#1A202C')
                g.addColorStop(1, '#2D3748')
            } else {
                g.addColorStop(0, '#87CEEB')
                g.addColorStop(1, '#E0F6FF')
            }
            ctx.fillStyle = g
            ctx.fillRect(0, 0, WIDTH, HEIGHT)

            ctx.fillStyle = isDarkMode ? '#E2E8F0' : '#FFD700'
            ctx.beginPath()
            ctx.arc(80, 80, isDarkMode ? 25 : 30, 0, Math.PI * 2)
            ctx.fill()

            if (isDarkMode) {
                ctx.fillStyle = '#FFFFFF'
                for (let i = 0; i < 30; i++) {
                    const x = Math.sin(t * 0.001 + i * 0.5) * 3 + (i * 37) % WIDTH
                    const y = Math.cos(t * 0.001 + i * 0.5) * 3 + (i * 39) % (HEIGHT - 200)
                    const size = Math.sin(t * 0.003 + i) * 0.5 + 1
                    ctx.beginPath()
                    ctx.arc(x, y, size, 0, Math.PI * 2)
                    ctx.fill()
                }
            }
        }

        const drawGround = () => {
            ctx.fillStyle = isDarkMode ? '#4A5568' : '#8B7355'
            ctx.fillRect(0, HEIGHT - GROUND_HEIGHT, WIDTH, GROUND_HEIGHT)
            ctx.fillStyle = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
            for (let x = 0; x < WIDTH; x += 20) ctx.fillRect(x, HEIGHT - GROUND_HEIGHT + 50, 12, 6)
            const gradient = ctx.createLinearGradient(0, HEIGHT - GROUND_HEIGHT, 0, HEIGHT)
            if (isDarkMode) {
                gradient.addColorStop(0, 'rgba(74, 85, 104, 0.8)')
                gradient.addColorStop(1, 'rgba(45, 55, 72, 0.8)')
            } else {
                gradient.addColorStop(0, 'rgba(139, 115, 85, 0.8)')
                gradient.addColorStop(1, 'rgba(119, 95, 65, 0.8)')
            }
            ctx.fillStyle = gradient
            ctx.fillRect(0, HEIGHT - GROUND_HEIGHT, WIDTH, GROUND_HEIGHT)
        }

        const drawPipes = () => {
            for (let pipe of pipesRef.current) {
                const rx = pipe.x
                const gapY = pipe.gapY
                drawPipeRect(rx, 0, PIPE_WIDTH, gapY, true, pipe.isGolden)
                drawPipeRect(rx, gapY + PIPE_GAP, PIPE_WIDTH, HEIGHT - GROUND_HEIGHT - (gapY + PIPE_GAP), false, pipe.isGolden)
            }
        }

        const drawPipeRect = (x, y, w, h, flip, isGolden) => {
            ctx.save()
            if (isGolden) {
                const gradient = ctx.createLinearGradient(x, y, x + w, y + h)
                gradient.addColorStop(0, '#FFD700')
                gradient.addColorStop(1, '#FFA500')
                ctx.fillStyle = gradient
                ctx.fillStyle = '#FFFFFF'
                ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 200) * 0.4
                ctx.beginPath()
                ctx.arc(x + w / 2, y + h / 2, 4, 0, Math.PI * 2)
                ctx.fill()
                ctx.globalAlpha = 1.0
            } else {
                ctx.fillStyle = '#4CAF50'
            }
            ctx.fillRect(x, y, w, h)
            ctx.fillStyle = 'rgba(0,0,0,0.15)'
            ctx.fillRect(x + w - 8, y, 8, h)
            if (isGolden) ctx.fillStyle = '#FFD700'
            else if (isDarkMode) ctx.fillStyle = '#34495E'
            else ctx.fillStyle = '#388E3C'
            if (flip) ctx.fillRect(x - 6, y + h - 12, w + 12, 12)
            else ctx.fillRect(x - 6, y, w + 12, 12)
            ctx.restore()
        }

        const drawBird = () => {
            const bird = birdRef.current
            ctx.save()
            ctx.translate(bird.x, bird.y)
            ctx.rotate(bird.rotation)
            ctx.beginPath()
            ctx.fillStyle = '#FFB74D'
            ctx.arc(0, 0, BIRD_RADIUS, 0, Math.PI * 2)
            ctx.fill()
            ctx.beginPath()
            ctx.fillStyle = '#FF9800'
            ctx.ellipse(-3, 6, 10, 4, Math.sin(bird.vy * 0.02) * 0.3, 0, Math.PI * 2)
            ctx.fill()
            ctx.beginPath()
            ctx.fillStyle = '#333'
            ctx.arc(6, -6, 3, 0, Math.PI * 2)
            ctx.fill()
            ctx.beginPath()
            ctx.moveTo(14, -2)
            ctx.lineTo(22, 0)
            ctx.lineTo(14, 4)
            ctx.closePath()
            ctx.fillStyle = '#FF5722'
            ctx.fill()
            ctx.restore()
        }

        const drawHUD = () => {
            ctx.save()
            ctx.font = 'bold 36px Arial'
            ctx.textAlign = 'center'
            ctx.fillStyle = isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)'
            ctx.fillText(scoreRef.current, WIDTH / 2 + 2, 80 + 2)
            ctx.fillStyle = isDarkMode ? '#E2E8F0' : '#fff'
            ctx.fillText(scoreRef.current, WIDTH / 2, 80)
            ctx.restore()
        }

        const drawStartOverlay = () => {
            ctx.save()
            ctx.fillStyle = 'rgba(0,0,0,0.4)'
            ctx.fillRect(0, 0, WIDTH, HEIGHT)
            ctx.fillStyle = 'rgba(255,255,255,0.95)'
            ctx.fillRect(40, 120, WIDTH - 80, 280)
            ctx.fillStyle = '#374151'
            ctx.font = 'bold 32px Arial'
            ctx.textAlign = 'center'
            ctx.fillText('🐦 Flappy Bird', WIDTH / 2, 180)
            ctx.font = '18px Arial'
            ctx.fillStyle = '#6B7280'
            ctx.fillText('Press Space / Tap to flap and start', WIDTH / 2, 220)
            ctx.fillText('🎯 How to Play:', WIDTH / 2, 260)
            ctx.fillText('Avoid pipes and stay airborne!', WIDTH / 2, 285)
            ctx.fillText('Score increases each time you pass a pipe', WIDTH / 2, 310)
            ctx.font = '14px Arial'
            ctx.fillStyle = '#9CA3AF'
            ctx.fillText('💡 Tip: Tap gently for better control', WIDTH / 2, 340)
            ctx.restore()
        }

        const drawGameOverOverlay = () => {
            ctx.save()
            ctx.fillStyle = 'rgba(0,0,0,0.5)'
            ctx.fillRect(0, 0, WIDTH, HEIGHT)
            ctx.fillStyle = 'rgba(255,255,255,0.95)'
            ctx.fillRect(50, 160, WIDTH - 100, 260)
            if (isGameWon) {
                ctx.fillStyle = '#FFD700'
                ctx.font = 'bold 32px Arial'
                ctx.textAlign = 'center'
                ctx.fillText('🏆 Congratulations!', WIDTH / 2, 210)
                ctx.font = '20px Arial'
                ctx.fillText('You completed all 100 pipes!', WIDTH / 2, 245)
            } else {
                ctx.fillStyle = '#EF4444'
                ctx.font = 'bold 32px Arial'
                ctx.textAlign = 'center'
                ctx.fillText('💥 Game Over', WIDTH / 2, 210)
            }
            ctx.font = 'bold 22px Arial'
            ctx.fillStyle = '#374151'
            ctx.fillText(`Score: ${scoreRef.current}`, WIDTH / 2, 250)
            const currentHigh = Math.max(scoreRef.current, highScore)
            ctx.fillStyle = '#059669'
            ctx.fillText(`🏆 High Score: ${currentHigh}`, WIDTH / 2, 285)
            if (scoreRef.current > highScore) {
                ctx.font = '18px Arial'
                ctx.fillStyle = '#DC2626'
                ctx.fillText('🎉 New High Score! 🎉', WIDTH / 2, 315)
            }
            ctx.font = '16px Arial'
            ctx.fillStyle = '#6B7280'
            ctx.fillText('Press Space / Tap to restart', WIDTH / 2, 360)
            ctx.restore()
        }

        const render = (now) => {
            const t = now / 1000
            ctx.clearRect(0, 0, WIDTH, HEIGHT)
            drawBackground(t)
            drawPipes()
            drawGround()
            drawBird()
            drawHUD()
            if (state === 'ready') drawStartOverlay()
            else if (state === 'over') drawGameOverOverlay()
        }

        const update = (dt) => {
            const bird = birdRef.current
            if (state === 'playing') {
                bird.vy += GRAVITY * dt
                if (bird.vy > MAX_DROP_SPEED) bird.vy = MAX_DROP_SPEED
                bird.y += bird.vy * dt
                bird.rotation = Math.max(Math.min(bird.vy / 400, 0.9), -0.9)

                spawnTimerRef.current += dt
                if (spawnTimerRef.current >= PIPE_SPAWN_INTERVAL) {
                    spawnTimerRef.current = 0
                    pipeCountRef.current += 1
                    const newPipe = createPipe(pipeCountRef.current, WIDTH, HEIGHT)
                    if (newPipe) pipesRef.current.push(newPipe)
                }

                for (let pipe of pipesRef.current) {
                    pipe.x -= PIPE_SPEED * dt
                    if (pipe.movingGap) {
                        pipe.gapY += pipe.gapDirection * pipe.gapSpeed * dt
                        const minY = PIPE_MIN_GAP_Y
                        const maxY = HEIGHT - GROUND_HEIGHT - PIPE_GAP - 40
                        if (pipe.gapY <= minY) { pipe.gapY = minY; pipe.gapDirection = 1 }
                        else if (pipe.gapY >= maxY) { pipe.gapY = maxY; pipe.gapDirection = -1 }
                    }
                }

                if (pipesRef.current.length && pipesRef.current[0].x + PIPE_WIDTH < -20) {
                    pipesRef.current.shift()
                }

                for (let i = 0; i < pipesRef.current.length; i++) {
                    const p = pipesRef.current[i]
                    if (!p.passed && p.x + PIPE_WIDTH / 2 < bird.x) {
                        p.passed = true
                        scoreRef.current += 1
                        setScore(scoreRef.current)
                        playSound('point')
                        if (p.isGolden) {
                            setIsGameWon(true)
                            setState('over')
                        }
                        if (scoreRef.current > highScore) {
                            const newHigh = scoreRef.current
                            setHighScore(newHigh)
                            localStorage.setItem(HS_KEY, newHigh.toString())
                        }
                    }
                }

                if (checkCollision(bird, pipesRef.current, WIDTH, HEIGHT)) {
                    if (bird.y + BIRD_RADIUS >= HEIGHT - GROUND_HEIGHT) playSound('die')
                    else playSound('hit')
                    setState('over')
                }
            } else if (state === 'ready') {
                bird.y = HEIGHT / 2 + Math.sin(Date.now() / 300) * 7
                bird.rotation = Math.sin(Date.now() / 400) * 0.06
            } else if (state === 'over') {
                if (bird.y + BIRD_RADIUS < HEIGHT - GROUND_HEIGHT) {
                    bird.vy += GRAVITY * dt
                    bird.y += bird.vy * dt
                    bird.rotation = Math.min(Math.max(bird.vy / 400, -0.9), 1.2)
                } else {
                    bird.y = HEIGHT - GROUND_HEIGHT - BIRD_RADIUS
                    bird.vy = 0
                }
            }
        }

        const loop = (now) => {
            if (!lastTimeRef.current) lastTimeRef.current = now
            const dt = Math.min((now - lastTimeRef.current) / 1000, 0.033)
            lastTimeRef.current = now
            try {
                update(dt)
                render(now)
            } catch (err) {
                console.error('Game loop error:', err)
            }
            rafRef.current = requestAnimationFrame(loop)
        }

        rafRef.current = requestAnimationFrame(loop)
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            rafRef.current = null
            lastTimeRef.current = 0
        }
    }, [state, highScore])

    const resetScores = () => {
        setHighScore(0)
        localStorage.removeItem(HS_KEY)
    }

    return (
        <div className="flappy-bird-container">
            <div className="flappy-bird-header">
                <h1>🐦 Flappy Bird</h1>
                <button onClick={resetScores} className="reset-btn">Reset High Score</button>
            </div>

            <div className="flappy-bird-stats">
                <div className="stat"><span>Score</span><span>{score}</span></div>
                <div className="stat"><span>High Score</span><span>{highScore}</span></div>
            </div>

            <div className="flappy-bird-game-area">
                <div className="flappy-bird-canvas-wrapper">
                    <canvas ref={canvasRef} className="flappy-bird-canvas" />
                </div>
            </div>
        </div>
    )
}

export default FlappyBird