import { CANVAS_WIDTH, CANVAS_HEIGHT, CELL_SIZE, BOARD_WIDTH, BOARD_HEIGHT, getGhostY } from './Tetris.logic'

export function renderTetris(canvas, state) {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#26312c'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    const drawCell = (x, y, color, outline = false) => {
        if (y < 0) return
        const px = x * CELL_SIZE, py = y * CELL_SIZE
        if (outline) {
            ctx.strokeStyle = '#b9b3a5'
            ctx.lineWidth = 1
            ctx.strokeRect(px + 3.5, py + 3.5, CELL_SIZE - 7, CELL_SIZE - 7)
        } else {
            ctx.fillStyle = color
            ctx.fillRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2)
            ctx.strokeStyle = '#26312c'
            ctx.strokeRect(px + 4.5, py + 4.5, CELL_SIZE - 9, CELL_SIZE - 9)
        }
    }
    ctx.strokeStyle = '#3b463c'
    ctx.lineWidth = 1
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            ctx.strokeRect(x * CELL_SIZE + 0.5, y * CELL_SIZE + 0.5, CELL_SIZE, CELL_SIZE)
        }
    }
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            if (state.board[y][x]) drawCell(x, y, state.board[y][x])
        }
    }
    if (!state.current) return
    const ghostY = getGhostY(state.board, state.current, state.px, state.py)
    state.current.shape.forEach((row, y) => row.forEach((cell, x) => {
        if (!cell) return
        if (state.phase === 'playing') drawCell(state.px + x, ghostY + y, state.current.color, true)
        drawCell(state.px + x, state.py + y, state.current.color)
    }))
}
