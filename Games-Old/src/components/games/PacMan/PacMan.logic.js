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