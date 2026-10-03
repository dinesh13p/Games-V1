import { useCallback, useEffect, useRef, useState } from 'react'
import { CANVAS_WIDTH, PADDLE_WIDTH, createBrickGame, advanceBricks } from './BrickBreaker.logic'
import { renderBricks } from './BrickBreaker.render'

const loadBest = () => {
    try { return Number(localStorage.getItem('brickBreakerHighScore')) || 0 } catch { return 0 }
}
const summary = state => ({ phase: state.phase, score: state.score, lives: state.lives,
    won: state.won, bricks: state.bricks.filter(brick => brick.visible).length, highScore: state.highScore })

export function useBrickBreaker() {
    const canvasRef = useRef(null)
    const model = useRef(null)
    if (!model.current) model.current = { ...createBrickGame(), highScore: loadBest() }
    const keys = useRef({ left: false, right: false })
    const [view, setView] = useState(() => summary(model.current))
    const publish = useCallback(() => {
        const next = summary(model.current)
        setView(previous => Object.keys(next).every(key => next[key] === previous[key]) ? previous : next)
    }, [])
    const startGame = useCallback(() => {
        model.current = { ...createBrickGame(), phase: 'playing', highScore: model.current.highScore }
        canvasRef.current?.focus({ preventScroll: true })
        keys.current = { left: false, right: false }
        publish()
    }, [publish])
    const togglePause = useCallback(() => {
        const state = model.current
        if (state.phase === 'playing' || state.phase === 'paused') {
            state.phase = state.phase === 'playing' ? 'paused' : 'playing'
            if (state.phase === 'playing') canvasRef.current?.focus({ preventScroll: true })
            keys.current = { left: false, right: false }
            publish()
        }
    }, [publish])
    const setDirection = useCallback((direction, pressed) => {
        keys.current[direction] = pressed && model.current.phase === 'playing'
    }, [])
    const movePaddle = useCallback(event => {
        if (model.current.phase !== 'playing') return
        if (event.type === 'pointermove' && !event.buttons && event.pointerType !== 'touch') return
        const rect = canvasRef.current.getBoundingClientRect()
        model.current.paddle.x = Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH,
            (event.clientX - rect.left) * CANVAS_WIDTH / rect.width - PADDLE_WIDTH / 2))
        if (event.type === 'pointerdown') event.currentTarget.setPointerCapture(event.pointerId)
    }, [])
    const resetScore = useCallback(() => {
        model.current.highScore = 0
        try { localStorage.removeItem('brickBreakerHighScore') } catch { /* Storage is optional. */ }
        publish()
    }, [publish])

    useEffect(() => {
        let frame, last = 0, elapsed = 0
        const loop = now => {
            elapsed += last ? Math.min((now - last) / 1000, 0.05) : 0
            last = now
            if (model.current.phase === 'playing') {
                while (elapsed >= 1 / 60 && model.current.phase === 'playing') {
                    model.current = advanceBricks(model.current, keys.current)
                    elapsed -= 1 / 60
                }
                const state = model.current
                if (state.phase === 'over' && state.score > state.highScore) {
                    state.highScore = state.score
                    try { localStorage.setItem('brickBreakerHighScore', String(state.score)) } catch { /* Storage is optional. */ }
                }
                publish()
            } else elapsed = 0
            renderBricks(canvasRef.current, model.current)
            frame = requestAnimationFrame(loop)
        }
        frame = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(frame)
    }, [publish])

    useEffect(() => {
        const onKeyDown = event => {
            if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.target.closest?.('input, select, textarea, [contenteditable="true"]')) return
            if ([' ', 'Enter'].includes(event.key) && event.target.closest?.('button, a')) return
            const key = event.key.toLowerCase()
            if (key === ' ' || key === 'p') {
                event.preventDefault()
                if (event.repeat) return
                if (model.current.phase === 'ready' || model.current.phase === 'over') startGame()
                else togglePause()
            }
            if (key === 'arrowleft' || key === 'a') { event.preventDefault(); setDirection('left', true) }
            if (key === 'arrowright' || key === 'd') { event.preventDefault(); setDirection('right', true) }
        }
        const onKeyUp = event => {
            if (['ArrowLeft', 'a', 'A'].includes(event.key)) setDirection('left', false)
            if (['ArrowRight', 'd', 'D'].includes(event.key)) setDirection('right', false)
        }
        const onBlur = () => {
            keys.current = { left: false, right: false }
            if (model.current.phase === 'playing') { model.current.phase = 'paused'; publish() }
        }
        const onVisibility = () => { if (document.hidden) onBlur() }
        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup', onKeyUp)
        window.addEventListener('blur', onBlur)
        document.addEventListener('visibilitychange', onVisibility)
        return () => {
            window.removeEventListener('keydown', onKeyDown)
            window.removeEventListener('keyup', onKeyUp)
            window.removeEventListener('blur', onBlur)
            document.removeEventListener('visibilitychange', onVisibility)
        }
    }, [publish, setDirection, startGame, togglePause])
    return { canvasRef, view, startGame, togglePause, setDirection, movePaddle, resetScore }
}
