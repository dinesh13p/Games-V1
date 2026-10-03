import { useEffect, useRef, useState } from 'react'
import { BLACK, WHITE, GoGameEngine } from './GoGame.logic.js'

export function useGoGame() {
    const [engine, setEngine] = useState(() => new GoGameEngine())
    const [mode, setMode] = useState('pvc')
    const [difficulty, setDifficulty] = useState('medium')
    const [humanPlayer, setHumanPlayer] = useState(BLACK)
    const [focus, setFocus] = useState({ row: 4, col: 4 })
    const boardRef = useRef(null)
    const aiTurn = mode === 'pvc' && !engine.gameOver && engine.currentPlayer !== humanPlayer

    useEffect(() => {
        if (!aiTurn) return undefined
        let cancelled = false
        const timer = setTimeout(() => {
            const move = engine.getAIMove(difficulty)
            if (cancelled || !move) return
            setEngine(current => {
                if (current !== engine) return current
                const next = current.clone()
                next.makeMove(move.row, move.col)
                return next
            })
        }, 300)
        return () => {
            cancelled = true
            clearTimeout(timer)
        }
    }, [engine, aiTurn, difficulty])

    const restart = () => setEngine(new GoGameEngine(engine.size))
    const changeMode = value => { setMode(value); restart() }
    const changeSide = value => { setHumanPlayer(Number(value)); restart() }
    const changeSize = value => {
        const size = Number(value)
        setEngine(new GoGameEngine(size))
        setFocus({ row: Math.floor(size / 2), col: Math.floor(size / 2) })
    }
    const play = (row, col) => {
        if (aiTurn || !engine.isValidMove(row, col)) return
        const next = engine.clone()
        next.makeMove(row, col)
        setEngine(next)
        setFocus({ row, col })
    }
    const canUndo = mode === 'pvp' ? engine.moveHistory.length > 0 :
        engine.moveHistory.some(move => move.player === humanPlayer)
    const undo = () => {
        if (!canUndo) return
        const next = engine.clone()
        next.undo()
        if (mode === 'pvc') {
            while (next.currentPlayer !== humanPlayer && next.moveHistory.length) next.undo()
        }
        setEngine(next)
    }
    const moveFocus = (event, row, col) => {
        const offsets = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }
        if (!offsets[event.key]) return
        event.preventDefault()
        const [dr, dc] = offsets[event.key]
        const nextRow = Math.max(0, Math.min(engine.size - 1, row + dr))
        const nextCol = Math.max(0, Math.min(engine.size - 1, col + dc))
        setFocus({ row: nextRow, col: nextCol })
        boardRef.current?.querySelector(`[data-cell="${nextRow}-${nextCol}"]`)?.focus()
    }
    const playerName = player => player === BLACK ? 'Black' : 'White'
    const status = engine.gameOver ? (engine.winner ? `${playerName(engine.winner)} wins with five in a row.` : 'Draw. The board is full.') :
        aiTurn ? `${playerName(engine.currentPlayer)} is thinking…` :
            `${playerName(engine.currentPlayer)} to play${mode === 'pvc' ? ' · your turn' : ''}.`

    return { engine, mode, difficulty, humanPlayer, focus, boardRef, aiTurn, status, canUndo,
        restart, changeMode, changeSide, changeSize, setDifficulty, setFocus, play, undo, moveFocus, BLACK, WHITE }
}
