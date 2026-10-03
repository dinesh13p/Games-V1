import { useCallback, useEffect, useRef, useState } from 'react'
import { createFroggerGame, advanceFrogger, moveFrog } from './FroggerGame.logic'
import { renderFrogger } from './FroggerGame.render'

const loadBest = () => {
    try { return Number(localStorage.getItem('froggerHighScore')) || 0 } catch { return 0 }
}
const summary = state => ({ phase: state.phase, score: state.score, highScore: state.highScore,
    timeLeft: state.timeLeft, completions: state.completions, progress: 11 - state.frogY })

export function useFrogger() {
    const canvasRef = useRef(null)
    const model = useRef(null)
    if (!model.current) model.current = { ...createFroggerGame(), highScore: loadBest() }
    const pointer = useRef(null)
    const [view, setView] = useState(() => summary(model.current))
    const publish = useCallback(() => {
        const next = summary(model.current)
        setView(previous => Object.keys(next).every(key => next[key] === previous[key]) ? previous : next)
    }, [])
    const startGame = useCallback(() => {
        model.current = { ...createFroggerGame(), phase: 'playing', highScore: model.current.highScore }
        canvasRef.current?.focus({ preventScroll: true })
        pointer.current = null
        publish()
    }, [publish])
    const togglePause = useCallback(() => {
        if (!['playing', 'paused'].includes(model.current.phase)) return
        model.current.phase = model.current.phase === 'playing' ? 'paused' : 'playing'
        if (model.current.phase === 'playing') canvasRef.current?.focus({ preventScroll: true })
        pointer.current = null
        publish()
    }, [publish])
    const move = useCallback(direction => {
        model.current = moveFrog(model.current, direction)
        publish()
    }, [publish])
    const onPointerDown = useCallback(event => {
        if (model.current.phase !== 'playing') return
        pointer.current = { x: event.clientX, y: event.clientY }
        event.currentTarget.setPointerCapture(event.pointerId)
    }, [])
    const onPointerMove = useCallback(event => {
        if (!pointer.current || model.current.phase !== 'playing') return
        const dx = event.clientX - pointer.current.x, dy = event.clientY - pointer.current.y
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return
        move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'))
        pointer.current = { x: event.clientX, y: event.clientY }
    }, [move])
    const onPointerUp = useCallback(() => { pointer.current = null }, [])
    const resetScore = useCallback(() => {
        model.current.highScore = 0
        try { localStorage.removeItem('froggerHighScore') } catch { /* Storage is optional. */ }
        publish()
    }, [publish])

    useEffect(() => {
        let frame, last = 0, elapsed = 0
        const loop = now => {
            elapsed += last ? Math.min((now - last) / 1000, 0.05) : 0
            last = now
            if (model.current.phase === 'playing') {
                while (elapsed >= 1 / 60 && model.current.phase === 'playing') {
                    model.current = advanceFrogger(model.current)
                    elapsed -= 1 / 60
                }
                const state = model.current
                if (state.phase === 'over' && state.score > state.highScore) {
                    state.highScore = state.score
                    try { localStorage.setItem('froggerHighScore', String(state.score)) } catch { /* Storage is optional. */ }
                }
                publish()
            } else elapsed = 0
            renderFrogger(canvasRef.current, model.current)
            frame = requestAnimationFrame(loop)
        }
        frame = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(frame)
    }, [publish])

    useEffect(() => {
        const onKeyDown = event => {
            if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.target.closest?.('input, select, textarea, [contenteditable="true"]')) return
            if ([' ', 'Enter'].includes(event.key) && event.target.closest?.('button, a')) return
            const directions = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }
            if (directions[event.key]) { event.preventDefault(); move(directions[event.key]) }
            if (event.key === ' ' || event.key.toLowerCase() === 'p') {
                event.preventDefault()
                if (event.repeat) return
                if (['ready', 'over'].includes(model.current.phase)) startGame()
                else togglePause()
            }
        }
        const onBlur = () => {
            pointer.current = null
            if (model.current.phase === 'playing') { model.current.phase = 'paused'; publish() }
        }
        const onVisibility = () => { if (document.hidden) onBlur() }
        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('blur', onBlur)
        document.addEventListener('visibilitychange', onVisibility)
        return () => {
            window.removeEventListener('keydown', onKeyDown)
            window.removeEventListener('blur', onBlur)
            document.removeEventListener('visibilitychange', onVisibility)
        }
    }, [publish, move, startGame, togglePause])
    return { canvasRef, view, startGame, togglePause, move, onPointerDown, onPointerMove, onPointerUp, resetScore }
}
