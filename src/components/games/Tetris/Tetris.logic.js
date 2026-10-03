// Tetris Game Logic

export const BOARD_WIDTH = 10
export const BOARD_HEIGHT = 20
export const CELL_SIZE = 28
export const CANVAS_WIDTH = BOARD_WIDTH * CELL_SIZE
export const CANVAS_HEIGHT = BOARD_HEIGHT * CELL_SIZE
export const EMPTY = 0

export const BASE_DROP = 800
export const LEVEL_DROP_DECREMENT = 70
export const MIN_DROP = 80
export const DAS_DELAY = 150
export const ARR_INTERVAL = 60
export const SOFT_DROP_INTERVAL = 50
export const SOFT_DROP_POINTS_PER_CELL = 1
export const HARD_DROP_POINTS_PER_CELL = 2

export const PIECES = {
    I: { shape: [[1, 1, 1, 1]], color: '#829d99' },
    O: { shape: [[1, 1], [1, 1]], color: '#c2b17e' },
    T: { shape: [[0, 1, 0], [1, 1, 1]], color: '#a49b8c' },
    S: { shape: [[0, 1, 1], [1, 1, 0]], color: '#92a478' },
    Z: { shape: [[1, 1, 0], [0, 1, 1]], color: '#b87963' },
    J: { shape: [[1, 0, 0], [1, 1, 1]], color: '#7e92a1' },
    L: { shape: [[0, 0, 1], [1, 1, 1]], color: '#bc986d' }
}

export const randPiece = () => {
    const keys = Object.keys(PIECES)
    const t = keys[Math.floor(Math.random() * keys.length)]
    return { type: t, shape: PIECES[t].shape.map(r => [...r]), color: PIECES[t].color }
}

export const rotateCW = (piece) => {
    const s = piece.shape
    const w = s[0].length
    const h = s.length
    const rotated = Array.from({ length: w }, () => Array(h).fill(0))
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            if (s[y][x]) rotated[x][h - 1 - y] = s[y][x]
        }
    }
    return { ...piece, shape: rotated }
}

export const emptyBoard = () => {
    return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(EMPTY))
}

export const copyBoard = (b) => b.map(r => [...r])

export const isValid = (board, piece, px, py) => {
    if (!piece) return false
    const s = piece.shape
    for (let y = 0; y < s.length; y++) {
        for (let x = 0; x < s[y].length; x++) {
            if (!s[y][x]) continue
            const nx = px + x
            const ny = py + y
            if (nx < 0 || nx >= BOARD_WIDTH || ny >= BOARD_HEIGHT) return false
            if (ny >= 0 && board[ny][nx]) return false
        }
    }
    return true
}

export const placePiece = (board, piece, px, py) => {
    const nb = copyBoard(board)
    const s = piece.shape
    for (let y = 0; y < s.length; y++) {
        for (let x = 0; x < s[y].length; x++) {
            if (!s[y][x]) continue
            const nx = px + x
            const ny = py + y
            if (ny >= 0 && ny < BOARD_HEIGHT) nb[ny][nx] = piece.color
        }
    }
    return nb
}

export const clearLines = (board) => {
    const newBoard = board.filter(row => row.some(c => !c))
    const cleared = BOARD_HEIGHT - newBoard.length
    while (newBoard.length < BOARD_HEIGHT) {
        newBoard.unshift(Array(BOARD_WIDTH).fill(EMPTY))
    }
    return { board: newBoard, cleared }
}

export const getGhostY = (board, piece, px, py) => {
    let gy = py
    while (isValid(board, piece, px, gy + 1)) gy++
    return gy
}

export const dropTimeForLevel = (level) => {
    return Math.max(MIN_DROP, BASE_DROP - (level - 1) * LEVEL_DROP_DECREMENT)
}

export const HS_KEY = "tetris_highscore_v1"

export const getLineScores = () => [0, 40, 100, 300, 1200]

export const createTetrisState = (now = 0) => ({
    board: emptyBoard(), current: null, next: null, hold: null,
    holdUsed: false, px: 0, py: -2, score: 0, lines: 0, level: 1,
    dropTimer: dropTimeForLevel(1), lastDrop: now, lastSoftDrop: now, phase: 'ready'
})

export const startTetris = (now = 0) => {
    const current = randPiece()
    return { ...createTetrisState(now), current, next: randPiece(),
        px: Math.floor((BOARD_WIDTH - current.shape[0].length) / 2), phase: 'playing' }
}

export const spawnTetris = state => {
    const current = state.next || randPiece()
    const next = { ...state, current, next: randPiece(), holdUsed: false,
        px: Math.floor((BOARD_WIDTH - current.shape[0].length) / 2), py: -2 }
    if (!isValid(next.board, current, next.px, next.py)) next.phase = 'over'
    return next
}

export const lockTetris = (state, now) => {
    // Cells above the visible board cannot be silently discarded on lock.
    const toppedOut = state.current.shape.some((row, y) => row.some(cell => cell && state.py + y < 0))
    if (toppedOut) return { ...state, phase: 'over' }
    const placed = placePiece(state.board, state.current, state.px, state.py)
    const { board, cleared } = clearLines(placed)
    const lines = state.lines + cleared
    const level = Math.floor(lines / 10) + 1
    return spawnTetris({ ...state, board, lines, level,
        score: state.score + getLineScores()[cleared] * state.level,
        dropTimer: dropTimeForLevel(level), lastDrop: now })
}

export const moveTetris = (state, dx) => {
    if (state.phase !== 'playing' || !state.current) return state
    return isValid(state.board, state.current, state.px + dx, state.py) ? { ...state, px: state.px + dx } : state
}

export const rotateTetris = state => {
    if (state.phase !== 'playing' || !state.current) return state
    const current = rotateCW(state.current)
    for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [0, -1]]) {
        if (isValid(state.board, current, state.px + dx, state.py + dy)) return { ...state, current, px: state.px + dx, py: state.py + dy }
    }
    return state
}

export const dropTetris = (state, now, hard = false, soft = true) => {
    if (state.phase !== 'playing' || !state.current) return state
    if (hard) {
        const py = getGhostY(state.board, state.current, state.px, state.py)
        return lockTetris({ ...state, py, score: state.score + (py - state.py) * HARD_DROP_POINTS_PER_CELL }, now)
    }
    if (isValid(state.board, state.current, state.px, state.py + 1)) {
        return { ...state, py: state.py + 1, score: state.score + (soft ? SOFT_DROP_POINTS_PER_CELL : 0) }
    }
    return lockTetris(state, now)
}

export const holdTetris = (state, now) => {
    if (state.phase !== 'playing' || state.holdUsed || !state.current) return state
    let next
    if (!state.hold) next = spawnTetris({ ...state, hold: { ...state.current } })
    else {
        const current = { ...state.hold }
        next = { ...state, current, hold: { ...state.current }, px: Math.floor((BOARD_WIDTH - current.shape[0].length) / 2), py: -2 }
        if (!isValid(next.board, current, next.px, next.py)) next.phase = 'over'
    }
    return { ...next, holdUsed: true, lastDrop: now }
}

export const advanceTetris = (state, now, downHeld) => {
    if (state.phase !== 'playing') return state
    let next = state
    if (downHeld && now - next.lastSoftDrop >= SOFT_DROP_INTERVAL) {
        next = { ...dropTetris(next, now), lastSoftDrop: now }
    }
    if (next.phase === 'playing' && now - next.lastDrop >= next.dropTimer) {
        next = { ...dropTetris(next, now, false, false), lastDrop: now }
    }
    return next
}
