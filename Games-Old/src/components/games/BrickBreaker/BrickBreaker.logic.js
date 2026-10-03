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
    '#ff4757', '#ff6b7d', '#ffa726', '#ffcc02', '#26de81', '#45aaf2'
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
        results.ball = { ...ball, dy: -ball.dy }
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