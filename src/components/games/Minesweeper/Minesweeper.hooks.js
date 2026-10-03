import { useEffect, useReducer, useRef, useState } from 'react'
import { DIFFICULTIES, createMinesweeperState, minesweeperReducer } from './Minesweeper.logic.js'

export const useMinesweeper = () => {
    const [state, dispatch] = useReducer(minesweeperReducer, undefined, () => createMinesweeperState())
    const [activeCell, setActiveCell] = useState(0)
    const boardRef = useRef(null)
    const cfg = DIFFICULTIES[state.difficulty]
    const flags = state.board.flat().filter(cell => cell.isFlagged).length
    const revealed = state.board.flat().filter(cell => cell.isRevealed && !cell.isMine).length

    useEffect(() => {
        if (state.status !== 'running') return
        const timer = window.setInterval(() => dispatch({ type: 'tick' }), 1000)
        return () => window.clearInterval(timer)
    }, [state.status])

    const restart = () => {
        dispatch({ type: 'restart' })
        setActiveCell(0)
        boardRef.current?.parentElement.scrollTo({ left: 0, top: 0 })
    }
    const setDifficulty = difficulty => {
        dispatch({ type: 'difficulty', difficulty })
        setActiveCell(0)
        boardRef.current?.parentElement.scrollTo({ left: 0, top: 0 })
    }
    const onCellKeyDown = (event, r, c) => {
        if (event.key.toLowerCase() === 'f') {
            event.preventDefault()
            dispatch({ type: 'flag', r, c })
            return
        }
        const offset = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[event.key]
        if (!offset && event.key !== 'Home' && event.key !== 'End') return
        event.preventDefault()
        const nextRow = offset ? Math.max(0, Math.min(cfg.rows - 1, r + offset[0])) : event.ctrlKey ? event.key === 'Home' ? 0 : cfg.rows - 1 : r
        const nextCol = offset ? Math.max(0, Math.min(cfg.cols - 1, c + offset[1])) : event.key === 'Home' ? 0 : cfg.cols - 1
        const index = nextRow * cfg.cols + nextCol
        setActiveCell(index)
        boardRef.current?.querySelector(`[data-cell="${index}"]`)?.focus()
    }

    return {
        state, cfg, flags, revealed, activeCell, setActiveCell, boardRef,
        restart, setDifficulty, onCellKeyDown,
        toggleFlagMode: () => dispatch({ type: 'flagMode' }),
        activateCell: (r, c) => dispatch({ type: 'activate', r, c }),
        flagCell: (event, r, c) => {
            event.preventDefault()
            dispatch({ type: 'flag', r, c })
        },
    }
}
