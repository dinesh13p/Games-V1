// Brick Breaker Game Logic

export const CANVAS_WIDTH = 600
export const CANVAS_HEIGHT = 400
export const PADDLE_WIDTH = 100
export const PADDLE_HEIGHT = 15
export const PADDLE_SPEED = 8
export const BALL_RADIUS = 8
export const BALL_SPEED = 4
export const BRICK_ROWS = 6
export const BRICK_COLS = 10
export const BRICK_WIDTH = 56
export const BRICK_HEIGHT = 20
export const BRICK_PADDING = 4
export const BRICK_OFFSET_TOP = 60
export const BRICK_OFFSET_LEFT = 8

export const BRICK_COLORS = [
    '#a65c43', '#b2775d', '#b09568', '#9b9b77', '#7e8b70', '#6c807f'
]

export const createBricks = () => {
    const bricks = []
    for (let row = 0; row < BRICK_ROWS; row++) {
        for (let col = 0; col < BRICK_COLS; col++) {
            bricks.push({
                x: col * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT,
                y: row * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP,
                width: BRICK_WIDTH,
                height: BRICK_HEIGHT,
                color: BRICK_COLORS[row],
                visible: true,
                points: (BRICK_ROWS - row) * 10
            })
        }
    }
    return bricks
}

export const checkBallCollision = (ball, paddle, bricks) => {
    const results = { ball, bricks: [...bricks], score: 0, hitBrick: false }

    // Ball collision with walls
    if (ball.x + BALL_RADIUS > CANVAS_WIDTH || ball.x - BALL_RADIUS < 0) {
        results.ball = { ...ball, dx: -ball.dx }
    }

    if (ball.y - BALL_RADIUS < 0) {
        results.ball = { ...results.ball, dy: -ball.dy }
    }

    // Ball collision with bottom
    if (ball.y + BALL_RADIUS > CANVAS_HEIGHT) {
        results.lost = true
        return results
    }

    // Ball collision with paddle
    if (
        ball.x + BALL_RADIUS > paddle.x &&
        ball.x - BALL_RADIUS < paddle.x + PADDLE_WIDTH &&
        ball.y + BALL_RADIUS > paddle.y &&
        ball.y - BALL_RADIUS < paddle.y + PADDLE_HEIGHT &&
        ball.dy > 0
    ) {
        const hitPos = (ball.x - (paddle.x + PADDLE_WIDTH / 2)) / (PADDLE_WIDTH / 2)
        results.ball = {
            ...ball,
            dx: BALL_SPEED * hitPos * 0.8,
            dy: -Math.abs(ball.dy)
        }
        if (Math.abs(results.ball.dy) < BALL_SPEED * 0.5) {
            results.ball.dy = results.ball.dy < 0 ? -BALL_SPEED * 0.5 : BALL_SPEED * 0.5
        }
    }

    // Ball collision with bricks
    results.bricks = results.bricks.map(brick => {
        if (!brick.visible) return brick

        if (
            ball.x + BALL_RADIUS > brick.x &&
            ball.x - BALL_RADIUS < brick.x + brick.width &&
            ball.y + BALL_RADIUS > brick.y &&
            ball.y - BALL_RADIUS < brick.y + brick.height
        ) {
            results.ball = { ...results.ball, dy: -results.ball.dy }
            results.score += brick.points
            results.hitBrick = true
            return { ...brick, visible: false }
        }
        return brick
    })

    return results
}

export const createBrickGame = () => ({
    paddle: { x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2, y: CANVAS_HEIGHT - 30 },
    ball: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 50,
        dx: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1), dy: -BALL_SPEED },
    bricks: createBricks(), score: 0, lives: 3, phase: 'ready', won: false
})

export const advanceBricks = (state, keys) => {
    if (state.phase !== 'playing') return state
    const paddle = { ...state.paddle }
    if (keys.left) paddle.x -= PADDLE_SPEED
    if (keys.right) paddle.x += PADDLE_SPEED
    paddle.x = Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, paddle.x))
    const ball = { ...state.ball, x: state.ball.x + state.ball.dx, y: state.ball.y + state.ball.dy }
    const speed = BALL_SPEED * Math.min(1 + (state.score / 1000) * 0.1, 1.5)
    const magnitude = Math.hypot(ball.dx, ball.dy)
    if (magnitude) { ball.dx = ball.dx / magnitude * speed; ball.dy = ball.dy / magnitude * speed }
    const result = checkBallCollision(ball, paddle, state.bricks)
    const next = { ...state, paddle, ball: result.ball, bricks: result.bricks, score: state.score + result.score }
    if (result.lost) {
        next.lives--
        if (next.lives <= 0) next.phase = 'over'
        else next.ball = createBrickGame().ball
    }
    if (!next.bricks.some(brick => brick.visible)) { next.won = true; next.phase = 'over' }
    return next
}
