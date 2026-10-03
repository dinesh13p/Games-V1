import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { BASE_SPEED_MS, DIRECTIONS, HS_KEY, createSnakeState, snakeReducer } from './SnakeGame.logic.js'

const readBest = () => {
    try {
        const value = Number(localStorage.getItem(HS_KEY))
        return Number.isFinite(value) && value >= 0 ? value : 0
    } catch {
        return 0
    }
}

export const useSnakeGame = () => {
    const [state, dispatch] = useReducer(snakeReducer, undefined, createSnakeState)
    const [best, setBest] = useState(readBest)
    const boardRef = useRef(null)
    const gesture = useRef(null)
    const turn = useCallback(direction => dispatch({ type: 'turn', direction }), [])

    useEffect(() => {
        if (state.status !== 'running') return
        const timer = window.setInterval(() => dispatch({ type: 'tick' }), Math.max(75, BASE_SPEED_MS - state.score / 5))
        return () => window.clearInterval(timer)
    }, [state.status, state.score, state.round])

    useEffect(() => {
        if (state.score <= best) return
        setBest(state.score)
        try {
            localStorage.setItem(HS_KEY, String(state.score))
        } catch { /* Play continues when browser storage is unavailable. */ }
    }, [state.score, best])

    useEffect(() => {
        const onKeyDown = event => {
            if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.target.closest('input, select, textarea, [contenteditable="true"]')) return
            const direction = {
                ArrowUp: DIRECTIONS.up, w: DIRECTIONS.up,
                ArrowDown: DIRECTIONS.down, s: DIRECTIONS.down,
                ArrowLeft: DIRECTIONS.left, a: DIRECTIONS.left,
                ArrowRight: DIRECTIONS.right, d: DIRECTIONS.right,
            }[event.key.length === 1 ? event.key.toLowerCase() : event.key]
            if (direction && state.status === 'running') {
                event.preventDefault()
                turn(direction)
            } else if (event.code === 'Space' && !event.target.closest('button, a')) {
                event.preventDefault()
                if (event.repeat) return
                dispatch({ type: state.status === 'ready' ? 'start' : state.status === 'paused' ? 'resume' : ['lost', 'won'].includes(state.status) ? 'restart' : 'pause' })
            }
        }
        const onVisibility = () => {
            if (document.hidden) dispatch({ type: 'pause' })
        }
        const onBlur = () => dispatch({ type: 'pause' })
        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('blur', onBlur)
        document.addEventListener('visibilitychange', onVisibility)
        return () => {
            window.removeEventListener('keydown', onKeyDown)
            window.removeEventListener('blur', onBlur)
            document.removeEventListener('visibilitychange', onVisibility)
        }
    }, [state.status, turn])

    const control = type => {
        dispatch({ type })
        boardRef.current?.focus({ preventScroll: true })
    }

    const onPointerDown = event => {
        if (event.pointerType === 'mouse') return
        gesture.current = { x: event.clientX, y: event.clientY, id: event.pointerId }
        event.currentTarget.setPointerCapture(event.pointerId)
    }

    const onPointerUp = event => {
        const start = gesture.current
        if (!start || start.id !== event.pointerId) return
        gesture.current = null
        const dx = event.clientX - start.x
        const dy = event.clientY - start.y
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 16) return
        turn(Math.abs(dx) > Math.abs(dy)
            ? dx > 0 ? DIRECTIONS.right : DIRECTIONS.left
            : dy > 0 ? DIRECTIONS.down : DIRECTIONS.up)
    }

    return {
        state, best, boardRef, turn, control,
        swipeHandlers: { onPointerDown, onPointerUp, onPointerCancel: () => { gesture.current = null } },
    }
}
