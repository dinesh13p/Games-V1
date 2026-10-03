// A shallow orthographic projection of extruded polygons. The floor is the
// original collision plane; a maximum 4px Z depth shifts a sprite at most 2.6px.
export const projectInvaderPoint = (x, y, z = 0) => [x + z * 0.45, y - z * 0.65]

function polygon(ctx, points, color) {
    ctx.beginPath()
    points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y))
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
}

function extrusion(ctx, points, depth, colors) {
    const front = points.map(([x, y]) => projectInvaderPoint(x, y, depth))
    if (depth) points.forEach((point, index) => {
        const next = (index + 1) % points.length
        const dx = points[next][0] - point[0], dy = points[next][1] - point[1]
        if (-dx * 0.65 - dy * 0.45 <= 0) return
        polygon(ctx, [point, points[next], front[next], front[index]], index % 2 ? colors[1] : colors[2])
    })
    polygon(ctx, front, colors[0])
}

const LARGE = [[2, 0], [3, 0], [3, 1], [7, 1], [7, 0], [8, 0], [8, 2], [9, 2], [9, 3], [10, 3], [10, 6], [9, 6], [9, 4], [8, 4], [8, 6], [7, 6], [7, 7], [5.5, 7], [5.5, 6], [4.5, 6], [4.5, 7], [3, 7], [3, 6], [2, 6], [2, 4], [1, 4], [1, 6], [0, 6], [0, 3], [1, 3], [1, 2], [2, 2]]
const SMALL = [[4, 0], [6, 0], [6, 1], [7, 1], [7, 2], [8, 2], [8, 3], [9, 3], [9, 5], [8, 5], [8, 6], [9, 6], [9, 7], [7, 7], [7, 6], [6, 6], [6, 5], [4, 5], [4, 6], [3, 6], [3, 7], [1, 7], [1, 6], [2, 6], [2, 5], [1, 5], [1, 3], [2, 3], [2, 2], [3, 2], [3, 1], [4, 1]]
const STARS = [[23, 120], [151, 38], [331, 28], [572, 165], [48, 478], [387, 493], [212, 467], [552, 473], [84, 22], [474, 44], [306, 590], [558, 586]]

export function drawSpaceInvaders(canvas, state, flat) {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, 600, 600)
    ctx.fillStyle = '#202c2d'
    ctx.fillRect(0, 0, 600, 600)
    ctx.strokeStyle = '#4b5853'
    ctx.lineWidth = 1
    STARS.forEach(([x, y]) => {
        ctx.beginPath(); ctx.moveTo(x - 1.5, y); ctx.lineTo(x + 1.5, y); ctx.moveTo(x, y - 1.5); ctx.lineTo(x, y + 1.5); ctx.stroke()
    })
    ctx.strokeStyle = '#647364'
    ctx.beginPath(); ctx.moveTo(12, 578); ctx.lineTo(588, 578); ctx.stroke()
    for (let x = 12; x <= 588; x += 48) {
        ctx.beginPath(); ctx.moveTo(x, 578); ctx.lineTo(x, 583); ctx.stroke()
    }
    const depth = flat ? 0 : 4
    const legFrame = !flat && Math.floor(state.time / 330) % 2
    state.enemies.forEach(enemy => {
        if (!enemy.alive) return
        const shape = enemy.type === 'small' ? SMALL : LARGE
        const points = shape.map(([x, y]) => [enemy.x + x / 10 * enemy.width, enemy.y + (legFrame && y >= 6 ? y - 0.55 : y) / 7 * enemy.height])
        const colors = enemy.type === 'small' ? ['#c6a469', '#735838', '#987747'] : ['#b77359', '#653f32', '#8b503d']
        extrusion(ctx, points, depth, colors)
        const [eyeX, eyeY] = projectInvaderPoint(enemy.x, enemy.y, depth)
        ctx.fillStyle = '#202c2d'
        ctx.fillRect(eyeX + enemy.width * 0.27, eyeY + enemy.height * 0.38, 4, 3)
        ctx.fillRect(eyeX + enemy.width * 0.6, eyeY + enemy.height * 0.38, 4, 3)
    })

    const player = state.player
    const x = player.x, y = player.y, w = player.width, h = player.height
    const ship = [[x, y + h], [x, y + h * 0.45], [x + w * 0.15, y + h * 0.45], [x + w * 0.15, y], [x + w * 0.425, y], [x + w * 0.425, y - 10], [x + w * 0.575, y - 10], [x + w * 0.575, y], [x + w * 0.85, y], [x + w * 0.85, y + h * 0.45], [x + w, y + h * 0.45], [x + w, y + h]]
    extrusion(ctx, ship, depth, player.invincible ? ['#e3d7af', '#777052', '#a69e73'] : ['#b1c095', '#495842', '#748163'])
    const [cockpitX, cockpitY] = projectInvaderPoint(x + 15, y + 4, depth)
    ctx.fillStyle = '#34423b'
    ctx.fillRect(cockpitX, cockpitY, 10, 5)
    if (player.invincible) {
        ctx.strokeStyle = '#e3d7af'
        ctx.strokeRect(x - 5, y - 14, w + 10, h + 20)
    }

    const drawBullet = (bullet, colors) => extrusion(ctx, [[bullet.x, bullet.y], [bullet.x + bullet.width, bullet.y], [bullet.x + bullet.width, bullet.y + bullet.height], [bullet.x, bullet.y + bullet.height]], depth, colors)
    state.bullets.forEach(bullet => drawBullet(bullet, ['#e2d2a2', '#92825b', '#bcaa7b']))
    state.enemyBullets.forEach(bullet => drawBullet(bullet, ['#d49475', '#734939', '#a76951']))

    if (state.status === 'paused' || state.status === 'won' || state.status === 'lost') {
        ctx.fillStyle = '#202c2d'
        ctx.fillRect(140, 246, 320, 96)
        ctx.strokeStyle = '#b4bea3'
        ctx.strokeRect(140, 246, 320, 96)
        ctx.textAlign = 'center'
        ctx.fillStyle = '#e7e1d5'
        ctx.font = '26px Georgia, serif'
        ctx.fillText(state.status === 'paused' ? 'Paused' : state.status === 'won' ? 'Sector clear' : 'Defence lost', 300, 286)
        ctx.font = '12px "Courier New", monospace'
        ctx.fillText(state.status === 'paused' ? 'ESC TO RESUME' : 'SPACE TO PLAY AGAIN', 300, 317)
        ctx.textAlign = 'left'
    }
}
