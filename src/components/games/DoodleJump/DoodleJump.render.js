import { CANVAS_WIDTH, CANVAS_HEIGHT, DOODLER_WIDTH, DOODLER_HEIGHT } from './DoodleJump.logic'

export function renderDoodle(canvas, state) {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#e7e1d5'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    ctx.save()
    ctx.translate(0, -state.cameraY)
    for (const platform of state.platforms) {
        if (platform.y < state.cameraY - 50 || platform.y > state.cameraY + CANVAS_HEIGHT + 50) continue
        ctx.fillStyle = platform.type === 'spiked' ? '#a3422a' : platform.type === 'green' ? '#46533b' : '#87745a'
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
        if (platform.type === 'spiked') {
            for (let i = 0; i < 6; i++) {
                const x = platform.x + platform.width / 6 * i + platform.width / 12
                ctx.beginPath()
                ctx.moveTo(x - 6, platform.y)
                ctx.lineTo(x, platform.y - 8)
                ctx.lineTo(x + 6, platform.y)
                ctx.fill()
            }
        } else if (platform.type === 'green') {
            ctx.fillStyle = '#f1ecdf'
            ctx.font = 'bold 13px Courier New'
            ctx.textAlign = 'center'
            ctx.fillText('↑ ↑', platform.x + platform.width / 2, platform.y + 12)
        }
    }
    for (const object of state.fallingObjects) {
        ctx.fillStyle = '#626557'
        ctx.fillRect(object.x, object.y, object.width, object.height)
        ctx.strokeStyle = '#f1ecdf'
        ctx.beginPath()
        ctx.moveTo(object.x + 6, object.y + 6)
        ctx.lineTo(object.x + 18, object.y + 18)
        ctx.moveTo(object.x + 18, object.y + 6)
        ctx.lineTo(object.x + 6, object.y + 18)
        ctx.stroke()
    }
    const doodler = state.doodler
    ctx.fillStyle = doodler.flying ? '#9b8150' : '#728060'
    ctx.fillRect(doodler.x, doodler.y, DOODLER_WIDTH, DOODLER_HEIGHT)
    ctx.strokeStyle = '#262b25'
    ctx.lineWidth = 2
    ctx.strokeRect(doodler.x, doodler.y, DOODLER_WIDTH, DOODLER_HEIGHT)
    ctx.fillStyle = '#262b25'
    const eyeOffset = doodler.facingRight ? 2 : 0
    ctx.fillRect(doodler.x + 10 + eyeOffset, doodler.y + 12, 10, 10)
    ctx.fillRect(doodler.x + 36 + eyeOffset, doodler.y + 12, 10, 10)
    ctx.beginPath()
    ctx.arc(doodler.x + 30, doodler.y + 40, 10, 0, Math.PI)
    ctx.stroke()
    ctx.fillRect(doodler.x + 15, doodler.y + DOODLER_HEIGHT, 8, 8)
    ctx.fillRect(doodler.x + 37, doodler.y + DOODLER_HEIGHT, 8, 8)
    ctx.restore()
}
