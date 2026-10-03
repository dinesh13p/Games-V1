// Flappy Bird Game Logic

export const WIDTH = 480
export const HEIGHT = 640
export const GRAVITY = 1400
export const FLAP_VELOCITY = -380
export const MAX_DROP_SPEED = 900
export const BIRD_RADIUS = 18
export const PIPE_WIDTH = 72
export const PIPE_GAP = 150
export const PIPE_MIN_GAP_Y = 100
export const PIPE_SPAWN_INTERVAL = 1.6
export const PIPE_SPEED = 180
export const GROUND_HEIGHT = 110
export const HS_KEY = 'flappyBirdHighScore'

export const randRange = (min, max) => Math.random() * (max - min) + min

export const shouldPipeMove = (pipeNumber) => {
    if (pipeNumber <= 24) return false
    const cycleBase = Math.floor((pipeNumber - 1) / 100) * 100
    const n = pipeNumber - cycleBase
    if (n >= 25 && n <= 45) return [28, 31, 34, 37, 40, 43].includes(n)
    if (n >= 46 && n <= 75) return n % 2 === 0
    if (n >= 76 && n <= 100) return true
    return false
}

export const createPipe = (pipeCount, width, height) => {
    const x = width + 40
    const minY = PIPE_MIN_GAP_Y
    const maxY = height - GROUND_HEIGHT - PIPE_GAP - 40
    const currentPipeNumber = pipeCount + 1

    if (currentPipeNumber > 100) return null

    if (currentPipeNumber === 100) {
        return {
            x,
            gapY: height / 2,
            originalGapY: height / 2,
            pipeNumber: currentPipeNumber,
            movingGap: false,
            gapDirection: 1,
            gapSpeed: 80,
            isGolden: true,
            isLastPipe: true,
            passed: false
        }
    }

    const gapY = randRange(minY, maxY)
    const shouldMove = shouldPipeMove(currentPipeNumber)

    return {
        x,
        gapY,
        originalGapY: gapY,
        pipeNumber: currentPipeNumber,
        movingGap: shouldMove,
        gapDirection: 1,
        gapSpeed: shouldMove ? 80 : 0,
        isGolden: false,
        isLastPipe: false,
        passed: false
    }
}

export const checkCollision = (bird, pipes, width, height) => {
    if (bird.y + BIRD_RADIUS >= height - GROUND_HEIGHT) return true
    if (bird.y - BIRD_RADIUS <= 0) return true

    for (let pipe of pipes) {
        const rx = pipe.x
        const rw = PIPE_WIDTH
        const topRect = { x: rx, y: 0, w: rw, h: pipe.gapY }
        const bottomRect = {
            x: rx,
            y: pipe.gapY + PIPE_GAP,
            w: rw,
            h: height - GROUND_HEIGHT - (pipe.gapY + PIPE_GAP)
        }

        if (circleRectCollision(bird, topRect) || circleRectCollision(bird, bottomRect)) {
            return true
        }
    }
    return false
}

export const createFlappyGame = () => ({
    bird: { x: WIDTH * 0.28, y: HEIGHT / 2, vy: 0, rotation: 0 },
    pipes: [], spawnTimer: 0, pipeCount: 0, score: 0, phase: 'ready', won: false
})

export const advanceFlappy = (state, dt) => {
    const bird = { ...state.bird }
    const next = { ...state, bird, pipes: state.pipes.map(pipe => ({ ...pipe })), events: [] }
    if (state.phase !== 'playing') return next
    bird.vy = Math.min(bird.vy + GRAVITY * dt, MAX_DROP_SPEED)
    bird.y += bird.vy * dt
    bird.rotation = Math.max(Math.min(bird.vy / 400, 0.9), -0.9)
    next.spawnTimer += dt
    if (next.spawnTimer >= PIPE_SPAWN_INTERVAL) {
        next.spawnTimer = 0
        // createPipe accepts the number already spawned, so the first pipe is 1.
        const pipe = createPipe(next.pipeCount, WIDTH, HEIGHT)
        next.pipeCount++
        if (pipe) next.pipes.push(pipe)
    }
    for (const pipe of next.pipes) {
        pipe.x -= PIPE_SPEED * dt
        if (pipe.movingGap) {
            pipe.gapY += pipe.gapDirection * pipe.gapSpeed * dt
            const maxY = HEIGHT - GROUND_HEIGHT - PIPE_GAP - 40
            if (pipe.gapY <= PIPE_MIN_GAP_Y) { pipe.gapY = PIPE_MIN_GAP_Y; pipe.gapDirection = 1 }
            else if (pipe.gapY >= maxY) { pipe.gapY = maxY; pipe.gapDirection = -1 }
        }
        if (!pipe.passed && pipe.x + PIPE_WIDTH / 2 < bird.x) {
            pipe.passed = true
            next.score++
            next.events.push('point')
            if (pipe.isGolden) { next.won = true; next.phase = 'over' }
        }
    }
    next.pipes = next.pipes.filter(pipe => pipe.x + PIPE_WIDTH >= -20)
    if (checkCollision(bird, next.pipes, WIDTH, HEIGHT)) {
        next.events.push(bird.y + BIRD_RADIUS >= HEIGHT - GROUND_HEIGHT ? 'die' : 'hit')
        next.phase = 'over'
    }
    return next
}

export const circleRectCollision = (circle, rect) => {
    const cx = circle.x
    const cy = circle.y
    const rx = rect.x
    const ry = rect.y
    const rw = rect.w
    const rh = rect.h

    const closestX = Math.max(rx, Math.min(cx, rx + rw))
    const closestY = Math.max(ry, Math.min(cy, ry + rh))

    const dx = cx - closestX
    const dy = cy - closestY
    return dx * dx + dy * dy < BIRD_RADIUS * BIRD_RADIUS
}
