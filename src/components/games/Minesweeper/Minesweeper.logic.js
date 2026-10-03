// Minesweeper Game Logic

export const DIFFICULTIES = {
    Beginner: { rows: 9, cols: 9, mines: 10 },
    Intermediate: { rows: 16, cols: 16, mines: 40 },
    Expert: { rows: 16, cols: 30, mines: 99 }
}

export const make2D = (rows, cols, fn) => {
    return Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => fn(r, c))
    )
}

export const neighbors = (r, c, rows, cols) => {
    const dirs = [-1, 0, 1]
    const list = []
    for (const dr of dirs) {
        for (const dc of dirs) {
            if (dr === 0 && dc === 0) continue
            const nr = r + dr
            const nc = c + dc
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) list.push([nr, nc])
        }
    }
    return list
}

export const createBoard = (rows, cols, mines, random = Math.random, excluded = []) => {
    const total = rows * cols
    const exclusions = new Set(excluded.map(([r, c]) => r * cols + c))
    const candidates = Array.from({ length: total }, (_, index) => index).filter(index => !exclusions.has(index))
    const mineSet = new Set()
    // Sampling without replacement is bounded, even with a constant random source.
    for (let count = 0; count < Math.min(mines, candidates.length); count++) {
        const index = count + Math.min(candidates.length - count - 1, Math.floor(random() * (candidates.length - count)))
        ;[candidates[count], candidates[index]] = [candidates[index], candidates[count]]
        mineSet.add(candidates[count])
    }

    const board = make2D(rows, cols, (r, c) => ({
        r,
        c,
        isMine: mineSet.has(r * cols + c),
        isRevealed: false,
        isFlagged: false,
        adjacent: 0
    }))

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c].isMine) continue
            let cnt = 0
            for (const [nr, nc] of neighbors(r, c, rows, cols)) {
                if (board[nr][nc].isMine) cnt++
            }
            board[r][c].adjacent = cnt
        }
    }
    return board
}

export const floodReveal = (board, r, c) => {
    const rows = board.length
    const cols = board[0].length
    const stack = [[r, c]]
    const seen = new Set()
    while (stack.length) {
        const [cr, cc] = stack.pop()
        const key = cr + ',' + cc
        if (seen.has(key)) continue
        seen.add(key)
        const cell = board[cr][cc]
        if (cell.isRevealed || cell.isFlagged || cell.isMine) continue
        cell.isRevealed = true
        if (!cell.isMine && cell.adjacent === 0) {
            for (const [nr, nc] of neighbors(cr, cc, rows, cols)) {
                stack.push([nr, nc])
            }
        }
    }
}

export const safeFirstClick = (board, r, c, rows, cols, mines, random = Math.random) => {
    if (!board[r][c].isMine && board[r][c].adjacent === 0) return board
    const opening = [[r, c], ...neighbors(r, c, rows, cols)]
    const excluded = rows * cols - opening.length >= mines ? opening : [[r, c]]
    const fresh = createBoard(rows, cols, mines, random, excluded)
    for (const row of fresh) {
        for (const cell of row) cell.isFlagged = board[cell.r][cell.c].isFlagged
    }
    return fresh
}

export const createMinesweeperState = (difficulty = 'Beginner', random = Math.random) => {
    const cfg = DIFFICULTIES[difficulty]
    return {
        difficulty,
        board: createBoard(cfg.rows, cfg.cols, cfg.mines, random),
        status: 'ready',
        flagMode: false,
        elapsed: 0,
        exploded: null,
    }
}

const cloneBoard = board => board.map(row => row.map(cell => ({ ...cell })))
const isFinished = state => state.status === 'won' || state.status === 'lost'

export const revealCell = (state, r, c, random = Math.random) => {
    const target = state.board[r]?.[c]
    if (!target || target.isRevealed || target.isFlagged || isFinished(state)) return state
    const cfg = DIFFICULTIES[state.difficulty]
    let board = cloneBoard(state.board)
    if (state.status === 'ready') board = safeFirstClick(board, r, c, cfg.rows, cfg.cols, cfg.mines, random)
    if (board[r][c].isMine) {
        for (const cell of board.flat()) if (cell.isMine) cell.isRevealed = true
        return { ...state, board, status: 'lost', exploded: [r, c] }
    }
    floodReveal(board, r, c)
    const won = board.flat().every(cell => cell.isMine || cell.isRevealed)
    if (won) for (const cell of board.flat()) if (cell.isMine) cell.isFlagged = true
    return { ...state, board, status: won ? 'won' : 'running' }
}

export const toggleFlag = (state, r, c) => {
    const target = state.board[r]?.[c]
    if (!target || target.isRevealed || isFinished(state)) return state
    const board = cloneBoard(state.board)
    board[r][c].isFlagged = !board[r][c].isFlagged
    return { ...state, board }
}

export const minesweeperReducer = (state, action) => {
    switch (action.type) {
        case 'restart': return createMinesweeperState(state.difficulty, action.random)
        case 'difficulty': return DIFFICULTIES[action.difficulty]
            ? createMinesweeperState(action.difficulty, action.random) : state
        case 'flagMode': return { ...state, flagMode: !state.flagMode }
        case 'flag': return toggleFlag(state, action.r, action.c)
        case 'reveal': return revealCell(state, action.r, action.c, action.random)
        case 'activate': return state.flagMode
            ? toggleFlag(state, action.r, action.c) : revealCell(state, action.r, action.c, action.random)
        case 'tick': return state.status === 'running' ? { ...state, elapsed: state.elapsed + 1 } : state
        default: return state
    }
}

export const describeCell = (cell, status) => {
    const position = `Row ${cell.r + 1}, column ${cell.c + 1}`
    if (cell.isRevealed) return `${position}, ${cell.isMine ? 'mine' : cell.adjacent ? `${cell.adjacent} adjacent mines` : 'clear'}`
    if (cell.isFlagged) return `${position}, ${status === 'lost' && !cell.isMine ? 'incorrect flag' : 'flagged'}`
    return `${position}, covered`
}
