import { useCallback, useEffect, useRef, useState } from 'react'
import { HS_KEY, DAS_DELAY, ARR_INTERVAL, createTetrisState, startTetris,
    advanceTetris, moveTetris, rotateTetris, dropTetris, holdTetris } from './Tetris.logic'
import { renderTetris } from './Tetris.render'

const loadBest = () => {
    try { return Number(localStorage.getItem(HS_KEY)) || 0 } catch { return 0 }
}
const summary = state => ({ phase: state.phase, score: state.score, highScore: state.highScore,
    level: state.level, lines: state.lines, next: state.next, hold: state.hold, holdUsed: state.holdUsed })
const emptyKeys = () => ({ left: false, right: false, down: false, leftAt: 0, rightAt: 0 })

export function useTetris() {
    const canvasRef = useRef(null)
    const model = useRef(null)
    if (!model.current) model.current = { ...createTetrisState(), highScore: loadBest() }
    const keys = useRef(emptyKeys())
    const pointer = useRef(null)
    const lastTap = useRef(0)
    const [view, setView] = useState(() => summary(model.current))
    const publish = useCallback((saveBest = true) => {
        const state = model.current
        if (saveBest && state.phase === 'over' && state.score > state.highScore) {
            state.highScore = state.score
            try { localStorage.setItem(HS_KEY, String(state.score)) } catch { /* Storage is optional. */ }
        }
        const next = summary(state)
        setView(previous => Object.keys(next).every(key => next[key] === previous[key]) ? previous : next)
    }, [])
    const startGame = useCallback(() => {
        model.current = { ...startTetris(performance.now()), highScore: model.current.highScore }
        canvasRef.current?.focus({ preventScroll: true })
        keys.current = emptyKeys()
        pointer.current = null
        lastTap.current = 0
        publish()
    }, [publish])
    const togglePause = useCallback(() => {
        const state = model.current
        if (!['playing', 'paused'].includes(state.phase)) return
        state.phase = state.phase === 'playing' ? 'paused' : 'playing'
        if (state.phase === 'playing') canvasRef.current?.focus({ preventScroll: true })
        state.lastDrop = performance.now()
        state.lastSoftDrop = state.lastDrop
        keys.current = emptyKeys()
        pointer.current = null
        publish()
    }, [publish])
    const action = useCallback(name => {
        const now = performance.now(), state = model.current
        if (state.phase !== 'playing') return
        if (name === 'left') model.current = moveTetris(state, -1)
        if (name === 'right') model.current = moveTetris(state, 1)
        if (name === 'rotate') model.current = rotateTetris(state)
        if (name === 'down') model.current = { ...dropTetris(state, now), lastSoftDrop: now }
        if (name === 'drop') model.current = dropTetris(state, now, true)
        if (name === 'hold') model.current = holdTetris(state, now)
        publish()
    }, [publish])
    const holdDirection = useCallback((direction, pressed) => {
        if (!pressed) { keys.current[direction] = false; return }
        if (model.current.phase !== 'playing' || keys.current[direction]) return
        keys.current[direction] = true
        keys.current[`${direction}At`] = performance.now() + DAS_DELAY
        action(direction)
    }, [action])
    const resetScore = useCallback(() => {
        model.current.highScore = 0
        try { localStorage.removeItem(HS_KEY) } catch { /* Storage is optional. */ }
        publish(false)
    }, [publish])

    useEffect(() => {
        let frame
        const loop = now => {
            if (model.current.phase === 'playing') {
                for (const direction of ['left', 'right']) {
                    if (keys.current[direction] && now >= keys.current[`${direction}At`]) {
                        model.current = moveTetris(model.current, direction === 'left' ? -1 : 1)
                        keys.current[`${direction}At`] = now + ARR_INTERVAL
                    }
                }
                model.current = advanceTetris(model.current, now, keys.current.down)
                publish()
            }
            renderTetris(canvasRef.current, model.current)
            frame = requestAnimationFrame(loop)
        }
        frame = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(frame)
    }, [publish])

    useEffect(() => {
        const directions = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowDown: 'down', s: 'down', S: 'down' }
        const onKeyDown = event => {
            if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.target.closest?.('input, select, textarea, [contenteditable="true"]')) return
            if ([' ', 'Enter'].includes(event.key) && event.target.closest?.('button, a')) return
            if ([' ', 'Enter'].includes(event.key) && ['ready', 'over'].includes(model.current.phase)) {
                event.preventDefault(); if (!event.repeat) startGame(); return
            }
            if (event.key.toLowerCase() === 'p') { event.preventDefault(); if (!event.repeat) togglePause(); return }
            if (directions[event.key]) { event.preventDefault(); holdDirection(directions[event.key], true); return }
            const actions = { ArrowUp: 'rotate', w: 'rotate', W: 'rotate', ' ': 'drop', c: 'hold', C: 'hold' }
            if (actions[event.key]) { event.preventDefault(); if (!event.repeat) action(actions[event.key]) }
        }
        const onKeyUp = event => { if (directions[event.key]) holdDirection(directions[event.key], false) }
        const onBlur = () => { keys.current = emptyKeys(); if (model.current.phase === 'playing') togglePause() }
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
            keys.current = emptyKeys()
        }
    }, [action, holdDirection, startGame, togglePause])

    const onPointerDown = useCallback(event => {
        pointer.current = { x: event.clientX, y: event.clientY }
        event.currentTarget.setPointerCapture(event.pointerId)
    }, [])
    const onPointerUp = useCallback(event => {
        if (!pointer.current) return
        const dx = event.clientX - pointer.current.x, dy = event.clientY - pointer.current.y
        pointer.current = null
        if (['ready', 'over'].includes(model.current.phase)) { startGame(); return }
        if (model.current.phase !== 'playing') return
        if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) { action(dx > 0 ? 'right' : 'left'); lastTap.current = 0 }
        else if (Math.abs(dy) > 30) { action(dy > 0 ? 'down' : 'rotate'); lastTap.current = 0 }
        else {
            const now = performance.now()
            if (lastTap.current && now - lastTap.current < 300) { action('drop'); lastTap.current = 0 }
            else { action('rotate'); lastTap.current = now }
        }
    }, [action, startGame])
    const cancelPointer = useCallback(() => { pointer.current = null }, [])
    return { canvasRef, view, startGame, togglePause, action, holdDirection, resetScore, onPointerDown, onPointerUp, cancelPointer }
}
