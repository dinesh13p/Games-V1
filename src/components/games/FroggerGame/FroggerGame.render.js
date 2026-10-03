import { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE, ROWS } from './FroggerGame.logic'

export function renderFrogger(canvas, state) {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const evening = state.completions % 2 === 1
    ctx.fillStyle = evening ? '#303c32' : '#858e72'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    ctx.fillStyle = evening ? '#303f47' : '#667c80'
    ctx.fillRect(0, GRID_SIZE, CANVAS_WIDTH, GRID_SIZE * 2)
    ctx.fillStyle = evening ? '#262b25' : '#4a4c43'
    ctx.fillRect(0, GRID_SIZE * 3, CANVAS_WIDTH, GRID_SIZE * 3)
    ctx.fillRect(0, GRID_SIZE * 7, CANVAS_WIDTH, GRID_SIZE * 3)
    ctx.strokeStyle = '#929485'
    ctx.setLineDash([10, 12])
    for (let row = 1; row < ROWS; row++) {
        ctx.beginPath(); ctx.moveTo(0, row * GRID_SIZE); ctx.lineTo(CANVAS_WIDTH, row * GRID_SIZE); ctx.stroke()
    }
    ctx.setLineDash([])
    for (const log of state.logs) {
        const x = log.x * GRID_SIZE, y = log.y * GRID_SIZE, width = log.width * GRID_SIZE
        ctx.fillStyle = '#b29a75'
        ctx.fillRect(x, y, width, GRID_SIZE)
        ctx.strokeStyle = '#74634b'
        ctx.strokeRect(x + 5, y + 10, width - 10, GRID_SIZE - 20)
    }
    for (const car of state.cars) {
        const x = car.x * GRID_SIZE, y = car.y * GRID_SIZE
        ctx.fillStyle = '#bb735a'
        ctx.fillRect(x, y + 10, GRID_SIZE, GRID_SIZE - 20)
        ctx.fillStyle = '#262b25'
        ctx.fillRect(x + 10, y + 15, 10, 10)
        ctx.fillRect(x + 30, y + 15, 10, 10)
    }
    const x = state.frogX * GRID_SIZE + 10, y = state.frogY * GRID_SIZE + 10
    ctx.fillStyle = '#e7e1d5'
    ctx.fillRect(x, y, GRID_SIZE - 20, GRID_SIZE - 20)
    ctx.strokeStyle = '#262b25'
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, GRID_SIZE - 20, GRID_SIZE - 20)
    ctx.fillStyle = '#262b25'
    ctx.fillRect(x + 5, y + 5, 8, 8)
    ctx.fillRect(x + 17, y + 5, 8, 8)
    ctx.fillStyle = '#f1ecdf'
    ctx.font = '13px Courier New'
    ctx.textAlign = 'center'
    ctx.fillText('HOME', CANVAS_WIDTH / 2, 30)
    ctx.lineWidth = 1
}
