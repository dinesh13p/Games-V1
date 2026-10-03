import { CANVAS_WIDTH, CANVAS_HEIGHT, BOW_X, BOW_Y, TARGET_SIZE, TARGET_TYPES } from './ArcheryGame.logic'

export function renderArchery(canvas, state) {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#e7e1d5'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    ctx.fillStyle = '#b9bea9'
    ctx.fillRect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50)
    ctx.strokeStyle = '#626557'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(0, CANVAS_HEIGHT - 50); ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 50); ctx.stroke()
    const angle = state.bowAngle
    ctx.strokeStyle = '#87745a'
    ctx.lineWidth = 8
    ctx.beginPath(); ctx.arc(BOW_X, BOW_Y, 40, angle - Math.PI / 3, angle + Math.PI / 3); ctx.stroke()
    ctx.strokeStyle = '#262b25'
    ctx.lineWidth = 2
    const offset = state.power * 0.3
    ctx.beginPath()
    ctx.moveTo(BOW_X + Math.cos(angle - Math.PI / 3) * 40, BOW_Y + Math.sin(angle - Math.PI / 3) * 40)
    ctx.lineTo(BOW_X - Math.cos(angle) * offset, BOW_Y - Math.sin(angle) * offset)
    ctx.lineTo(BOW_X + Math.cos(angle + Math.PI / 3) * 40, BOW_Y + Math.sin(angle + Math.PI / 3) * 40)
    ctx.stroke()
    if (state.chargeAt !== null) {
        ctx.strokeStyle = '#a3422a'
        ctx.setLineDash([5, 5])
        ctx.beginPath(); ctx.moveTo(BOW_X + 50, BOW_Y)
        ctx.lineTo(BOW_X + 50 + Math.cos(angle) * 180, BOW_Y + Math.sin(angle) * 180)
        ctx.stroke(); ctx.setLineDash([])
    }
    for (const target of state.targets) {
        if (target.hit) continue
        const info = TARGET_TYPES[target.type], size = TARGET_SIZE * info.size
        ctx.fillStyle = '#87745a'
        ctx.fillRect(target.x - 2, target.y + size / 2, 4, 30)
        for (const [radius, color] of [[size / 2, '#f1ecdf'], [size / 3, info.color], [size / 6, '#f1ecdf']]) {
            ctx.fillStyle = color
            ctx.beginPath(); ctx.arc(target.x, target.y, radius, 0, Math.PI * 2); ctx.fill()
        }
        ctx.strokeStyle = '#626557'; ctx.lineWidth = 1
        ctx.beginPath(); ctx.arc(target.x, target.y, size / 2, 0, Math.PI * 2); ctx.stroke()
    }
    ctx.strokeStyle = '#262b25'; ctx.lineWidth = 3
    for (const enemy of state.enemies) {
        if (enemy.hit) continue
        const { x, y } = enemy
        ctx.beginPath(); ctx.arc(x, y - 30, 8, 0, Math.PI * 2); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(x, y - 22); ctx.lineTo(x, y - 5)
        ctx.moveTo(x - 10, y - 15); ctx.lineTo(x + 10, y - 15)
        ctx.moveTo(x, y - 5); ctx.lineTo(x - 8, y + 5)
        ctx.moveTo(x, y - 5); ctx.lineTo(x + 8, y + 5); ctx.stroke()
    }
    for (const arrow of state.arrows) {
        ctx.save(); ctx.translate(arrow.x, arrow.y); ctx.rotate(arrow.angle)
        ctx.strokeStyle = '#626557'; ctx.lineWidth = 3
        ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(15, 0); ctx.stroke()
        ctx.fillStyle = '#262b25'
        ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(10, -3); ctx.lineTo(10, 3); ctx.fill()
        ctx.fillStyle = '#a3422a'; ctx.fillRect(-15, -2, 6, 4)
        ctx.restore()
    }
    for (const particle of state.particles) {
        ctx.fillStyle = particle.color; ctx.globalAlpha = particle.life / 30
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size)
    }
    ctx.globalAlpha = 1
}
