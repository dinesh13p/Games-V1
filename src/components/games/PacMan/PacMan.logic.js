// Pac-Man Game Logic

export const initialMaze = [
    ["W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W"],
    ["W", "P", "P", "P", "P", "P", "P", "W", "P", "P", "P", "P", "P", "P", "W"],
    ["W", "O", "W", "W", "P", "W", "W", "W", "W", "W", "P", "W", "W", "O", "W"],
    ["W", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "W"],
    ["W", "P", "W", "W", "P", "W", "P", "P", "P", "W", "P", "W", "W", "P", "W"],
    ["W", "P", "P", "P", "P", "W", "P", "P", "P", "W", "P", "P", "P", "P", "W"],
    ["W", "W", "W", "W", "P", "P", "P", "P", "P", "P", "P", "W", "W", "W", "W"],
    ["E", "E", "E", "W", "P", "W", "W", "E", "W", "W", "P", "W", "E", "E", "E"],
    ["W", "W", "W", "W", "P", "W", "E", "E", "E", "W", "P", "W", "W", "W", "W"],
    ["W", "P", "P", "P", "P", "W", "P", "P", "P", "W", "P", "P", "P", "P", "W"],
    ["W", "P", "W", "W", "P", "W", "P", "P", "P", "W", "P", "W", "W", "P", "W"],
    ["W", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "W"],
    ["W", "O", "W", "W", "P", "W", "W", "W", "W", "W", "P", "W", "W", "O", "W"],
    ["W", "P", "P", "P", "P", "P", "P", "W", "P", "P", "P", "P", "P", "P", "W"],
    ["W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W"]
]

export const PACMAN_BASE_START = { x: 1, y: 13 }

export const GHOST_BASE_STARTS = [
    { x: 6, y: 7, color: 'red', direction: { dx: 1, dy: 0 } },
    { x: 8, y: 7, color: 'pink', direction: { dx: -1, dy: 0 } },
    { x: 7, y: 7, color: 'cyan', direction: { dx: 0, dy: 1 } },
    { x: 7, y: 6, color: 'orange', direction: { dx: 0, dy: -1 } },
    { x: 7, y: 8, color: 'green', direction: { dx: 1, dy: 0 } }
]

export const DIFFICULTIES = {
    Beginner: { scale: 1, ghosts: 2, baseSpeed: 200, powerSpeed: 350, ambushAhead: 4 },
    Intermediate: { scale: 1.5, ghosts: 3, baseSpeed: 160, powerSpeed: 280, ambushAhead: 5 },
    Advanced: { scale: 2, ghosts: 5, baseSpeed: 120, powerSpeed: 220, ambushAhead: 6 }
}

export const scaleMaze = (baseMaze, factor) => {
    if (factor === 1) return baseMaze.map(r => [...r])
    const rows = baseMaze.length, cols = baseMaze[0].length
    const newRows = Math.max(1, Math.round(rows * factor))
    const newCols = Math.max(1, Math.round(cols * factor))
    return Array.from({ length: newRows }, (_, r) =>
        Array.from({ length: newCols }, (_, c) => {
            const br = Math.min(rows - 1, Math.max(0, Math.floor(r / factor)))
            const bc = Math.min(cols - 1, Math.max(0, Math.floor(c / factor)))
            return baseMaze[br][bc]
        })
    )
}

export const findNearestOpenCell = (grid, startX, startY) => {
    const h = grid.length, w = grid[0].length
    const inBounds = (x, y) => y >= 0 && y < h && x >= 0 && x < w
    const isOpen = (x, y) => inBounds(x, y) && grid[y][x] !== 'W'
    if (isOpen(startX, startY)) return { x: startX, y: startY }
    const queue = [{ x: startX, y: startY }]
    const seen = new Set([startX + ',' + startY])
    const dirs = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }]
    while (queue.length) {
        const cur = queue.shift()
        for (const d of dirs) {
            const nx = cur.x + d.dx, ny = cur.y + d.dy, k = nx + ',' + ny
            if (seen.has(k)) continue
            seen.add(k)
            if (isOpen(nx, ny)) return { x: nx, y: ny }
            if (inBounds(nx, ny)) queue.push({ x: nx, y: ny })
        }
    }
    return { x: Math.min(w - 1, Math.max(0, startX)), y: Math.min(h - 1, Math.max(0, startY)) }
}

export const getDistance = (x1, y1, x2, y2) => Math.abs(x1 - x2) + Math.abs(y1 - y2)

export const PACMAN_KEYS = {
    ArrowUp: { dx: 0, dy: -1 }, KeyW: { dx: 0, dy: -1 },
    ArrowDown: { dx: 0, dy: 1 }, KeyS: { dx: 0, dy: 1 },
    ArrowLeft: { dx: -1, dy: 0 }, KeyA: { dx: -1, dy: 0 },
    ArrowRight: { dx: 1, dy: 0 }, KeyD: { dx: 1, dy: 0 }
}

export const isPacmanControlTarget = target => Boolean(target?.closest?.(
    'input, textarea, select, button, a, [contenteditable]:not([contenteditable="false"]), [role="textbox"]'
))

