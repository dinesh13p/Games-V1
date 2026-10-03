// Pong Game Logic

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
    const aiCenter = state.aiY + state.paddleHeight / 2
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