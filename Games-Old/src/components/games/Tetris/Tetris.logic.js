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
    I: { shape: [[1, 1, 1, 1]], color: "#00f5ff" },
    O: { shape: [[1, 1], [1, 1]], color: "#f7e733" },
    T: { shape: [[0, 1, 0], [1, 1, 1]], color: "#a57cff" },
    S: { shape: [[0, 1, 1], [1, 1, 0]], color: "#48df57" },
    Z: { shape: [[1, 1, 0], [0, 1, 1]], color: "#ff6b6b" },
    J: { shape: [[1, 0, 0], [1, 1, 1]], color: "#3b82f6" },
    L: { shape: [[0, 0, 1], [1, 1, 1]], color: "#f59e0b" }
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
    const rotated = Array.from({ length: w }, (_, r) => Array(h).fill(0))
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

export const loadHighScore = () => {
    const v = localStorage.getItem(HS_KEY)
    return v ? parseInt(v, 10) || 0 : 0
}

export const saveHighScore = (v) => {
    localStorage.setItem(HS_KEY, String(v || 0))
}

export const getLineScores = () => [0, 40, 100, 300, 1200]