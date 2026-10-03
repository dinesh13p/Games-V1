// Snake Game Logic

export const BOARD_SIZE = 20
export const BASE_SPEED_MS = 140
export const HS_KEY = "snake_highscore_v2"

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

export const randFood = (snake) => {
    while (true) {
        const r = Math.floor(Math.random() * BOARD_SIZE)
        const c = Math.floor(Math.random() * BOARD_SIZE)
        if (!snake.some(([sr, sc]) => sr === r && sc === c)) return [r, c]
    }
}

export const checkCollision = (snake, head) => {
    // Wall collision
    if (head[0] < 0 || head[1] < 0 || head[0] >= BOARD_SIZE || head[1] >= BOARD_SIZE) {
        return true
    }
    // Self collision
    if (snake.some(([r, c]) => r === head[0] && c === head[1])) {
        return true
    }
    return false
}

export const moveSnake = (snake, direction, food, grow) => {
    const head = snake[0]
    const newHead = [head[0] + direction[0], head[1] + direction[1]]

    if (checkCollision(snake, newHead)) {
        return null
    }

    const newSnake = [newHead, ...snake]

    if (newHead[0] === food[0] && newHead[1] === food[1]) {
        return { snake: newSnake, ate: true }
    }

    if (grow > 0) {
        return { snake: newSnake, ate: false, grow: grow - 1 }
    }

    newSnake.pop()
    return { snake: newSnake, ate: false }
}