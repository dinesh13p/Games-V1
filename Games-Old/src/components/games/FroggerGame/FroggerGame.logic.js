// Frogger Game Logic

export const CANVAS_WIDTH = 450
export const CANVAS_HEIGHT = 600
export const GRID_SIZE = 50
export const COLS = 9
export const ROWS = 12

export const initializeObjects = (completions = 0) => {
    const cars = []
    const logs = []

    const darkMode = completions % 2 === 1

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

export const checkCollisions = (frogX, frogY, cars, logs, completions) => {
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