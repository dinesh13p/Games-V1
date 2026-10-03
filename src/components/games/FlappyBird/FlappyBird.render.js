import { WIDTH, HEIGHT, PIPE_WIDTH, PIPE_GAP, GROUND_HEIGHT, BIRD_RADIUS } from './FlappyBird.logic'

export function renderFlappy(canvas, state) {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#e7e1d5'
    ctx.fillRect(0, 0, WIDTH, HEIGHT)
    for (const pipe of state.pipes) {
        ctx.fillStyle = pipe.isGolden ? '#9b8150' : '#687454'
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY)
        ctx.fillRect(pipe.x, pipe.gapY + PIPE_GAP, PIPE_WIDTH, HEIGHT - GROUND_HEIGHT - pipe.gapY - PIPE_GAP)
        ctx.fillStyle = '#46533b'
        ctx.fillRect(pipe.x - 6, pipe.gapY - 12, PIPE_WIDTH + 12, 12)
        ctx.fillRect(pipe.x - 6, pipe.gapY + PIPE_GAP, PIPE_WIDTH + 12, 12)
        ctx.fillStyle = '#f1ecdf'
        ctx.textAlign = 'center'
        ctx.font = '14px Courier New'
        ctx.fillText(String(pipe.pipeNumber).padStart(2, '0'), pipe.x + PIPE_WIDTH / 2, 25)
        if (pipe.isGolden) {
            ctx.fillText('FINISH', pipe.x + PIPE_WIDTH / 2, 48)
        }
    }
    ctx.fillStyle = '#b9b3a5'
    ctx.fillRect(0, HEIGHT - GROUND_HEIGHT, WIDTH, GROUND_HEIGHT)
    ctx.fillStyle = '#87745a'
    ctx.fillRect(0, HEIGHT - GROUND_HEIGHT, WIDTH, 5)
    const bird = state.bird
    ctx.save(); ctx.translate(bird.x, bird.y); ctx.rotate(bird.rotation)
    ctx.fillStyle = '#b57b53'
    ctx.beginPath(); ctx.arc(0, 0, BIRD_RADIUS, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#262b25'; ctx.lineWidth = 1.5; ctx.stroke()
    ctx.fillStyle = '#a3422a'
    ctx.beginPath(); ctx.ellipse(-3, 6, 10, 4, Math.sin(bird.vy * 0.02) * 0.3, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#262b25'
    ctx.beginPath(); ctx.arc(6, -6, 3, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.moveTo(14, -2); ctx.lineTo(22, 0); ctx.lineTo(14, 4); ctx.fill()
    ctx.restore()
}
