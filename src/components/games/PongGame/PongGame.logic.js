// Pong Game Logic

export const CANVAS_WIDTH = 600
export const CANVAS_HEIGHT = 400

export const createGameState = (width, height) => ({
    playerY: height / 2 - 40,
    aiY: height / 2 - 40,
    ballX: width / 2,
    ballY: height / 2,
    ballSpeedX: 5 * (Math.random() > 0.5 ? 1 : -1),
    ballSpeedY: 4 * (Math.random() > 0.5 ? 1 : -1),
    paddleHeight: 80,
    paddleWidth: 10,
    ballSize: 10,
    upPressed: false,
    downPressed: false
})

export const updateAI = (state, height, isMobile) => {
    const ballCenter = state.ballY + state.ballSize / 2
    const aiTargetY = ballCenter - state.paddleHeight / 2
    const aiLerp = isMobile ? 0.25 : 0.15
    state.aiY += (aiTargetY - state.aiY) * aiLerp
    state.aiY = Math.max(0, Math.min(height - state.paddleHeight, state.aiY))
}

export const moveBall = (state, width, height) => {
    state.ballX += state.ballSpeedX
    state.ballY += state.ballSpeedY

    if (state.ballY <= 0 || state.ballY + state.ballSize >= height) {
        state.ballSpeedY = -state.ballSpeedY
    }
}

export const checkPaddleCollision = (state, width) => {
    // Player paddle collision
    if (
        state.ballX <= 20 &&
        state.ballY + state.ballSize >= state.playerY &&
        state.ballY <= state.playerY + state.paddleHeight
    ) {
        state.ballSpeedX = Math.abs(state.ballSpeedX)
        state.ballSpeedY += (Math.random() - 0.5) * 2
    }

    // AI paddle collision
    if (
        state.ballX + state.ballSize >= width - 20 &&
        state.ballY + state.ballSize >= state.aiY &&
        state.ballY <= state.aiY + state.paddleHeight
    ) {
        state.ballSpeedX = -Math.abs(state.ballSpeedX)
        state.ballSpeedY += (Math.random() - 0.5) * 2
    }
}

export const checkScore = (state, width) => {
    if (state.ballX < 0) return { scorer: 'ai' }
    if (state.ballX > width) return { scorer: 'player' }
    return null
}

export const createPongGame = () => ({
    ...createGameState(CANVAS_WIDTH, CANVAS_HEIGHT), score: { player: 0, ai: 0 }, phase: 'ready'
})

export const advancePong = (state, isMobile) => {
    const next = { ...state, score: { ...state.score } }
    if (state.phase !== 'playing') return next
    if (state.upPressed) next.playerY -= 6
    if (state.downPressed) next.playerY += 6
    next.playerY = Math.max(0, Math.min(CANVAS_HEIGHT - state.paddleHeight, next.playerY))
    updateAI(next, CANVAS_HEIGHT, isMobile)
    moveBall(next, CANVAS_WIDTH, CANVAS_HEIGHT)
    checkPaddleCollision(next, CANVAS_WIDTH)
    const result = checkScore(next, CANVAS_WIDTH)
    if (result) {
        next.score[result.scorer]++
        if (next.score[result.scorer] >= 10) next.phase = 'over'
        else {
            next.ballX = CANVAS_WIDTH / 2
            next.ballY = CANVAS_HEIGHT / 2
            next.ballSpeedX = 5 * (Math.random() > 0.5 ? 1 : -1)
            next.ballSpeedY = 4 * (Math.random() > 0.5 ? 1 : -1)
        }
    }
    return next
}
