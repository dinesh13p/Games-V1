export const BOARD_SIZE = 20
export const BASE_SPEED_MS = 140
export const HS_KEY = "snake_highscore_v2"
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

export const DIRECTIONS = {
    up: [-1, 0],
    down: [1, 0],
    left: [0, -1],
    right: [0, 1],
}

export const randFood = (snake, random = Math.random) => {
    const occupied = new Set(snake.map(([r, c]) => r * BOARD_SIZE + c))
    const free = []
    for (let index = 0; index < BOARD_SIZE * BOARD_SIZE; index++) {
        if (!occupied.has(index)) free.push(index)
    }
    if (!free.length) return null
    const index = free[Math.min(free.length - 1, Math.floor(random() * free.length))]
    return [Math.floor(index / BOARD_SIZE), index % BOARD_SIZE]
}

export const checkCollision = (snake, head) => {
    return head[0] < 0 || head[1] < 0 || head[0] >= BOARD_SIZE || head[1] >= BOARD_SIZE
        || snake.some(([r, c]) => r === head[0] && c === head[1])
}

export const moveSnake = (snake, direction, food, grow = 0) => {
    const head = snake[0]
    const newHead = [head[0] + direction[0], head[1] + direction[1]]
    const ate = Boolean(food && newHead[0] === food[0] && newHead[1] === food[1])
    // The tail vacates its square on an ordinary move, so that square is safe.
    const body = ate || grow > 0 ? snake : snake.slice(0, -1)
    if (checkCollision(body, newHead)) return null
    const newSnake = [newHead, ...snake]
    if (!ate && grow <= 0) newSnake.pop()
    return { snake: newSnake, ate, grow: ate ? grow : Math.max(0, grow - 1) }
}

export const createSnakeState = (random = Math.random) => {
    const snake = [[10, 10], [10, 9], [10, 8]]
    return {
        snake,
        direction: DIRECTIONS.right,
        nextDirection: DIRECTIONS.right,
        turnQueued: false,
        food: randFood(snake, random),
        score: 0,
        round: 0,
        status: 'ready',
    }
}

export const queueDirection = (state, direction) => {
    if (state.status !== 'running' || state.turnQueued) return state
    if (!Object.values(DIRECTIONS).some(([r, c]) => direction[0] === r && direction[1] === c)) return state
    const [r, c] = state.direction
    if ((direction[0] === -r && direction[1] === -c)
        || (direction[0] === r && direction[1] === c)) return state
    // Accept only one turn per simulation step, including rapid mixed inputs.
    return { ...state, nextDirection: direction, turnQueued: true }
}

export const tickSnake = (state, random = Math.random) => {
    if (state.status !== 'running') return state
    const result = moveSnake(state.snake, state.nextDirection, state.food)
    if (!result) return { ...state, status: 'lost' }
    const food = result.ate ? randFood(result.snake, random) : state.food
    return {
        ...state,
        snake: result.snake,
        direction: state.nextDirection,
        turnQueued: false,
        food,
        score: state.score + (result.ate ? 10 : 0),
        status: food === null ? 'won' : 'running',
    }
}

export const snakeReducer = (state, action) => {
    switch (action.type) {
        case 'start':
            return state.status === 'ready' ? { ...state, status: 'running' } : state
        case 'pause':
            return state.status === 'running' ? { ...state, status: 'paused' } : state
        case 'resume':
            return state.status === 'paused' ? { ...state, status: 'running' } : state
        case 'restart':
            return { ...createSnakeState(action.random), round: state.round + 1, status: 'running' }
        case 'turn':
            return queueDirection(state, action.direction)
        case 'tick':
            return tickSnake(state, action.random)
        default:
            return state
    }
}
