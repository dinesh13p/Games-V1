import { useCallback, useEffect, useRef, useState } from 'react'
import { CANVAS_HEIGHT, createPongGame, advancePong } from './PongGame.logic'
import { renderPong } from './PongGame.render'

const summary = state => ({ phase: state.phase, player: state.score.player, ai: state.score.ai })

export function usePong() {
    const canvasRef = useRef(null)
    const model = useRef(null)
    if (!model.current) model.current = createPongGame()
    const dragging = useRef(false)
    const [view, setView] = useState(() => summary(model.current))
    const publish = useCallback(() => {
        const next = summary(model.current)
        setView(previous => Object.keys(next).every(key => next[key] === previous[key]) ? previous : next)
    }, [])
    const startGame = useCallback(() => {
        model.current = { ...createPongGame(), phase: 'playing' }
        canvasRef.current?.focus({ preventScroll: true })
        dragging.current = false
        publish()
    }, [publish])
    const togglePause = useCallback(() => {
        const state = model.current
        if (!['playing', 'paused'].includes(state.phase)) return
        state.phase = state.phase === 'playing' ? 'paused' : 'playing'
        if (state.phase === 'playing') canvasRef.current?.focus({ preventScroll: true })
        state.upPressed = false
        state.downPressed = false
        dragging.current = false
        publish()
    }, [publish])
    const setDirection = useCallback((direction, pressed) => {
        model.current[direction === 'up' ? 'upPressed' : 'downPressed'] = pressed && model.current.phase === 'playing'
    }, [])
    const movePaddle = useCallback(event => {
        if (model.current.phase !== 'playing') return
        if (event.type === 'pointerdown') {
            dragging.current = true
            event.currentTarget.setPointerCapture(event.pointerId)
        }
        if (!dragging.current) return
        const rect = canvasRef.current.getBoundingClientRect()
        const state = model.current
        state.playerY = Math.max(0, Math.min(CANVAS_HEIGHT - state.paddleHeight,
            (event.clientY - rect.top) * CANVAS_HEIGHT / rect.height - state.paddleHeight / 2))
    }, [])
    const releasePointer = useCallback(() => { dragging.current = false }, [])

    useEffect(() => {
        let frame, last = 0, elapsed = 0
        const mobile = window.matchMedia('(max-width: 767px)')
        const loop = now => {
            elapsed += last ? Math.min((now - last) / 1000, 0.05) : 0
            last = now
            if (model.current.phase === 'playing') {
                while (elapsed >= 1 / 60 && model.current.phase === 'playing') {
                    model.current = advancePong(model.current, mobile.matches)
                    elapsed -= 1 / 60
                }
                publish()
            } else elapsed = 0
            renderPong(canvasRef.current, model.current)
            frame = requestAnimationFrame(loop)
        }
        frame = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(frame)
    }, [publish])
    useEffect(() => {
        const onKeyDown = event => {
            if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.target.closest?.('input, select, textarea, [contenteditable="true"]')) return
            if ([' ', 'Enter'].includes(event.key) && event.target.closest?.('button, a')) return
            if (event.key === 'ArrowUp') { event.preventDefault(); setDirection('up', true) }
            if (event.key === 'ArrowDown') { event.preventDefault(); setDirection('down', true) }
            if (event.key === ' ' || event.key.toLowerCase() === 'p') {
                event.preventDefault()
                if (event.repeat) return
                if (['ready', 'over'].includes(model.current.phase)) startGame()
                else togglePause()
            }
        }
        const onKeyUp = event => {
            if (event.key === 'ArrowUp') setDirection('up', false)
            if (event.key === 'ArrowDown') setDirection('down', false)
        }
        const onBlur = () => { if (model.current.phase === 'playing') togglePause() }
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
    }, [setDirection, startGame, togglePause])
    return { canvasRef, view, startGame, togglePause, setDirection, movePaddle, releasePointer }
}
