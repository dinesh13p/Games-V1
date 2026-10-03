import { useEffect, useRef, useState } from 'react'
import { BaghChalEngine, GOAT, TIGER } from './BaghChalGame.logic.js'

export function useBaghChal() {
    const [engine, setEngine] = useState(() => new BaghChalEngine())
    const [mode, setMode] = useState('pvc')
    const [role, setRole] = useState('goat')
    const [difficulty, setDifficulty] = useState('medium')
    const [selected, setSelected] = useState(null)
    const [focus, setFocus] = useState(12)
    const boardRef = useRef(null)
    const aiTurn = mode === 'pvc' && !engine.gameOver && engine.currentPlayer !== role
    const legalMoves = engine.getLegalMoves()
    const destinations = new Set((selected !== null ? legalMoves.filter(move => move.from === selected) :
        legalMoves.filter(move => move.type === 'place')).map(move => move.to))

    useEffect(() => {
        if (!aiTurn) return undefined
        let cancelled = false
        const timer = setTimeout(() => {
            const move = engine.chooseAIMove(difficulty)
            if (cancelled || !move) return
            setEngine(current => {
                if (current !== engine) return current
                const next = current.clone()
                next.applyMove(move)
                return next
            })
            setSelected(null)
        }, 350)
        return () => { cancelled = true; clearTimeout(timer) }
    }, [engine, aiTurn, difficulty])

    const restart = () => { setEngine(new BaghChalEngine()); setSelected(null) }
    const changeMode = value => { setMode(value); restart() }
    const changeRole = value => { setRole(value); restart() }
    const play = position => {
        if (aiTurn || engine.gameOver) return
        setFocus(position)
        const move = legalMoves.find(candidate => candidate.to === position &&
            (candidate.type === 'place' || candidate.from === selected))
        if (move) {
            const next = engine.clone()
            next.applyMove(move)
            setEngine(next)
            setSelected(null)
            return
        }
        const ownPiece = engine.currentPlayer === 'tiger' ? TIGER : GOAT
        if (engine.board[position] === ownPiece && legalMoves.some(candidate => candidate.from === position)) {
            setSelected(current => current === position ? null : position)
        } else setSelected(null)
    }
    const canUndo = mode === 'pvp' ? engine.moveHistory.length > 0 : engine.moveHistory.some(move => move.player === role)
    const undo = () => {
        if (!canUndo) return
        const next = engine.clone()
        next.undo()
        if (mode === 'pvc') while (next.currentPlayer !== role && next.moveHistory.length) next.undo()
        setEngine(next)
        setSelected(null)
    }
    const moveFocus = (event, position) => {
        if (event.key === 'Escape') { setSelected(null); return }
        const offsets = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }
        if (!offsets[event.key]) return
        event.preventDefault()
        const [dr, dc] = offsets[event.key]
        const row = Math.max(0, Math.min(4, Math.floor(position / 5) + dr))
        const col = Math.max(0, Math.min(4, position % 5 + dc))
        const next = row * 5 + col
        setFocus(next)
        boardRef.current?.querySelector(`[data-position="${next}"]`)?.focus()
    }
    const resultText = {
        captured_goats: 'Tigers win. Five goats captured.',
        tigers_blocked: 'Goats win. All four tigers are trapped.',
        goats_blocked: 'Tigers win. The goats have no legal move.',
        repetition: 'Draw. The same position occurred three times.',
    }
    const turnName = engine.currentPlayer === 'goat' ? 'Goats' : 'Tigers'
    const status = engine.gameOver ? resultText[engine.reason] : aiTurn ? `${turnName} are thinking…` :
        engine.currentPlayer === 'goat' && engine.gamePhase === 'placement' ? `Goats: place goat ${engine.goatsPlaced + 1} of 20.` :
            selected !== null ? `${turnName}: choose a marked destination.` : `${turnName}: select a piece to move.`
    return { engine, mode, role, difficulty, selected, focus, boardRef, aiTurn, legalMoves, destinations, canUndo, status,
        restart, changeMode, changeRole, setDifficulty, play, undo, moveFocus, setFocus }
}
