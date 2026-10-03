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

export const createBoard = (rows, cols, mines) => {
    const total = rows * cols
    const mineSet = new Set()
    while (mineSet.size < Math.min(mines, total)) {
        mineSet.add(Math.floor(Math.random() * total))
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
        if (cell.isRevealed || cell.isFlagged) continue
        cell.isRevealed = true
        if (!cell.isMine && cell.adjacent === 0) {
            for (const [nr, nc] of neighbors(cr, cc, rows, cols)) {
                stack.push([nr, nc])
            }
        }
    }
}

export const safeFirstClick = (board, r, c, rows, cols, mines) => {
    if (!board[r][c].isMine && board[r][c].adjacent === 0) return board
    for (let tries = 0; tries < 200; tries++) {
        const fresh = createBoard(rows, cols, mines)
        if (!fresh[r][c].isMine) return fresh
    }
    return board
}