export function createPacmanGame(difficulty = 'Beginner', status = 'waiting') {
    const cfg = DIFFICULTIES[difficulty]
    const maze = scaleMaze(initialMaze, cfg.scale)
    const pacman = findNearestOpenCell(maze, Math.round(PACMAN_BASE_START.x * cfg.scale), Math.round(PACMAN_BASE_START.y * cfg.scale))
    const ghosts = GHOST_BASE_STARTS.slice(0, cfg.ghosts).map(base => {
        const home = findNearestOpenCell(maze, Math.round(base.x * cfg.scale), Math.round(base.y * cfg.scale))
        return { ...base, ...home, home, direction: { ...base.direction }, mode: 'chase' }
    })
    return { difficulty, maze, pacman, ghosts, score: 0, status, powerTimer: 0, lastDirection: { dx: 1, dy: 0 } }
}

export function canPacmanMove(maze, x, y) {
    const width = maze[0].length
    return y >= 0 && y < maze.length && maze[y][(x + width) % width] !== 'W'
}

function resolvePacmanCollisions(state) {
    const colliding = ghost => Math.abs(ghost.x - state.pacman.x) <= 0.8 && Math.abs(ghost.y - state.pacman.y) <= 0.8
    if (state.ghosts.some(colliding)) {
        if (state.powerTimer <= 0) return { ...state, status: 'gameOver' }
        let bonus = 0
        const ghosts = state.ghosts.map(ghost => {
            if (!colliding(ghost)) return ghost
            bonus += 200
            let home = ghost.home
            if (home.x === state.pacman.x && home.y === state.pacman.y) {
                // A respawn must not immediately award another capture on the same cell.
                const row = state.maze.findIndex((cells, y) => cells.some((cell, x) => cell !== 'W' && getDistance(x, y, state.pacman.x, state.pacman.y) > 2))
                const x = state.maze[row].findIndex((cell, x) => cell !== 'W' && getDistance(x, row, state.pacman.x, state.pacman.y) > 2)
                home = { x, y: row }
            }
            return { ...ghost, ...home }
        })
        state = { ...state, ghosts, score: state.score + bonus }
    }
    const remaining = state.maze.some(row => row.some(cell => cell === 'P' || cell === 'O'))
    return remaining ? state : { ...state, status: 'won' }
}

export function movePacman(state, dx, dy) {
    if (state.status !== 'playing') return state
    const lastDirection = { dx, dy }
    const x = (state.pacman.x + dx + state.maze[0].length) % state.maze[0].length
    const y = state.pacman.y + dy
    if (!canPacmanMove(state.maze, x, y)) return { ...state, lastDirection }
    const cell = state.maze[y][x]
    const maze = state.maze.map(row => [...row])
    maze[y][x] = 'E'
    return resolvePacmanCollisions({
        ...state, maze, lastDirection, pacman: { x, y },
        score: state.score + (cell === 'P' ? 10 : cell === 'O' ? 50 : 0),
        powerTimer: cell === 'O' ? 5000 : state.powerTimer
    })
}

export function movePacmanGhosts(state, random = Math.random) {
    if (state.status !== 'playing') return state
    const { maze, pacman, lastDirection, powerTimer } = state
    const width = maze[0].length, height = maze.length
    const ahead = DIFFICULTIES[state.difficulty].ambushAhead
    const clampX = x => Math.max(0, Math.min(width - 1, x))
    const clampY = y => Math.max(0, Math.min(height - 1, y))
    const ghosts = state.ghosts.map(ghost => {
        let targetX = pacman.x, targetY = pacman.y
        if (ghost.color === 'red' || ghost.color === 'pink') {
            const distance = ghost.color === 'red' ? 1 : ahead
            targetX = clampX(pacman.x + lastDirection.dx * distance)
            targetY = clampY(pacman.y + lastDirection.dy * distance)
        } else if (ghost.color === 'cyan') {
            targetX = clampX(pacman.x + lastDirection.dx * (ahead - 1) + lastDirection.dy * 2)
            targetY = clampY(pacman.y + lastDirection.dy * (ahead - 1) - lastDirection.dx * 2)
        } else if (ghost.color === 'orange' && getDistance(ghost.x, ghost.y, pacman.x, pacman.y) <= Math.max(6, ahead)) {
            targetX = 0
            targetY = height - 1
        } else if (ghost.color === 'green') {
            targetX = clampX(pacman.x + lastDirection.dx * (ahead - 2) + Math.sign(random() - 0.5))
            targetY = clampY(pacman.y + lastDirection.dy * (ahead - 2) + Math.sign(random() - 0.5))
        }
        if (powerTimer > 0) {
            targetX = ghost.x < Math.floor(width / 2) ? width - 1 : 0
            targetY = ghost.y < Math.floor(height / 2) ? height - 1 : 0
        }
        const directions = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }]
            .filter(d => canPacmanMove(maze, ghost.x + d.dx, ghost.y + d.dy))
        let available = directions.filter(d => d.dx !== -ghost.direction.dx || d.dy !== -ghost.direction.dy)
        if (!available.length) available = directions
        if (!available.length) return ghost
        available.sort((a, b) => {
            const distance = d => getDistance((ghost.x + d.dx + width) % width, ghost.y + d.dy, targetX, targetY)
            return powerTimer > 0 ? distance(b) - distance(a) : distance(a) - distance(b)
        })
        const direction = random() < 0.2 && available.length > 1 ? available[Math.floor(random() * Math.min(2, available.length))] : available[0]
        return { ...ghost, x: (ghost.x + direction.dx + width) % width, y: ghost.y + direction.dy, direction, mode: powerTimer > 0 ? 'flee' : 'chase' }
    })
    return resolvePacmanCollisions({ ...state, ghosts })
}

export const pacmanGhostDelay = state => {
    const cfg = DIFFICULTIES[state.difficulty]
    return state.powerTimer > 0 ? cfg.powerSpeed : cfg.baseSpeed
}
