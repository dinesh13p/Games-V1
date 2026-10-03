import { CANVAS_WIDTH, CANVAS_HEIGHT } from './PongGame.logic'

export function renderPong(canvas, state) {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#262f2c'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    ctx.strokeStyle = '#626f61'
    ctx.setLineDash([8, 8])
    ctx.beginPath(); ctx.moveTo(CANVAS_WIDTH / 2, 0); ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#e7e1d5'
    ctx.fillRect(10, state.playerY, state.paddleWidth, state.paddleHeight)
    ctx.fillStyle = '#b8755d'
    ctx.fillRect(CANVAS_WIDTH - 20, state.aiY, state.paddleWidth, state.paddleHeight)
    ctx.fillStyle = '#e7e1d5'
    ctx.fillRect(state.ballX, state.ballY, state.ballSize, state.ballSize)
    ctx.fillStyle = '#b9b3a5'
    ctx.textAlign = 'center'
    ctx.font = '12px Courier New'
    ctx.fillText('YOU', CANVAS_WIDTH / 4, 25)
    ctx.fillText('COMPUTER', CANVAS_WIDTH * 3 / 4, 25)
}
