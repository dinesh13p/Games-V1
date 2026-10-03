// Orthographic oblique projection. X/Y remain the logical maze coordinates;
// only Z projects onto the screen, so the camera never drifts during play.
export const projectMazePoint = (x, y, z = 0) => [x + z * 0.42, y - z * 0.72]

function polygon(ctx, points, color) {
    ctx.fillStyle = color
    ctx.beginPath()
    points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y))
    ctx.closePath()
    ctx.fill()
}

function prism(ctx, points, depth, top, side, edge) {
    const upper = points.map(([x, y]) => projectMazePoint(x, y, depth))
    if (depth) points.forEach((point, index) => {
        const next = (index + 1) % points.length
        // Cull back-facing side walls; a static camera needs only two sides.
        const dx = points[next][0] - point[0], dy = points[next][1] - point[1]
        if ((-dx * 0.72 - dy * 0.42) * depth <= 0) return
        polygon(ctx, [point, points[next], upper[next], upper[index]], index % 2 ? side : edge)
    })
    polygon(ctx, upper, top)
}

function circlePoints(x, y, radius, segments = 16) {
    return Array.from({ length: segments }, (_, i) => {
        const angle = i / segments * Math.PI * 2
        return [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius]
    })
}

const GHOST_COLORS = { red: '#b45a43', pink: '#c8917f', cyan: '#86a9a2', orange: '#c29050', green: '#8c9e6d' }

export function drawPacman(canvas, state, flat, time) {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const size = canvas.width, margin = 22
    const cell = (size - margin * 2) / state.maze.length
    const depth = flat ? 0 : cell * 0.24
    ctx.clearRect(0, 0, size, size)
    ctx.fillStyle = '#1e2b28'
    ctx.fillRect(0, 0, size, size)
    ctx.save()
    ctx.translate(margin, margin)
    const boardSize = size - margin * 2
    prism(ctx, [[0, 0], [boardSize, 0], [boardSize, boardSize], [0, boardSize]], flat ? 0 : -8, '#25362f', '#15211d', '#16241f')
    ctx.fillStyle = '#1a2722'
    ctx.fillRect(0, 0, boardSize, boardSize)

    state.maze.forEach((row, y) => row.forEach((type, x) => {
        const left = x * cell, top = y * cell, cx = left + cell / 2, cy = top + cell / 2
        if (type === 'W') {
            const inset = cell * 0.045
            prism(ctx, [[left + inset, top + inset], [left + cell - inset, top + inset], [left + cell - inset, top + cell - inset], [left + inset, top + cell - inset]], depth, '#526b59', '#293e33', '#344d3b')
            ctx.strokeStyle = '#72876b'
            ctx.lineWidth = 0.6
            const [px, py] = projectMazePoint(left + inset, top + inset, depth)
            ctx.beginPath(); ctx.moveTo(px, py + cell * 0.8); ctx.lineTo(px, py); ctx.lineTo(px + cell * 0.8, py); ctx.stroke()
        } else if (type === 'P') {
            prism(ctx, circlePoints(cx, cy, cell * 0.06, 8), flat ? 0 : cell * 0.07, '#e3d8b7', '#9e9475', '#b5aa8b')
        } else if (type === 'O') {
            const lift = flat ? 0 : cell * (0.15 + Math.sin(time / 300) * 0.035)
            prism(ctx, circlePoints(cx, cy, cell * 0.16, 8), lift, '#ddbd66', '#8b753b', '#b79b50')
            ctx.strokeStyle = '#d5ca9c'
            ctx.lineWidth = 1
            ctx.strokeRect(cx - cell * 0.25, cy - cell * 0.25, cell * 0.5, cell * 0.5)
        }
    }))

    state.ghosts.forEach(ghost => {
        const cx = (ghost.x + 0.5) * cell, cy = (ghost.y + 0.5) * cell, radius = cell * 0.34
        const points = []
        for (let i = 0; i <= 8; i++) {
            const angle = Math.PI + i / 8 * Math.PI
            points.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius])
        }
        const step = flat ? 0 : Math.sin(time / 130) * cell * 0.025
        points.push([cx + radius, cy + radius], [cx + radius * 0.55, cy + radius * 0.65 + step], [cx + radius * 0.15, cy + radius], [cx - radius * 0.25, cy + radius * 0.65 - step], [cx - radius * 0.65, cy + radius], [cx - radius, cy + radius * 0.65])
        const frightened = state.powerTimer > 0
        prism(ctx, points, depth, frightened ? '#b2bfa6' : GHOST_COLORS[ghost.color], '#654332', '#805840')
        const [eyeX, eyeY] = projectMazePoint(cx, cy - cell * 0.035, depth)
        ctx.fillStyle = '#eee6cd'
        ctx.fillRect(eyeX - cell * 0.22, eyeY - cell * 0.07, cell * 0.15, cell * 0.18)
        ctx.fillRect(eyeX + cell * 0.07, eyeY - cell * 0.07, cell * 0.15, cell * 0.18)
        ctx.fillStyle = '#233128'
        const gazeX = ghost.direction.dx * cell * 0.025, gazeY = ghost.direction.dy * cell * 0.025
        ctx.fillRect(eyeX - cell * 0.18 + gazeX, eyeY + gazeY, cell * 0.065, cell * 0.085)
        ctx.fillRect(eyeX + cell * 0.11 + gazeX, eyeY + gazeY, cell * 0.065, cell * 0.085)
    })

    const cx = (state.pacman.x + 0.5) * cell, cy = (state.pacman.y + 0.5) * cell
    const facing = Math.atan2(state.lastDirection.dy, state.lastDirection.dx)
    const mouth = flat ? 0.3 : 0.16 + (Math.sin(time / 95) + 1) * 0.17
    const points = [[cx, cy]]
    for (let i = 0; i <= 22; i++) {
        const angle = facing + mouth + i / 22 * (Math.PI * 2 - mouth * 2)
        points.push([cx + Math.cos(angle) * cell * 0.36, cy + Math.sin(angle) * cell * 0.36])
    }
    prism(ctx, points, depth, '#dec267', '#8f702f', '#b79542')
    const [ex, ey] = projectMazePoint(cx + Math.cos(facing - 1) * cell * 0.2, cy + Math.sin(facing - 1) * cell * 0.2, depth)
    polygon(ctx, circlePoints(ex, ey, cell * 0.04, 8), '#29332b')
    ctx.restore()
}
