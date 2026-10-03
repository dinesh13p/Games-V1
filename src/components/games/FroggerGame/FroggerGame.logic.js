// Frogger Game Logic

export const CANVAS_WIDTH = 450
export const CANVAS_HEIGHT = 600
export const GRID_SIZE = 50
export const COLS = 9
export const ROWS = 12

export const initializeObjects = () => {
    const cars = []
    const logs = []

    // Create cars for road rows
    for (let row = 3; row <= 5; row++) {
        for (let i = 0; i < 3; i++) {
            cars.push({
                x: i * 3,
                y: row,
                direction: row % 2 === 0 ? 1 : -1,
                speed: 0.02 + Math.random() * 0.01
            })
        }
    }

    for (let row = 7; row <= 9; row++) {
        for (let i = 0; i < 3; i++) {
            cars.push({
                x: i * 3,
                y: row,
                direction: row % 2 === 0 ? 1 : -1,
                speed: 0.02 + Math.random() * 0.01
            })
        }
    }

    // Create logs for water rows
    for (let row = 1; row <= 2; row++) {
        for (let i = 0; i < 2; i++) {
            logs.push({
                x: i * 4.5,
                y: row,
                direction: row % 2 === 0 ? -1 : 1,
                speed: 0.015 + Math.random() * 0.005,
                width: 2.5
            })
        }
    }

    return { cars, logs }
}

export const checkCollisions = (frogX, frogY, cars, logs) => {
    // Check car collisions
    if ((frogY >= 3 && frogY <= 5) || (frogY >= 7 && frogY <= 9)) {
        for (const car of cars) {
            if (car.y === frogY) {
                const carLeft = car.x
                const carRight = car.x + 1
                if (frogX >= carLeft && frogX <= carRight) {
                    return { collision: true, type: 'car' }
                }
            }
        }
    }

    // Check water
    if (frogY >= 1 && frogY <= 2) {
        let onLog = false
        for (const log of logs) {
            if (log.y === frogY) {
                const logLeft = log.x
                const logRight = log.x + log.width
                if (frogX >= logLeft && frogX <= logRight) {
                    onLog = true
                    return { collision: false, onLog: true, logDirection: log.direction, logSpeed: log.speed }
                }
            }
        }
        if (!onLog) {
            return { collision: true, type: 'water' }
        }
    }

    // Check win (reached top)
    if (frogY === 0) {
        return { collision: false, win: true }
    }

    return { collision: false }
}

export const createFroggerGame = () => ({
    frogX: 4, frogY: 11, ...initializeObjects(), timeLeft: 30,
    elapsed: 0, score: 0, completions: 0, phase: 'ready'
})

export const moveFrog = (state, direction) => {
    if (state.phase !== 'playing') return state
    const next = { ...state }
    if (direction === 'up' && next.frogY > 0) { next.frogY--; next.score += 10 }
    if (direction === 'down' && next.frogY < ROWS - 1) next.frogY++
    if (direction === 'left' && next.frogX > 0) next.frogX = Math.max(0, next.frogX - 1)
    if (direction === 'right' && next.frogX < COLS - 1) next.frogX = Math.min(COLS - 1, next.frogX + 1)
    return next
}

export const advanceFrogger = (state, dt = 1 / 60) => {
    if (state.phase !== 'playing') return state
    const cars = state.cars.map(car => {
        let x = car.x + car.direction * car.speed
        if (x > COLS + 1) x = -2
        if (x < -2) x = COLS + 1
        return { ...car, x }
    })
    const logs = state.logs.map(log => {
        let x = log.x + log.direction * log.speed
        if (x > COLS + 2) x = -log.width - 1
        if (x < -log.width - 1) x = COLS + 2
        return { ...log, x }
    })
    const elapsed = state.elapsed + dt
    const timeLeft = Math.max(0, 30 - Math.floor(elapsed))
    const next = { ...state, cars, logs, elapsed, timeLeft }
    const result = checkCollisions(state.frogX, state.frogY, cars, logs)
    if (result.collision || timeLeft === 0) return { ...next, phase: 'over' }
    if (result.win) return { ...next, ...initializeObjects(), frogX: 4, frogY: 11,
        completions: state.completions + 1, score: state.score + timeLeft * 10, timeLeft: 30, elapsed: 0 }
    if (result.onLog) {
        next.frogX += result.logDirection * result.logSpeed
        if (next.frogX < 0) next.frogX = COLS - 1
        if (next.frogX >= COLS) next.frogX = 0
    }
    return next
}
