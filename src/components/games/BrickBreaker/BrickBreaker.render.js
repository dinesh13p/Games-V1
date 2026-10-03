import { CANVAS_WIDTH, CANVAS_HEIGHT, PADDLE_WIDTH, PADDLE_HEIGHT, BALL_RADIUS } from './BrickBreaker.logic'

export function renderBricks(canvas, state) {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#262f2c'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    for (const brick of state.bricks) {
        if (!brick.visible) continue
        ctx.fillStyle = brick.color
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height)
        ctx.strokeStyle = '#262f2c'
        ctx.strokeRect(brick.x + 3.5, brick.y + 3.5, brick.width - 7, brick.height - 7)
    }
    ctx.fillStyle = '#e7e1d5'
    ctx.fillRect(state.paddle.x, state.paddle.y, PADDLE_WIDTH, PADDLE_HEIGHT)
    ctx.beginPath()
    ctx.arc(state.ball.x, state.ball.y, BALL_RADIUS, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#b9b3a5'
    ctx.font = '12px Courier New'
    ctx.fillText('CLEAR THE FIELD', 12, 25)
}
